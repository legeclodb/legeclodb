<template>
  <div class="root" @mousemove="onMouseMove">
    <div class="header" :class="{ 'hidden': !showHeader }">
      <Navigation />
      <div class="menu-content">
        <div class="menu-panel">
          <b-tabs nav-class="tab-index" v-model="searchTabIndex">
            <b-tab title="タグ検索">
              <div class="menu-widgets flex">
                <div class="widget">
                  <b-button-group size="sm" id="skill_type_selector">
                    <b-button v-for="(c, i) in skillTypeFilter" :key="i" :pressed.sync="c.state" @click="updateQuery('skillType')" variant="outline-secondary">
                      {{ skillTypes[i] }}
                    </b-button>
                  </b-button-group>
                </div>
                <div class="widget" style="width: 170px">
                  <b-form-input v-model="tagSearchPattern" type="text" debounce="500" size="sm" placeholder="検索ワード (正規表現)" :update="updateQuery('tag')" />
                </div>
              </div>
              <div class="menu-widgets flex">
                <div class="widget" style="margin-right:0px" v-for="(tc, tci) in tagCategory" :key="tci">
                  <b-dropdown :text="tc.display" :ref="tc.name" size="sm" @show="onTagDropdownShow($event, tc)" @hide="onTagDropdownHide($event, tc)">
                    <b-dropdown-item class="d-flex flex-column" v-for="t in getFilteredMainTags(tc.tags)" :key="mainTagTable[t].id" :id="genTagID(t)" @click="setTagSearchPattern(t); hideTagDropdown(tc, t);">
                      {{t}} <span class="note" v-html="`(${mainTagTable[t].count})`"></span> <span v-if="mainTagTable[t].note" class="note" v-html="mainTagTable[t].note"></span>
                      <b-popover v-if="subTagTable[t]" :target="genTagID(t)" triggers="hover focus" :delay="{show:0, hide:250}" no-fade @show="onSubtagPopoverShow(tc, t)" @hidden="onSubtagPopoverHide(tc, t)">
                        <b-dropdown-item class="d-flex flex-column" v-for="st in getFilteredSubTags(t)" :key="tagTable[st].id" @click="setTagSearchPattern(st, true); hideTagDropdown(tc, t);">
                          {{st}} <span class="note" v-html="`(${tagTable[st].count})`"></span>
                        </b-dropdown-item>
                      </b-popover>
                    </b-dropdown-item>
                  </b-dropdown>
                </div>
                <div class="widget">
                  <b-button variant="secondary" size="sm" @click="tagSearchPattern=''">クリア</b-button>
                </div>
              </div>
            </b-tab>
            <b-tab title="フリーワード検索">
              <div class="menu-widgets flex">
                <div class="widget" style="width: 300px">
                  <b-form-input v-model="freeSearchPattern" type="text" debounce="500" size="sm" placeholder="検索ワード (正規表現)" :update="updateQuery('free')" />
                </div>
                <div class="widget">
                  <b-button variant="secondary" size="sm" @click="freeSearchPattern=''">クリア</b-button>
                </div>
              </div>
            </b-tab>
          </b-tabs>
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
                <b-button v-for="(c, i) in classFilter" :key="i" :pressed.sync="c.state" @click="updateQuery('class')" variant="outline-secondary">
                  <b-img-lazy :src="getImageURL(classes[i])" width="25" height="25" />
                </b-button>
              </b-button-group>
            </div>
          </div>
          <div class="menu-widgets flex">
            <div class="widget">
              <b-button-group size="sm" id="support_type_selector">
                <b-button v-for="(c, i) in supportTypeFilter" :key="i" :pressed.sync="c.state" @click="updateQuery('supportType')" variant="outline-secondary">
                  <b-img-lazy :src="getImageURL(supportTypes[i])" height="25" />
                </b-button>
              </b-button-group>
            </div>
            <div class="widget">
              <b-button-group size="sm" id="rareiry_selector">
                <b-button v-for="(c, i) in rarityFilter" :key="i" :pressed.sync="c.state" @click="updateQuery('rarity')" variant="outline-secondary">
                  <b-img-lazy :src="getImageURL(rarities[i])" width="36" height="20" />
                </b-button>
              </b-button-group>
            </div>
            <div class="widget">
              <b-button-group size="sm" id="attack_type_selector">
                <b-button v-for="(c, i) in damageTypeFilter" :key="i" :pressed.sync="c.state" @click="updateQuery('damageType')" variant="outline-secondary">
                  <b-img-lazy :src="getImageURL(damageTypes[i])" width="25" height="25" />
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
              <span>表示 件数：</span>
              <b-dropdown :text="displayCounts[displayCount]" size="sm" id="detail_selector">
                <b-dropdown-item class="d-flex flex-column" v-for="(c, i) in displayCounts" :key="i" @click="displayCount=i">
                  {{ displayCounts[i] }}
                </b-dropdown-item>
              </b-dropdown>
            </div>
            <div class="widget">
              <span>形式：</span>
              <b-dropdown :text="displayTypes[displayType]" size="sm" id="detail_selector">
                <b-dropdown-item class="d-flex flex-column" v-for="(c, i) in displayTypes" :key="i" @click="displayType=i">
                  {{ displayTypes[i] }}
                </b-dropdown-item>
              </b-dropdown>
            </div>
          </div>
          <div class="menu-widgets flex">
            <div class="widget">
              <span>ソート：</span>
              <b-dropdown :text="sortTypes[sortType]" size="sm" id="sort_selector">
                <b-dropdown-item class="d-flex flex-column" v-for="(c, i) in sortTypes" :key="i" @click="sortType=i">
                  {{ sortTypes[i] }}
                </b-dropdown-item>
              </b-dropdown>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div id="content" class="content" style="margin-top: 200px;" :style="style">

      <div class="pages" v-if="getPageCount(items) > 1">
        <b-pagination v-model="page"
                      :total-rows="items.length"
                      :per-page="displayCountNum"
                      @change="onPage"
                      limit="10"
                      hide-goto-end-buttons></b-pagination>
        <ul class="pagination b-pagination" style="margin-left: 0px;">
          <li class="page-item">
            <b-button @click="scrollToBottom()" variant="outline-secondary" class="page-link">
              ↓
            </b-button>
          </li>
        </ul>
      </div>

      <template v-for="chr in pagedItems">
        <div class="character" :id="'chr_'+chr.id" :key="chr.id">
          <div class="flex">
            <div class="portrait">
              <b-img-lazy :src="getImageURL(chr.name)" :alt="chr.name" width="100" height="100" rounded />
            </div>
            <div class="detail" v-show="displayType >= 1">
              <div class="info" :class="{ 'highlighted': isInfoHighlighted(chr) }">
                <h5 v-html="chrNameToHtml(chr.name)"></h5>
                <div class="status">
                  <b-img-lazy :src="getImageURL(chr.class)" :title="'クラス:'+chr.class" height="25" />
                  <b-img-lazy :src="getImageURL(chr.supportType)" :title="'サポートタイプ:'+chr.supportType" height="25" />
                  <b-img-lazy :src="getImageURL(chr.rarity)" :title="'レアリティ:'+chr.rarity" height="20" />
                  <div class="param-box"><b-img-lazy :src="getImageURL(chr.damageType)" :title="'攻撃タイプ:'+chr.damageType" width="20" height="20" /></div>
                  <div class="param-box"><b-img-lazy :src="getImageURL('射程')" title="射程" width="18" height="18" /><span>{{chr.range}}</span></div>
                  <span class="date">{{chr.date}}</span>
                </div>
                <div class="status2">
                  <div class="param-box"><b-img-lazy :src="getImageURL('HP')" title="HP" width="18" height="18" /><span>{{chr.hp}}</span></div>
                  <div class="param-box" v-if="chr.damageType=='アタック'"><b-img-lazy :src="getImageURL('アタック')" title="アタック" width="18" height="18" /><span>{{chr.atk}}</span></div>
                  <div class="param-box" v-if="chr.damageType=='マジック'"><b-img-lazy :src="getImageURL('マジック')" title="マジック" width="18" height="18" /><span>{{chr.mag}}</span></div>
                  <div class="param-box"><b-img-lazy :src="getImageURL('ディフェンス')" title="ディフェンス" width="18" height="18" /><span>{{chr.def}}</span></div>
                  <div class="param-box"><b-img-lazy :src="getImageURL('レジスト')" title="レジスト" width="18" height="18" /><span>{{chr.res}}</span></div>
                  <div class="param-box"><span class="param-name">戦闘力:</span><span class="param-value">{{chr.power}}</span></div>
                </div>
              </div>
              <div class="skills">
                <div class="skill" v-for="(skill, si) in chr.skills" :class="{'active': skill.skillType == 'アクティブ', 'passive': skill.skillType == 'パッシブ', 'highlighted': isSkillHighlighted(skill) }" :key="si">
                  <div class="flex">
                    <div class="icon" :id="'chr_'+chr.id+'_skill'+si">
                      <b-img-lazy :src="getImageURL(skill.name)" with="50" height="50" />
                      <b-popover v-if="displayType==1" :target="'chr_'+chr.id+'_skill'+si" triggers="hover focus" :title="skill.name" placement="top">
                        <div class="flex">
                          <div v-html="descToHtml(skill)"></div>
                        </div>
                      </b-popover>
                    </div>
                    <div class="desc" v-show="displayType >= 2">
                      <div class="flex">
                        <h6>
                          {{ skill.name }}
                          <b-dropdown class="level-selector" :text="skill.current" v-if="skill.descs" variant="outline-secondary">
                            <b-dropdown-item class="d-flex flex-column" v-for="(ds, di) in skill.descs" :key="di" @click="skill.current=di; skill.desc=ds;">{{di}}</b-dropdown-item>
                          </b-dropdown>
                        </h6>
                        <div class="param-group" v-html="skillParamsToHtml(skill)"></div>
                      </div>
                      <p><span v-html="descToHtml(skill)"></span><span v-if="skill.note" class="note" v-html="noteToHtml(skill)"></span></p>
                    </div>
                  </div>
                  <div class="tags" v-show="displayType >= 2">
                    <b-badge class="tag" :key="i" v-for="(tag, i) in skill.tags" variant="info" pill @click="setTagSearchPattern(tag)">{{ tag }}</b-badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <div class="pages" v-if="getPageCount(items) > 1">
        <b-pagination v-model="page"
                      :total-rows="items.length"
                      :per-page="displayCountNum"
                      @change="onPage"
                      limit="10"
                      hide-goto-end-buttons></b-pagination>
        <ul class="pagination b-pagination" style="margin-left: 0px;">
          <li class="page-item">
            <b-button @click="scrollToTop()" variant="outline-secondary" class="page-link">
              ↑
            </b-button>
          </li>
        </ul>
      </div>

    </div>
  </div>
</template>

<script>
import Navigation from './Navigation.vue'
import jsonSkills from '../assets/support_skills.json'
import jsonCharacters from '../assets/support_characters.json'
import jsonConstants from '../assets/constants.json'
import common from "./common";

export default {
  name: 'SupportCharacters',
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
      supportTypes: jsonConstants.supportTypes,
      rarities: jsonConstants.rarities,
      damageTypes: jsonConstants.damageTypes,
      skillTypes: [
        "アクティブ",
        "パッシブ1",
        "パッシブ2",
      ],

      displayTypes: [
        "アイコン",
        "シンプル",
        "詳細",
      ],
      sortTypes: [
        "実装時期(降順)",
        "実装時期(昇順)",
        "戦闘力(降順)",
        "戦闘力(昇順)",
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
        action: {
          display: "攻撃/回復",
          name: "tags_action",
          tags: new Set(),
        },
        other: {
          display: "その他",
          name: "tags_other",
          tags: new Set(),
        },
      },
      subTagTable: {},

      classFilter: [],
      supportTypeFilter: [],
      rarityFilter: [],
      damageTypeFilter: [],
      skillTypeFilter: [],

      enableUpdateURL: false,
      prevURL: "",

    };
  },

  computed: {
    rawItems() {
      return this.characters;
    },
    items() {
      let characters = this.characters.filter(a => this.filterItem(a)); // filter & shallow copy
      switch (this.sortType) {
        case 0: // 新→旧
          characters.sort((a, b) => b.date.localeCompare(a.date));
          break;
        case 1: // 新→旧
          characters.sort((a, b) => a.date.localeCompare(b.date));
          break;
        case 2:
          characters.sort((a, b) => a.power < b.power ? 1 : -1);
          break;
        case 3:
          characters.sort((a, b) => a.power < b.power ? -1 : 1);
          break;
      }
      return characters;
    },
    pagedItems() {
      return this.applyPage(this.items);
    },
  },

  created() {
    this.setupDB();

    this.fillFilter(this.classFilter, this.classes);
    this.fillFilter(this.supportTypeFilter, this.supportTypes);
    this.fillFilter(this.rarityFilter, this.rarities);
    this.fillFilter(this.damageTypeFilter, this.damageTypes);
    this.fillFilter(this.skillTypeFilter, this.skillTypes);

    this.decodeURL();
    this.updateTagCounts();
  },

  mounted() {
    this.enableUpdateURL = true;
    window.onpopstate = function () {
      this.enableUpdateURL = false;
      this.decodeURL(true);
      this.$nextTick(function () {
        this.enableUpdateURL = true;
      });
    }.bind(this);
  },

  methods: {
    setupDB() {
      // 外部 json 由来のデータへの変更はセッションをまたいでしまうので、deep copy しておく
      this.characters = structuredClone(this.characters);
      this.skills = structuredClone(this.skills);

      this.predefinedMainTags.push("分類");

      let skillMap = new Map();
      let skillId = 0;
      for (let skill of this.skills) {
        skill.recordType = 'skill';
        skill.id = ++skillId;
        skillMap.set(skill.name, skill);
      }

      let chrId = 0;
      for (let chr of this.characters) {
        chr.recordType = 'chr';
        chr.id = ++chrId;
        chr.classId = this.classes.findIndex(v => v == chr.class);
        chr.supportTypeId = this.supportTypes.findIndex(v => v == chr.supportType);
        chr.rarityId = this.rarities.findIndex(v => v == chr.rarity);
        chr.damageTypeId = this.damageTypes.findIndex(v => v == chr.damageType);

        const status = this.getSupportChrStatus(chr);
        status[5] = 0; // tec
        chr.hp = status[0];
        chr.atk = status[1];
        chr.def = status[2];
        chr.mag = status[3];
        chr.res = status[4];
        chr.power = this.getSupportBattlePower(status);

        for (let si = 0; si < chr.skills.length; ++si) {
          let skill = skillMap.get(chr.skills[si]);
          if (!skill) {
            // 開発中とりあえず表示させるための措置
            skill = skillMap.get(this.skills[0].name);
          }
          skill.skillIndex = si; // パッシブ1 のみが複数キャラで共有され、現状全て si==1 なので問題ない

          if (si == 0) {
            const m = chr.name.match(/\((.+?)\)/);
            if (m) {
              // 不格好だがアクティブスキルにキャラ特性タグを追加…
              skill.tags.push(`分類:${m[1]}`);
            }
          }
          chr.skills[si] = skill;
          this.registerTags(skill.tags);
        }

        let skillActive = chr.skills[0];
        if (skillActive.descs) {
          skillActive.current = "Lv 6";
          skillActive.desc = skillActive.descs[skillActive.current];
        }
      }

      let handledTags = new Set();
      this.appendSet(handledTags, this.constants.tagsHidden);

      const isAction = function (t) {
        for (const n of this.constants.tagsAction) {
          if (t.startsWith(n))
            return true;
        }
        return false;
      }.bind(this);

      for (let t of this.getMainTags()) {
        if (handledTags.has(t))
          continue;

        if (t.match(/^バフ:/))
          this.tagCategory.buff.tags.add(t);
        else if (t.match(/^デバフ:/))
          this.tagCategory.debuff.tags.add(t);
        else if (t.match(/^無効化:/))
          this.tagCategory.resist.tags.add(t);
        else if (isAction(t))
          this.tagCategory.action.tags.add(t);
        else
          this.tagCategory.other.tags.add(t);
      }
      this.reorderSet(this.tagCategory.buff.tags, this.constants.tagsBuff);
      this.reorderSet(this.tagCategory.debuff.tags, this.constants.tagsDebuff);
      this.reorderSet(this.tagCategory.resist.tags, this.constants.tagsResist);
      this.reorderSet(this.tagCategory.action.tags, this.constants.tagsAction);
      this.reorderSet(this.tagCategory.other.tags, this.constants.tagsOther);
      this.reorderSubtag();
    },

    isInfoHighlighted(chr) {
      return this.freeSearchFn && this.freeSearchFn(chr)
        ? 2 : 0;
    },
    isSkillHighlighted(skill) {
      let r = 0;
      if (this.tagSearchFn) {
        r |= this.applySkillTypeFilter(skill) && this.tagSearchFn(skill)
          ? 1: 0;
      }
      if (this.freeSearchFn) {
        r |= this.freeSearchFn(skill)
          ? 2 : 0;
      }
      return r;
    },
    applySkillTypeFilter(skill) {
      return !this.isFilterEnabled(this.skillTypeFilter) ||
        (skill.skillIndex == 0 && this.skillTypeFilter[0].state) ||
        (skill.skillIndex == 1 && this.skillTypeFilter[1].state) ||
        (skill.skillIndex == 2 && this.skillTypeFilter[2].state);
    },
    applyClassFilter(chr) {
      return this.filterMatch(this.classFilter, chr.classId) &&
        this.filterMatch(this.supportTypeFilter, chr.supportTypeId) &&
        this.filterMatch(this.rarityFilter, chr.rarityId) &&
        this.filterMatch(this.damageTypeFilter, chr.damageTypeId);
    },
    applySearchPatterns(chr) {
      let r = this.isInfoHighlighted(chr);
      for (let skill of chr.skills) {
        r |= this.isSkillHighlighted(skill);
      }
      return r == this.getSearchMask();
    },
    filterItem(chr) {
      let ok = !chr.hidden && this.applyClassFilter(chr);
      if (ok && this.isSearchPatternSet()) {
        ok = this.applySearchPatterns(chr);
      }
      return ok;
    },
    updateTagCounts() {
      this.resetTagCounts();
      for (let chr of this.characters) {
        if (this.applyClassFilter(chr)) {
          for (let skill of chr.skills) {
            if (this.applySkillTypeFilter(skill)) {
              this.countTags(skill.tags);
            }
          }
        }
      }
    },

    skillParamsToHtml(skill) {
      if (skill.skillType == 'アクティブ') {
        return `
<div class="param-box"><span class="param-name">範囲:</span><span class="param-value">${skill.area}</span></div>
<div class="param-box"><span class="param-name">射程:</span><span class="param-value">${skill.range}</span></div>
`;
      }
      else if (skill.skillType == 'パッシブ') {
        return "";
      }
    },

    updateURL(kvp) {
      if (!this.enableUpdateURL)
        return false;

      let seri = new this.URLSerializer();
      if (this.isFilterEnabled(this.classFilter))
        seri.class = this.serializeFilter(this.classFilter);
      if (this.isFilterEnabled(this.supportTypeFilter))
        seri.supportType = this.serializeFilter(this.supportTypeFilter);
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
  
      if (kvp) {
        for (const k in kvp)
          seri[k] = kvp[k];
      }

      let url = seri.serialize();
      if (url != this.prevURL) {
        window.history.pushState(null, null, url);
        this.prevURL = url;
        return true;
      }
      return false;
    },
    decodeURL(initState = false) {
      let data = new this.URLSerializer({
        class: 0,
        supportType: 0,
        damageType: 0,
        rarity: 0,
        skillType: 0,
        tag: "",
        free: "",
        p: 1,
      });

      if (data.deserialize(window.location.href) || initState) {
        this.deserializeFilter(this.classFilter, data.class);
        this.deserializeFilter(this.supportTypeFilter, data.supportType);
        this.deserializeFilter(this.damageTypeFilter, data.damageType);
        this.deserializeFilter(this.rarityFilter, data.rarity);
        this.deserializeFilter(this.skillTypeFilter, data.skillType);
        this.tagSearchPattern = data.tag;
        this.freeSearchPattern = data.free;
        if (this.freeSearchPattern.length != 0)
          this.searchTabIndex = 1;

        if (data.p > 0)
          this.page = data.p;
      }
    },
  },
}
</script>

<style scoped>
</style>
