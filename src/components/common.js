import jsonImageTable from '../assets/image_table.json'

export default {
  data() {
    return {
      imageTable: jsonImageTable,

      showHeader: true,
      preventShowHideHeaderOnScroll: 0,
      lastScrollPosition: 0,
      showDetail: 2,

      allTags: new Set(),
      mainTags: new Set(),
      subTagTable: {},

      tagSearchPattern: "",
      tagSearchPatternPrev: "",
      prevTagRE: null,
    }
  },

  mounted() {
    window.addEventListener('scroll', this.onScroll);
  },

  beforeDestroy() {
    window.removeEventListener('scroll', this.onScroll);
  },

  computed: {
    style() {
      return {
        "--character-width": `${this.showDetail >= 2 ? '750px' : ''}`,
        "--character-min-width": `${this.showDetail == 1 ? '400px' : ''}`,
        "--character-flex-grow": `${this.showDetail < 2 ? 0 : 1}`,
        "--skills-display": `${this.showDetail < 2 ? 'flex' : 'display'}`,
        "--skill-flex-grow": `${this.showDetail == 2 ? 1 : 0}`,
      };
    },
  },

  methods: {
    onScroll() {
      const pos = window.pageYOffset || document.documentElement.scrollTop;
      if (pos < 0 || Math.abs(pos - this.lastScrollPosition) < 30) {
        return;
      }

      if (this.preventShowHideHeaderOnScroll > 0) {
        --this.preventShowHideHeaderOnScroll;
      }
      else {
        this.showHeader = pos < this.lastScrollPosition;
      }
      this.lastScrollPosition = pos;
    },

    getImageURL(name) {
      if (name in this.imageTable) {
        return this.imageTable[name];
      }
      return "./empty.png";
    },

    compareDate(a, b) {
      return a.date == b.date ? 0 : (a.date < b.date ? -1 : 1);
    },
    appendSet(dst, iteratable) {
      for (const v of iteratable) {
        dst.add(v);
      }
    },
    sortSet(dst, compare = undefined) {
      let sorted = Array.from(dst).sort(compare);
      dst.clear();
      this.appendSet(dst, sorted);
    },
    partitionSet(dst, condition) {
      let tmp = [];
      for (const v of dst) {
        if (condition(v)) {
          tmp.push(v);
        }
      }
      for (const v of tmp) {
        dst.delete(v);
        dst.add(v);
      }
    },
    reorderSet(dst, patterns) {
      let tmp = [];
      for (const v of patterns) {
        if (dst.has(v)) {
          dst.delete(v);
          tmp.push(v);
        }
      }
      if (tmp.length != 0) {
        for (const v of dst) {
          tmp.push(v);
        }
        dst.clear();
        this.appendSet(dst, tmp);
      }
    },

    partitionSubtags(subtagSet) {
      this.sortSet(subtagSet);
      this.partitionSet(subtagSet, tag => tag.match(/\(物理\)/));
      this.partitionSet(subtagSet, tag => tag.match(/\(魔法\)/));
      this.partitionSet(subtagSet, tag => tag.match(/\(スキル\)/));
      this.partitionSet(subtagSet, tag => tag.match(/\(単体スキル\)/));
      this.partitionSet(subtagSet, tag => tag.match(/\(範囲スキル\)/));
    },
    reorderSubtag() {
      for (let k in this.subTagTable) {
        this.partitionSubtags(this.subTagTable[k]);
      }
    },

    addSubTag(main, sub) {
      let subtags = this.subTagTable[main];
      if (!subtags) {
        subtags = new Set();
        this.subTagTable[main] = subtags;
      }
      if (!subtags.has(main) && this.allTags.has(main)) {
        subtags.add(main);
      }
      subtags.add(sub);
    },
    registerTags(tags) {
      for (let t of tags) {
        this.allTags.add(t);
        let p = t.indexOf('(');
        if (p != -1) {
          let sub = t;
          t = t.slice(0, p);
          this.addSubTag(t, sub);
        }
        else if (t in this.subTagTable) {
          this.subTagTable[t].add(t);
        }
        this.mainTags.add(t);
      }
    },


    isFilterEnabled(filter) {
      for (const v of filter)
        if (v.state)
          return true;
      return false;
    },
    fillFilter(dst, items) {
      while (dst.length < items.length) {
        dst.push({ state: false });
      }
    },
    filterMatch(filter, index) {
      if (this.isFilterEnabled(filter)) {
        if (Array.isArray(index)) {
          for (const i of index) {
            if (i >= 0 && filter[i].state) {
              return true;
            }
          }
          return false;
        }
        else {
          return index >= 0 && filter[index].state;
        }
      }
      else {
        return true;
      }
    },

    setTagSearchPattern(txt, wholeWord = false) {
      txt = txt.trim();
      txt = txt.replaceAll('(', '\\(');
      txt = txt.replaceAll(')', '\\)');
      txt = "^" + txt;
      if (wholeWord && !txt.endsWith(')')) {
        txt += "$";
      }
      this.tagSearchPattern = txt;

      this.preventShowHideHeaderOnScroll = 1;
      this.$nextTick(function () {
        this.showHeader = true;
      }.bind(this));
    },
    getTagRE() {
      if (this.tagSearchPattern.length == 0) {
        this.prevTagRE = null;
        return null;
      }
      else {
        try {
          let re = new RegExp(this.tagSearchPattern);
          this.prevTagRE = re;
          return re;
        }
        catch (e) {
          return this.prevTagRE;
        }
      }
    },
    matchTags(tags, re) {
      for (const tag of tags) {
        if (tag.match(re)) {
          return true;
        }
      }
      return false;
    },

    chrNameToHtml(name) {
      let m = name.match(/([^(]+)(\(.+?\))/);
      if (m) {
        return m[1] + `<span class='note'>${m[2]}</span>`;
      }
      else {
        return name;
      }
    },
    descToHtml(item) {
      return item.desc.replaceAll("\n", "<br/>") + "<br/>";
    },

    onChangeFilterState() {
      this.updateURL();
      this.preventShowHideHeaderOnScroll = 1;
    },
    onUpdateTagSearchPattern() {
      // なぜかボタン一個押すたびに呼ばれるので変更チェック…
      if (this.tagSearchPattern == this.tagSearchPatternPrev)
        return;
      this.tagSearchPatternPrev = this.tagSearchPattern;
      this.updateURL();
    },

    onTagDropdownShow(event, state) {
      state.keepDropdown = 0;
      state.readyToHide = false;
    },
    onTagDropdownHide(event, state) {
      if (state.keepDropdown > 0) {
        event.preventDefault();
      }
    },
    onSubtagPopoverShow(state, popoverTarget) {
      this.$root.$emit('bv::hide::popover', this.prevPopover);
      this.prevPopover = popoverTarget;
      state.keepDropdown++;
    },
    onSubtagPopoverHide(state) {
      state.keepDropdown--;
      if (state.readyToHide) {
        this.$refs[state.name][0].hide();
        state.readyToHide = false;
      }
    },
    hideTagDropdown(state, popoverTarget) {
      if (popoverTarget) {
        this.$root.$emit('bv::hide::popover', popoverTarget);
      }
      state.readyToHide = true;
    },


    serializeFilter(filter) {
      let r = 0;
      for (let i = 0; i < filter.length; ++i) {
        if (filter[i].state) {
          r |= 1 << i;
        }
      }
      return r;
    },
    deserializeFilter(filter, v) {
      for (let i = 0; i < filter.length; ++i) {
        filter[i].state = (v & (1 << i)) != 0;
      }
    },

    copyToClipboard(value) {
      if (navigator.clipboard) {
        return navigator.clipboard.writeText(value);
      }
    },

    URLSerializer: class {
      constructor(data) {
        for (const k in data) {
          this[k] = data[k];
        }
      }

      serialize() {
        let params = [];
        for (const k in this) {
          params.push(k + "=" + this[k].toString());
        }
        return "?" + (params.length != 0 ? params.join("&") : "");
      }

      deserialize(url) {
        url = decodeURIComponent(url);
        let numHandled = 0;
        let q = url.match(/\?([^#]+)/);
        if (q) {
          let params = q[1].split('&');
          for (let param of params) {
            let kvp = param.split('=');
            if (kvp.length == 2) {
              if (typeof this[kvp[0]] === "number")
                this[kvp[0]] = parseInt(kvp[1]);
              else
                this[kvp[0]] = kvp[1];
              ++numHandled;
            }
          }
        }
        return numHandled;
      }
    },
  }
}
