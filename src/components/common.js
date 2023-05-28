import jsonImageTable from '../assets/image_table.json'

export default {
  data() {
    return {
      imageTable: jsonImageTable,

      showHeader: true,
      preventShowHideHeaderOnScroll: 0,
      lastScrollPosition: 0,
      displayType: 2,
      displayCount: 1,
      sortType: 0,
      sortOrder: 0,
      sortBySlot: false,
      page: 1,

      tagTable: {},
      mainTagTable: {},
      subTagTable: {},
      tagIDSeed: 0,
      mainTagIDSeed: 0,
      predefinedMainTags: [],

      tagSearchPattern: "",
      tagSearchPatternPrev: "",
      tagSearchFn: null,

      freeSearchPattern: "",
      freeSearchPatternPrev: "",
      freeSearchFn: null,

      searchTabIndex: 0,

      displayCounts: [
        "10",
        "20",
        "50",
        "100",
        "全て",
      ],
    }
  },

  created() {
    let route = this.getRouteName();
    let tmp = null;

    tmp = localStorage.getItem(`${route}.displayCount`);
    if (tmp)
      this.displayCount = parseInt(tmp);

    tmp = localStorage.getItem(`${route}.displayType`);
    if (tmp)
      this.displayType = parseInt(tmp);

    tmp = localStorage.getItem(`${route}.sortType`);
    if (tmp)
      this.sortType = parseInt(tmp);

    tmp = localStorage.getItem(`${route}.sortOrder`);
    if (tmp)
      this.sortOrder = parseInt(tmp);

    tmp = localStorage.getItem(`${route}.sortBySlot`);
    if (tmp)
      this.sortBySlot = (tmp == "true");
  },

  mounted() {
    window.addEventListener('scroll', this.onScroll);
  },

  beforeDestroy() {
    window.removeEventListener('scroll', this.onScroll);
  },

  watch: {
    displayCount: function (v) {
      localStorage.setItem(`${this.getRouteName()}.displayCount`, v);
    },
    displayType: function (v) {
      localStorage.setItem(`${this.getRouteName()}.displayType`, v);
    },
    sortType: function (v) {
      localStorage.setItem(`${this.getRouteName()}.sortType`, v);
    },
    sortOrder: function (v) {
      localStorage.setItem(`${this.getRouteName()}.sortOrder`, v);
    },
    sortBySlot: function (v) {
      localStorage.setItem(`${this.getRouteName()}.sortBySlot`, v);
    },
  },

  computed: {
    style() {
      return {
        "--character-width": `${this.displayType >= 2 ? '750px' : ''}`,
        "--character-min-width": `${this.displayType == 1 ? '500px' : ''}`,
        "--character-flex-grow": `${this.displayType < 2 ? 0 : 1}`,
        "--skills-display": `${this.displayType < 2 ? 'flex' : 'display'}`,
        "--skill-flex-grow": `${this.displayType == 2 ? 1 : 0}`,
      };
    },

    displayCountNum() {
      let v = NaN;
      if (this.displayCount < this.displayCounts.length)
        v = parseInt(this.displayCounts[this.displayCount]);
      return isNaN(v) ? 1000 : v;
    }
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

    onPage(page) {
      if (page)
        this.updateURL({ p: page });
    },

    getRouteName() {
      let ret = this.$route.name;
      if (ret == 'index')
        ret = 'main';
      return ret;
    },

    hideHeader() {
      this.showHeader = false;
    },

    scrollToTop() {
      window.scroll(0, 0);
    },
    scrollToBottom() {
      window.scrollTo(0, document.body.scrollHeight);
    },

    onMouseMove(event) {
      if (event.clientY < 50) {
        this.showHeader = true;
      }
    },

    escapeRE(str) {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
        if (condition(v))
          tmp.push(v);
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

    applyPage(array) {
      const n = this.displayCountNum;
      if (array.length < n)
        return array;
      const start = n * (this.page - 1);
      const end = Math.min(n * this.page, array.length);
      return array.slice(start, end);
    },
    getPageCount(array) {
      const n = this.displayCountNum;
      return Math.ceil(array.length / n);
    },
    getPageOf(array, finder) {
      const n = this.displayCountNum;
      const i = array.findIndex(finder);
      return Math.floor((i / n)) + 1;
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

    getMainTagIfSubTag(tag) {
      for (const m of this.predefinedMainTags) {
        if (tag.startsWith(m))
          return m;
      }
      let p = tag.indexOf('(');
      return p != -1 ? tag.slice(0, p) : null;
    },
    addMainTag(t) {
      if (!this.mainTagTable[t]) {
        this.mainTagTable[t] = {
          id: ++this.mainTagIDSeed,
          count: 0,
          note: this.constants.tagNotes[t]
        };
      }
    },
    addSubTag(main, sub) {
      let subtags = this.subTagTable[main];
      if (!subtags) {
        subtags = new Set();
        this.subTagTable[main] = subtags;
      }
      if (!subtags.has(main) && this.tagTable[main]) {
        subtags.add(main);
      }
      subtags.add(sub);
    },
    registerTag(t) {
      if (!this.tagTable[t]) {
        this.tagTable[t] = {
          id: ++this.tagIDSeed,
          count: 0,
        };
      }
      else {
        return;
      }

      const mainTag = this.getMainTagIfSubTag(t);
      if (mainTag) {
        this.addMainTag(mainTag);
        this.addSubTag(mainTag, t);
      }
      else {
        this.addMainTag(t);
        if (t in this.subTagTable) {
          this.subTagTable[t].add(t);
        }
      }
    },
    registerTags(tags) {
      for (const t of tags) {
        this.registerTag(t);
      }
    },
    countTags(tags) {
      for (let t of tags) {
        ++this.tagTable[t].count;

        const mainTag = this.getMainTagIfSubTag(t);
        if (mainTag) {
          ++this.mainTagTable[mainTag].count;
        }
        else {
          ++this.mainTagTable[t].count;
        }
      }
    },
    resetTagCounts() {
      for (let v of Object.values(this.tagTable)) {
        v.count = 0;
      }
      for (let v of Object.values(this.mainTagTable)) {
        v.count = 0;
      }
    },

    genTagID(t) {
      return `tag${this.mainTagTable[t].id}`;
    },
    getMainTags() {
      return Object.keys(this.mainTagTable);
    },
    getFilteredMainTags(tags) {
      let r = [];
      for (const t of tags) {
        if (this.mainTagTable[t].count > 0) {
          r.push(t);
        }
      }
      return r;
    },
    getFilteredSubTags(mainTag) {
      let r = null;
      const subTags = this.subTagTable[mainTag];
      if (subTags) {
        for (const t of subTags) {
          if (this.tagTable[t].count > 0) {
            if (r == null) {
              r = [];
            }
            r.push(t);
          }
        }
      }
      return r;
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

    setTagSearchPattern(txt, wholeWord = false, escape = true) {
      txt = txt.trim();
      if (escape)
        txt = this.escapeRE(txt);
      txt = "^" + txt;
      if (wholeWord)
        txt += "$";
      else
        txt += "($|[(:])";
      this.tagSearchPattern = txt;
      this.freeSearchPattern = "";
      this.searchTabIndex = 0;

      this.preventShowHideHeaderOnScroll = 1;
      this.hidePopover();
      this.$nextTick(function () {
        this.showHeader = true;
      }.bind(this));
    },
    setFreeSearchPattern(txt, wholeWord = false, escape = true) {
      txt = txt.trim();
      if (escape)
        txt = this.escapeRE(txt);
      if (wholeWord)
        txt = `^${txt}$`;
      this.freeSearchPattern = txt;
      this.tagSearchPattern = "";
      this.searchTabIndex = 1;

      this.preventShowHideHeaderOnScroll = 1;
      this.hidePopover();
      this.$nextTick(function () {
        this.showHeader = true;
      }.bind(this));
    },

    matchTags(tags, re) {
      for (const tag of tags) {
        if (tag.match(re)) {
          return true;
        }
      }
      return false;
    },
    matchContent(item, re) {
      return (item.name && item.name.match(re)) || (item.desc && item.desc.match(re)) || (item.date && item.date.match(re));
    },
    getSearchMask() {
      return (this.tagSearchFn ? 1 : 0) | (this.freeSearchFn ? 2 : 0);
    },
    isSearchPatternSet() {
      return this.tagSearchFn || this.freeSearchFn;
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
      let text = item.desc;
      while (true) {
        // [caution]hoge[/caution] -> <span class='caution'>hoge</span>
        // 入れ子のケースに対応するためループする必要がある
        let tmp = text.replaceAll(/\[([^\]]+?)\](.+?)\[\/\1\]/g, "<span class='$1'>$2</span>");
        if (tmp == text)
          break;
        text = tmp;
      }
      return text.replaceAll("\n", "<br/>") + "<br/>";
    },
    noteToHtml(item) {
      let text = item.note;
      while (true) {
        let tmp = text.replaceAll(/\[([^\]]+?)\](.+?)\[\/\1\]/g, "<span class='$1'>$2</span>");
        if (tmp == text)
          break;
        text = tmp;
      }
      return text.replaceAll("\n", "<br/>") + "<br/>";
    },

    updateQuery(name, updateURL = true) {
      let modified = false;
      try {
        // なぜかボタン一個押すたびに呼ばれるので変更チェック
        if (this.tagSearchPattern != this.tagSearchPatternPrev) {
          this.tagSearchPatternPrev = this.tagSearchPattern;
          modified = true;

          if (this.tagSearchPattern.length != 0) {
            const re = new RegExp(this.tagSearchPattern);
            this.tagSearchFn = function (item) {
              return item.tags && this.matchTags(item.tags, re);
            }.bind(this);
          }
          else {
            this.tagSearchFn = null;
          }
        }

        // 同上
        if (this.freeSearchPattern != this.freeSearchPatternPrev) {
          this.freeSearchPatternPrev = this.freeSearchPattern;
          modified = true;

          if (this.freeSearchPattern.length != 0) {
            const re = new RegExp(this.freeSearchPattern);
            this.freeSearchFn = function (item) {
              if (typeof item === 'string') {
                return item.match(re);
              }
              else if (['chr', 'skill', 'talent'].includes(item.recordType)) {
                return this.matchContent(item, re);
              }
              else {
                throw new Error("freeSearchFn: something wrong");
              }
            }.bind(this);
          }
          else {
            this.freeSearchFn = null;
          }
        }
      }
      catch (e) {
        return;
      }

      if (modified || !['tag', 'free'].includes(name)) {
        if (['class', 'rarity', 'symbol', 'supportType', 'damageType', 'skillType', 'itemType', 'any'].includes(name))
          this.updateTagCounts();
        if (updateURL)
          this.updateURL();
        this.preventShowHideHeaderOnScroll = 1;
      }
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
      this.hidePopover(this.prevPopover);
      this.prevPopover = this.genTagID(popoverTarget);
      state.keepDropdown++;
    },
    onSubtagPopoverHide(state) {
      state.keepDropdown--;
      if (state.readyToHide) {
        this.$refs[state.name][0].hide();
      }
    },
    hideTagDropdown(state, popoverTarget) {
      if (popoverTarget) {
        this.hidePopover(this.genTagID(popoverTarget));
      }
      state.readyToHide = true;
    },
    hidePopover(id = null) {
      this.$root.$emit('bv::hide::popover', id);
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

    getMainChrStatus(chr, level = 110, star = 6, bonus = true)
    {
      if (!chr.statusInit || !chr.statusLv || !chr.statusStar)
        return null;

      let r = [0, 0, 0, 0, 0, 0];
      for (let i = 0; i < r.length; ++i) {
        r[i] += chr.statusInit[i];
        r[i] += Math.round(chr.statusLv[i] * (level - 1));
        r[i] += Math.round(chr.statusStar[i] * star);
      }
      if (bonus) {
        const fixed = [100 + 800, 25, 15, 25, 15, 0]; // 好感度 + マスターレベル3
        const rate = [80 + 70, 90 + 50, 80 + 50, 90 + 50, 80 + 50, 50]; // 記憶の書 + 強化ボード (%)
        for (let i = 0; i < r.length; ++i) {
          r[i] += fixed[i];
          r[i] *= 1.0 + rate[i] * 0.01;
          r[i] = Math.round(r[i]);
        }
      }
      return r;
    },

    getSupportChrStatus(chr, level = 110, star = 6, bonus = true) {
      if (!chr.statusInit || !chr.statusLv || !chr.statusStar)
        return null;

      let r = [0, 0, 0, 0, 0, 0];
      for (let i = 0; i < r.length; ++i) {
        r[i] += chr.statusInit[i];
        r[i] += Math.round(chr.statusLv[i] * (level - 1));
        r[i] += Math.round(chr.statusStar[i] * star);
      }
      if (bonus) {
        const fixed = [100 + 1200, 25 + 55, 15 + 28, 25 + 55, 15 + 28, 0]; // 好感度 + マスターレベル3
        const rate = [80 + 30, 90 + 30, 80 + 30, 90 + 30, 80 + 30, 0]; // 記憶の書 + 強化ボード (%)
        for (let i = 0; i < r.length; ++i) {
          r[i] += fixed[i];
          r[i] *= 1.0 + rate[i] * 0.01;
          r[i] = Math.round(r[i]);
        }
      }
      return r;
    },

    toNumber(v)
    {
      if (typeof v === "number")
        return v;
      const r = parseFloat(v);
      return isNaN(r) ? 0 : r;
    },
    toInt(v) {
      if (typeof v === "number")
        return v;
      const r = parseInt(v);
      return isNaN(r) ? 0 : r;
    },
    parseValue(s) {
      if (s == 'true')
        return true;
      else if (s == 'false')
        return false;
      else
        return this.toNumber(s);
    },

    getBattlePower(status)
    {
      if (!status)
        return 0;

      let r = 0;
      r += status[0] * 0.05;
      r += Math.max(status[1], status[3]) * 2 * (1.0 + status[5] * 0.0003);
      r += status[2] * 2;
      r += status[4] * 2;
      return r;
    },
    getMainBattlePower(status) {
      let r = this.getBattlePower(status);
      return Math.round(r * (1.0 + 0.6 + 0.3 + 0.03 * 6));
    },
    getSupportBattlePower(status) {
      let r = this.getBattlePower(status);
      return Math.round(r * (1.0 + 0.6 + 0.15));
    },
    getEstimatedItemBattlePower(item, baseAtk = 3000) {
      const params = item.params;
      let r = 0;
      if (params.hp)
        r += params.hp * 0.05;
      if (params.def)
        r += params.def * 2;
      if (params.res)
        r += params.res * 2;

      if (params.atk)
        r += params.atk * 2;
      else if (params.mag)
        r += params.mag * 2;

      if (params.tec)
        r += baseAtk * 2 * (params.tec * 0.0003)

      return Math.round(r);
    }
  }
}
