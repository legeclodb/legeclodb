<template>
  <div class="root" @mousemove="onMouseMove">
    <div class="header" :class="{ 'hidden': !showHeader }">
      <Navigation />
      <div class="menu-content">
        <div class="menu-panel">
          <b-tabs v-model="searchTabIndex">
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
            <div class="widget">
              <b-button size="sm" :pressed.sync="engageFilter" @click="updateQuery('engage')" variant="outline-secondary">
                <b-img-lazy :src="getImageURL('エンゲージ')" width="25" height="25" />
              </b-button>
            </div>
          </div>
          <div class="menu-widgets flex">
            <div class="widget">
              <b-button-group size="sm" id="symbol_selector">
                <b-button v-for="(c, i) in symbolFilter" :key="i" :pressed.sync="c.state" @click="updateQuery('symbol')" variant="outline-secondary">
                  <b-img-lazy :src="getImageURL(symbols[i])" height="25" />
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
          <b-tabs v-model="settingsTabIndex">
            <b-tab title="表示">
              <div class="menu-widgets flex">
                <div class="widget">
                  <span>件数：</span>
                  <b-dropdown :text="displayCounts[displayCount]" size="sm" id="detail_selector">
                    <b-dropdown-item class="d-flex flex-column" v-for="(c, i) in displayCounts" :key="i" @click="displayCount=i">
                      {{ c }}
                    </b-dropdown-item>
                  </b-dropdown>
                </div>
                <div class="widget">
                  <span>形式：</span>
                  <b-dropdown :text="displayTypes[displayType]" size="sm" id="detail_selector">
                    <b-dropdown-item class="d-flex flex-column" v-for="(c, i) in displayTypes" :key="i" @click="displayType=i">
                      {{ c }}
                    </b-dropdown-item>
                  </b-dropdown>
                </div>
                <div class="widget">
                  <span>エンゲージ：</span>
                  <b-dropdown text="一括切替" size="sm">
                    <b-dropdown-item class="d-flex flex-column" @click="switchEngageAll(false)">エンゲージ前</b-dropdown-item>
                    <b-dropdown-item class="d-flex flex-column" @click="switchEngageAll(true)">エンゲージ後</b-dropdown-item>
                  </b-dropdown>
                </div>
              </div>
              <div class="menu-widgets flex">
                <div class="widget">
                  <span>ソート：</span>
                  <b-dropdown :text="sortTypes[sortType]" size="sm" id="sort_selector">
                    <b-dropdown-item class="d-flex flex-column" v-for="(c, i) in sortTypes" :key="i" @click="sortType=i">
                      {{ c }}
                    </b-dropdown-item>
                  </b-dropdown>
                  <span style="width:5px"></span>
                  <b-dropdown :text="sortOrders[sortOrder]" size="sm" id="sort_order_selector">
                    <b-dropdown-item class="d-flex flex-column" v-for="(c, i) in sortOrders" :key="i" @click="sortOrder=i">
                      {{ c }}
                    </b-dropdown-item>
                  </b-dropdown>
                </div>
              </div>
            </b-tab>
            <b-tab title="ステータス">
              <div class="flex">
                <div class="menu-widgets">
                  <b-container>
                    <b-form-row v-for="(param, name, index) in [stat.base.level, stat.base.star]" :key="index">
                      <b-col style="text-align: right" align-self="end">
                        <label :for="`stat-${name}`">{{param.label}}</label>
                      </b-col>
                      <b-col>
                        <b-form-input style="width: 4em" :id="`stat-${name}`" v-model.number="param.value" size="sm" type="number" class="input-param" :min="param.min" :max="param.max"></b-form-input>
                      </b-col>
                    </b-form-row>
                  </b-container>
                </div>
                <div class="menu-widgets">
                  <div style="margin: 3px">
                    <b-button variant="secondary" size="sm" style="width: 7em" @click="updateStatus()" id="stat-detail">詳細設定</b-button>
                    <b-popover target="stat-detail" triggers="click blur" placement="bottom" custom-class="stat-popover">
                      <div class="flex" style="font-size: small">
                        <b-container>
                          <div style="text-align:center">
                            <h6 style="margin: 5px 0px">基本情報</h6>
                          </div>
                          <b-form-row v-for="(param, name, index) in stat.base" :key="index">
                            <b-col style="text-align: right" align-self="end">
                              <label style="width: 7em" :for="`stat-${name}`">{{param.label}}</label>
                            </b-col>
                            <b-col>
                              <b-form-input v-if="param.type == 'number'" style="width: 4em" :id="`stat-${name}`" v-model.number="param.value" size="sm" type="number" class="input-param" :min="param.min" :max="param.max"></b-form-input>
                              <b-form-checkbox v-if="param.type == 'bool'" style="width: 5em" :id="`stat-${name}`" v-model="param.value" size="sm" plain></b-form-checkbox>
                            </b-col>
                          </b-form-row>
                        </b-container>
                        <b-container>
                          <div style="text-align:center">
                            <h6 style="margin: 5px 0px">記憶の書＋強化ボード</h6>
                          </div>
                          <b-form-row v-for="(param, name, index) in stat.boosts" :key="index">
                            <b-col style="text-align: right" align-self="end">
                              <label style="width: 8em" :for="`stat-${name}`">{{param.label}}</label>
                            </b-col>
                            <b-col>
                              <b-form-input v-if="param.type == 'number'" style="width: 4em" :id="`stat-${name}`" v-model.number="param.value" size="sm" type="number" class="input-param" :min="param.min" :max="param.max"></b-form-input>
                            </b-col>
                          </b-form-row>
                        </b-container>
                      </div>
                      <div class="flex" style="margin: 5px 5px 0px 5px">
                        <div style="text-align: left">
                          <b-button variant="secondary" size="sm" style="margin: 3px" @click="resetStatus()">カンスト化</b-button>
                          <b-button variant="secondary" size="sm" style="margin: 3px" @click="resetStatus(1)">キャラ紹介を再現</b-button>
                        </div>
                        <div style="text-align: right; flex-grow: 1">
                          <b-button variant="secondary" size="sm" style="width: 7em; margin: 3px" @click="updateStatus()">適用</b-button>
                        </div>
                      </div>
                    </b-popover>
                  </div>
                  <div style="margin: 3px">
                    <b-button variant="secondary" size="sm" style="width: 7em" @click="updateStatus()">適用</b-button>
                  </div>
                </div>
              </div>
            </b-tab>
          </b-tabs>
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
              <b-img-lazy :src="getImageURL(chr.icon)" :title="chr.name" width="100" height="100" rounded />
            </div>
            <div class="detail" v-show="displayType >= 1">
              <div class="info" :class="{ 'highlighted': isInfoHighlighted(chr) }">
                <h5 v-html="chrNameToHtml(chr.name)"></h5>
                <div class="status">
                  <b-img-lazy :src="getImageURL(chr.class)" :title="'クラス:'+chr.class" height="25" />
                  <b-img-lazy :src="getImageURL(chr.symbol)" :title="'シンボル:'+chr.symbol" height="25" />
                  <b-img-lazy :src="getImageURL(chr.rarity)" :title="'レアリティ:'+chr.rarity" height="20" />
                  <div class="param-box"><b-img-lazy :src="getImageURL(chr.damageType)" :title="'攻撃タイプ:'+chr.damageType" width="20" height="20" /></div>
                  <div class="param-box"><b-img-lazy :src="getImageURL('射程')" title="射程" width="18" height="18" /><span>{{chr.range}}</span></div>
                  <div class="param-box"><b-img-lazy :src="getImageURL('移動')" title="移動" width="18" height="18" /><span>{{chr.move}}</span></div>
                  <div class="param-box"><span class="param-name">実装日:</span><span class="param-value">{{chr.date}}</span></div>
                  <div class="param-box" v-if="chr.engage"><span class="param-name">エンゲージ:</span><span class="param-value">{{chr.engage.date}}</span></div>
                </div>
                <div v-if="chr.status" class="status2" :title="`☆${stat.base.star.value} Lv${stat.base.level.value} 時のステータス`" v-html="statusToHtml(chr.status)" />
              </div>
              <div class="skills">
                <div class="talent" :class="{ 'highlighted': isTalentHighlighted(chr.talent) }">
                  <div class="flex">
                    <div class="icon" :id="'chr_'+chr.id+'_talent'">
                      <b-img-lazy :src="getImageURL(chr.talent.icon)" with="50" height="50" />
                      <b-popover v-if="displayType==1" :target="'chr_'+chr.id+'_talent'" :title="chr.talent.name" triggers="hover focus" :delay="{show:0, hide:250}" no-fade placement="top">
                        <div class="flex">
                          <div v-html="descToHtml(chr.talent)"></div>
                        </div>
                      </b-popover>
                    </div>
                    <div class="desc" v-show="displayType >= 2">
                      <h5>
                        {{ skillNameToHtml(chr.talent) }}
                        <b-dropdown v-if="chr.talent.descs" class="level-selector" :text="chr.talent.current" variant="outline-secondary">
                          <b-dropdown-item class="d-flex flex-column" v-for="(ds, di) in chr.talent.descs" :key="di" @click="chr.talent.current=di; chr.talent.desc=ds;">{{di}}</b-dropdown-item>
                        </b-dropdown>
                        <b-dropdown v-if="chr.engage" class="level-selector" :text="chr.engage.enabled ? 'エンゲージ後': 'エンゲージ前'" variant="outline-secondary">
                          <b-dropdown-item class="d-flex flex-column" @click="switchEngage(chr, false)">エンゲージ前</b-dropdown-item>
                          <b-dropdown-item class="d-flex flex-column" @click="switchEngage(chr, true)">エンゲージ後</b-dropdown-item>
                        </b-dropdown>
                      </h5>
                      <p><span v-html="descToHtml(chr.talent)"></span><span v-if="chr.talent.note" class="note" v-html="noteToHtml(chr.talent)"></span></p>
                    </div>
                  </div>
                  <div class="tags" v-show="displayType >= 2">
                    <b-badge class="tag" :key="i" v-for="(tag, i) in chr.talent.tags" variant="info" pill @click="setTagSearchPattern(tag)">{{ tag }}</b-badge>
                  </div>
                </div>
                <div class="skill" v-for="(skill, si) in chr.skills" :class="getSkillClass(skill)" :key="si">
                  <div class="flex">
                    <div class="icon" :id="'chr_'+chr.id+'_skill'+si">
                      <b-link @click="setSkillFilter(skill)"><b-img-lazy :src="getImageURL(skill.icon)" with="50" height="50" /></b-link>
                      <b-popover v-if="displayType>=1" :target="'chr_'+chr.id+'_skill'+si" :title="skill.name" triggers="hover focus" :delay="{show:0, hide:250}" no-fade placement="top">
                        <div class="flex" v-if="displayType==1">
                          <div v-html="descToHtml(skill)"></div>
                        </div>
                        <div v-if="skill.owners" class="owners">
                          所持者:<br />
                          <b-link v-for="(owner, oi) in skill.owners" :key="oi" @click="moveToChr(owner)">
                            <b-img-lazy :src="getImageURL(owner.icon)" :title="owner.name" width="50" height="50" />
                          </b-link>
                        </div>
                      </b-popover>
                    </div>
                    <div class="desc" v-show="displayType >= 2">
                      <div class="flex">
                        <h6>{{ skillNameToHtml(skill) }}</h6>
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

          <div class="summon" v-if="chr.summon" v-show="displayType >= 1">
            <div class="flex" v-for="(summon, smi) in chr.summon" :key="smi">
              <div class="portrait">
                <b-img-lazy :src="getImageURL(summon.icon)" :title="summon.name" width="100" height="100" rounded />
              </div>
              <div class="detail" v-show="displayType >= 1">
                <div class="info" :class="{ 'highlighted': isInfoHighlighted(summon) }">
                  <h5><span v-html="chrNameToHtml(summon.name)"></span> <span class="note">(召喚ユニット)</span></h5>
                  <div class="status">
                    <b-img-lazy :src="getImageURL(summon.class)" :title="'クラス:'+summon.class" height="25" />
                    <div class="param-box"><b-img-lazy :src="getImageURL(summon.damageType)" :title="'攻撃タイプ:'+summon.damageType" width="20" height="20" /></div>
                    <div class="param-box"><b-img-lazy :src="getImageURL('射程')" title="射程" width="18" height="18" /><span>{{summon.range}}</span></div>
                    <div class="param-box"><b-img-lazy :src="getImageURL('移動')" title="移動" width="18" height="18" /><span>{{summon.move}}</span></div>
                  </div>
                  <div class="status2" v-html="statusToHtml(summon.status)" />
                </div>
                <div class="skills">
                  <div class="talent" :class="{ 'highlighted': isTalentHighlighted(summon.talent) }">
                    <div class="flex">
                      <div class="icon" :id="'summon_'+chr.id+'_'+smi+'_talent'">
                        <b-img-lazy :src="getImageURL(summon.talent.icon)" with="50" height="50" />
                        <b-popover v-if="displayType==1" :target="'summon_'+chr.id+'_'+smi+'_talent'" triggers="hover focus" :title="summon.talent.name" placement="top">
                          <div class="flex">
                            <div v-html="descToHtml(summon.talent)"></div>
                          </div>
                        </b-popover>
                      </div>
                      <div class="desc" v-show="displayType >= 2">
                        <h5>
                          {{ summon.talent.name }}
                        </h5>
                        <p><span v-html="descToHtml(summon.talent)"></span><span v-if="summon.talent.note" class="note" v-html="noteToHtml(summon.talent)"></span></p>
                      </div>
                    </div>
                    <div class="tags" v-show="displayType >= 2">
                      <b-badge class="tag" :key="i" v-for="(tag, i) in summon.talent.tags" variant="info" pill @click="setTagSearchPattern(tag)">{{ tag }}</b-badge>
                    </div>
                  </div>
                  <div class="skill" v-for="(skill, si) in summon.skills" :class="getSkillClass(skill)" :key="si">
                    <div class="flex">
                      <div class="icon" :id="'summon_'+chr.id+'_'+smi+'_skill'+si">
                        <b-link @click="setSkillFilter(skill)"><b-img-lazy :src="getImageURL(skill.icon)" with="50" height="50" /></b-link>
                        <b-popover v-if="displayType>=1" :target="'summon_'+chr.id+'_'+smi+'_skill'+si" triggers="hover focus" :delay="{show:0, hide:250}" no-fade :title="skill.name" placement="top">
                          <div class="flex" v-if="displayType==1">
                            <div v-html="descToHtml(skill)"></div>
                          </div>
                          <div v-if="skill.owners" class="owners">
                            所持者:<br />
                            <b-link v-for="(owner, oi) in skill.owners" :key="oi" @click="moveToChr(owner)">
                              <b-img-lazy :src="getImageURL(owner.icon)" :title="owner.name" width="50" height="50" />
                            </b-link>
                          </div>
                        </b-popover>
                      </div>
                      <div class="desc" v-show="displayType >= 2">
                        <div class="flex">
                          <h6>{{ skill.name }}</h6>
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
import jsonActive from '../assets/main_active.json'
import jsonPassive from '../assets/main_passive.json'
import jsonTalents from '../assets/main_talents.json'
import jsonCharacters from '../assets/main_characters.json'
import jsonNpcMainChrs from '../assets/npc_main_characters.json'
import jsonConstants from '../assets/constants.json'
import common from "./common"
import * as lut from './utils.js'

export default {
  name: 'MainCharacters',
  components: {
    Navigation,
  },
  mixins: [common],

  data() {
    return {
      active: jsonActive,
      passive: jsonPassive,
      talents: jsonTalents,
      npc: jsonNpcMainChrs,
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

      displayTypes: [
        "アイコン",
        "シンプル",
        "詳細",
      ],
      sortTypes: [
        "実装日",
        "エンゲージ実装日",
        "戦闘力",
        "攻撃力",
        "HP",
        "アタック",
        "ディフェンス",
        "マジック",
        "レジスト",
        "テクニック",
      ],
      sortOrders: [
        "降順",
        "昇順"
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

      classFilter: [],
      symbolFilter: [],
      rarityFilter: [],
      damageTypeFilter: [],
      skillTypeFilter: [],
      engageFilter: false,

      stat: {
        base: {
          level: {
            label: "レベル",
            type: "number",
            min: 1,
            value: 110,
          },
          star: {
            label: "⭐",
            type: "number",
            min: 1,
            max: 6,
            value: 6,
          },
          master: {
            label: "マスターレベル",
            type: "number",
            min: 0,
            max: 3,
            value: 3,
          },
          loveBonus: {
            label: "好感度ボーナス",
            type: "bool",
            value: true,
          },
        },
        boosts: {
          hp: {
            label: "HP (%)",
            type: "number",
            min: 0,
            value: 150,
          },
          atk: {
            label: "アタック (%)",
            type: "number",
            min: 0,
            value: 140,
          },
          def: {
            label: "ディフェンス (%)",
            type: "number",
            min: 0,
            value: 130,
          },
          mag: {
            label: "マジック (%)",
            type: "number",
            min: 0,
            value: 140,
          },
          res: {
            label: "レジスト (%)",
            type: "number",
            min: 0,
            value: 130,
          },
          tec: {
            label: "テクニック (%)",
            type: "number",
            min: 0,
            value: 50,
          },
        },
      },

      enableUpdateURL: false,
      prevURL: "",
    };
  },

  computed: {
    rawItems() {
      return this.characters;
    },
    items() {
      let ret = this.characters.filter(a => this.filterItem(a)); // filter & shallow copy

      const c = this.compare;

      const comparer = [
        (a, b) => b.date.localeCompare(a.date), // 実装日
        (a, b) => this.compareEngageDate(a, b), // エンゲージ実装日
        (a, b) => c(a.status[6], b.status[6]), // 戦闘力
        (a, b) => c(a.attackPower, b.attackPower), // 攻撃力
        (a, b) => c(a.status[0], b.status[0]), // HP
        (a, b) => c(a.status[1], b.status[1]), // アタック
        (a, b) => c(a.status[2], b.status[2]), // ディフェンス
        (a, b) => c(a.status[3], b.status[3]), // マジック
        (a, b) => c(a.status[4], b.status[4]), // レジスト
        (a, b) => c(a.status[5], b.status[5]), // テクニック
      ];
      if (this.sortType >= 0 && this.sortType < comparer.length) {
        const fn = comparer[this.sortType]
        if (this.sortOrder == 0)
          ret.sort((a, b) => fn(a, b));
        else
          ret.sort((a, b) => fn(b, a));
      }

      return ret;
    },
    pagedItems() {
      return this.applyPage(this.items);
    },
  },

  created() {
    document.title = "れじぇくろDB: メインキャラ";
    this.setupDB();

    this.fillFilter(this.classFilter, this.classes);
    this.fillFilter(this.symbolFilter, this.symbols);
    this.fillFilter(this.rarityFilter, this.rarities);
    this.fillFilter(this.damageTypeFilter, this.damageTypes);
    this.fillFilter(this.skillTypeFilter, this.skillTypes);

    this.decodeURL();
    this.updateTagCounts();
  },

  mounted() {
    this.enableUpdateURL = true;
    window.onpopstate = () => {
      this.enableUpdateURL = false;
      this.decodeURL(true);
      this.$nextTick(() => {
        this.enableUpdateURL = true;
      });
    };
  },

  methods: {
    setupDB() {
      // 外部 json 由来のデータへの変更はセッションをまたいでしまうので、deep copy しておく
      this.active = structuredClone(this.active);
      this.passive = structuredClone(this.passive);
      this.talents = structuredClone(this.talents);
      this.npc = structuredClone(this.npc);
      this.characters = structuredClone(this.characters);

      const tagFilter = (skill, effectCategory, effect) => {
        if (effectCategory == "バフ") {
          if (!this.isPublicTarget(effect))
            return false;
          const cond = effect.condition;
          if (cond && (cond.onClass || cond.onSymbol))
            return false;
        }
        else if (effectCategory == "デバフ") {
          if (effect.ephemeral)
            return false;
        }
        return true;
      };
      const options = {
        npc: this.npc,
        includeSkillEffectTags: true,
        tagFilter: tagFilter
      };
      this.setupCharacters(this.npc, this.active, this.passive, this.talents, options);
      this.setupCharacters(this.characters, this.active, this.passive, this.talents, options);

      let chrId = 0;
      for (let chr of this.characters) {
        chr.id = ++chrId;
        chr.classId = this.classes.findIndex(v => v == chr.class);
        chr.symbolId = this.symbols.findIndex(v => v == chr.symbol);
        chr.rarityId = this.rarities.findIndex(v => v == chr.rarity);
        chr.damageTypeId = this.damageTypes.findIndex(v => v == chr.damageType);
        this.$set(chr, 'status', [0, 0, 0, 0, 0, 0, 0]);
        Object.defineProperty(chr, 'attackPower', {
          get: chr.damageTypeId == 0 ? () => { return chr.status[1]; } : () => { return chr.status[3]; },
        });
      }
      this.stat.defaults = [
        ...Object.values(this.stat.base).map(a => a.value),
        ...Object.values(this.stat.boosts).map(a => a.value),
      ];
      this.updateStatus();

      for (let skill of [...this.active, ...this.passive, ...this.talents]) {
        this.registerTags(skill.tags);
      }

      // リストの上の方に出すため特別処理
      let handledTags = new Set();
      this.appendSet(handledTags, this.constants.tagsHidden);
      let handlePredefinedTags = (dstTags, predefinedTags) => {
        for (let t of predefinedTags) {
          dstTags.add(t);
          handledTags.add(t);
        }
      };
      handlePredefinedTags(this.tagCategory.buff.tags, ["シンボルスキル"]);

      const isAction = (t) => {
        for (const n of this.constants.tagsAction) {
          if (t.startsWith(n))
            return true;
        }
        return false;
      };

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

    switchEngage(chr, v) {
      if (chr.engage) {
        chr.engage.enabled = v;
      }
      this.updateTagCounts();
    },
    switchEngageAll(v) {
      for (let chr of this.characters) {
        if (chr.engage) {
          chr.engage.enabled = v;
        }
      }
      this.updateTagCounts();
    },
    updateStatus() {
      const clampAndGet = (a) => {
        if (typeof a.min == 'number') {
          a.value = Math.max(a.value, a.min);
        }
        if (typeof a.max == 'number') {
          a.value = Math.min(a.value, a.max);
        }
        return a.value;
      }
      let [level, star, master, loveBonus] = Object.values(this.stat.base).map(a => clampAndGet(a));
      let boosts = Object.values(this.stat.boosts).map(a => a.value);

      for (let chr of this.characters) {
        const status = this.getMainChrStatus(chr, level, star, master, loveBonus, boosts);
        if (status) {
          chr.status = [...status, this.getMainBattlePower(status, star, master, 5, 0, false)];
        }

        // 召喚ユニット
        for (let sum of chr?.summonAll ?? []) {
          sum.status = this.getNPCChrStatus(sum, level);
        }
      }
      this.$forceUpdate();
    },
    resetStatus(type = 0) {
      const s = this.stat;
      const presets = [
        s.defaults,
        [100, 6, 0, true, 70, 50, 50, 50, 50, 50]
      ];
      let vals = [...presets[type]];
      for (let v of [...Object.values(s.base), ...Object.values(s.boosts)]) {
        v.value = vals.shift();
      }
      this.updateStatus();
    },

    moveToChr(chr, revealHidden = true) {
      const cid = typeof chr === 'number' ? chr : chr.id;
      let p = this.getPageOf(this.items, a => a.id == cid);
      if (p == 0 && revealHidden) {
        this.resetAllFilters();
        p = this.getPageOf(this.items, a => a.id == cid);
      }
      this.updateURL({ id: cid });

      if (p > 0) {
        this.page = p;
        this.$nextTick(() => {
          let e = document.getElementById(`chr_${cid}`);
          if (e != null) {
            this.preventShowHideHeaderOnScroll = 1;
            this.hideHeader();
            this.hidePopover();
            e.scrollIntoView();
          }
        });
      }
    },

    resetAllFilters() {
      this.tagSearchPattern = '';
      this.freeSearchPattern = '';

      const resetFilter = (filter) => {
        for (let e of filter)
          e.state = false;
      };
      resetFilter(this.classFilter);
      resetFilter(this.symbolFilter);
      resetFilter(this.rarityFilter);
      resetFilter(this.damageTypeFilter);
      resetFilter(this.skillTypeFilter);

      this.updateQuery('any', false);
    },
    setSkillFilter(skill) {
      this.setFreeSearchPattern(skill.name, true);
    },

    isInfoHighlighted(chr) {
      return this.freeSearchFn && this.freeSearchFn(chr)
        ? 2 : 0;
    },
    isTalentHighlighted(talent) {
      let r = 0;
      if (this.tagSearchFn) {
        r |= this.applyTalentFilter(talent) && this.tagSearchFn(talent)
          ? 1 : 0;
      }
      if (this.freeSearchFn) {
        r |= this.freeSearchFn(talent)
          ? 2 : 0;
      }
      return r;
    },
    isSkillHighlighted(skill) {
      let r = 0;
      if (this.tagSearchFn) {
        r |= this.applySkillTypeFilter(skill) && this.tagSearchFn(skill)
          ? 1 : 0;
      }
      if (this.freeSearchFn) {
        r |= this.freeSearchFn(skill)
          ? 2 : 0;
      }
      return r;
    },
    applyTalentFilter(talent) {
      return !this.isFilterEnabled(this.skillTypeFilter) || this.skillTypeFilter[0].state;
    },
    applySkillTypeFilter(skill) {
      return !this.isFilterEnabled(this.skillTypeFilter) ||
        (skill.isPassive && this.skillTypeFilter[1].state) ||
        (skill.isActive && this.skillTypeFilter[2].state);
    },
    applyClassFilter(chr) {
      return (!this.engageFilter || chr.engage) && (
        this.filterMatch(this.classFilter, chr.classId) &&
        this.filterMatch(this.symbolFilter, chr.symbolId) &&
        this.filterMatch(this.rarityFilter, chr.rarityId) &&
        this.filterMatch(this.damageTypeFilter, chr.damageTypeId));
    },
    applySearchPatterns(chr) {
      const doApply = (obj) => {
        let r = this.isInfoHighlighted(obj) | this.isTalentHighlighted(obj.talent);
        for (let skill of obj.skills)
          r |= this.isSkillHighlighted(skill);
        return r;
      };

      let r = doApply(chr);
      if (chr.summon) {
        for (let summon of chr.summon)
          r |= doApply(summon);
      }
      return r == this.getSearchMask();
    },
    filterItem(chr) {
      let ok = this.applyClassFilter(chr);
      if (ok && this.isSearchPatternSet()) {
        ok = this.applySearchPatterns(chr);
      }
      return ok;
    },
    updateTagCounts() {
      this.resetTagCounts();

      const doCount = (obj) => {
        if (this.applyTalentFilter(obj.talent)) {
          this.countTags(obj.talent.tags);
        }
        for (let skill of obj.skills) {
          if (this.applySkillTypeFilter(skill)) {
            this.countTags(skill.tags);
          }
        }
      };

      for (let chr of this.characters) {
        if (this.applyClassFilter(chr)) {
          doCount(chr);
          if (chr.summon) {
            for (let summon of chr.summon)
              doCount(summon);
          }
        }
      }
    },

    getSkillClass(skill) {
      return {
        active: skill.isActive,
        passive: skill.isPassive,
        highlighted: this.isSkillHighlighted(skill),
      }
    },

    updateURL(kvp) {
      if (!this.enableUpdateURL)
        return false;

      let seri = new lut.URLSerializer();
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
      if (this.engageFilter)
        seri.engage = 1;

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
      let data = new lut.URLSerializer({
        class: 0,
        symbol: 0,
        damageType: 0,
        rarity: 0,
        skillType: 0,
        tag: "",
        free: "",
        p: 1,
        id: -1,
      });

      if (data.deserialize(window.location.href) || initState) {
        this.deserializeFilter(this.classFilter, data.class);
        this.deserializeFilter(this.symbolFilter, data.symbol);
        this.deserializeFilter(this.damageTypeFilter, data.damageType);
        this.deserializeFilter(this.rarityFilter, data.rarity);
        this.deserializeFilter(this.skillTypeFilter, data.skillType);
        this.tagSearchPattern = data.tag;
        this.freeSearchPattern = data.free;
        if (this.freeSearchPattern.length != 0)
          this.searchTabIndex = 1;

        if (data.p > 0)
          this.page = data.p;
        if (data.id > -1)
          this.moveToChr(data.id);
        if (data.engage)
          this.engageFilter = true;
      }
    },
  }
}
</script>

<style scoped>
</style>
