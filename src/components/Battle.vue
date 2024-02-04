<template>
  <div class="root" @mousemove="onMouseMove">
    <div class="header" :class="{ 'hidden': !showHeader }">
      <Navigation />
    </div>
    <div class="about" style="margin-top: 55px;">
      <div class="menu-content" style="flex-wrap: nowrap">
        <div class="menu-panel" id="cb-settings">
          <div class="menu-widgets flex">
            <div class="widget">
              <span>マップデータ：</span>
              <b-dropdown :text="battleData ? battleData.uid : ''" size="sm" id="battle_selector" :disabled="battle!=null">
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
        <b-tabs v-model="phaseTabIndex">
          <b-tab v-for="phase in phaseList" :title="phase.desc" @click="selectPhase(phase.id, true); updateURL();" :key="phase.id"></b-tab>
        </b-tabs>

        <div style="padding: 10px; background-color: white; display: flex;">
          <div class="grid-container">
            <div v-for="(cell, i) in cells" :key="i" :set="unit=findUnitByCoord(cell.coord)" class="grid-cell" :class="getCellClass(cell)" :id="cell.id"
                 @click="onCellClick(cell)" v-on:mouseover="onCellEnter(cell)" v-on:mouseleave="onCellLeave(cell)">
              <template v-if="unit?.isEnemy && unit?.hasSupport">
                <b-img-lazy :src="getImageURL(unit.main.class)" class="center"
                            width="30" height="30" style="position: relative; left: 8px; top: -8px; z-index: 1;" />
                <b-img-lazy :src="getImageURL(unit.support.class)" class="center"
                            width="30" height="30" style="position: relative; left: -8px; top: 8px; z-index: 0;" />
              </template>
              <template v-else-if="unit?.isEnemy && unit?.main">
                <b-img-lazy :src="getImageURL(unit.main.class)" class="center" width="40" height="40" />
              </template>
              <template v-else-if="unit?.isAlly">
                <div draggable @dragstart="onCellDrag(cell)" @drop="onCellDrop(cell)" @dragover="onDragOver">
                  <b-img-lazy :src="getImageURL(unit.main.icon)" class="center" width="50" height="50" />
                </div>
              </template>
            </div>
          </div>

          <div class="enemy-list">
            <template v-for="enemy in enemies">
              <div class="character" :class="{ 'highlighted': isUnitHighlighted(enemy) }" :id="'enemy_'+enemy.fid" :key="enemy.fid" :set="unit=enemy.unit">
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
                      <div class="skill" v-for="(skill, si) in unit.main.skills" :class="getSkillClass(skill)" :key="si">
                        <div class="flex">
                          <div class="icon" :id="'enemy_'+enemy.fid+'_skill'+si">
                            <b-img-lazy :src="getImageURL(skill.icon)" with="50" height="50" />
                            <b-popover v-if="displayType==1" :target="'enemy_'+enemy.fid+'_skill'+si" triggers="hover focus" :delay="{show:0, hide:250}" no-fade :title="skill.name" placement="top">
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

    <div v-if="false" class="content" style="margin-top: 40px">
      <div class="unit-panel">
        <div class="flex">
          <b-button size="sm" id="btl-unit-player" style="width: 13em;">
            ユニットセレクタ(味方)
            <UnitSelector target="btl-unit-player" :units="playerUnits" closeonclick />
          </b-button>
          <b-button size="sm" id="btl-unit-enemy" style="width: 13em; margin-left: 0.5em;">
            ユニットセレクタ(敵)
            <UnitSelector target="btl-unit-enemy" :units="enemyUnits" closeonclick />
          </b-button>
        </div>
      </div>
    </div>

    <div class="content" style="margin-top: 40px">
      <div class="unit-panel">
        <div class="flex">
          <b-form-input v-model="slotName" placeholder="編成名" :disabled="battle!=null" style="width: 12em"></b-form-input>
          <b-dropdown size="sm" text="編成をセーブ" :disabled="battle!=null" style="width: 10em; margin-left: 0.5em;">
            <b-dropdown-item v-for="(name, i) in slotNames" :key=i @click="saveUnits(i)">スロット{{i}}: {{name}}</b-dropdown-item>
          </b-dropdown>
          <b-dropdown size="sm" text="編成をロード" :disabled="battle!=null" style="width: 10em; margin-left: 0.5em;">
            <b-dropdown-item v-for="(name, i) in slotNames" :key=i @click="loadUnits(i)">スロット{{i}}: {{name}}</b-dropdown-item>
            <b-dropdown-item @click="loadUnits(99)">バックアップ</b-dropdown-item>
          </b-dropdown>
          <b-button size="sm" @click="clearUnits()" :disabled="battle!=null" style="width: 10em; margin-left: 1em;">
            編成をクリア
          </b-button>
          <b-button size="sm" style="width: 14em; margin-left: 4em;" @click="battle ? endSimulation() : beginSimulation()">
            {{battle ? 'シミュレーション終了' : 'シミュレーション開始'}}
          </b-button>
        </div>
      </div>
    </div>

    <div class="content" :style="style">
      <div class="main-panel" style="margin-top: 10px; margin-bottom: 20px;">
        <b-tabs v-model="unitTabIndex">
          <b-tab v-for="(unit, ui) in playerUnits" :key="ui" style="background-color: white; min-width: 1520px; min-height: 500px;">
            <template #title>
              <h2 style="font-size: 1em;" draggable @dragstart="onUnitDrag(unit)" @drop="onUnitDrop(unit)" @dragover="onDragOver">
                ユニット{{ui+1}}
                <b-img-lazy :src="getImageURL(unit.main?.icon)" width="30" />
                <b-img-lazy :src="getImageURL(unit.support?.icon)" width="30" />
              </h2>
            </template>
            <div v-if="!battle" style="padding: 10px;">
              <b-button :id="`btn-edit-unit${ui}`" @click="unit.showEditor=!unit.showEditor" style="width: 10em;">編集</b-button>
              <b-popover :target="`btn-edit-unit${ui}`" custom-class="status-simulator-popover" :show.sync="unit.showEditor" :delay="{show:0, hide:250}" no-fade>
                <StatusSimulator embed :data="unit.editorData" @change="unit.edit($event)" />
                <div class="flex">
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
                      <div class="skill" v-for="(skill, si) in unit.main.skills" :class="getSkillClass(skill)" :key="`skill${si}`">
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

          </b-tab>
        </b-tabs>

      </div>
    </div>

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
import UnitSelector from './parts/UnitSelector.vue'
import * as ldb from "./simulator/battle.js";

export default {
  name: 'Battle',
  components: {
    Navigation,
    StatusSimulator,
    UnitSelector,
  },
  mixins: [commonjs,lookupjs],

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

      enemies: [],
      allies: [],
      path: null,

      selected: null,
      hovered: null,

      phaseTabIndex: 0,
      prevURL: "",

      slotNames: ["", "", "", "", "", "", "", "", "", ""],
      slotName: "",
      enemyUnits: [],
      playerUnits: [
        new ldb.BaseUnit(),
        new ldb.BaseUnit(),
        new ldb.BaseUnit(),
        new ldb.BaseUnit(),
        new ldb.BaseUnit(),
      ],
      unitTabIndex: 0,

      btlPhaseList: [
        { index: 0, id: "1P", desc: "1Tプレイヤー" },
        { index: 1, id: "1E", desc: "1T敵" },
        { index: 2, id: "2P", desc: "2Tプレイヤー" },
        { index: 3, id: "2E", desc: "2T敵" },
        { index: 4, id: "3P", desc: "3Tプレイヤー" },
        { index: 5, id: "3E", desc: "3T敵" },
        { index: 6, id: "4P", desc: "4Tプレイヤー" },
        { index: 7, id: "4E", desc: "4T敵" },
        { index: 8, id: "5P", desc: "5Tプレイヤー" },
        { index: 9, id: "5E", desc: "5T敵" },
      ],
      battle: null,
    };
  },

  beforeCreate() {
    window.$vue = this;
  },

  created() {
    document.title = "れじぇくろDB: 戦闘データ";

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

    this.selectBattle(this.battleList.slice(-1)[0].uid);
    this.selectPhase("0");
    this.$nextTick(function () {
      // 即時実行するとなんか tab の連動が追いつかないっぽいので $nextTick で行う
      this.decodeURL();
    });

    window.onpopstate = function () {
      this.decodeURL(true);
    }.bind(this);
    },

  computed: {
    validPlayerUnits() {
      return this.playerUnits.flatMap(a => a.main.cid ? [a] : []);
    },
    allUnits() {
      return [...this.playerUnits, ...this.enemyUnits];
    },
    allActiveUnits() {
      return this.allUnits.filter(a => a.phase == this.phase || a.fid == "E01");
    },
  },

  methods: {
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
      this.enemies = this.battleData.enemies.filter(e => e.phase == pid || e.fid == "E01");
      this.allies = this.battleData.allies.filter(e => e.phase == pid);

      for (let cell of this.cells) {
        cell.enemy = null;
        cell.ally = null;

        for (let enemy of this.enemies) {
          if (enemy.coord[0] == cell.coord[0] && enemy.coord[1] == cell.coord[1]) {
            cell.enemy = enemy;
          }
        }
        for (let ally of this.allies) {
          if (ally.coord[0] == cell.coord[0] && ally.coord[1] == cell.coord[1]) {
            cell.ally = ally;
          }
        }
      }

      if (clear) {
        this.selectUnit(null);
      }
    },

    findUnitByCoord(coord) {
      for (const u of this.allActiveUnits) {
        if (u.coord[0] == coord[0] && u.coord[1] == coord[1])
          return u;
      }
      return null;
    },

    selectUnit(fid) {
      const e = this.allActiveUnits.find(u => u.fid == fid);
      if (e) {
        this.selected = fid;
        if (e.isEnemy) {
          this.scrollTo(`unit_${fid}`);
        }

        let pf = new ldb.PathFinder(15, 15);
        if (e.isEnemy) {
          pf.setObstacles(this.allActiveUnits.filter(a => a.isAlly));
        }
        if (e.isAlly) {
          pf.setObstacles(this.allActiveUnits.filter(a => a.isEnemy));
        }
        pf.setStart(e.coord[0], e.coord[1]);
        pf.build(e.main.move, e.main.range);
        this.path = pf;
      }
      else {
        this.selected = null;
        this.path = null;
      }
    },

    mergeChrData(dst, src) {
      const props = ["name", "icon", "class", "rarity", "symbol", "supportType", "damageType", "range", "move"];
      if (src) {
        for (const prop of props) {
          dst[prop] = src[prop];
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
      return unit.fid == this.selected || unit.fid == this.hovered;
    },

    getCellClass(cell) {
      const unit = this.findUnitByCoord(cell.coord);

      let r = [];
      if (unit) {
        if (unit.isEnemy)
          r.push("enemy-cell");
        if (unit.isAlly)
          r.push("ally-cell");
        if (unit.fid == this.selected)
          r.push("selected");
      }
      else if (this.path) {
        if (this.path.isReachable(cell.coord)) {
          r.push("in-move-range");
        }
        else if (this.path.isShootable(cell.coord)) {
          r.push("in-attack-range");
        }
      }
      return r;
    },

    scrollTo(id) {
      this.$nextTick(function () {
        let e = document.getElementById(id);
        if (e) {
          e.scrollIntoView({block: "nearest"});
        }
      });
    },

    onCellEnter(cell) {
      this.hovered = cell.enemy ? cell.enemy.fid : null;
      if (cell.enemy)
        this.scrollTo(`enemy_${cell.enemy.fid}`);
    },
    onCellLeave(cell) {
      if (cell.enemy && this.hovered == cell.enemy.fid) {
        this.hovered = null;
      }
    },
    onCellClick(cell) {
      if (cell.enemy) {
        this.selectUnit(cell.enemy.fid);
      }
      else if (cell.ally) {
        this.selectUnit(cell.ally.fid);
      }
      else {
        this.selectUnit(null);
      }
      //this.updateURL();
    },

    updateURL() {
      let seri = new this.URLSerializer();
      seri.b = this.battleId;
      if (this.phase != "0")
        seri.p = this.phase;
      if (this.selected)
        seri.u = this.selected;

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
      }
    },


    beginSimulation() {
      this.selectUnit(null);
      if (!this.battle) {
        this.battle = new ldb.BattleContext(this.playerUnits, this.enemyUnits);
      }
    },
    endSimulation() {
      this.selectUnit(null);
      if (this.battle) {
        this.battle.finalize();
        this.battle = null;
      }
    },

    onUnitDrag(unit) {
      this.draggingUnit = unit;
    },
    onUnitDrop(unit) {
      if (this.draggingUnit && !this.battle) {
        if (this.draggingUnit && unit) {
          this.draggingUnit.swap(unit);
        }
      }
      this.draggingUnit = null;
      this.selectUnit(null);
    },
    onCellDrag(cell) {
      this.onUnitDrag(this.findUnitByCoord(cell.coord));
    },
    onCellDrop(cell) {
      this.onUnitDrop(this.findUnitByCoord(cell.coord));
    },
    onDragOver(e) {
      e.preventDefault();
    },


    uidToObject(uid) {
      return this.searchTableWithUid.get(uid);
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

    clearUnits() {
      for (let unit of this.playerUnits) {
        unit.initialize();
      }
    },
    saveUnits(slot = 0) {
      let old = JSON.parse(localStorage.getItem(`battle.slot${slot}`));
      if (old?.units) {
        localStorage.setItem(`battle.slot99`, JSON.stringify(old));
      }

      this.setArrayElement(this.slotNames, slot, this.slotName);
      let data = {
        name: this.slotName,
        units: this.playerUnits.map(a => a.serialize()),
      };
      localStorage.setItem(`battle.slot${slot}`, JSON.stringify(data));
    },
    loadUnits(slot = 0) {
      let data = JSON.parse(localStorage.getItem(`battle.slot${slot}`));
      if (data) {
        this.slotName = data.name ?? "";
        for (let i = 0; i < this.playerUnits.length; ++i) {
          this.playerUnits[i].deserialize(data.units[i]);
        }
      }
      else {
        for (let unit of this.playerUnits) {
          unit.initialize();
        }
      }
      this.selectUnit(null);
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
    grid-template-columns: 50px 50px 50px 50px 50px 50px 50px 50px 50px 50px 50px 50px 50px 50px 50px;
    grid-template-rows: 50px 50px 50px 50px 50px 50px 50px 50px 50px 50px 50px 50px 50px 50px 50px;
    margin-right: 20px;
  }
  .grid-cell {
    border: 1px solid rgba(140,149,159,0.5);
    width: 50px;
    height: 50px;
    display: flex;
    justify-content: center;
  }

  .enemy-cell {
    background: rgb(255, 160, 160);
    cursor: pointer;
  }
  .enemy-cell.selected {
    border-color: rgb(255, 40, 40);
    background: rgb(255, 80, 80);
  }

  .ally-cell {
    background: rgb(140, 160, 255);
    cursor: grab;
  }
  .ally-cell.selected {
    border-color: rgb(40, 40, 255);
    background: rgb(80, 80, 255);
  }

  .in-move-range {
    background: rgb(255, 230, 215);
  }
  .in-attack-range {
    background: rgb(255, 245, 230);
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
    padding: 1px;
    vertical-align: middle;
  }

  input::placeholder {
    color: rgb(190, 190, 190) !important;
    font-size: small !important;
  }

  .popover {
    max-width: 450px;
  }
  .status-simulator-popover {
    max-width: 880px !important;
    width: 880px !important;
  }

</style>
