import jsonImageTable from '../assets/image_table.json'
import jsonConstants from '../assets/constants.json'
import jsonRandomEffectTable from '../assets/random_effect_table.json'

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
      settingsTabIndex: 0,

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
      const pos = window.scrollY || document.documentElement.scrollTop;
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
      else {
        if (name) {
          console.log(`getImageURL(): ${name} not found`);
        }
        return "./empty.png";
      }
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
      if (tags) {
        for (const t of tags)
          this.registerTag(t);
      }
    },
    countTags(tags) {
      if (!tags)
        return;
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
      this.$nextTick(() => {
        this.showHeader = true;
      });
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
      this.$nextTick(() => {
        this.showHeader = true;
      });
    },

    matchTags(tags, re) {
      if (tags) {
        for (const tag of tags) {
          if (tag.match(re)) {
            return true;
          }
        }
      }
      return false;
    },
    matchContent(item, re) {
      if (typeof item === 'string') {
        return item.match(re);
      }
      else {
        return (item.name && item.name.match(re)) || (item.desc && item.desc.match(re)) || (item.date && item.date.match(re));
      }
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
    descToHtml(item, removeMarkup = false) {
      let text = item.desc;
      if (!text)
        return "";

      // 行を跨ぐ置換がありうるため、先に \n -> <br/> 置換
      text = text.replaceAll("\n", "<br/>") + "<br/>";
      while (true) {
        // [caution]hoge[/caution] -> <span class='caution'>hoge</span>
        // 入れ子のケースに対応するためループする必要がある
        let replaced = removeMarkup ? "$2" : "<span class='$1'>$2</span>";
        let tmp = text.replaceAll(/\[([^\]]+?)\](.+?)\[\/\1\]/g, replaced);
        if (tmp == text)
          break;
        text = tmp;
      }
      return text;
    },
    descToTitle(item) {
      if (!item)
        return "";
      let text = item.name + "\n";
      if (item.isMain) {
        text += `クラス:${item.class} シンボル:${item.symbol} 攻撃タイプ:${item.damageType}\n`;
      }
      if (item.isSupport) {
        text += `クラス:${item.class} 攻撃タイプ:${item.damageType}\n`;
      }
      if (item.isItem) {
        text += this.statusToText(item.status) + "\n";
      }
      if (item.isActive || item.isPassive) {
        text += [
          ["CT", this.ctToText(item)],
          ["範囲", this.areaToText(item)],
          ["射程", this.rangeToText(item)],
          ["コスト", item.cost],
        ].filter(a => a[1])
          .map((a) => `${a[0]}: ${a[1]}`)
          .join(" ") + "\n";
      }
      text += this.removeMarkup(item.desc);
      return text;
    },

    ctToText(item) {
      return item.ct == 0 ? "-" : item.ct;
    },
    areaToText(item) {
      if (item.areaShape == "直線") {
        return `直線${item.area}マス`
      }
      else {
        return item.area;
      }
    },
    rangeToText(item) {
      return item.range;
    },
    removeMarkup(text) {
      if (!text) {
        return "";
      }
      while (true) {
        let tmp = text.replaceAll(/\[([^\]]+?)\](.+?)\[\/\1\]/g, "$2");
        if (tmp == text)
          break;
        text = tmp;
      }
      return text;
    },
    noteToHtml(item) {
      let text = item.note;

      const funcTable = {
        randomTableToString(name) {
          name = name.replace(/^['"]/, "").replace(/['"]$/, "");
          if (name in jsonRandomEffectTable) {
            const table = jsonRandomEffectTable[name];
            const getVal = (a) => {
              let v = a.value ?? "";
              if (v) {
                if (name.startsWith("ランダムデバフ"))
                  v = `-${v}`;
                else
                  v = `+${v}`;
                if (a.type != "移動")
                  v = `${v}%`;
              }
              return v;
            };
            return table.map(a => `${a.type}${getVal(a)}(${a.duration}ターン)`).join("、");
          }
        },
      };
      text = text.replace(/`([^(]+?)\(([^)]+)\)`/g, (match, func, args) => {
        if (func in funcTable) {
          return funcTable[func](args);
        }
        else {
          throw `関数が見つかりませんでした: ${func}`;
        }
      });

      while (true) {
        let tmp = text.replaceAll(/\[([^\]]+?)\](.+?)\[\/\1\]/g, "<span class='$1'>$2</span>");
        if (tmp == text)
          break;
        text = tmp;
      }
      return text.replaceAll("\n", "<br/>") + "<br/>";
    },
    skillNameToHtml(skill) {
      return skill.name;
    },
    skillParamsToHtml(skill) {
      return [
        ["CT", this.ctToText(skill)],
        ["範囲", this.areaToText(skill)],
        ["射程", this.rangeToText(skill)],
        ["コスト", skill.cost],
      ].filter(a => a[1])
        .map((a) => `<div class="param-box"><span class="param-name">${a[0]}:</span><span class="param-value">${a[1]}</span></div>`)
        .join("");
    },
    statusToHtml(status, prefix = "", damageType = null) {
      const conv = (n, v, i) => {
        if (!v)
          return [];
        if (i < 6)
          return `<div class="param-box"><img src="${this.getImageURL(n)}" title="${n}" width="18" height="18" /><span>${prefix}${v}</span></div>`;
        else
          return `<div class="param-box"><span class="param-name">${n}:</span><span class="param-value">${v}</span></div>`;
      };
      let list = ["HP", "アタック", "ディフェンス", "マジック", "レジスト", "テクニック", "戦闘力"].flatMap((n, i) => conv(n, status[i], i));

      if (damageType) {
        list.splice(5, 1);
        if (damageType == "アタック")
          list.splice(3, 1);
        else if (damageType == "マジック")
          list.splice(1, 1, ...list.splice(3, 1));
      }
      return list.join("");
    },
    statusToText(status) {
      const conv = (n, v, i) => {
        if (!v)
          return [];
        return `${n}+${v} `;
      };
      let list = ["HP", "アタック", "ディフェンス", "マジック", "レジスト", "テクニック", "戦闘力"].flatMap((n, i) => conv(n, status[i], i));
      return list.join("");
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
            this.tagSearchFn = (item) => {
              return this.matchTags(item.tags, re);
            };
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
            this.freeSearchFn = (item) => this.matchContent(item, re);
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
        if (['class', 'engage', 'rarity', 'symbol', 'supportType', 'damageType', 'skillType', 'itemType', 'any'].includes(name))
          this.updateTagCounts();
        if (updateURL && this.updateURL)
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
                this[kvp[0]] = decodeURIComponent(kvp[1]);
              ++numHandled;
            }
          }
        }
        return numHandled;
      }
    },

    getMainChrStatus(chr, level = 110, star = 6, master = 3, loveBonus = true, boost = [150, 140, 130, 140, 130, 50])
    {
      if (!chr || !chr.statusInit || !chr.statusLv || !chr.statusStar)
        return null;

      let r = [0, 0, 0, 0, 0, 0];
      for (let i = 0; i < r.length; ++i) {
        r[i] += chr.statusInit[i];
        r[i] += Math.round(chr.statusLv[i] * (level - 1));
        r[i] += Math.round(chr.statusStar[i] * star);
      }
      if(master > 0 && master <= 3){
        const values = [
          [  0, 0, 0, 0, 0, 0],
          [200, 0, 0, 0, 0, 0],
          [400, 0, 0, 0, 0, 0],
          [800, 0, 0, 0, 0, 0],
        ];
        for (let i = 0; i < r.length; ++i)
          r[i] += values[master][i];
      }
      if (loveBonus) {
        const values = [100, 25, 15, 25, 15, 0];
        for (let i = 0; i < values.length; ++i)
          r[i] += values[i];
      }
      if (boost) {
        for (let i = 0; i < boost.length; ++i)
          r[i] = Math.round(r[i] * (1.0 + boost[i] * 0.01));
      }
      return r;
    },

    getSupportChrStatus(chr, level = 110, star = 6, master = 3, loveBonus = true, boost = [110, 120, 110, 120, 110, 0], amulet = null) {
      if (!chr || !chr.statusInit || !chr.statusLv || !chr.statusStar)
        return null;

      let r = [0, 0, 0, 0, 0, 0];
      for (let i = 0; i < r.length; ++i) {
        r[i] += chr.statusInit[i];
        r[i] += Math.round(chr.statusLv[i] * (level - 1));
        r[i] += Math.round(chr.statusStar[i] * star);
      }
      if (master > 0 && master <= 3) {
        const values = [
          [   0,  0,  0,  0,  0, 0],
          [ 300, 15,  8, 15,  8, 0],
          [ 600, 30, 16, 30, 16, 0],
          [1200, 55, 28, 55, 28, 0],
        ];
        for (let i = 0; i < r.length; ++i)
          r[i] += values[master][i];
      }
      if (loveBonus) {
        const values = [100, 25, 15, 25, 15, 0];
        for (let i = 0; i < values.length; ++i)
          r[i] += values[i];
      }

      // 端数の丸め方で誤差が出てしまうため、r *= 1.0 + boost + amulet ではダメ
      let additional = [0, 0, 0, 0, 0, 0];
      if (boost) {
        for (let i = 0; i < boost.length; ++i)
          additional[i] += Math.round(r[i] * (boost[i] * 0.01));
      }
      if (amulet) {
        for (let i = 0; i < amulet.length; ++i)
          additional[i] += Math.round(r[i] * (amulet[i] * 0.01));
      }
      for (let i = 0; i < additional.length; ++i)
        r[i] += additional[i];

      return r;
    },

    getItemStatus(item, level = 50) {
      if (!item || !item.statusInit || !item.statusLv)
        return null;

      let r = [0, 0, 0, 0, 0, 0];
      for (let i = 0; i < r.length; ++i) {
        r[i] += Math.round(item.statusInit[i] + item.statusLv[i] * (level - 1));
      }
      return r;
    },

    // rate: 各能力値のブースト量% (例: [200, 100, 100, 100, 100, 100] で HP だけ 2 倍)
    getNPCChrStatus(chr, level, rate = null)
    {
      let status = null;

      // NPC のステータスは大体 10 レベル毎にキーとなる値が設定されており、それ以外のレベルでは線形補間する必要がある
      let prevLv = null;
      for (let lvStr in chr.statusLvs) {
        const lv = parseInt(lvStr);
        if (lv == level) {
          // キーレベルに一致する場合、その値を使う
          status = [...chr.statusLvs[lv]];
          break;
        }
        else if (lv < level) {
          prevLv = lv;
        }
        else {
          // ステータス補間
          const ps = chr.statusLvs[prevLv];
          const cs = chr.statusLvs[lv];
          status = new Array(cs.length);
          for (let i = 0; i < cs.length; ++i) {
            status[i] = ps[i] + Math.floor(((cs[i] - ps[i]) / (lv - prevLv)) * (level - prevLv));
          }
          break;
        }
      }
      if (!status) {
        // 最大キーレベルより高い場合は最大キーレベルの値を使う
        status = [...chr.statusLvs[prevLv]];
      }

      // ブースト適用
      if (rate) {
        for (let i = 0; i < status.length; ++i) {
          status[i] = Math.round(status[i] * (rate[i] * 0.01));
        }
      }
      return status;
    },

    getEngateDate(chr) {
      return chr.engage ? chr.engage.date : "";
    },
    compareEngageDate(l, r) {
      const ld = this.getEngateDate(l);
      const rd = this.getEngateDate(r);
      if (ld || rd) {
        return ld == rd ? r.date.localeCompare(l.date) : rd.localeCompare(ld);
      }
      else {
        return r.date.localeCompare(l.date);
      }
    },

    // seq must be sorted array
    lowerBound(seq, n) {
      let first = 0, last = seq.length - 1;
      while (first <= last) {
        const middle = (first + last) / 2;
        if (seq[middle] < n)
          first = middle + 1;
        else
          last = middle - 1;
      }
      return first;
    },
    compare(a, b) {
      return a == b ? 0 : a < b ? 1 : -1;
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
      else if (s.match(/^[\d.]+$/))
        return this.toNumber(s);
      else
        return s;
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
    getMainBattlePower(status, star = 6, master = 3, skillCost = 6, itemStar = 20, enchantComplete = true, engageSkillCount = 0) {
      let r = this.getBattlePower(status);
      return Math.round(r * (1.0 + 0.1 * star + 0.1 * master + 0.03 * skillCost + 0.02 * itemStar + (enchantComplete ? 0.1 : 0) + engageSkillCount * 0.05));
    },
    getSupportBattlePower(status, star = 6, master = 3, skillCount = 3) {
      status = [...status];
      status[5] = 0; // テクニックを計上しない
      let r = this.getBattlePower(status);
      return Math.round(r * (1.0 + 0.1 * star + 0.1 * master + 0.05 * skillCount));
    },
    getEstimatedItemBattlePower(status, api = 0, baseAP = 3000, baseTec = 0) {
      let r = 0;
      r += status[0] * 0.05;
      r += status[2] * 2;
      r += status[4] * 2;

      let ap = 0;
      if (api == 0)
        ap = Math.max(status[1], status[3]);
      else
        ap = status[api];
      r += ap * 2 * (1.0 + (baseTec + status[5]) * 0.0003);

      r += baseAP * 2 * (status[5] * 0.0003);

      return Math.round(r);
    },


    getEffectIndex(effectType) {
      const effectTypes = jsonConstants.effectTypes;
      return effectTypes.findIndex(a => a == effectType);
    },

    isPublicTarget(target) {
      return !target ||
        (typeof (target) == "string" && !target.startsWith("自身"));
    },
    isSelfTarget(target) {
      return !target ||
        (typeof (target) == "string" && target.startsWith("自身"));
    },

    effectParamsToTags(skill, params) {
      let miscTags = [];
      const addTag = (tag) => {
        miscTags.push(tag);
      };

      if (skill.multiAction) {
        let postfix = "";
        for (const ma of skill.multiAction) {
          const cond = ma.condition;
          if (cond) {
            if (cond.onKill)
              postfix = "(敵撃破時)";
            else if (cond.probability)
              postfix = "(確率)";
            else
              postfix = "";
          }
          if (ma.target && ma.target != "自身") {
            postfix = "(味方)";
          }
        }
        addTag(`再行動${postfix}`);
        if (!skill.isActive || (skill.isActive && skill.damageRate) || postfix == "(味方)") {
          addTag(`再攻撃${postfix}`);
        }
      }

      if (skill.multiMove) {
        let postfix = "";
        for (const mm of skill.multiMove) {
          const cond = mm.condition;
          if (cond) {
            if (cond.onKill)
              postfix = "(敵撃破時)";
            else
              postfix = "";
          }
        }
        addTag(`再移動${postfix}`);
      }

      if (skill.guard) {
        let postfix = "";
        for (const v of skill.guard) {
          if (v.type == "物理") {
            postfix = "(物理攻撃)";
          }
        }
        addTag(`ガード${postfix}`);
      }

      if (skill.doubleAttack) {
        let postfix = "";
        for (const da of skill.doubleAttack) {
          const cond = da.condition;
          if (cond) {
            if (cond.onEnemyTurn)
              postfix = "(反撃)";
            else
              postfix = "";
          }
        }
        addTag(`2回攻撃${postfix}`);
      }
      if (skill.supportAttack) {
        addTag(`サポート同時攻撃`);
      }
      if (skill.ignoreGuard) {
        addTag(`ガード不可攻撃`);
      }

      if (skill.fixedDamage) {
        if (skill.fixedDamage.find(a => !(typeof (target) == "string" && a.target?.startsWith("自身")))) {
          addTag(`固定ダメージ`);
        }
      }
      if (skill.areaDamage) {
        addTag(`範囲攻撃(自分中心)`);
      }

      if (skill.heal) {
        for (const heal of skill.heal) {
          if (heal.target == "全体") {
            addTag(`全体回復`);
          }
          else if (heal.target == "範囲" || (heal.target == "スキル対象" && skill.area != "単体")) {
            addTag(`範囲回復`);
          }
          else if (heal.target == "スキル対象" && skill.area == "単体") {
            addTag(`単体回復`);
          }
          else if (heal.target == "味方(低HP)") {
            addTag(`単体回復(低HP)`);
          }
          else if (heal.target == "自身" && heal.type == "ダメージ割合") {
            addTag(`与ダメ回復`);
          }
        }
      }

      if (skill.revive) {
        addTag(`復活`);
      }
      if (skill.summon) {
        addTag(`召喚`);
      }
      if (skill.isSymbolSkill) {
        addTag(`シンボルスキル`);
      }
      if (skill.buffCancel) {
        addTag(`バフ解除`);
      }
      if (skill.buffSteal) {
        addTag(`バフ奪取`);
      }

      if (skill.ctReduction) {
        let postfix = "";
        for (const v of skill.ctReduction) {
          if (v.target != "自身") {
            postfix = `(味方)`;
          }
          else if (v.targetSkill == "全スキル") {
            postfix = `(自身)`;
          }
        }
        if (postfix) {
          addTag(`CT減${postfix}`);
        }
      }

      if (skill.positionManipulate) {
        let postfix = "";
        for (const v of skill.positionManipulate) {
          postfix = `(${v.type})`;
        }
        addTag(`位置移動${postfix}`);
      }

      const buffToS = (effectCategory, effect) => {
        if (params.tagFilter && !params.tagFilter(skill, effectCategory, effect))
          return [];

        if (effect.type == "ランダム") {
          // ランダムは扱いが特殊なので個別処理
          return `${effectCategory}:${effect.type}(${effect.variant})`;
        }
        if (effect.isDebuff && !effect.duration) {
          return [];
        }

        // マイナスバフをデメリットタグとして登録するか
        if (typeof (effect.value) == 'number') {
          if (effect.value < 0 && effect.isBuff) {
            if (params.includeDemeritTags) {
              effectCategory = "デメリット"
            }
            else {
              //console.log(effect);
              return [];
            }
          }
        }

        let t = effectCategory + ":" + effect.type;

        if (effect.ephemeral) {
          t += "(戦闘時)";
        }
        else if (effect.target) {
          if ((params.includeSelfTags && this.isSelfTarget(effect.target))) {
            t += `(${effect.target})`;
          }
        }
        else if (params.includeAreaTags && effect.isBuff && effect.area) {
          t += `(味方)`;
        }
        return t;
      };

      let buff = skill.buff;
      if (skill.isSymbolSkill) {
        buff = buff?.slice(6, buff.length); // シンボルスキル共通バフは除外
      }

      const map = (a, f) => a ? a.flatMap(f) : [];
      return [
        ...miscTags,
        ...map(buff, a => buffToS("バフ", a)),
        ...map(skill.debuff, a => buffToS("デバフ", a)),
        ...map(skill.statusEffects, a => buffToS("デバフ", a)),
        ...map(skill.immune, a => buffToS("無効化", a)),
        ...map(skill.drawback, a => buffToS("デメリット", a)),
      ];
    },

    setupSkill(skill, params) {
      const self = this;
      if (skill.isActive) {
        if (skill.area == "単体") {
          skill.isSingleTarget = true;
        }
        if (skill.range == "自ユニット") {
          if (skill.isSingleTarget) {
            skill.isSelfTarget = true;
          }
          else if (skill.areaShape == "直線") {
            skill.isDirectionalAreaTarget = true;
          }
          else {
            skill.isRadialAreaTarget = true;
          }
        }
        if (skill.area && skill.area != "単体") {
          skill.isAreaTarget = true;
        }

        const hasAreaEffect = (effects) => {
          if (effects) {
            for (const e of effects) {
              if (e.target != "自身") {
                return true;
              }
            }
          }
          return false;
        };

        if (skill.damageRate || hasAreaEffect(skill.debuff)) {
          skill.isTargetEnemy = true;
        }
        if (skill.healRate || hasAreaEffect(skill.buff)) {
          skill.isTargetAlly = true;
        }
        if (skill.summon) {
          skill.isTargetCell = true;
        }
      }

      const setupSlot = (effect) => {
        effect.typeId = self.getEffectIndex(effect.type);
        if (skill.isActive && !effect.slot) {
          let slot = effect.type;
          if (effect.isBuff)
            slot += "+";
          else if (effect.isDebuff)
            slot += "-";
          if (skill.isMainSkill)
            slot += "(メイン)";
          else if (skill.isSupportSkill)
            slot += "(サポート)";
          if (effect.ephemeral)
            slot += "(戦闘時)";
          effect.slot = slot;
        }
        else if (skill.isActive && effect.slot) {
          effect.hasSpecialSlot = true;
        }
      };
      const setParent = (effect) => {
        Object.defineProperty(effect, 'parent', {
          value: skill,
          writable: false,
        });
      };
      const setupRandomTable = (effect) => {
        if (effect.type == "ランダム") {
          const tableName = effect.isBuff ? `ランダムバフ:${effect.variant}` : `ランダムデバフ:${effect.variant}`;
          if (tableName in jsonRandomEffectTable) {
            effect.randomTable = jsonRandomEffectTable[tableName].map(a => Object.assign({}, a)); // shallow copy
          }
          else {
            throw `ランダム効果がテーブルから見つかりませんでした: ${skill.name} ${effect.variant}`;
          }
        }
      };

      if (skill.buff) {
        for (let v of skill.buff) {
          setParent(v);
          v.isBuff = true;
          setupSlot(v);
          setupRandomTable(v);

          if (typeof (v.value) === 'number' && v.value < 0) {
            if (!skill.negativeEffects)
              skill.negativeEffects = [];
            skill.negativeEffects.push(v);
          }
        }
      }
      if (skill.debuff) {
        for (let v of skill.debuff) {
          setParent(v);
          v.isDebuff = true;
          setupSlot(v);
          setupRandomTable(v);
        }
      }
      if (skill.statusEffects) {
        for (let v of skill.statusEffects) {
          setParent(v);
          v.isStatusEffect = true;
        }
      }
      if (skill.immune) {
        for (let v of skill.immune) {
          setParent(v);
          v.isImmune = true;
        }
      }

      if (!skill.tags)
        skill.tags = [];
      if (params.includeSkillEffectTags)
        skill.tags = [...skill.tags, ...this.effectParamsToTags(skill, params)];

      if (!skill.icon)
        skill.icon = skill.uid;
    },

    setupItems(items, params = {}) {
      const consts = jsonConstants;
      const allClasses = [0, 1, 2, 3, 4, 5, 6, 7];

      for (let item of items) {
        item.isItem = true;
        this.setupSkill(item, params);

        if (item.classes) {
          item.classIds = item.classes.map(cls => consts.classes.findIndex(v => v == cls));
          item.classFlags = 0;
          for (const i of item.classIds)
            item.classFlags |= 1 << i;
        }
        else {
          item.classIds = allClasses;
          item.classFlags = 0xffff;
        }

        if (item.rarity)
          item.rarityId = consts.rarities.findIndex(v => v == item.rarity);
        if (item.slot)
          item.slotId = consts.itemTypes.findIndex(v => v == item.slot);

        item.status = this.getItemStatus(item);
      }
    },

    // params:
    // {
    //   includeSelfTags: bool,
    //   includeSkillEffectTags: bool,
    //   includeAreaTags: bool,
    //   includeDemeritTags: bool,
    //   tagFilter: (skill, effectCategory, effect) => bool,
    // }
    setupCharacters(characters, activeSkills, passiveSkills, talents = [], params = {}) {
      const isMain = talents.length != 0;
      const isSupport = !isMain;
      const consts = jsonConstants;

      for (let s of activeSkills)
        s.isActive = true;
      for (let s of passiveSkills)
        s.isPassive = true;
      for (let s of talents)
        s.isTalent = true;

      if (isMain) {
        for (let chr of characters)
          chr.isMain = true;
        for (let s of [...activeSkills, ...passiveSkills, ...talents])
          s.isMainSkill = true;
      }
      if (isSupport) {
        for (let chr of characters)
          chr.isSupport = true;
        for (let s of [...activeSkills, ...passiveSkills])
          s.isSupportSkill = true;
      }

      let skillTable = new Map();
      for (let s of [...activeSkills, ...passiveSkills, ...talents]) {
        this.setupSkill(s, params);
        skillTable.set(s.uid, s);
      }

      const grabSkill = (id, chr) => {
        if (typeof (id) == "object") {
          return id;
        }

        let skill = skillTable.get(id);
        if (!skill) {
          console.error(`skill not found: ${id}`);
          return null;
        }
        if (!skill.owners)
          Object.defineProperty(skill, 'owners', {
            value: [],
            writable: false,
          });
        if (!skill.owners.includes(chr))
          skill.owners.push(chr);

        // todo: まともなレベル選択処理
        if (!skill.desc && skill.descs) {
          skill.current = "Lv 6";
          this.$set(skill, 'desc', skill.descs[skill.current]);

          const arrayToScalar = (obj, prop) => {
            const v = obj[prop];
            if (Array.isArray(v)) {
              obj[`${prop}_`] = v;
              obj[prop] = v[v.length - 1];
            }
          };

          let effects = [
            ...(skill.buff ? skill.buff : []),
            ...(skill.debuff ? skill.debuff : []),
            ...(skill.immune ? skill.immune : []),
          ]
          for (let effect of effects) {
            arrayToScalar(effect, "value");
            arrayToScalar(effect, "duration");
            if (effect.add) {
              arrayToScalar(effect.add, "rate");
            }
            let cond = effect.condition;
            if (cond) {
              arrayToScalar(cond, "probability");
            }
          }
        }
        return skill;
      };

      for (let chr of characters) {
        if (chr.talent) {
          chr.isMain = true;
          chr.talent = grabSkill(chr.talent, chr);
        }
        else {
          chr.isSupport = true;
        }
        if (!chr.icon) {
          chr.icon = chr.uid;
        }

        if (chr.class)
          chr.classId = consts.classes.findIndex(v => v == chr.class);
        if (chr.symbol)
          chr.symbolId = consts.symbols.findIndex(v => v == chr.symbol);
        if (chr.rarity)
          chr.rarityId = consts.rarities.findIndex(v => v == chr.rarity);
        if (chr.damageType)
          chr.damageTypeId = consts.damageTypes.findIndex(v => v == chr.damageType);
        if (chr.supportType)
          chr.supportTypeId = consts.supportTypes.findIndex(v => v == chr.supportType);

        const handleSummons = (skills) => {
          for (let s of skills) {
            if (Array.isArray(s.summon) && (typeof s.summon[0]) == "string") {
              s.summon = s.summon.map(uid => chr.summon.find(sch => sch.uid == uid));
            }
          }
        };

        if (chr.skills) {
          chr.skills = chr.skills.flatMap(id => grabSkill(id, chr));
          if (chr.summon) {
            for (let s of chr.summon) {
              s.talent = grabSkill(s.talent, chr);
              s.skills = s.skills.flatMap(id => grabSkill(id, chr));
              if (!s.icon) {
                s.icon = s.uid;
              }
            }
            Object.defineProperty(chr, 'baseSkills', {
              configurable: true,
              get: () => chr.skills
            });

            handleSummons(chr.skills);
            Object.defineProperty(chr, 'summonAll', {
              configurable: true,
              get: () => chr.summon
            });
          }
        }

        if (chr.engage?.skills) {
          chr.engage.skills = chr.engage.skills.flatMap(id => grabSkill(id, chr));
          for (let i = 0; i < chr.skills.length; ++i) {
            if (chr.engage.skills[i] !== chr.skills[i]) {
              chr.engage.skills[i].isEngageSkill = true;
            }
          }
          this.$set(chr.engage, 'enabled', false);

          chr._skills = chr.skills;
          Object.defineProperty(chr, 'skills', {
            configurable: true,
            get: () => chr.engage.enabled ? chr.engage.skills : chr._skills,
          });
          Object.defineProperty(chr, 'baseSkills', {
            configurable: true,
            get: () => chr._skills,
          });

          if (chr.summon) {
            handleSummons(chr.engage.skills);

            chr._summon = chr.summon;
            Object.defineProperty(chr, 'summon', {
              configurable: true,
              get: () => chr.skills.find(a => a.summon).summon
            });
            Object.defineProperty(chr, 'summonAll', {
              configurable: true,
              get: () => chr._summon
            });
          }
        }

        if (params.includeSkillEffectTags && chr.isMain) {
          let multiAttack = 0;
          const skills = [chr.talent, ...(chr.engage?.skills ?? chr.skills ?? [])];
          for (const skill of skills) {
            if (this.matchTags(skill?.tags, /^再攻撃(\(敵撃破時\))?$/)) {
              ++multiAttack;
            }
          }
          if (multiAttack >= 2) {
            chr.talent.tags.push("再々攻撃");
          }
        }
      }
    },


    toast(mes) {
      this.$bvToast.toast(mes, {
        toaster: 'b-toaster-bottom-left',
        autoHideDelay: Math.min(300 + mes.length * 150, 3000),
        appendToast: true,
      });
    },

    dispatchScrollEvent() {
      // ダミー scroll イベントの発行。
      // (主に popover 内の要素のサイズが変わった際に再配置を促すため用)
      window.dispatchEvent(new CustomEvent('scroll'));
    },

    setArrayElement(ary, idx, item) {
      this.$set(ary, idx, item);
    },
    pushArray(ary, item) {
      ary.push(item);
    },
    popArray(ary) {
      if (ary.length > 0) {
        ary.splice(ary.length - 1);
      }
    },

    moveProperty(dst, src, name) {
      if (name in src) {
        dst[name] = src[name];
        delete src[name];
      }
    },
    swapProperty(dst, src, field) {
      const tmp = dst[field];
      dst[field] = src[field];
      src[field] = tmp;
    },
    objectEqual(obj1, obj2) {
      if (obj1 === obj2) {
        return true;
      }
      if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
        return false;
      }

      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);
      if (keys1.length !== keys2.length) {
        return false;
      }
      for (let key of keys1) {
        if (!Object.hasOwn(obj2, key)) {
          return false;
        }
        if (!this.objectEqual(obj1[key], obj2[key])) {
          return false;
        }
      }
      return true;
    },

  },
}
