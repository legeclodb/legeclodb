<template>
  <div class="root">
    <div class="header" :class="{ 'hidden': !showHeader }">
      <Navigation />
      <div class="menu-content">
        <div class="menu-panel">
          <div class="menu-widgets flex">
            <div class="widget">
              <h6>タグ検索</h6>
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
            <div class="widget" style="width: 170px">
              <b-form-input v-model="tagSearchPattern" type="text" debounce="500" size="sm" placeholder="検索ワード (正規表現)" :update="onUpdateTagSearchPattern()" />
            </div>
          </div>
          <div class="menu-widgets flex">
            <div class="widget" style="margin-right:0px" v-for="(tc, tci) in tagCategory" :key="tci">
              <b-dropdown :text="tc.display" :ref="tc.name" size="sm" @show="onTagDropdownShow($event, tc)" @hide="onTagDropdownHide($event, tc)">
                <b-dropdown-item class="d-flex flex-column" v-for="(t, i) in tc.tags" :key="i" :id="tc.name+'_item'+i" @click="setTagSearchPattern(t); hideTagDropdown(tc, tc.name+'_item'+i);">
                  {{t}} <span v-if="constants.tagNotes[t]" class="note" v-html="constants.tagNotes[t]"></span>
                  <b-popover v-if="subTagTable[t]" :target="tc.name+'_item'+i" triggers="hover focus" :delay="{show:0, hide:250}" no-fade @show="onSubtagPopoverShow(tc, tc.name+'_item'+i)" @hidden="onSubtagPopoverHide(tc, tc.name+'_item'+i)">
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
              <h6>フィルター</h6>
            </div>
          </div>
          <div class="menu-widgets flex">
            <div class="widget">
              <b-button-group size="sm" id="class_selector">
                <b-button v-for="(c, i) in classFilter" :key="i" :pressed.sync="c.state" @click="onChangeFilterState()" variant="outline-secondary">
                  <b-img-lazy :src="getImageURL(classes[i])" width="25" height="25" />
                </b-button>
              </b-button-group>
            </div>
          </div>
          <div class="menu-widgets flex">
            <div class="widget">
              <b-button-group size="sm" id="symbol_selector">
                <b-button v-for="(c, i) in symbolFilter" :key="i" :pressed.sync="c.state" @click="onChangeFilterState()" variant="outline-secondary">
                  <b-img-lazy :src="getImageURL(symbols[i])" height="25" />
                </b-button>
              </b-button-group>
            </div>
            <div class="widget">
              <b-button-group size="sm" id="attack_type_selector">
                <b-button v-for="(c, i) in damageTypeFilter" :key="i" :pressed.sync="c.state" @click="onChangeFilterState()" variant="outline-secondary">
                  <b-img-lazy :src="getImageURL(damageTypes[i])" width="25" height="25" />
                </b-button>
              </b-button-group>
            </div>
            <div class="widget">
              <b-button-group size="sm" id="rareiry_selector">
                <b-button v-for="(c, i) in rarityFilter" :key="i" :pressed.sync="c.state" @click="onChangeFilterState()" variant="outline-secondary">
                  <b-img-lazy :src="getImageURL(rarities[i])" width="36" height="20" />
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
    <div class="content" style="margin-top: 210px;" :style="style">
      <template v-for="chr in items">
        <div class="character" :id="'chr_'+chr.id" :key="chr.id" v-show="filterItem(chr)">
          <div class="flex">
            <div class="portrait">
              <b-img-lazy :src="getImageURL(chr.name)" :alt="chr.name" width="100" height="100" rounded />
            </div>
            <div class="detail" v-show="showDetail >= 1">
              <div class="info" :class="{ 'highlighted': isInfoHighlighted(chr) }">
                <h5 v-html="chrNameToHtml(chr.name)"></h5>
                <div class="status">
                  <b-img-lazy :src="getImageURL(chr.class)" :alt="chr.class" height="25" />
                  <b-img-lazy :src="getImageURL(chr.symbol)" :alt="chr.symbol" height="25" />
                  <b-img-lazy :src="getImageURL(chr.rarity)" :alt="chr.rarity" height="20" />
                  <div class="param-box"><b-img-lazy :src="getImageURL(chr.damageType)" :alt="chr.damageType" width="20" height="20" /></div>
                  <div class="param-box"><b-img-lazy :src="getImageURL('射程')" alt="射程" width="18" height="18" /><span>{{chr.range}}</span></div>
                  <div class="param-box"><b-img-lazy :src="getImageURL('移動')" alt="移動" width="18" height="18" /><span>{{chr.move}}</span></div>
                  <b-link :href="'https://legeclo.wikiru.jp/?' + chr.name" target="_blank">Wiki</b-link>
                </div>
              </div>
              <div class="skills">
                <div class="talent" :class="{ 'highlighted': isTalentHighlighted(chr) }">
                  <div class="flex">
                    <div class="icon" :id="'chr_'+chr.id+'_talent'">
                      <b-img-lazy :src="getImageURL(chr.talent.name)" with="50" height="50" />
                      <b-popover v-if="showDetail==1" :target="'chr_'+chr.id+'_talent'" triggers="hover focus" :title="chr.talent.name" :content="chr.talent.desc" placement="top"></b-popover>
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
                <div class="skill" v-for="(skill, si) in chr.skills" :class="getSkillClass(skill)" :key="si">
                  <div class="flex">
                    <div class="icon" :id="'chr_'+chr.id+'_skill'+si">
                      <b-img-lazy :src="getImageURL(skill.name)" with="50" height="50" />
                      <b-popover v-if="showDetail==1" :target="'chr_'+chr.id+'_skill'+si" triggers="hover focus" :title="skill.name" :content="skill.desc" placement="top"></b-popover>
                    </div>
                    <div class="desc" v-show="showDetail >= 2">
                      <div class="flex">
                        <h6>{{ skill.name }}</h6>
                        <div class="param-group" v-html="skillParamsToHtml(skill)"></div>
                      </div>
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
import jsonSkills from '../assets/main_skills.json'
import jsonCharacters from '../assets/main_characters.json'
import jsonConstants from '../assets/constants.json'
import common from "./common";

export default {
  name: 'MainCharacters',
  components: {
    Navigation,
  },
  mixins: [common],

  data() {
    return {
      skills: jsonSkills,
      characters: jsonCharacters,
      constants: jsonConstants,

      classes: jsonConstants.classes,
      symbols: jsonConstants.symbols,
      damageTypes: jsonConstants.damageTypes,
      rarities: jsonConstants.rarities,
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

      classFilter: [],
      symbolFilter: [],
      rarityFilter: [],
      damageTypeFilter: [],
      skillTypeFilter: [],

      enableUpdateURL: false,
      prevURL: "",
    };
  },

  computed: {
    items() {
      return this.characters;
    },
  },

  created() {
    this.setupDB();

    this.fillFilter(this.classFilter, this.classes);
    this.fillFilter(this.symbolFilter, this.symbols);
    this.fillFilter(this.rarityFilter, this.rarities);
    this.fillFilter(this.damageTypeFilter, this.damageTypes);
    this.fillFilter(this.skillTypeFilter, this.skillTypes);
  },

  mounted() {
    this.decodeURL();

    window.onpopstate = function() {
      this.decodeURL(true);
    }.bind(this);

    this.enableUpdateURL = true;
  },

  methods: {
    isInfoHighlighted(chr) {
      return this.freeSearchRE && this.matchContent(chr, this.freeSearchRE);
    },
    isTalentHighlighted(chr) {
      let ok = false;
      if (!ok && this.tagSearchRE) {
        ok = (!this.isFilterEnabled(this.skillTypeFilter) || this.skillTypeFilter[0].state) &&
          this.matchTags(chr.talent.tags, this.tagSearchRE);
      }
      if (!ok && this.freeSearchRE) {
        ok = this.matchContent(chr.talent, this.freeSearchRE);
      }
      return ok;
    },
    isSkillHighlighted(skill) {
      let ok = false;
      if (!ok && this.tagSearchRE) {
        ok = (!this.isFilterEnabled(this.skillTypeFilter) ||
          (skill.skillType == "パッシブ" && this.skillTypeFilter[1].state) ||
          (skill.skillType == "アクティブ" && this.skillTypeFilter[2].state)) &&
          this.matchTags(skill.tags, this.tagSearchRE);
      }
      if (!ok && this.freeSearchRE) {
        ok = this.matchContent(skill, this.freeSearchRE);
      }
      return ok;
    },
    applySearchPatterns(chr) {
      if (this.isInfoHighlighted(chr) || this.isTalentHighlighted(chr)) {
        return true;
      }
      for (let skill of chr.skills) {
        if (this.isSkillHighlighted(skill)) {
          return true;
        }
      }
      return false;
    },
    filterItem(chr) {
      let ok = this.filterMatch(this.classFilter, chr.classId) &&
        this.filterMatch(this.symbolFilter, chr.symbolId) &&
        this.filterMatch(this.rarityFilter, chr.rarityId) &&
        this.filterMatch(this.damageTypeFilter, chr.damageTypeId);
      if (ok && this.isSearchPatternSet()) {
        ok = this.applySearchPatterns(chr);
      }
      return ok;
    },
    getSkillClass(skill) {
      return {
        active: skill.skillType == 'アクティブ',
        passive: skill.skillType == 'パッシブ',
        highlighted: this.isSkillHighlighted(skill),
      }
    },
    skillParamsToHtml(skill) {
      if (skill.skillType == 'アクティブ') {
        return `
<div class="param-box"><span class="param-name">CT:</span><span class="param-value">${skill.ct}</span></div>
<div class="param-box"><span class="param-name">範囲:</span><span class="param-value">${skill.area}</span></div>
<div class="param-box"><span class="param-name">射程:</span><span class="param-value">${skill.range}</span></div>
<div class="param-box"><span class="param-name">コスト:</span><span class="param-value">${skill.cost}</span></div>
`;
      }
      else if (skill.skillType == 'パッシブ') {
        return `
<div class="param-box"><span class="param-name">コスト:</span><span class="param-value">${skill.cost}</span></div>
`;
      }
    },

    setupDB() {
      let skillMap = new Map();
      for (let skill of this.skills) {
        skillMap.set(skill.name, skill);
        this.registerTags(skill.tags);
      }

      // 外部 json 由来のデータへの変更はセッションをまたいでしまうので、deep copy しておく
      this.characters = structuredClone(this.characters);
      let idSeed = 0;
      for (let chr of this.characters) {
        chr.id = ++idSeed;
        chr.classId = this.classes.findIndex(v => v == chr.class);
        chr.symbolId = this.symbols.findIndex(v => v == chr.symbol);
        chr.rarityId = this.rarities.findIndex(v => v == chr.rarity);
        chr.damageTypeId = this.damageTypes.findIndex(v => v == chr.damageType);

        for (let i = 0; i < chr.skills.length; ++i) {
          if (typeof chr.skills[i] === "string") {
            chr.skills[i] = skillMap.get(chr.skills[i]);
          }
        }

        let aoeAttack = 0;
        for (let skill of chr.skills) {
          for (const t of skill.skillTags) {
            if (t == "攻撃(範囲)" && skill.skillType == "アクティブ") {
              ++aoeAttack;
            }
          }
        }
        if (aoeAttack > 0) {
          chr.talent.tags.push(`範囲攻撃所持(${aoeAttack})`);
        }

        // ↑でタグを追加するのでこのタイミングである必要がある
        this.registerTags(chr.talent.tags);
      }

      // リストの上の方に出すため特別処理
      let handledTags = new Set();
      this.appendSet(handledTags, this.constants.tagsHidden);
      let handlePredefinedTags = function(dstTags, predefinedTags) {
        for (let t of predefinedTags) {
          dstTags.add(t);
          handledTags.add(t);
        }
      };
      handlePredefinedTags(this.tagCategory.buff.tags, ["シンボルスキル"]);

      for (let t of Array.from(this.mainTags).sort()) {
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
      this.reorderSet(this.tagCategory.buff.tags, this.constants.tagsBuff);
      this.reorderSet(this.tagCategory.debuff.tags, this.constants.tagsDebuff);
      this.reorderSet(this.tagCategory.resist.tags, this.constants.tagsResist);
      this.reorderSet(this.tagCategory.other.tags, this.constants.tagsOther);
      this.reorderSubtag();
    },
    
    updateURL() {
      if (!this.enableUpdateURL) {
        return;
      }

      let seri = new this.URLSerializer();
      if (this.isFilterEnabled(this.classFilter))
        seri.class = this.serializeFilter(this.classFilter);
      if (this.isFilterEnabled(this.symbolFilter))
        seri.symbol = this.serializeFilter(this.symbolFilter);
      if (this.isFilterEnabled(this.rarityFilter))
        seri.rarity = this.serializeFilter(this.rarityFilter);
      if (this.isFilterEnabled(this.damageTypeFilter))
        seri.damageType = this.serializeFilter(this.damageTypeFilter);
      if (this.isFilterEnabled(this.skillTypeFilter))
        seri.skillType = this.serializeFilter(this.skillTypeFilter);
      if (this.tagSearchPattern.length > 0)
        seri.tag = this.tagSearchPattern;
      if (this.freeSearchPattern.length > 0)
        seri.free = this.freeSearchPattern;

      let url = seri.serialize();
      if (url != this.prevURL) {
        window.history.pushState(null, null, url);
        this.prevURL = url;
      }
    },
    decodeURL(initState = false) {
      let data = new this.URLSerializer({
        class: 0,
        symbol: 0,
        damageType: 0,
        rarity: 0,
        skillType: 0,
        tag: "",
        free: "",
      });

      if (data.deserialize(window.location.href) || initState) {
        this.enableUpdateURL = false;
        this.deserializeFilter(this.classFilter, data.class);
        this.deserializeFilter(this.symbolFilter, data.symbol);
        this.deserializeFilter(this.damageTypeFilter, data.damageType);
        this.deserializeFilter(this.rarityFilter, data.rarity);
        this.deserializeFilter(this.skillTypeFilter, data.skillType);
        this.tagSearchPattern = data.tag;
        this.freeSearchPattern = data.free;
        this.$forceUpdate();
        this.enableUpdateURL = true;
      }
    },
  }
}
</script>

<style scoped>
</style>
