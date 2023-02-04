export default {
  data() {
    return {
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


    isFilterEnabled(filter) {
      for (const v of filter)
        if (v.state)
          return true;
      return false;
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
  }
}
