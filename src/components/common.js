import jsonImageTable from '../assets/image_table.json'

export default {
  data() {
    return {
      imageTable: jsonImageTable,

      showHeader: true,
      preventShowHideHeaderOnScroll: 0,
      lastScrollPosition: 0,
      showDetail: 2,

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
    sortSet(dst, compare = undefined) {
      let sorted = Array.from(dst).sort(compare);
      dst.clear();
      for (let a of sorted) {
        dst.add(a);
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
