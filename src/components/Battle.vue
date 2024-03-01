<template>
  <div class="root" @mousemove="onMouseMove" @click="onCellRClick(null)">
    <div class="header" :class="{ 'hidden': !showHeader }">
      <Navigation />
    </div>
    <div class="about" style="margin-top: 55px;">
      <div class="menu-content" style="flex-wrap: nowrap">
        <div class="menu-panel" id="cb-settings">
          <div class="menu-widgets flex">
            <div class="widget">
              <span>マップデータ：</span>
              <b-dropdown :text="battleData ? battleData.uid : ''" size="sm" id="battle_selector" :disabled="simulation!=null">
                <b-dropdown-item v-for="(battle, i) in battleList" class="d-flex flex-column" :key="i" @click="selectBattle(battle.uid, true); updateURL();">
                  {{ battle.uid }}
                </b-dropdown-item>
              </b-dropdown>
            </div>
          </div>
        </div>
        <div class="menu-panel" id="cb-settings">
          <div class="menu-widgets flex">
            <div class="widget">
              <span>敵情報：</span>
              <b-dropdown :text="displayTypes[displayType]" size="sm" id="detail_selector">
                <b-dropdown-item class="d-flex flex-column" v-for="(c, i) in displayTypes" :key="i" @click="displayType=i">
                  {{ c }}
                </b-dropdown-item>
              </b-dropdown>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="content" :style="style">
      <div class="main-panel">
        <b-tabs v-if="!simulation" v-model="phaseTabIndex">
          <b-tab v-for="phase in phaseList" :title="phase.desc" @click="selectPhase(phase.id, true); updateURL();" :key="phase.id"></b-tab>
        </b-tabs>

        <div style="padding: 10px; background-color: white; display: flex;">
          <div ref="cells" class="grid-container">
            <div v-for="(cell, i) in cells" :key="i" :set="unit=findUnitByCoord(cell.coord)" :class="getCellClass(cell)" :id="cell.id"
                 @click.stop="onClickCell(cell)"
                 @click.middle.prevent.stop="onCellRClick(cell)" @mousedown.middle.prevent.stop="dummyHandler()"
                 @click.right.prevent.stop="onCellRClick(cell)"
                 @mouseover="onEnterCell(cell)" @mouseleave="onLeaveCell(cell)">
              <template v-if="unit?.isEnemy && unit?.hasSupport">
                <b-img :src="getImageURL(unit.main.class)" class="center"
                       width="30" height="30" style="position: relative; left: 8px; top: -8px; z-index: 1;" />
                <b-img :src="getImageURL(unit.support.class)" class="center"
                       width="30" height="30" style="position: relative; left: -8px; top: 8px; z-index: 0;" />
              </template>
              <template v-else-if="unit?.isEnemy && unit?.main">
                <b-img :src="getImageURL(unit.main.class)" class="center" width="40" height="40" />
              </template>
              <template v-else-if="unit?.isPlayer">
                <div draggable @dragstart="onDragCell(cell)" @drop="onDropCell(cell)" @dragover.prevent="dummyHandler()">
                  <b-img :src="getImageURL(unit.main.icon)" class="center" width="50" height="50" />
                </div>
              </template>
            </div>
          </div>

          <div class="enemy-list">
            <template v-for="unit in activeEnemyUnits">
              <div class="character" :class="{ 'highlighted': isUnitHighlighted(unit) }" :id="'unit_'+unit.fid" :key="unit.fid">
                <div class="flex">
                  <div class="portrait">
                    <b-img-lazy :src="getImageURL(unit.main.icon)" :title="unit.main.name" width="80" height="80" rounded />
                  </div>
                  <div class="detail" v-show="displayType >= 1">
                    <div class="info">
                      <h5 v-html="chrNameToHtml(unit.main.name+' (メイン)')"></h5>
                      <div class="status">
                        <b-img-lazy :src="getImageURL(unit.main.class)" :title="'クラス:'+unit.main.class" height="25" />
                        <div class="param-box"><b-img-lazy :src="getImageURL(unit.main.damageType)" :title="'攻撃タイプ:'+unit.main.damageType" width="20" height="20" /></div>
                        <div class="param-box"><b-img-lazy :src="getImageURL('射程')" title="射程" width="18" height="18" /><span>{{unit.main.range}}</span></div>
                        <div class="param-box"><b-img-lazy :src="getImageURL('移動')" title="移動" width="18" height="18" /><span>{{unit.main.move}}</span></div>
                        <div class="param-box"><span class="param-name">レベル:</span><span class="param-value">{{unit.main.level}}</span></div>
                      </div>
                      <div v-if="unit.main.status" class="status2" v-html="statusToHtml(unit.main.status)" />
                    </div>
                    <div class="skills">
                      <template v-for="(skill, si) in unit.main.skills">
                        <div v-if="!skill.isNormalAttack" class="skill" :class="getSkillClass(skill)" :key="si">
                          <div class="flex">
                            <div class="icon" :id="'enemy_'+unit.fid+'_skill'+si">
                              <b-img-lazy :src="getImageURL(skill.icon)" with="50" height="50" />
                              <b-popover v-if="displayType==1" :target="'enemy_'+unit.fid+'_skill'+si" triggers="hover focus" :delay="{show:0, hide:250}" no-fade :title="skill.name" placement="top">
                                <div class="flex">
                                  <div v-html="descToHtml(skill)"></div>
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
                        </div>
                      </template>
                    </div>
                  </div>
                </div>

                <div v-if="unit.hasSupport && displayType >= 2" class="flex">
                  <div class="portrait">
                    <b-img-lazy :src="getImageURL(unit.support.icon)" :title="unit.support.name" width="80" height="80" rounded />
                  </div>
                  <div class="detail" v-show="displayType >= 1">
                    <div class="info">
                      <h5 v-html="chrNameToHtml(unit.support.name+' (サポート)')"></h5>
                      <div class="status">
                        <b-img-lazy :src="getImageURL(unit.support.class)" :title="'クラス:'+unit.support.class" height="25" />
                        <div class="param-box"><b-img-lazy :src="getImageURL(unit.support.damageType)" :title="'攻撃タイプ:'+unit.support.damageType" width="20" height="20" /></div>
                        <div class="param-box"><b-img-lazy :src="getImageURL('射程')" title="射程" width="18" height="18" /><span>{{unit.support.range}}</span></div>
                        <div class="param-box"><span class="param-name">レベル:</span><span class="param-value">{{unit.support.level}}</span></div>
                      </div>
                      <div v-if="unit.support.status" class="status2" v-html="statusToHtml(unit.support.status)" />
                    </div>
                  </div>
                </div>
              </div>
            </template>

          </div>

        </div>
      </div>
    </div>

    <div v-if="simulation" class="content" style="margin-top: 20px" @click.stop="">
      <div class="unit-panel">
        <div v-if="actionsToSelect.length" style="margin-bottom: 20px">
          <b-button size="sm" style="width: 45px; height: 45px; margin-right: 5px;" @click="pushTool(tools.confirm);">
            待機
          </b-button>
          <b-link v-for="(skill, si) of actionsToSelect" :key="si" @click="onClickAction(skill)">
            <b-img :src="getImageURL(skill.icon)" :title="descToTitle(skill)" :class="getActionClass(skill)" width="50" />
          </b-link>
        </div>
        <div>
          <h5>
            ターン{{ simulation.turn }} : {{ simulation.isPlayerTurn ? 'プレイヤー': 'エネミー' }}フェイズ
          </h5>
          <b-button size="sm" @click="endTurn()" style="width: 10em; margin-right: 1em;"
                    :disabled="simulation.turn == simulation.maxTurn && simulation.isEnemyTurn">
            ターン終了
          </b-button>
          <b-button size="sm" @click="endSimulation()" style="width: 14em;">
            シミュレーション終了
          </b-button>
        </div>
        <div style="margin-top: 20px">
          <b-button size="sm" @click="eraseWeakEnemies()" style="width: 10em;">
            ザコ敵を除去
          </b-button>
        </div>
      </div>

      <div class="unit-panel">
        <div v-if="!showConfirm">
          シミュレーションモードでは実際のゲームのようにユニットを操作できます。<br />
          しかし、検証のため、あるいは再現が難しいため、動作が異なる点もあります。以下大雑把な説明。<br />
          <ul>
            <li><b>右クリックでキャンセル</b>の動作になります。</li>
            <li><b>敵フェイズでは敵ユニットを手動で操作する必要があります</b>。正確な再現が困難なため、自動では行動しません。</li>
            <li>移動可能範囲は表示されますが、それを無視して無限に移動できます。また、無限に再行動できます。</li>
            <li>CT 中のアクティブスキルも使用可能です。</li>
          </ul>
        </div>
        <div v-else>
          <b-button size="sm" @click="confirmAction()" style="width: 14em;">
            行動を確定
          </b-button>
        </div>
      </div>
    </div>
    <div v-else class="content" style="margin-top: 30px">
      <div class="unit-panel">
        <div class="flex">
          <b-dropdown text="編成をセーブ" style="min-width: 10em;">
            <b-dropdown-item v-for="(name, i) in slotNames" :key=i @click="saveLoadout(i)">スロット{{i}}: {{name}}</b-dropdown-item>
          </b-dropdown>
          <b-dropdown text="編成をロード" style="min-width: 10em; margin-left: 0.5em; ">
            <b-dropdown-item v-for="(name, i) in slotNames" :key=i @click="loadLoadout(i)">スロット{{i}}: {{name}}</b-dropdown-item>
            <b-dropdown-item @click="loadLoadout(99)">バックアップ</b-dropdown-item>
          </b-dropdown>

          <b-button size="sm" id="btn-loadout-op" style="min-width: 10em; margin-left: 0.5em; ">
            編成を共有
            <b-popover :target="`btn-loadout-op`" triggers="click" custom-class="loadout-popover" @show="fetchLoadoutList()" ref="loadout_popover">
              <h5>公開されている編成</h5>
              <template v-if="fetching">
                <div style="padding: 10px;">
                  <b-spinner small label="Spinning"></b-spinner>
                </div>
              </template>
              <template v-else>
                <b-table small outlined sticky-header :items="loadoutList" :fields="loadoutFields" style="min-width: 90%;">
                  <template #cell(name)="row">
                    <span>{{row.item.name}}</span>
                  </template>
                  <template #cell(actions)="row">
                    <div class="flex" style="">
                      <b-button size="sm" @click="downloadLoadoutFromServer(row.item)">
                        ロード
                      </b-button>
                      <b-button size="sm" :id="`loadout-${row.item.hash}`" @click="copyLoadoutUrl(row.item)" style="margin-left: 0.25em">
                        URL コピー
                      </b-button>
                      <b-button v-if="row.item.delkey" size="sm" @click="deleteLoadoutFromServer(row.item)" style="margin-left: 0.25em">
                        削除(確認あり)
                      </b-button>
                    </div>
                  </template>
                </b-table>
              </template>
              <div class="flex" style="margin-bottom: 0.5em;">
                <b-button size="sm" @click="exportLoadoutToServer()" style="min-width: 12em;" id="btn-loadout-publish">
                  現在の編成を公開
                </b-button>
                <b-form-input size="sm" v-model="userName" placeholder="投稿者名" style="width: 8em; margin-left: 0.25em;"></b-form-input>
                <span style="margin-left: 0.5em; color: rgb(160,160,160) ">(投稿者本人は投稿したデータを削除可能)</span>
              </div>
              <div class="flex" style="margin-bottom: 0.5em;">
                <b-button size="sm" @click="exportLoadoutAsFile()" style="min-width: 12em;">
                  ファイルにエクスポート
                </b-button>
                <b-button size="sm" @click="importLoadoutFromFile()" style="min-width: 12em; margin-left: 0.25em;">
                  ファイルからインポート
                </b-button>
              </div>
              <div class="flex">
                <b-button size="sm" @click="$refs.loadout_popover.$emit('close')">閉じる</b-button>
              </div>
            </b-popover>
          </b-button>

          <b-button @click="clearLoadout()" style="min-width: 10em; margin-left: 0.5em; ">
            編成をクリア
          </b-button>

          <b-button style="width: 14em; margin-left: 4em;" @click="beginSimulation()">
            シミュレーション開始
          </b-button>
        </div>
      </div>
    </div>

    <div class="content" :style="style">
      <div class="main-panel" style="margin-top: 10px; margin-bottom: 10px;">
        <div v-if="!simulation" class="flex" style="margin: 0px 10px 10px 10px;">
          <b-form-input size="sm" v-model="slotName" placeholder="編成名" style="width: 16em"></b-form-input>
          <b-form-input size="sm" v-model="slotDesc" placeholder="説明など" style="flex: 1; margin-left: 0.25em; "></b-form-input>
          <b-button size="sm" v-if="loadoutHash" id="btn-loadout-message" style="margin-left: 0.25em; ">
            <b-icon icon="chat-text" title="この編成へのコメントを表示" />
            <b-popover target="btn-loadout-message" triggers="click" custom-class="comment-popover" ref="message_popover">
              <MessageBoard :thread="loadoutHash" @change="onMessageChange" @discard="onMessageDiscard" />
              <div class="flex">
                <b-button size="sm" @click="$refs.message_popover.$emit('close')">閉じる</b-button>
              </div>
            </b-popover>
          </b-button>
        </div>

        <b-tabs v-model="unitTabIndex">
          <b-tab v-for="(unit, ui) in playerUnits" :key="ui" style="background-color: white;">
            <template #title>
              <h2 style="font-size: 1em;" draggable @dragstart="onDragUnit(unit)" @drop="onDropUnit(unit)" @dragover.prevent="dummyHandler()">
                ユニット{{ui+1}}
                <b-img-lazy :src="getImageURL(unit.main?.icon)" width="30" />
                <b-img-lazy :src="getImageURL(unit.support?.icon)" width="30" />
              </h2>
            </template>

            <div @dragover.prevent @drop.prevent="onDropLoadout($event)" style="min-width: 1520px; min-height: 500px;">
              <div v-if="!simulation" style="padding: 10px; display: flex">
                <b-button :id="`btn-edit-unit${ui}`" @click="unit.showEditor=!unit.showEditor" style="width: 12em;">編集</b-button>
                <b-popover :target="`btn-edit-unit${ui}`" custom-class="status-simulator-popover" :show.sync="unit.showEditor" :delay="{show:0, hide:250}" no-fade>
                  <StatusSimulator embed :data="unit.editorData" @change="unit.edit($event)" />
                  <div class="flex" style="margin: 0 0 10px 10px;">
                    <b-button size="sm" @click="unit.showEditor=false">閉じる</b-button>
                  </div>
                </b-popover>
              </div>

              <div class="flex" style="align-items: flex-start;">
                <div v-if="unit.main.cid" class="character">
                  <div class="flex">
                    <div class="portrait">
                      <b-img-lazy :src="getImageURL(unit.main.icon)" :title="unit.main.name" width="100" height="100" rounded />
                    </div>
                    <div class="detail" v-show="displayType >= 1">
                      <div class="info">
                        <h5 v-html="chrNameToHtml(unit.main.name)"></h5>
                        <div class="status">
                          <b-img-lazy :src="getImageURL(unit.main.class)" :title="'クラス:'+unit.main.class" height="25" />
                          <b-img-lazy :src="getImageURL(unit.main.symbol)" :title="'シンボル:'+unit.main.symbol" height="25" />
                          <b-img-lazy :src="getImageURL(unit.main.rarity)" :title="'レアリティ:'+unit.main.rarity" height="20" />
                          <div class="param-box"><b-img-lazy :src="getImageURL(unit.main.damageType)" :title="'攻撃タイプ:'+unit.main.damageType" width="20" height="20" /></div>
                          <div class="param-box"><b-img-lazy :src="getImageURL('射程')" title="射程" width="18" height="18" /><span>{{unit.main.range}}</span></div>
                          <div class="param-box"><b-img-lazy :src="getImageURL('移動')" title="移動" width="18" height="18" /><span>{{unit.main.move}}</span></div>
                        </div>
                        <div class="status2" v-html="statusToHtml(unit.main.status)" />
                      </div>
                      <div class="skills">
                        <template v-for="(skill, si) in unit.main.skills">
                          <div class="skill" v-if="!skill.isNormalAttack" :class="getSkillClass(skill)" :key="`skill${si}`">
                            <div class="flex">
                              <div class="icon" :id="`unit${ui}_main_skill${si}`">
                                <b-img-lazy :src="getImageURL(skill.icon)" with="50" height="50" />
                                <b-popover v-if="displayType==1" :target="`unit${ui}_main_skill${si}`" triggers="hover focus" :delay="{show:0, hide:250}" no-fade :title="skill.name" placement="top">
                                  <div class="flex">
                                    <div v-html="descToHtml(skill)"></div>
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
                          </div>
                        </template>
                      </div>
                      <div class="skills">
                        <div class="skill" v-for="(skill, si) in unit.main.items" :class="getSkillClass(skill)" :key="`item${si}`">
                          <div class="flex">
                            <div class="icon" :id="`unit${ui}_main_item${si}`">
                              <b-img-lazy :src="getImageURL(skill.icon)" with="50" height="50" />
                              <b-popover v-if="displayType==1" :target="`unit${ui}_main_item${si}`" triggers="hover focus" :delay="{show:0, hide:250}" no-fade :title="skill.name" placement="top">
                                <div class="flex">
                                  <div v-html="descToHtml(skill)"></div>
                                </div>
                              </b-popover>
                            </div>
                            <div class="desc" v-show="displayType >= 2">
                              <div class="flex">
                                <h6>
                                  <b-img-lazy v-if="skill.slot" :src="getImageURL(skill.slot)" :title="'部位:'+skill.slot" height="20" />
                                  {{ skill.name }}
                                </h6>
                              </div>
                              <p><span v-html="descToHtml(skill)"></span><span v-if="skill.note" class="note" v-html="noteToHtml(skill)"></span></p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="unit.support.cid" class="character">
                  <div class="flex">
                    <div class="portrait">
                      <b-img-lazy :src="getImageURL(unit.support.icon)" :title="unit.support.name" width="100" height="100" rounded />
                    </div>
                    <div class="detail" v-show="displayType >= 1">
                      <div class="info">
                        <h5 v-html="chrNameToHtml(unit.support.name)"></h5>
                        <div class="status">
                          <b-img-lazy :src="getImageURL(unit.support.class)" :title="'クラス:'+unit.support.class" height="25" />
                          <b-img-lazy :src="getImageURL(unit.support.supportType)" :title="'サポートタイプ:'+unit.support.supportType" height="25" />
                          <b-img-lazy :src="getImageURL(unit.support.rarity)" :title="'レアリティ:'+unit.support.rarity" height="20" />
                          <div class="param-box"><b-img-lazy :src="getImageURL(unit.support.damageType)" :title="'攻撃タイプ:'+unit.support.damageType" width="20" height="20" /></div>
                          <div class="param-box"><b-img-lazy :src="getImageURL('射程')" title="射程" width="18" height="18" /><span>{{unit.support.range}}</span></div>
                        </div>
                        <div class="status2" v-html="statusToHtml(unit.support.status)" />
                      </div>
                      <div class="skills">
                        <div class="skill" v-for="(skill, si) in unit.support.skills" :class="getSkillClass(skill)" :key="`skill${si}`">
                          <div class="flex">
                            <div class="icon" :id="`unit${ui}_sup_skill${si}`">
                              <b-img-lazy :src="getImageURL(skill.icon)" with="50" height="50" />
                              <b-popover v-if="displayType==1" :target="`unit${ui}_sup_skill${si}`" triggers="hover focus" :delay="{show:0, hide:250}" no-fade :title="skill.name" placement="top">
                                <div class="flex">
                                  <div v-html="descToHtml(skill)"></div>
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
                        </div>
                      </div>
                      <div class="skills">
                        <div class="skill" v-for="(skill, si) in unit.support.items" :class="getSkillClass(skill)" :key="`item${si}`">
                          <div class="flex">
                            <div class="icon" :id="`unit${ui}_sup_item${si}`">
                              <b-img-lazy :src="getImageURL(skill.icon)" with="50" height="50" />
                              <b-popover v-if="displayType==1" :target="`unit${ui}_sup_item${si}`" triggers="hover focus" :delay="{show:0, hide:250}" no-fade :title="skill.name" placement="top">
                                <div class="flex">
                                  <div v-html="descToHtml(skill)"></div>
                                </div>
                              </b-popover>
                            </div>
                            <div class="desc" v-show="displayType >= 2">
                              <div class="flex">
                                <h6>
                                  <b-img-lazy :src="getImageURL(skill.slot)" :title="'部位:'+skill.slot" height="20" />
                                  {{ skill.name }}
                                </h6>
                              </div>
                              <p><span v-html="descToHtml(skill)"></span><span v-if="skill.note" class="note" v-html="noteToHtml(skill)"></span></p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </b-tab>
        </b-tabs>

      </div>
    </div>

    <ItemPopovers />
  </div>
</template>

<script>
import Navigation from './Navigation.vue'
import jsonEnemyMainChrs from '../assets/enemy_main_characters.json'
import jsonEnemySupportChrs from '../assets/enemy_support_characters.json'
import jsonBattle from '../assets/battle.json'
import commonjs from "./common.js";
import lookupjs from "./simulator/lookup.js";
import StatusSimulator from './simulator/StatusSimulator.vue'
import MessageBoard from './parts/MessageBoard.vue'
import * as ldb from "./simulator/simulation.js";

import ItemPopovers from './parts/ItemPopovers.vue'
import ItemPopoversJs from "./parts/ItemPopovers.js";

const LoadoutServer = "https://primitive-games.jp/legeclodb/loadout/index.cgi";
const BattleLogServer = "https://primitive-games.jp/legeclodb/battlelog/index.cgi";

export default {
  name: 'Battle',
  components: {
    Navigation,
    StatusSimulator,
    MessageBoard,
    ItemPopovers,
  },
  mixins: [commonjs, lookupjs, ItemPopoversJs],

  data() {
    return {
      displayTypes: [
        "アイコン",
        "シンプル",
        "詳細",
      ],
      phaseList: [
        { index: 0, id: "0", desc: "初期配置" },
        { index: 1, id: "1E", desc: "1T敵フェイズ" },
        { index: 2, id: "2E", desc: "2T敵フェイズ" },
        { index: 3, id: "3E", desc: "3T敵フェイズ" },
        { index: 4, id: "4E", desc: "4T敵フェイズ" },
      ],

      divX: 15,
      divY: 15,

      battleList: [],
      battleId: "",
      battleData: null,
      cells: [],
      phase: "",
      path: null,
      skillRange: null,
      skillArea: null,
      skillDirection: null,

      selectedUnit: null,   // unit
      actionsToSelect: [],  // skill
      selectedSkill: null,  // skill
      targetUnit: null, // unit
      targetCell: null, // cell
      targetDirection: ldb.Direction.None,
      showConfirm: false,

      tools: {},
      toolStack: [],

      phaseTabIndex: 0,
      prevURL: "",

      slotNames: ["", "", "", "", "", "", "", "", "", ""],
      slotName: "",
      slotDesc: "",
      userName: "",

      enemyUnits: [],
      playerUnits: [
        new ldb.BaseUnit(),
        new ldb.BaseUnit(),
        new ldb.BaseUnit(),
        new ldb.BaseUnit(),
        new ldb.BaseUnit(),
      ],
      unitTabIndex: 0,

      simPhaseList: [
        { index: 0, id: "1P", desc: "1Tプレイヤー" },
        { index: 1, id: "1E", desc: "1Tエネミー" },
        { index: 2, id: "2P", desc: "2Tプレイヤー" },
        { index: 3, id: "2E", desc: "2Tエネミー" },
        { index: 4, id: "3P", desc: "3Tプレイヤー" },
        { index: 5, id: "3E", desc: "3Tエネミー" },
        { index: 6, id: "4P", desc: "4Tプレイヤー" },
        { index: 7, id: "4E", desc: "4Tエネミー" },
        { index: 8, id: "5P", desc: "5Tプレイヤー" },
        { index: 9, id: "5E", desc: "5Tエネミー" },
      ],
      simulation: null,

      loadoutList: [],
      loadoutFields: [
        {
          key: "name",
          label: "名前",
        },
        {
          key: "author",
          label: "投稿者",
        },
        {
          key: "date",
          label: "日付",
        },
        {
          key: "actions",
          label: "操作",
        }
      ],
      loadoutHash: "",

      battlelogList: [],
      fetching: false,
    };
  },

  beforeCreate() {
    window.$vue = this;
  },

  created() {
    document.title = "れじぇくろDB: ギルドクエストEX";

    this.setupDB();

    this.enemyMainChrs = structuredClone(jsonEnemyMainChrs).filter(a => !a.hidden);
    this.enemySupChrs = structuredClone(jsonEnemySupportChrs).filter(a => !a.hidden);
    this.setupCharacters(this.enemyMainChrs, this.mainActive, this.mainPassive, this.mainTalents);
    this.setupCharacters(this.enemySupChrs, this.supActive, this.supPassive);

    this.battleList = structuredClone(jsonBattle);
    for (let battle of this.battleList) {
      for (let enemy of battle.enemies) {
        {
          const chr = this.enemyMainChrs.find(c => c.uid == enemy.main.cid);
          this.mergeChrData(enemy.main, chr);
          enemy.main.skills = [
            this.searchTableWithUid.get(enemy.main.talent),
            ...enemy.main.skills.map(id => this.searchTableWithUid.get(id)),
          ];
          enemy.main.status = this.getNPCChrStatus(chr, enemy.main.level, enemy.main.statusRate);
        }
        if (enemy.support) {
          const chr = this.enemySupChrs.find(c => c.uid == enemy.support.cid);
          this.mergeChrData(enemy.support, chr);
          enemy.support.status = this.getNPCChrStatus(chr, enemy.support.level, enemy.support.statusRate);
        }

        let unit = new ldb.BaseUnit(false);
        unit.fid = enemy.fid;
        unit.phase = enemy.phase;
        unit.coord = enemy.coord;
        this.moveProperty(unit.base, enemy, "main");
        this.moveProperty(unit.base, enemy, "support");
        enemy.unit = unit;
      }
    }

    for (let i = 0; i <= 9; ++i) {
      let data = JSON.parse(localStorage.getItem(`battle.slot${i}`));
      if (data?.name) {
        this.setArrayElement(this.slotNames, i, data.name);
      }
    }
  },

  mounted() {
    const divX = this.divX;
    const divY = this.divY;
    let cells = new Array(divX * divY);
    for (let y = 0; y < divY; ++y) {
      for (let x = 0; x < divX; ++x) {
        let i = y * divX + x;
        cells[i] = {
          id: `c${this.zeroPad(x)}${this.zeroPad(y)}`,
          coord: [x, y],
        };
      }
    }
    this.cells = cells;

    let cellStyle = this.$refs.cells.style;
    cellStyle.gridTemplateColumns = Array(divX).fill("50px").join(" ");
    cellStyle.gridTemplateRows = Array(divY).fill("50px").join(" ");

    this.userName = localStorage.getItem(`userName`) ?? "";

    this.selectBattle(this.battleList.slice(-1)[0].uid);
    this.selectPhase("0");
    this.$nextTick(() => {
      // 即時実行するとなんか tab の連動が追いつかないっぽいので $nextTick で行う
      this.decodeURL();
    });

    this.setupTools();

    window.onpopstate = () => {
      this.decodeURL(true);
    };
  },

  computed: {
    activeEnemyUnits() {
      if (this.simulation) {
        return this.enemyUnits.filter(a => a.isActive);
      }
      else {
        return this.enemyUnits.filter(a => a.phase == this.phase || a.fid == "E01");
      }
    },
    allActiveUnits() {
      if (this.simulation) {
        return [...this.playerUnits, ...this.enemyUnits].filter(a => a.isActive);
      }
      else {
        return [...this.playerUnits, ...this.enemyUnits].filter(a => a.phase == this.phase || a.fid == "E01");
      }
    },

    currentTool() {
      return this.toolStack.at(-1);
    },
    prevTool() {
      return this.toolStack.at(-2);
    },
  },

  watch: {
    userName: function (v) {
      localStorage.setItem(`userName`, v);
    },
  },

  methods: {
    setupTools() {
      // tool 変遷：
      // nonSimulation (非シミュレーション時)
      // selectUnit -> unitAction -> selectTarget -> (fireSkill)
      //                                          -> previewArea -> (fireSkill)
      //                          -> previewArea -> (fireSkill)
      //                                         -> previewDirection -> (fireSkill)

      let self = this;
      const confirm = () => {
        self.pushTool(self.tools.confirm);
      };

      this.tools = {
        // 非シミュレーション時
        // ユニット選択処理
        nonSimulation: {
          onClickCell(cell) {
            const unit = self.findUnitByCoord(cell.coord);
            if (!unit || self.selectedUnit === unit) {
              // 空セル、もしくは自身が選択されたらキャンセル
              this.onCancel();
            }
            else if(unit) {
              // ユニット選択処理
              self.selectUnit(unit);
              if (unit) {
                self.tools.moveUnit.buildPath(unit);
              }
            }
          },
          onDisable() {
            this.onCancel();
          },
          onCancel() {
            self.selectUnit(null);
            self.path = null;
          },
          onRenderCell(cell, r) {
            self.tools.moveUnit.onRenderCell(cell, r);
          },
        },

        // 以下は全てシミュレーション時
        // ユニット選択処理
        selectUnit: {
          onClickCell(cell) {
            const unit = self.findUnitByCoord(cell.coord);
            self.selectUnit(unit);
            if (unit) {
              self.pushTool(self.tools.moveUnit);
            }
          },
          onRenderCell(cell, r) {
            self.tools.moveUnit.onRenderCell(cell, r);
          },
        },

        // ユニット移動＆スキル選択処理
        moveUnit: {
          buildPath(unit) {
            let pf = new ldb.PathFinder(self.divX, self.divY);
            if (unit.isEnemy) {
              pf.setObstacles(self.allActiveUnits.filter(a => a.isPlayer && a.main.cid));
              pf.setOccupied(self.allActiveUnits.filter(a => a.isEnemy && a !== unit));
            }
            if (unit.isPlayer) {
              pf.setObstacles(self.allActiveUnits.filter(a => a.isEnemy));
              pf.setOccupied(self.allActiveUnits.filter(a => a.isPlayer && a.main.cid && a !== unit));
            }
            pf.setStart(unit.coord);
            pf.buildPath(unit.move, unit.range);
            self.path = pf;
          },

          onEnable() {
            self.selectedUnit.prevCoord = self.selectedUnit.coord;
            this.buildPath(self.selectedUnit);
            if (self.simulation.isOwnTurn(self.selectedUnit)) {
              self.actionsToSelect = self.selectedUnit.actions;
            }
          },
          onDisable() {
            self.selectUnit(null);
            self.path = null;
            self.actionsToSelect = [];
          },
          onClickCell(cell) {
            const unit = self.findUnitByCoord(cell.coord);
            let sim = self.simulation;
            if (unit) {
              if (self.selectedUnit === unit) {
                // 自身が選択されたらキャンセル
                self.cancelTools(self.tools.selectUnit);
              }
              else {
                // 別のユニットが選択されたらそちらに切り替え
                self.cancelTools(self.tools.selectUnit);
                self.selectUnit(unit);
                self.pushTool(self.tools.moveUnit);
              }
            }
            else {
              // ユニット移動処理
              // プレイヤーターンならプレイヤー側、敵ターンなら敵側のユニットだけ移動を許可
              if (sim.isOwnTurn(self.selectedUnit)) {
                self.selectedUnit.coord = cell.coord;
              }
            }
          },
          onClickAction(skill) {
            self.cancelTools(self.tools.moveUnit);
            self.selectAction(skill);

            if (skill) {
              if (skill.isSelfTarget) {
                self.targetCell = self.findCellByCoord(self.selectedUnit.coord);
                self.pushTools([self.tools.selectTarget, self.tools.confirm], this);
              }
              else if (skill.isRadialAreaTarget) {
                self.targetCell = self.findCellByCoord(self.selectedUnit.coord);
                self.pushTools([self.tools.previewArea, self.tools.confirm], this);
              }
              else if (skill.isDirectionalAreaTarget) {
                self.targetCell = self.findCellByCoord(self.selectedUnit.coord);
                self.pushTool(self.tools.previewArea);
              }
              else {
                self.pushTool(self.tools.selectTarget);
              }
            }
          },
          onCancel() {
            self.selectedUnit.coord = self.selectedUnit.prevCoord;
          },
          onRenderCell(cell, r) {
            let sim = self.simulation;
            let unit = self.findUnitByCoord(cell.coord);
            let selected = self.selectedUnit;
            if (unit) {
              if (unit.isEnemy)
                r.push("enemy-cell");
              if (unit.isPlayer)
                r.push("player-cell");
              if (unit === selected)
                r.push("selected");
            }
            if (self.path) {
              if (self.path.isInMoveRange(cell.coord)) {
                if (!unit) {
                  r.push("move-range");
                  if (sim?.isOwnTurn(selected)) {
                    r.push("click-to-move");
                  }
                  if (sim?.isOwnTurn(selected)) {
                    r.push("hovered");
                  }
                }
              }
              else if (self.path.isInFireRange(cell.coord)) {
                r.push("attack-range");
              }
            }
          },
        },

        // スキル射程表示＆ターゲット選択処理
        selectTarget: {
          isInFireRange(unit) {
            return self.skillRange.isInFireRange(unit?.coord);
          },

          onEnable() {
            let skill = self.selectedSkill;
            let pf = new ldb.PathFinder(self.divX, self.divY);
            pf.setStart(self.selectedUnit.coord);
            pf.buildPath(0, skill.range ?? 1, skill.rangeShape);
            self.skillRange = pf;
          },
          onDisable() {
            self.selectedSkill = null;
            self.skillRange = null;
            self.targetUnit = null;
            self.targetCell = null;
          },
          onClickCell(cell) {
            let unit = self.findUnitByCoord(cell.coord);
            if (self.skillRange.isInFireRange(cell.coord)) {
              let skill = self.selectedSkill;

              if (self.isValidTarget(self.selectedUnit, skill, unit)) {
                if (skill.isAreaTarget) {
                  // 範囲スキルの場合範囲確認モードに遷移
                  self.targetCell = cell;
                  self.pushTools([self.tools.previewArea, self.tools.confirm], this);
                }
                else {
                  // 単体スキルならスキル発動
                  // 召喚スキルはユニットのいないセルが対象になる
                  if (skill.isTargetCell) {
                    self.targetCell = cell;
                  }
                  else {
                    self.targetUnit = unit;
                  }
                  confirm();
                }
              }
            }
          },
          onClickAction(skill) {
            self.tools.moveUnit.onClickAction(skill);
          },
          onRenderCell(cell, r) {
            let unit = self.findUnitByCoord(cell.coord);
            let selected = self.selectedUnit;
            if (self.skillRange.isInFireRange(cell.coord)) {
              r.push("area-range");
              if (!self.showConfirm) {
                if (self.isValidTarget(selected, self.selectedSkill, unit)) {
                  r.push("click-to-fire");
                }
              }
              else {
                if ((unit && self.targetUnit === unit) || self.targetCell === cell) {
                  r.push("target-cell");
                }
              }
            }
          },
        },

        // 範囲スキルの範囲表示＆使用確認
        previewArea: {
          onEnable() {
            let skill = self.selectedSkill;
            let pf = new ldb.PathFinder(self.divX, self.divY);
            pf.setStart(self.targetCell.coord);
            pf.buildPath(0, skill.area, skill.areaShape);
            self.skillArea = pf;
            this.pf = pf;
          },
          onDisable() {
            if (self.prevTool !== self.tools.selectTarget) {
              self.selectedSkill = null;
              self.targetCell = null;
            }
            if (self.skillArea == this.pf) {
              self.skillArea = null;
            }
            this.pf = null;
          },
          onClickCell(cell) {
            let unit = self.findUnitByCoord(cell.coord);
            if (self.skillArea.isInFireRange(cell.coord)) {
              let skill = self.selectedSkill;

              if (self.isValidTarget(self.selectedUnit, skill, unit)) {
                // 方向指定スキルの場合ここに来る
                self.targetDirection = ldb.calcDirection(self.targetCell.coord, cell.coord);
                self.pushTools([self.tools.previewDirection, self.tools.confirm], this);
              }
            }
          },
          onClickAction(skill) {
            self.tools.moveUnit.onClickAction(skill);
          },
          onRenderCell(cell, r) {
            const unit = self.findUnitByCoord(cell.coord);
            const selected = self.selectedUnit;
            if (self.skillArea.isInFireRange(cell.coord)) {
              r.push("attack-range");
              if (self.isValidTarget(selected, self.selectedSkill, unit)) {
                if (!self.showConfirm) {
                  r.push("click-to-fire");
                }
                else {
                  r.push("target-cell");
                }
              }
            }
          },
        },

        previewDirection: {
          onEnable() {
            let skill = self.selectedSkill;
            let pf = new ldb.PathFinder(self.divX, self.divY);
            pf.setStart(self.targetCell.coord);
            pf.buildPath(0, skill.area, skill.areaShape, self.targetDirection);
            self.skillArea = pf;
            this.pf = pf;
          },
          onDisable() {
            if (self.skillArea == this.pf) {
              self.skillArea = self.tools.previewArea.pf;
            }
            this.pf = null;
            self.targetDirection = ldb.Direction.None;
          },
          onClickCell(cell) {
            let unit = self.findUnitByCoord(cell.coord);
            if (self.skillArea.isInFireRange(cell.coord)) {
              let skill = self.selectedSkill;

              if (self.isValidTarget(self.selectedUnit, skill, unit)) {
                confirm();
              }
            }
          },
          onClickAction(skill) {
            self.tools.moveUnit.onClickAction(skill);
          },
          onRenderCell(cell, r) {
            const unit = self.findUnitByCoord(cell.coord);
            const selected = self.selectedUnit;
            if (self.skillArea.isInFireRange(cell.coord)) {
              r.push("attack-range");
              if (self.isValidTarget(selected, self.selectedSkill, unit, false)) {
                r.push("target-cell");
              }
            }
          },
        },

        confirm: {
          onEnable() {
            self.showConfirm = true;
          },
          onDisable() {
            self.showConfirm = false;
          },
          onClickAction(skill) {
            self.tools.moveUnit.onClickAction(skill);
          },
          onRenderCell(cell, r) {
            self.prevTool.onRenderCell(cell, r);
          },
        },
      };

      this.resetTools(this.tools.nonSimulation);
    },

    isValidTarget(unit, skill, target, allowEmptyCell = true) {
      if (!unit || !skill) {
        return false;
      }

      const isTargetSide = () => {
        return target && ((skill.isTargetEnemy && unit.isPlayer != target.isPlayer) || (skill.isTargetAlly && unit.isPlayer == target.isPlayer));
      };

      if (skill.isSelfTarget) {
        // 自身が対象のスキル
        return unit === target;
      }
      else if (skill.isTargetCell) {
        // 空のセルが対象のスキル (召喚など)
        return !target;
      }
      else if (skill.isDirectionalAreaTarget) {
        // 方向指定スキル
        // ユニットでも空のセルでも対象に取れる、ただし使用者自身はダメ
        if (allowEmptyCell) {
          return unit !== target;
        }
        else {
          return isTargetSide();
        }
      }
      else if (skill.isRadialAreaTarget) {
        // 自分中心の範囲スキル
        return isTargetSide();
      }
      else {
        // その他ユニットが対象のスキル
        return isTargetSide();
      }
    },

    resetTools(tool = null) {
      if (tool) {
        while (this.popTool()) { }
        this.pushTool(tool);
      }
      else {
        while (this.toolStack.length > 1) {
          this.popTool();
        }
      }
    },
    cancelTools(cancelPoint = null) {
      let pos = this.toolStack.findIndex(a => a === cancelPoint);
      while (this.toolStack.length > 1) {
        if (this.toolStack.length - 1 == pos) {
          break;
        }
        let t = this.currentTool;
        let tpos = this.toolStack.findIndex(a => a === t.cancelPoint);
        if (tpos >= 1 && tpos < pos) {
          pos = tpos;
        }
        this.popTool(true);
      }
    },
    pushTool(tool) {
      if (tool.onEnable) {
        tool.onEnable();
      }
      this.pushArray(this.toolStack, tool);
    },
    pushTools(tools, cancelPoint = null) {
      if (cancelPoint) {
        tools.at(-1).cancelPoint = cancelPoint;
      }
      for (let t of tools) {
        this.pushTool(t);
      }
    },
    popTool(callCancel = false) {
      if (this.toolStack.length > 0) {
        let tool = this.currentTool;
        if (callCancel && tool.onCancel) {
          tool.onCancel();
        }
        if (tool.onDisable) {
          tool.onDisable();
        }
        this.popArray(this.toolStack);
        return true;
      }
      return false;
    },
    getPrevTool(tool) {
      const i = this.toolStack.findIndex(a => a === tool);
      console.log(i);
      return this.toolStack.at(i - 1);
    },

    zeroPad(num, pad = 2) {
      return String(num).padStart(pad, '0');
    },

    selectBattle(bid, clear = false) {
      this.enemyUnits = [];
      const battle = this.battleList.find(a => a.uid == bid);
      if (!battle)
        return;
      this.battleId = bid;
      this.battleData = battle;
      this.enemyUnits = battle.enemies.map(a => a.unit);

      if (clear) {
        this.selectPhase("0", clear);
      }

      for (let i = 0; i < battle.allies.length; ++i) {
        let ally = battle.allies[i];
        ally.unit = this.playerUnits[i];
        ally.unit.fid = ally.fid;
        ally.unit.phase = ally.phase;
        ally.unit.coord = ally.coord;
      }
    },

    selectPhase(pid, clear = false) {
      let phase = this.phaseList.find(p => p.id == pid);
      if (!phase)
        return;

      this.phaseTabIndex = phase.index;
      this.phase = pid;

      if (clear) {
        this.selectUnit(null);
      }
    },

    findCellByCoord(coord) {
      for (const c of this.cells) {
        if (c.coord[0] == coord[0] && c.coord[1] == coord[1])
          return c;
      }
      return null;
    },
    findUnitByCoord(coord) {
      for (const u of this.allActiveUnits) {
        if (u.coord[0] == coord[0] && u.coord[1] == coord[1]) {
          return (!this.simulation || u.isActive) ? u : null;
        }
      }
      return null;
    },

    selectUnit(unit) {
      this.selectedUnit = unit;
      if (unit) {
        if (unit.isEnemy) {
          this.scrollTo(`unit_${unit.fid}`);
        }
        if (unit.isPlayer) {
          const idx = this.playerUnits.findIndex(a => a.fid == unit.fid);
          this.unitTabIndex = idx;
        }
      }
    },

    selectAction(skill) {
      this.selectedSkill = skill;
    },

    getTargetUnits() {
      let pf = this.skillDirection ?? this.skillArea;
      if (pf) {
        return this.allActiveUnits.filter(u => {
          return pf.isInFireRange(u.coord) && this.isValidTarget(this.selectedUnit, this.selectedSkill, u);
        })
      }
      else {
        return this.targetUnit;
      }
    },

    confirmAction() {
      this.simulation.fireSkill(this.selectedUnit, this.selectedSkill, this.getTargetUnits(), this.targetCell);
      this.resetTools();
    },

    cancelAction() {
      let tool = this.currentTool;
      if (tool?.onCancel) {
        tool.onCancel();
      }
      if (this.toolStack.length > 1) {
        this.cancelTools(this.prevTool);
      }
    },

    mergeChrData(dst, src) {
      const props = [
        "isMain", "isSupport",
        "name", "icon", "class", "rarity", "symbol", "supportType", "damageType", "range", "move",
      ];
      if (src) {
        for (const prop of props) {
          if (prop in src)
            dst[prop] = src[prop];
          else
            delete dst[prop];
        }
      }
      else {
        for (const prop of props) {
          delete dst[prop];
        }
      }
    },

    getSkillClass(skill) {
      return {
        active: skill.isActive,
        passive: skill.isPassive,
      }
    },

    isUnitHighlighted(unit) {
      return unit && (unit === this.selectedUnit);
    },

    getCellClass(cell) {
      let r = ["grid-cell", "border-l", "border-t"];
      if (cell.coord[0] == this.divX - 1) {
        r.push("border-r");
      }
      if (cell.coord[1] == this.divY - 1) {
        r.push("border-b");
      }

      let tool = this.currentTool;
      if (tool?.onRenderCell) {
        tool.onRenderCell(cell, r);
      }
      return r;
    },
    getActionClass(skill) {
      let r = ["action"];
      if (skill === this.selectedSkill) {
        r.push("selected");
      }
      if (!skill.available) {
        r.push("grayscale");
      }
      return r;
    },

    scrollTo(id) {
      this.$nextTick(() => {
        let e = document.getElementById(id);
        if (e) {
          e.scrollIntoView({ block: "nearest" });
        }
      });
    },

    onEnterCell(cell) {
      this.hoveredCell = cell;
      const unit = this.findUnitByCoord(cell.coord);
      if (unit?.isEnemy) {
        //this.scrollTo(`enemy_${unit.fid}`);
      }
    },
    onLeaveCell(cell) {
      if (this.hoveredCell === cell) {
        this.hoveredCell = null;
      }
    },
    onClickCell(cell) {
      let tool = this.currentTool;
      if (tool && tool.onClickCell) {
        tool.onClickCell(cell);
      }
    },
    onCellRClick(cell) {
      this.cancelAction();
    },
    onClickAction(skill) {
      let tool = this.currentTool;
      if (tool && tool.onClickAction) {
        tool.onClickAction(skill);
      }
    },


    beginSimulation() {
      this.selectUnit(null);
      if (!this.simulation) {
        this.simulation = new ldb.SimContext(this.divX, this.divY, [...this.playerUnits, ...this.enemyUnits]);
        this.simulation.onSimulationBegin();
        this.resetTools(this.tools.selectUnit);
      }
    },
    endSimulation() {
      this.selectUnit(null);
      if (this.simulation) {
        this.simulation.onSimulationEnd();
        this.simulation = null;
        this.resetTools(this.tools.nonSimulation);
      }
    },

    eraseWeakEnemies() {
      this.simulation?.eraseWeakEnemies();
      this.$forceUpdate();
    },

    endTurn() {
      this.simulation?.passTurn();
    },

    onDragUnit(unit) {
      this.draggingUnit = unit;
    },
    onDropUnit(unit) {
      if (this.draggingUnit && !this.simulation) {
        if (this.draggingUnit && unit) {
          this.draggingUnit.swap(unit);
        }
      }
      this.draggingUnit = null;
      this.selectUnit(null);
    },
    onDragCell(cell) {
      this.onDragUnit(this.findUnitByCoord(cell.coord));
    },
    onDropCell(cell) {
      this.onDropUnit(this.findUnitByCoord(cell.coord));
    },
    dummyHandler() {
    },


    // in-place array copy
    copyArray(dst, src) {
      dst.length = src.length;
      for (let i = 0; i < src.length; ++i)
        dst[i] = src[i];
    },
    appendArray(dst, src) {
      let pos = dst.length;
      dst.length = dst.length + src.length;
      for (let i = 0; i < src.length; ++i)
        dst[pos++] = src[i];
    },

    serializeLoadout() {
      let r = {
        name: this.slotName,
        desc: this.slotDesc,
        units: this.playerUnits.map(a => a.serialize()),
      };
      return r;
    },
    deserializeLoadout(obj) {
      this.loadoutHash = null;
      this.slotName = obj.name ?? "";
      this.slotDesc = obj.desc ?? "";
      for (let i = 0; i < this.playerUnits.length; ++i) {
        this.playerUnits[i].deserialize(obj.units[i]);
      }
    },
    saveLoadout(slot = 0) {
      let old = JSON.parse(localStorage.getItem(`battle.slot${slot}`));
      if (old?.units?.find(a => a.main.cid)) {
        localStorage.setItem(`battle.slot99`, JSON.stringify(old));
        this.toast("上書き前の編成をバックアップスロットに保存しました。");
      }

      this.setArrayElement(this.slotNames, slot, this.slotName);
      let data = this.serializeLoadout();
      localStorage.setItem(`battle.slot${slot}`, JSON.stringify(data));
    },
    loadLoadout(slot = 0) {
      let data = JSON.parse(localStorage.getItem(`battle.slot${slot}`));
      if (data) {
        this.deserializeLoadout(data);
      }
      else {
        for (let unit of this.playerUnits) {
          unit.initialize();
        }
      }
      this.selectUnit(null);
    },
    exportLoadoutAsFile() {
      const data = this.serializeLoadout();
      const name = data.name ? data.name : "編成名";
      ldb.download(`${name}.loadout`, data);
    },
    importLoadoutFromFile() {
      ldb.openFileDialog(".loadout", (file) => {
        file.text().then((text) => {
          this.deserializeLoadout(JSON.parse(text));
        });
      });
    },
    importLoadoutFromUrl(url, callback = null) {
      if (url.match(/^https?:\/\//)) {
        // dropbox 対策
        url = url.replace("www.dropbox.com", "dl.dropboxusercontent.com");
      }
      else {
        // http で始まらない場合は hash とみなす
        url = `${LoadoutServer}?mode=get&hash=${url}`;
      }

      fetch(url).then((res) => {
        res.json().then((obj) => {
          this.deserializeLoadout(obj);
          if (callback) {
            callback();
          }
        })
      });
    },
    onDropLoadout(event) {
      if (event?.dataTransfer?.files?.length) {
        let file = event.dataTransfer.files[0];
        file.text().then((text) => {
          this.deserializeLoadout(JSON.parse(text));
        });
      }
    },
    clearLoadout() {
      if (this.playerUnits.find(a => a.main.cid)) {
        let old = this.serializeLoadout();
        localStorage.setItem(`battle.slot99`, JSON.stringify(old));
        this.toast("クリア前の編成をバックアップスロットに保存しました。");
      }

      this.slotName = "";
      this.slotDesc = "";
      this.loadoutHash = null;
      for (let unit of this.playerUnits) {
        unit.initialize();
      }
    },
    fetchLoadoutList() {
      this.fetching = true;
      fetch(LoadoutServer).then((res) => {
        res.json().then((obj) => {
          this.fetching = false;
          this.loadoutList = obj.sort((a, b) => b.date.localeCompare(a.date));
          for (let e of this.loadoutList) {
            // 長すぎる名前は切り詰めておく
            const maxNameLen = 24;
            if (e.name.length > maxNameLen) {
              e.name = e.name.substring(0, maxNameLen);
            }
            const delkey = localStorage.getItem(`delkey.${e.hash}`);
            if (delkey) {
              e.delkey = delkey;
            }
          }
        })
      });
    },
    exportLoadoutToServer() {
      const data = this.serializeLoadout();
      var form = new FormData()
      form.append('mode', 'put');
      form.append('data', new Blob([JSON.stringify(data, null, 2)]));
      form.append('author', this.userName.trim());
      fetch(LoadoutServer, { method: "POST", body: form }).then((res) => {
        res.json().then((obj) => {
          if (obj.succeeded) {
            localStorage.setItem(`delkey.${obj.hash}`, obj.delkey);
            this.fetchLoadoutList();
          }
          if (obj.message) {
            this.toast(obj.message);
          }
        })
      });
    },
    downloadLoadoutFromServer(rec) {
      this.importLoadoutFromUrl(`${LoadoutServer}?mode=get&hash=${rec.hash}`, () => {
        this.loadoutHash = rec.hash;
      });
    },
    deleteLoadoutFromServer(rec) {
      if (window.confirm(`"${rec.name}" をサーバーから削除します。よろしいですか？`)) {
        fetch(`${LoadoutServer}?mode=del&hash=${rec.hash}&delkey=${rec.delkey}`).then((res) => {
          res.json().then((obj) => {
            if (obj.succeeded) {
              localStorage.removeItem(`delkey.${rec.hash}`);
              if (rec.hash == this.loadoutHash) {
                this.loadoutHash = null;
              }
              this.fetchLoadoutList();
            }
            if (obj.message) {
              this.toast(obj.message);
            }
          });
        });
      }
    },
    copyLoadoutUrl(rec) {
      let url = window.location.href.replace(/\?.+/, '').replace(/#.+/, '');
      url += `?loadout=${rec.hash}`;
      this.copyToClipboard(url);
      this.toast(`コピーしました：${url}`);
    },

    onMessageChange(mb) {
      this.addPo(mb.anchors);
      this.dispatchScrollEvent();
    },
    onMessageDiscard(mb) {
      this.removePo(mb.anchors);
    },


    updateURL() {
      let seri = new this.URLSerializer();
      seri.b = this.battleId;
      if (this.phase != "0")
        seri.p = this.phase;
      if (this.selectedUnit)
        seri.u = this.selectedUnit.fid;

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
        b: "",
        p: "",
        u: "",
      });

      if (data.deserialize(window.location.href) || initState) {
        if (data.b)
          this.selectBattle(data.b);
        if (data.p)
          this.selectPhase(data.p);
        else if (data.b)
          this.selectPhase("0");
        if (data.u)
          this.selectUnit(data.u);

        if (data.loadout) {
          this.importLoadoutFromUrl(data.loadout);
        }
        if (data.battlelog) {
          this.importBattleLogUrl(data.battlelog);
        }
      }
    },
    dbgTest() {
    },
  },
}
</script>

<style scoped>
  .main-panel {
    padding-top: 10px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 0.3rem;
    display: inline-block;
    background: rgb(245, 245, 245);
    box-shadow: 0 3px 6px rgba(140,149,159,0.5);
  }

  .grid-container {
    display: grid;
    /*
      grid-gap によるボーダーの描画は、どうも画面のスケールが 100% でないときにムラができるっぽいので、
      旧来の border-(left|right|top|bottom) でなんとかする。

      grid-gap: 1px;
      padding: 1px;
      background: rgb(180,185,195);
    */
    margin-right: 20px;
  }
  .grid-cell {
    display: flex;
    justify-content: center;
    background: white;
  }
  .bordered {
    border: 1px solid rgb(180,185,195);
  }
  .border-l {
    border-left: 1px solid rgb(180,185,195);
  }
  .border-r {
    border-right: 1px solid rgb(180,185,195);
  }
  .border-t {
    border-top: 1px solid rgb(180,185,195);
  }
  .border-b {
    border-bottom: 1px solid rgb(180,185,195);
  }

  .enemy-cell {
    background: rgb(255, 160, 160);
    cursor: pointer;
  }
  .enemy-cell.selected {
    background: rgb(255, 80, 80);
  }

  .player-cell {
    background: rgb(140, 160, 255);
    cursor: pointer;
  }
  .player-cell.selected {
    background: rgb(80, 80, 255);
  }

  .target-cell {
    background: rgb(255, 90, 80) !important;
    cursor: crosshair;
  }

  .move-range {
    background: rgb(200, 220, 255);
  }
  .attack-range {
    background: rgb(255, 200, 190);
  }
  .area-range {
    background: rgb(255, 235, 190);
  }
  .click-to-move:hover {
    background: rgb(140, 160, 255);
    cursor: move;
  }
  .click-to-fire:hover {
    background: rgb(255, 90, 80);
    cursor: crosshair;
  }

  .enemy-list {
    max-height: 750px;
    overflow-y: scroll;
  }
  .enemy-panel {
  }

  .center {
    margin: auto;
  }

  .unit-panel {
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 0.3rem;
    display: inline-block;
    background: rgb(245, 245, 245);
    box-shadow: 0 3px 6px rgba(140,149,159,0.5);
    padding: 10px;
    margin: 5px;
  }

  .content ul {
    list-style-type: disc;
    margin: 0;
  }
  .content li {
    display: list-item;
    margin: 0 15px;
  }

  .action {
    border: 1px solid rgba(255, 255, 255, 0);
    border-radius: 0.3rem;
    background-color: rgba(255, 255, 255, 0);
  }
  .action.selected {
    border: 1px solid rgba(255, 0, 0, 255);
    background-color: rgba(255, 0, 0, 255);
  }
  .grayscale {
    filter: grayscale(100%);
  }

</style>
<style>
  .table {
    margin-bottom: 1px;
  }

  .desc .table {
    width: auto;
    margin: 3px;
  }

  .input-dropdown button {
    padding: 0.1em;
  }

  .table-sm td {
    padding-top: 1px;
    padding-bottom: 1px;
    vertical-align: middle;
  }

  input::placeholder {
    color: rgb(190, 190, 190) !important;
    font-size: small !important;
  }

  .status-simulator-popover {
    max-width: 1000px !important;
  }
  .status-simulator-popover .popover-body {
    padding: 0px !important;
  }
  .loadout-popover {
    max-width: 1000px !important;
    min-width: 800px !important;
  }
  .comment-popover {
    max-width: 800px !important;
    min-width: 600px !important;
  }
</style>
