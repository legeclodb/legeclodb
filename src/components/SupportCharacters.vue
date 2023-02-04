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
          <!--
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
          -->
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
                  <b-img-lazy :src="getImageURL(classes[i])" height="25" />
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

    <div class="content" :style="style">
      <template v-for="chr in items">
        <div class="character" :id="'mainchar_'+chr.id" :key="chr.id" v-show="filterItem(chr)">
          <div class="flex">
            <div class="portrait">
              <b-img-lazy :src="chr.icon" :alt="chr.name" />
            </div>
            <div class="detail" v-show="showDetail >= 1">
              <div class="info">
                <h5>{{ chr.name }}</h5>
                <b-img-lazy :src="getImageURL(chr.class)" :alt="chr.class" height="25" />
                <!--<b-img-lazy :src="getImageURL(chr.symbol)" :alt="chr.symbol" height="25" />-->
                <b-img-lazy :src="getImageURL(chr.damageType)" :alt="chr.damageType" height="25" />
                <b-img-lazy :src="getImageURL(chr.rarity)" :alt="chr.rarity" height="20" />
                <b-link :href="'https://legeclo.wikiru.jp/?' + chr.name" target="_blank">Wiki</b-link>
              </div>
              <div class="skills">
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
      name: 'SupportCharacters',
      components: {
        Navigation,
      },

      data() {
        return {
          skills: [],
          characters: [],
          constants: {},

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

          showDetail: 2,

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
        items() {
          return this.characters;
        },
        style() {
          return {
            "--character-flex-grow": `${this.showDetail < 2 ? 0 : 1}`,
            "--skills-display": `${this.showDetail < 2 ? 'flex' : 'display'}`,
            "--skill-flex-grow": `${this.showDetail == 2 ? 1 : 0}`,
          };
        },
      },

      async beforeCreate() {
        const fetchJson = function (uri) {
          return fetch(uri, { cache: "no-cache" }).then(res => res.json());
        };

        await Promise.all([
          fetchJson("./support_skills.json"),
          fetchJson("./support_characters.json"),
          fetchJson("./main_consts.json"),
        ]).then((values) => {
          this.skills = values[0];
          this.characters = values[1];
          this.constants = values[2];
          this.onLoadDB();
        });
      },

      methods: {
        onLoadDB() {

        },

        setupDB() {

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
          for (let skill of chr.skills) {
            if (this.isSkillHighlighted(skill)) {
              return true;
            }
          }
          return false;
        },
        filterItem(chr) {
          //let ok = (!this.isFilterEnabled(this.symbolFilter) || this.symbolFilter[chr.symbolId].state) &&
          //  (!this.isFilterEnabled(this.classFilter) || this.classFilter[chr.classId].state) &&
          //  (!this.isFilterEnabled(this.rarityFilter) || this.rarityFilter[chr.rarityId].state) &&
          //  (!this.isFilterEnabled(this.damageTypeFilter) || this.damageTypeFilter[chr.damageTypeId].state);

          let ok = true;
          if (ok && this.getTagRE()) {
            ok = this.applyTagSearchPattern(chr);
          }
          return ok;
        },

        getImageURL(name) {
          if (this.constants.iconTable && name in this.constants.iconTable) {
            return this.constants.iconTable[name];
          }
          return "./empty.png";
        },


        updateURL() {

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

      },
  }
  </script>

  <style scoped>
  </style>
