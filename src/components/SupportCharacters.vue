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
              <h6>クラスフィルター</h6>
            </div>
          </div>
          <div class="menu-widgets flex">
            <div class="widget">
              <b-button-group size="sm" id="class_selector">
                <b-button v-for="(c, i) in classFilter" :key="i" :pressed.sync="c.state" @click="onChangeFilterState()" variant="outline-secondary">
                  <b-img-lazy :src="getImageURL(classes[i])" height="25" />
                </b-button>
              </b-button-group>
            </div>
          </div>
          <div class="menu-widgets flex">
            <div class="widget">
              <b-button-group size="sm" id="support_type_selector">
                <b-button v-for="(c, i) in supportTypeFilter" :key="i" :pressed.sync="c.state" @click="onChangeFilterState()" variant="outline-secondary">
                  <b-img-lazy :src="getImageURL(supportTypes[i])" height="25" />
                </b-button>
              </b-button-group>
            </div>
            <div class="widget">
              <b-button-group size="sm" id="attack_type_selector">
                <b-button v-for="(c, i) in damageTypeFilter" :key="i" :pressed.sync="c.state" @click="onChangeFilterState()" variant="outline-secondary">
                  <b-img-lazy :src="getImageURL(damageTypes[i])" height="25" />
                </b-button>
              </b-button-group>
            </div>
            <div class="widget">
              <b-button-group size="sm" id="rareiry_selector">
                <b-button v-for="(c, i) in rarityFilter" :key="i" :pressed.sync="c.state" @click="onChangeFilterState()" variant="outline-secondary">
                  <b-img-lazy :src="getImageURL(rarities[i])" height="20" />
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
              <b-link :href="'#chr_'+chr.id"><b-img-lazy :src="getImageURL(chr.name)" :alt="chr.name" width="100" height="100" /></b-link>
            </div>
            <div class="detail" v-show="showDetail >= 1">
              <div class="info">
                <h5 v-html="chrNameToHtml(chr.name)"></h5>
                <b-img-lazy :src="getImageURL(chr.class)" :alt="chr.class" height="25" />
                <b-img-lazy :src="getImageURL(chr.supportType)" :alt="chr.symbol" height="25" />
                <b-img-lazy :src="getImageURL(chr.damageType)" :alt="chr.damageType" height="25" />
                <b-img-lazy :src="getImageURL(chr.rarity)" :alt="chr.rarity" height="20" />
                <b-link :href="'https://legeclo.wikiru.jp/?' + chr.name" target="_blank">Wiki</b-link>
              </div>
              <div class="skills">
                <div class="skill" v-for="(skill, si) in chr.skills" :class="{'active': skill.skillType == 'アクティブ', 'passive': skill.skillType == 'パッシブ', 'highlighted': isSkillHighlighted(skill) }" :key="si">
                  <div class="flex">
                    <div class="icon">
                      <b-img-lazy :src="getImageURL(skill.name)" with="50" height="50" />
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
import jsonSkills from '../assets/support_skills.json'
import jsonCharacters from '../assets/support_characters.json'
import jsonConstants from '../assets/constants.json'

export default {
  name: 'SupportCharacters',
  components: {
    Navigation,
  },

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
    items() {
      return this.characters;
    },
  },

  created() {
    this.setupDB();

    this.fillFilter(this.classFilter, this.classes);
    this.fillFilter(this.supportTypeFilter, this.supportTypes);
    this.fillFilter(this.rarityFilter, this.rarities);
    this.fillFilter(this.damageTypeFilter, this.damageTypes);
    this.fillFilter(this.skillTypeFilter, this.skillTypes);
  },

  mounted() {
    this.decodeURL();

    window.onpopstate = function () {
      this.decodeURL(true);
    }.bind(this);

    this.enableUpdateURL = true;
  },

  methods: {
    setupDB() {
      let skillMap = new Map();
      for (let skill of this.skills) {
        skillMap.set(skill.name, skill);
      }

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

      const registerTags = function (tags) {
        for (let t of tags) {
          allTags.add(t);
          let p = t.indexOf('(');
          if (p != -1) {
            let sub = t;
            t = t.slice(0, p);
            addSubTag(t, sub);
          }
          else if (t in this.subTagTable) {
            this.subTagTable[t].add(t);
          }
          mainTags.add(t);
        }
      }.bind(this);

      for (let skill of this.skills) {
        registerTags(skill.tags);
      }

      for (let k in this.subTagTable) {
        this.sortSet(this.subTagTable[k]);
      }

      // 外部 json 由来のデータへの変更はセッションをまたいでしまうので、deep copy しておく
      this.characters = structuredClone(this.characters);
      let idSeed = 0;
      for (let chr of this.characters) {
        chr.id = ++idSeed;
        chr.classId = this.classes.findIndex(v => v == chr.class);
        chr.supportTypeId = this.supportTypes.findIndex(v => v == chr.supportType);
        chr.rarityId = this.rarities.findIndex(v => v == chr.rarity);
        chr.damageTypeId = this.damageTypes.findIndex(v => v == chr.damageType);
        for (let si = 0; si < chr.skills.length; ++si) {
          let skill = skillMap.get(chr.skills[si]);
          skill.skillIndex = si; // パッシブ1 のみが複数キャラで共有され、現状全て si==1 なので問題ない
          chr.skills[si] = skill;
        }
      }

      let handledTags = new Set();
      for (let t of Array.from(mainTags).sort()) {
        if (handledTags.has(t))
          continue;

        if (t.match(/^バフ:/))
          this.tagCategory.buff.tags.add(t);
        else if (t.match(/^デバフ:/))
          this.tagCategory.debuff.tags.add(t);
        else if (t.match(/^無効化/))
          this.tagCategory.resist.tags.add(t);
        else
          this.tagCategory.other.tags.add(t);
      }

    },

    isSkillHighlighted(skill) {
      let re = this.getTagRE();
      if (!re) {
        return false;
      }
      if (!this.isFilterEnabled(this.skillTypeFilter) ||
        (skill.skillIndex == 0 && this.skillTypeFilter[0].state) ||
        (skill.skillIndex == 1 && this.skillTypeFilter[1].state) ||
        (skill.skillIndex == 2 && this.skillTypeFilter[2].state)) {
        if (this.matchTags(skill.tags, re)) {
          return true;
        }
      }
      return false;
    },
    applyTagSearchPattern(chr) {
      for (let skill of chr.skills) {
        if (this.isSkillHighlighted(skill)) {
          return true;
        }
      }
      return false;
    },
    filterItem(chr) {
      let ok = this.filterMatch(this.classFilter, chr.classId) &&
        this.filterMatch(this.supportTypeFilter, chr.supportTypeId) &&
        this.filterMatch(this.rarityFilter, chr.rarityId) &&
        this.filterMatch(this.damageTypeFilter, chr.damageTypeId);

      if (ok && this.getTagRE()) {
        ok = this.applyTagSearchPattern(chr);
      }
      return ok;
    },

    updateURL() {
      if (!this.enableUpdateURL) {
        return;
      }

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

      let url = seri.serialize();
      if (url != this.prevURL) {
        window.history.pushState(null, null, url);
        this.prevURL = url;
      }
    },
    decodeURL(initState = false) {
      let data = new this.URLSerializer({
        class: 0,
        supportType: 0,
        damageType: 0,
        rarity: 0,
        skillType: 0,
        tag: "",
      });

      if (data.deserialize(window.location.href) || initState) {
        this.enableUpdateURL = false;
        this.deserializeFilter(this.classFilter, data.class);
        this.deserializeFilter(this.supportTypeFilter, data.supportType);
        this.deserializeFilter(this.damageTypeFilter, data.damageType);
        this.deserializeFilter(this.rarityFilter, data.rarity);
        this.deserializeFilter(this.skillTypeFilter, data.skillType);
        this.tagSearchPattern = data.tag;
        this.$forceUpdate();
        this.enableUpdateURL = true;
      }
    },

    onChangeFilterState() {
      this.updateURL();
      this.preventShowHideHeaderOnScroll = 1;
    },
    onUpdateTagSearchPattern() {
      if (this.tagSearchPattern == this.tagSearchPatternPrev)
        return;
      this.tagSearchPatternPrev = this.tagSearchPattern;
      this.updateURL();
    },

    onTagDropdownShow(event, tagCategory) {
      tagCategory.keepDropdown = 0;
      tagCategory.readyToHide = false;
    },
    onTagDropdownHide(event, tagCategory) {
      if (tagCategory.keepDropdown > 0) {
        event.preventDefault();
      }
    },
    onSubtagPopoverShow(tagCategory, popoverTarget) {
      this.$root.$emit('bv::hide::popover', this.prevPopover);
      this.prevPopover = popoverTarget;
      tagCategory.keepDropdown++;
    },
    onSubtagPopoverHide(tagCategory) {
      tagCategory.keepDropdown--;
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

  },
}
</script>

<style scoped>
</style>
