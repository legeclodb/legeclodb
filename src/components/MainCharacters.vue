<template>
  <div class="root">
    <div class="header" :class="{ 'hidden': !showHeader }">
      <Navigation />
      <div class="menu-content">
        <div class="menu-panel">
          <div class="menu-widgets flex">
            <div class="widget">
              <h6>タレント / スキル検索</h6>
            </div>
          </div>
          <div class="menu-widgets flex">
            <div class="widget">
              <b-button-group size="sm" id="skill_type_selector">
                <b-button v-for="(c, i) in skillTypeFilter" :key="i" :pressed.sync="c.state" @click="onChangeFilterState()" variant="outline-secondary">
                  {{ skillTypes[i] }}
                </b-button>
              </b-button-group>
            </div>
            <div class="widget" style="width:150px">
              <b-form-input v-model="tagSearchPattern" type="text" debounce="500" size="sm" placeholder="タグ検索 (正規表現)" :update="onUpdateTagSearchPattern()" />
            </div>
          </div>
          <div class="menu-widgets flex">
            <div class="widget" style="margin-right:0px" v-for="(tc, tci) in tagCategory" :key="tci">
              <b-dropdown :text="tc.display" :ref="tc.name" size="sm" @hide="onTagDropdownHide($event, tc)">
                <b-dropdown-item class="d-flex flex-column" v-for="(t, i) in tc.tags" :key="i" :id="tc.name+'_item'+i" @click="setTagSearchPattern(t); hideTagDropdown(tc, tc.name+'_item'+i);">
                  {{t}} <span v-if="mainConsts.tagNotes[t]" class="note" v-html="mainConsts.tagNotes[t]"></span>
                  <b-popover v-if="subTagTable[t]" :target="tc.name+'_item'+i" triggers="hover focus" delay="0" no-fade @shown="onSubtagPopoverShow(tc)" @hidden="onSubtagPopoverHide(tc)">
                    <b-dropdown-item class="d-flex flex-column" v-for="(st, si) in subTagTable[t]" :key="si" @click="setTagSearchPattern(st, true); hideTagDropdown(tc, tc.name+'_item'+i);">{{st}}</b-dropdown-item>
                  </b-popover>
                </b-dropdown-item>
              </b-dropdown>
            </div>
            <div class="widget">
              <b-button variant="secondary" size="sm" @click="tagSearchPattern=''">クリア</b-button>
            </div>
          </div>
        </div>
        <div class="menu-panel">
          <div class="menu-widgets flex">
            <div class="widget">
              <h6>クラス / シンボル フィルター</h6>
            </div>
          </div>
          <div class="menu-widgets flex">
            <div class="widget">
              <b-button-group size="sm" id="class_selector">
                <b-button v-for="(c, i) in classFilter" :key="i" :pressed.sync="c.state" @click="onChangeFilterState()" variant="outline-secondary">
                  <b-img-lazy :src="getIconURL(classes[i])" height="25" />
                </b-button>
              </b-button-group>
            </div>
          </div>
          <div class="menu-widgets flex">
            <div class="widget">
              <b-button-group size="sm" id="symbol_selector">
                <b-button v-for="(c, i) in symbolFilter" :key="i" :pressed.sync="c.state" @click="onChangeFilterState()" variant="outline-secondary">
                  <b-img-lazy :src="getIconURL(symbols[i])" height="25" />
                </b-button>
              </b-button-group>
            </div>
            <div class="widget">
              <b-button-group size="sm" id="attack_type_selector">
                <b-button v-for="(c, i) in damageTypeFilter" :key="i" :pressed.sync="c.state" @click="onChangeFilterState()" variant="outline-secondary">
                  <b-img-lazy :src="getIconURL(damageTypes[i])" height="25" />
                </b-button>
              </b-button-group>
            </div>
            <div class="widget">
              <b-button-group size="sm" id="rareiry_selector">
                <b-button v-for="(c, i) in rarityFilter" :key="i" :pressed.sync="c.state" @click="onChangeFilterState()" variant="outline-secondary">
                  <b-img-lazy :src="getIconURL(rarities[i])" height="20" />
                </b-button>
              </b-button-group>
            </div>
          </div>
        </div>
        <div class="menu-panel">
          <div class="menu-widgets flex">
            <div class="widget">
              <h6>設定</h6>
            </div>
          </div>
          <div class="menu-widgets flex">
            <div class="widget">
              <span>表示：</span>
              <b-dropdown :text="showDetailTypes[showDetail]" size="sm" id="detail_selector" style="width:90px">
                <b-dropdown-item class="d-flex flex-column" v-for="(c, i) in showDetailTypes" :key="i" @click="showDetail=i">
                  {{ showDetailTypes[i] }}
                </b-dropdown-item>
              </b-dropdown>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="content" :style="style">
      <template v-for="chr in mainCharactersDB">
        <div class="character" :id="'mainchar_'+chr.id" :key="chr.id" v-show="filterMainCharacter(chr)">
          <div class="flex">
            <div class="portrait">
              <b-img-lazy :src="chr.icon" :alt="chr.name" />
            </div>
            <div class="detail" v-show="showDetail >= 1">
              <div class="info">
                <h5>{{ chr.name }}</h5>
                <b-img-lazy :src="getIconURL(chr.class)" :alt="chr.class" height="25" />
                <b-img-lazy :src="getIconURL(chr.symbol)" :alt="chr.symbol" height="25" />
                <b-img-lazy :src="getIconURL(chr.damageType)" :alt="chr.damageType" height="25" />
                <b-img-lazy :src="getIconURL(chr.rarity)" :alt="chr.rarity" height="20" />
                <b-link :href="'https://legeclo.wikiru.jp/?' + chr.name" target="_blank">Wiki</b-link>
              </div>
              <div class="skills">
                <div class="talent" :class="{ 'highlighted': isTalentHighlighted(chr) }">
                  <div class="flex">
                    <div class="icon">
                      <b-img-lazy :src="chr.talent.icon" with="50" height="50" />
                    </div>
                    <div class="desc" v-show="showDetail >= 2">
                      <h5>{{ chr.talent.name }}</h5>
                      <p><span v-html="descToHtml(chr.talent)"></span><span v-if="chr.talent.note" class="note" v-html="chr.talent.note"></span></p>
                    </div>
                  </div>
                  <div class="tags" v-show="showDetail >= 2">
                    <b-badge class="tag" :key="i" v-for="(tag, i) in chr.talent.tags" variant="info" pill @click="setTagSearchPattern(tag)">{{ tag }}</b-badge>
                  </div>
                </div>
                <div class="skill" v-for="(skill, si) in chr.skills" :class="{'active': skill.skillType == 'アクティブ', 'passive': skill.skillType == 'パッシブ', 'highlighted': isSkillHighlighted(skill) }" :key="si">
                  <div class="flex">
                    <div class="icon">
                      <b-img-lazy :src="skill.icon" with="50" height="50" />
                    </div>
                    <div class="desc" v-show="showDetail >= 2">
                      <h6>{{ skill.name }}</h6>
                      <p><span v-html="descToHtml(skill)"></span><span v-if="skill.note" class="note" v-html="skill.note"></span></p>
                    </div>
                  </div>
                  <div class="tags" v-show="showDetail >= 2">
                    <b-badge class="tag" :key="i" v-for="(tag, i) in skill.tags" variant="info" pill @click="setTagSearchPattern(tag)">{{ tag }}</b-badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import Navigation from './Navigation.vue'

export default {
  name: 'MainCharacters',
  components: {
    Navigation,
  },

  props: {
  },

  data() {
    return {
      mainSkills: [],
      mainCharacters: [],
      mainConsts: {},
      setupCompleted: false,

      symbols: [
        "ゼニス",
        "オリジン",
        "ナディア",
      ],
      classes: [
        "ソルジャー",
        "ランサー",
        "ライダー",
        "エアリアル",
        "ソーサラー",
        "セイント",
        "シューター",
        "アサシン",
      ],
      rarities: [
        "SSR",
        "SR",
        "R",
      ],
      damageTypes: [
        "アタック",
        "マジック",
      ],
      skillTypes: [
        "タレント",
        "パッシブ",
        "アクティブ",
      ],
      showDetailTypes: [
        "アイコン",
        "シンプル",
        "詳細",
      ],

      tagCategory: {
        buff: {
          display: "バフ系",
          name: "tags_buff",
          tags: new Set(),
        },
        debuff: {
          display: "デバフ系",
          name: "tags_debuff",
          tags: new Set(),
        },
        resist: {
          display: "無効化系",
          name: "tags_resist",
          tags: new Set(),
        },
        other: {
          display: "その他",
          name: "tags_other",
          tags: new Set(),
        },
      },
      subTagTable: {},

      showDetail: 2,
      showHeader: true,
      preventShowHideHeaderOnScroll: 0,
      lastScrollPosition: 0,

      symbolFilter: [
        { state: false },
        { state: false },
        { state: false },
      ],
      classFilter: [
        { state: false },
        { state: false },
        { state: false },
        { state: false },
        { state: false },
        { state: false },
        { state: false },
        { state: false },
      ],
      rarityFilter: [
        { state: false },
        { state: false },
        { state: false },
      ],
      damageTypeFilter: [
        { state: false },
        { state: false },
      ],
      
      skillTypeFilter: [
        { state: false },
        { state: false },
        { state: false },
      ],
      tagSearchPattern: "",
      tagSearchPatternPrev: "",
      prevTagRE: null,

      enableUpdateURL: false,
      prevURL: "",
    };
  },

  computed: {
    mainCharactersDB() {
      if (!this.setupCompleted) {
        return null;
      }
      return this.mainCharacters;
    },
    style() {
      return {
        "--character-flex-grow": `${this.showDetail < 2 ? 0 : 1}`,
        "--skills-display": `${this.showDetail < 2 ? 'flex': 'display'}`,
        "--skill-flex-grow": `${this.showDetail == 2 ? 1 : 0}`,
      };
    },
  },

  async beforeCreate() {
    const fetchJson = function(uri) {
      return fetch(uri, { cache: "no-cache" }).then(res => res.json());
    };

    await Promise.all([
      fetchJson("./main_skills.json"),
      fetchJson("./main_characters.json"),
      fetchJson("./main_consts.json"),
    ]).then((values) => {
      this.mainSkills = values[0];
      this.mainCharacters = values[1];
      this.mainConsts = values[2];
      this.onLoadDB();
    });
  },

  mounted() {
    window.addEventListener('scroll', this.onScroll);
    this.decodeURL();

    window.onpopstate = function() {
      this.decodeURL(true);
    }.bind(this);

    this.enableUpdateURL = true;
  },
  
  beforeDestroy () {
    window.removeEventListener('scroll', this.onScroll);
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

    setTagSearchPattern(txt, wholeWord = false) {
      txt = txt.trim();
      txt = txt.replace('(', '\\(');
      txt = txt.replace(')', '\\)');
      txt = "^" + txt;
      if (wholeWord) {
        txt += "$";
      }
      this.tagSearchPattern = txt;

      this.preventShowHideHeaderOnScroll = 1;
      this.$nextTick(function () {
        this.showHeader = true;
      }.bind(this));
    },
    
    compareDate(a, b) {
      return a.date == b.date ? 0 : (a.date < b.date ? -1 : 1);
    },

    isFilterEnabled(filter) {
      for (const v of filter)
        if (v.state)
          return true;
      return false;
    },
    matchTags(tags, re) {
        for (const tag of tags) {
          if (tag.match(re)) {
            return true;
          }
        }
        return false;
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
    isTalentHighlighted(chr) {
      let re = this.getTagRE();
      if (!re) {
        return false;
      }
      if (!this.isFilterEnabled(this.skillTypeFilter) || this.skillTypeFilter[0].state) {
        if (this.matchTags(chr.talent.tags, re)) {
          return true;
        }
      }
      return false;
    },
    isSkillHighlighted(skill) {
      let re = this.getTagRE();
      if (!re) {
        return false;
      }
      if (!this.isFilterEnabled(this.skillTypeFilter) ||
        (skill.skillType == "パッシブ" && this.skillTypeFilter[1].state) ||
        (skill.skillType == "アクティブ" && this.skillTypeFilter[2].state)) {
        if (this.matchTags(skill.tags, re)) {
          return true;
        }
      }
      return false;
    },
    applyTagSearchPattern(chr) {
      if (this.isTalentHighlighted(chr)) {
        return true;
      }
      for (let skill of chr.skills) {
        if (this.isSkillHighlighted(skill)) {
          return true;
        }
      }
      return false;
    },
    filterMainCharacter(chr) {
      let ok = (!this.isFilterEnabled(this.symbolFilter) || this.symbolFilter[chr.symbolId].state) &&
        (!this.isFilterEnabled(this.classFilter) || this.classFilter[chr.classId].state) &&
        (!this.isFilterEnabled(this.rarityFilter) || this.rarityFilter[chr.rarityId].state) &&
        (!this.isFilterEnabled(this.damageTypeFilter) || this.damageTypeFilter[chr.damageTypeId].state);

      if (ok && this.getTagRE()) {
        ok = this.applyTagSearchPattern(chr);
      }
      return ok;
    },

    descToHtml(item) {
      return item.desc.replaceAll("\n", "<br/>") + "<br/>";
    },

    getIconURL(name) {
      if (this.mainConsts.iconTable && name in this.mainConsts.iconTable) {
        return this.mainConsts.iconTable[name];
      }
      return "./empty.png";
    },

    setupDB() {
      // 最後の要素は追加用のテンプレになっているので取り除く
      if (this.mainCharacters[this.mainCharacters.length - 1].name.length == 0) {
        this.mainCharacters.pop();
      }
      //this.mainCharacters.sort(compareDate);

      let tmpSkillMap = new Map();
      for (let skill of this.mainSkills) {
        tmpSkillMap.set(skill.name, skill);
      }
      this.mainSkills = tmpSkillMap;

      const addUser = function (skill, chr) {
        if (!skill.users)
          skill.users = [];
        skill.users.push(chr.name);
      };

      let allTags = new Set();
      let mainTags = new Set();

      const addSubTag = function (main, sub) {
        let subtags = this.subTagTable[main];
        if (!subtags) {
          subtags = new Set();
          this.subTagTable[main] = subtags;
        }
        if (!subtags.has(main) && allTags.has(main)) {
          subtags.add(main);
        }
        subtags.add(sub);
      }.bind(this);

      const registerTags = function(tags) {
        for (let t of tags) {
          allTags.add(t);
          let p = t.lastIndexOf('(');
          if (p != -1) {
            let sub = t;
            t = t.slice(0, p);
            addSubTag(t, sub);
          }
          mainTags.add(t);
        }
      };

      let idSeed = 0;
      for (let chr of this.mainCharacters) {
        chr.id = ++idSeed;
        chr.symbolId = this.symbols.findIndex(v => v == chr.symbol);
        chr.classId = this.classes.findIndex(v => v == chr.class);
        chr.rarityId = this.rarities.findIndex(v => v == chr.rarity);
        chr.damageTypeId = this.damageTypes.findIndex(v => v == chr.damageType);

        let aoeAttack = 0;
        for (let i = 0; i < chr.skills.length; ++i) {
          let skill = this.mainSkills.get(chr.skills[i]);
          if (!skill) {
            console.log("不明なスキル: " + chr.name + ":" + chr.skills[i]);
          }
          addUser(skill, chr);
          chr.skills[i] = skill;
          registerTags(skill.tags);
          for (const t of skill.skillTags) {
            if (t == "攻撃(範囲)" && skill.skillType == "アクティブ") {
              ++aoeAttack;
            }
          }
        }
        if (aoeAttack > 0) {
          chr.talent.tags.push(`範囲攻撃所持(${aoeAttack})`);
        }
        registerTags(chr.talent.tags);
      }

      // リストの上の方に出すため特別処理
      let handledTags = new Set();
      let handlePredefinedTags = function(dstTags, predefinedTags) {
        if (Array.isArray(predefinedTags)) {
          for (let t of predefinedTags) {
            dstTags.add(t);
            handledTags.add(t);
          }
        }
      };
      handlePredefinedTags(this.tagCategory.buff.tags, this.mainConsts.tagsBuff);
      handlePredefinedTags(this.tagCategory.debuff.tags, this.mainConsts.tagsDebuff);
      handlePredefinedTags(this.tagCategory.resist.tags, this.mainConsts.tagsResist);
      handlePredefinedTags(this.tagCategory.other.tags, this.mainConsts.tagsOther);

      for (let t of Array.from(mainTags).sort()) {
        if (handledTags.has(t))
          continue;

        if (t.match(/^バフ:/))
          this.tagCategory.buff.tags.add(t);
        else if (t.match(/^デバフ:/))
          this.tagCategory.debuff.tags.add(t);
        else if (t.match(/^無効化:/))
          this.tagCategory.resist.tags.add(t);
        else 
          this.tagCategory.other.tags.add(t);
      }

      this.setupCompleted = true;
    },

    debugDB() {
      let skillMap = new Map();
      for (let skill of this.mainSkills) {
        skillMap.set(skill.name, skill);
      }

      for (let chr of this.mainCharacters) {
        if (chr.name.length == 0) {
          continue;
        }
        if (!this.symbols.find(e => e == chr.symbol)) {
          console.log("無効なシンボル: " + chr.name);
        }
        if (!this.classes.find(e => e == chr.class)) {
          console.log("無効なクラス: " + chr.name);
        }
        if (!this.rarities.find(e => e == chr.rarity)) {
          console.log("無効なレアリティ: " + chr.name);
        }
        if (!this.damageTypes.find(e => e == chr.damageType)) {
          console.log("無効なアタックタイプ: " + chr.name);
        }

        for (let skill of chr.skills) {
          if (typeof skill == "object" && typeof skill.icon == "string" && skill.icon.startsWith("https://")) {
            skillMap.set(skill.name, skill);
          }
        }
      }

      let orderdSkills = new Set();
      for (let chr of this.mainCharacters) {
        if (chr.name.length == 0) {
          continue;
        }
        for (let i = 0; i < chr.skills.length; ++i) {
          let skill = chr.skills[i];
          if (typeof skill == "object") {
            if (skillMap.has(skill.name)) {
              chr.skills[i] = skill.name;
            }
          }
          orderdSkills.add(skillMap.get(chr.skills[i]));
        }
      }

      console.log(JSON.stringify(Array.from(orderdSkills)));
      console.log(JSON.stringify(this.mainCharacters));
    },
    
    onLoadDB() {
      //this.debugDB();
      this.setupDB();
    },

    copyToClipboard(value) {
      if (navigator.clipboard) {
        return navigator.clipboard.writeText(value);
      }
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
    updateURL() {
      if (!this.enableUpdateURL) {
        return;
      }

      let params = [];
      if (this.isFilterEnabled(this.classFilter))
        params.push("class=" + this.serializeFilter(this.classFilter).toString(16));
      if (this.isFilterEnabled(this.symbolFilter))
        params.push("symbol=" + this.serializeFilter(this.symbolFilter).toString(16));
      if (this.isFilterEnabled(this.rarityFilter))
        params.push("rarity=" + this.serializeFilter(this.rarityFilter).toString(16));
      if (this.isFilterEnabled(this.damageTypeFilter))
        params.push("damageType=" + this.serializeFilter(this.damageTypeFilter).toString(16));
      if (this.isFilterEnabled(this.skillTypeFilter))
        params.push("skillType=" + this.serializeFilter(this.skillTypeFilter).toString(16));
      if (this.tagSearchPattern.length > 0)
        params.push("tag=" + this.tagSearchPattern);

      let url = "?";
      if (params.length != 0) {
        url += params.join("&");
      }
      if (url != this.prevURL) {
        window.history.pushState(null, null, url);
        this.prevURL = url;
      }
    },
    decodeURL(initState = false) {
      let data = {
        class: 0,
        symbol: 0,
        damageType: 0,
        rarity: 0,
        skillType: 0,
        tag: "",

        parseNumber(param, name) {
          let r = param.match(new RegExp(`${name}=([0-9a-f]+)`));
          if (r) {
            this[name] = parseInt(r[1], 16);
            return true;
          }
          return false;
        },
        parseString(param, name) {
          let r = param.match(new RegExp(`${name}=(.+)`));
          if (r) {
            this[name] = r[1];
            return true;
          }
          return false;
        },
        parseURL() {
          let ok = false;
          let url = decodeURIComponent(window.location.href);

          let q = url.lastIndexOf('?');
          if (q != -1) {
            let params = url.slice(q + 1).split('&');
            for (let param of params) {
              let handled = data.parseNumber(param, "class") || data.parseNumber(param, "symbol") ||
                data.parseNumber(param, "rarity") || data.parseNumber(param, "damageType") || data.parseNumber(param, "skillType") ||
                data.parseString(param, "tag");
              if(handled) {
                ok = true;
              }
            }
          }
          return ok;
        },
      };

      if (data.parseURL() || initState) {
        this.enableUpdateURL = false;
        this.deserializeFilter(this.classFilter, data.class);
        this.deserializeFilter(this.symbolFilter, data.symbol);
        this.deserializeFilter(this.damageTypeFilter, data.damageType);
        this.deserializeFilter(this.rarityFilter, data.rarity);
        this.deserializeFilter(this.skillTypeFilter, data.skillType);
        this.tagSearchPattern = data.tag;
        this.$forceUpdate();
        this.enableUpdateURL = true;
      }
    },
    onChangeFilterState() {
      if (!this.setupCompleted) {
        return;
      }
      this.updateURL();
      this.preventShowHideHeaderOnScroll = 1;
    },
    onUpdateTagSearchPattern() {
      // なぜかボタン一個押すたびに呼ばれるので変更チェック…
      if(this.tagSearchPattern == this.tagSearchPatternPrev)
        return;
      this.tagSearchPatternPrev = this.tagSearchPattern;
      this.updateURL();
    },

    onTagDropdownHide(event, tagCategory) {
      if (tagCategory.keepDropdown) {
        event.preventDefault();
      }
    },
    onSubtagPopoverShow(tagCategory) {
      tagCategory.keepDropdown = true;
    },
    onSubtagPopoverHide(tagCategory) {
      tagCategory.keepDropdown = false;
      if (tagCategory.readyToHide) {
        this.$refs[tagCategory.name][0].hide();
        tagCategory.readyToHide = false;
      }
    },
    hideTagDropdown(tagCategory, popoverTarget) {
      if (popoverTarget) {
        this.$root.$emit('bv::hide::popover', popoverTarget);
      }
      tagCategory.readyToHide = true;
    },

  }
}
</script>

<style scoped>
</style>
