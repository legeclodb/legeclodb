<template>
  <div class="root">
    <div class="header" :class="{ 'hidden': !showHeader }">
      <Navigation />
      <div class="menu-content">
        <!--
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
        -->
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
        showHeader: true,
        preventShowHideHeaderOnScroll: 0,
        lastScrollPosition: 0,
      };
    }
}
</script>

<style scoped>
</style>
