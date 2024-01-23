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
            <div v-for="(cell, i) in cells" :key="i" class="grid-cell" :class="getCellClass(cell)" :id="cell.id"
                 @click="onCellClick(cell)" v-on:mouseover="onCellEnter(cell)" v-on:mouseleave="onCellLeave(cell)">
              <template v-if="cell.enemy && cell.enemy.support">
                <b-img-lazy :src="getImageURL(cell.enemy.main.class)" class="center"
                            width="30" height="30" style="position: relative; left: 8px; top: -8px; z-index: 1;" />
                <b-img-lazy :src="getImageURL(cell.enemy.support.class)" class="center"
                            width="30" height="30" style="position: relative; left: -8px; top: 8px; z-index: 0;" />
              </template>
              <template v-else-if="cell.enemy && !cell.enemy.support">
                <b-img-lazy :src="getImageURL(cell.enemy.main.class)" class="center" width="40" height="40" />
              </template>
            </div>
          </div>

          <div class="enemy-list">
            <template v-for="ene in enemies">
              <div class="character" :class="{ 'highlighted': isUnitHighlighted(ene) }" :id="'enemy_'+ene.fid" :key="ene.fid">
                <div class="flex">
                  <div class="portrait">
                    <b-img-lazy :src="getImageURL(ene.main.icon)" :title="ene.main.name" width="80" height="80" rounded />
                  </div>
                  <div class="detail" v-show="displayType >= 1">
                    <div class="info">
                      <h5 v-html="chrNameToHtml(ene.main.name+' (メイン)')"></h5>
                      <div class="status">
                        <b-img-lazy :src="getImageURL(ene.main.class)" :title="'クラス:'+ene.main.class" height="25" />
                        <div class="param-box"><b-img-lazy :src="getImageURL(ene.main.damageType)" :title="'攻撃タイプ:'+ene.main.damageType" width="20" height="20" /></div>
                        <div class="param-box"><b-img-lazy :src="getImageURL('射程')" title="射程" width="18" height="18" /><span>{{ene.main.range}}</span></div>
                        <div class="param-box"><b-img-lazy :src="getImageURL('移動')" title="移動" width="18" height="18" /><span>{{ene.main.move}}</span></div>
                        <div class="param-box"><span class="param-name">レベル:</span><span class="param-value">{{ene.main.level}}</span></div>
                      </div>
                      <div v-if="ene.main.status" class="status2" v-html="statusToHtml(ene.main.status)" />
                    </div>
                    <div class="skills">
                      <div class="skill" v-for="(skill, si) in ene.main.skills" :class="getSkillClass(skill)" :key="si">
                        <div class="flex">
                          <div class="icon" :id="'enemy_'+ene.fid+'_skill'+si">
                            <b-img-lazy :src="getImageURL(skill.icon)" with="50" height="50" />
                            <b-popover v-if="displayType==1" :target="'enemy_'+ene.fid+'_skill'+si" triggers="hover focus" :delay="{show:0, hide:250}" no-fade :title="skill.name" placement="top">
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

                <div v-if="ene.support && displayType >= 2" class="flex">
                  <div class="portrait">
                    <b-img-lazy :src="getImageURL(ene.support.icon)" :title="ene.support.name" width="80" height="80" rounded />
                  </div>
                  <div class="detail" v-show="displayType >= 1">
                    <div class="info">
                      <h5 v-html="chrNameToHtml(ene.support.name+' (サポート)')"></h5>
                      <div class="status">
                        <b-img-lazy :src="getImageURL(ene.support.class)" :title="'クラス:'+ene.support.class" height="25" />
                        <div class="param-box"><b-img-lazy :src="getImageURL(ene.support.damageType)" :title="'攻撃タイプ:'+ene.support.damageType" width="20" height="20" /></div>
                        <div class="param-box"><b-img-lazy :src="getImageURL('射程')" title="射程" width="18" height="18" /><span>{{ene.support.range}}</span></div>
                        <div class="param-box"><span class="param-name">レベル:</span><span class="param-value">{{ene.support.level}}</span></div>
                      </div>
                      <div v-if="ene.support.status" class="status2" v-html="statusToHtml(ene.support.status)" />
                    </div>
                  </div>
                </div>
              </div>
            </template>

          </div>

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
          <b-button size="sm" style="width: 10em; margin-left: 4em;" @click="battle ? endBattle() : beginBattle()">
            {{battle ? 'ダメージ計算終了' : 'ダメージ計算開始'}}
          </b-button>
          <b-button size="sm" id="btl-unit-player" style="width: 13em; margin-left: 4em;">
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

    <div class="content" :style="style">
      <div class="main-panel" style="margin-top: 10px; margin-bottom: 20px;">
        <b-tabs v-model="unitTabIndex">
          <b-tab v-for="(unit, ui) in units" :key="ui" style="background-color: white; min-width: 1520px; min-height: 500px;">
            <template #title>
              <h2 style="font-size: 1em;">
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

      battleList: [],
      battleId: "",
      battleData: null,
      cells: [],
      phase: "",

      enemies: [],
      allies: [],

      selected: null,
      hovered: null,

      phaseTabIndex: 0,
      prevURL: "",

      slotNames: ["", "", "", "", "", "", "", "", "", ""],
      slotName: "",
      units: [
        new this.BaseUnit(0),
        new this.BaseUnit(1),
        new this.BaseUnit(2),
        new this.BaseUnit(3),
        new this.BaseUnit(4),
      ],
      unitTabIndex: 0,
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
        enemy.cellID = `c${this.zeroPad(enemy.coord[0])}${this.zeroPad(enemy.coord[1])}`;
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
    const div_x = 15;
    const div_y = 15;
    let cells = new Array(div_x * div_y);
    for (let y = 0; y < div_y; ++y) {
      for (let x = 0; x < div_x; ++x) {
        let i = y * div_x + x;
        cells[i] = {
          id: `c${this.zeroPad(x)}${this.zeroPad(y)}`,
          coord: [x, y],
          enemy: null,
          ally: null,
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
    playerUnits() {
      let r = [];
      for (let u of this.units) {
        if (u.main.cid)
          r.push(u);
      }
      return r;
    },
    enemyUnits() {
      const battle = this.battleList.find(a => a.uid == this.battleId);
      return battle ? battle.enemies : [];
    },
  },

  methods: {
    zeroPad(num, pad = 2) {
      return String(num).padStart(pad, '0');
    },

    selectBattle(bid, clear = false) {
      const battle = this.battleList.find(a => a.uid == bid);
      if (!battle)
        return;
      this.battleId = bid;
      this.battleData = battle;

      if (clear) {
        this.selectPhase("0", clear);
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

    selectUnit(fid) {
      const unit = this.enemies.find(u => u.fid == fid);
      if (unit) {
        this.selected = fid;
        this.scrollTo(`unit_${fid}`);
      }
      else {
        this.selected = null;
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
      let r = [];
      if (cell.enemy) {
        r.push("enemy-cell");
        if (cell.enemy.fid == this.selected) {
          r.push("selected");
        }
      }
      else if (cell.ally) {
        r.push("ally-cell");
      }
      else {
        const u = this.battleData.enemies.find(u => u.fid == this.selected);
        if (u) {
          let d = Math.abs(u.coord[0] - cell.coord[0]) + Math.abs(u.coord[1] - cell.coord[1]);
          if (d <= u.main.move) {
            r.push("in-move-range");
          }
          else if (d <= u.main.move + u.main.range) {
            r.push("in-attack-range");
          }
        }
      }
      return r;
    },

    scrollTo(id) {
      this.$nextTick(function () {
        let e = document.getElementById(id);
        if (e) {
          e.scrollIntoView();
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
      this.selectUnit(cell.enemy ? cell.enemy.fid : null);
      this.updateURL();
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

    BaseUnit: class {
      index;
      main;
      support;
      showEditor;
      editorData;

      constructor(i) {
        this.index = i;
        this.initialize();
      }
      initialize() {
        this.main = {
          cid: "",
          skills: [],
          items: [],
          status: [0, 0, 0, 0, 0, 0], // 基礎ステ
        };
        this.support = {
          cid: "",
          skills: [],
          items: [],
          status: [0, 0, 0, 0, 0, 0], // 基礎ステ
        };
        this.showEditor = false;
        this.editorData = [];

        const mergeChrData = window.$vue.mergeChrData;
        mergeChrData(this.main, null);
        mergeChrData(this.support, null);
      }
      serialize() {
        const serializeChr = function (src) {
          return {
            cid: src.cid,
            skills: src.skills.map(a => a.uid),
            items: src.items.map(a => a.uid),
            status: src.status,
          };
        };
        return {
          main: serializeChr(this.main),
          support: serializeChr(this.support),
          editorData: [...this.editorData],
        };
      }
      deserialize(r) {
        const uidToObject = window.$vue.uidToObject;
        const mergeChrData = window.$vue.mergeChrData;
        const deserializeChr = function (dst, src) {
          const chr = uidToObject(src.cid);
          mergeChrData(dst, chr);
          dst.cid = src.cid;
          dst.skills = src.skills.map(uidToObject);
          dst.items = src.items.map(uidToObject);
          dst.status = [...src.status];
        };
        deserializeChr(this.main, r.main);
        deserializeChr(this.support, r.support);
        this.editorData = [...r.editorData];
      }
      edit(ss) {
        const uidToObject = window.$vue.uidToObject;
        const copyArray = window.$vue.copyArray;
        const mergeChrData = window.$vue.mergeChrData;
        // エディタ側のオブジェクトとこちら側のオブジェクトは別個体なため、uid を元にこちら側のオブジェクトに差し替える。

        const mainChr = uidToObject(ss.main.character.value?.uid);
        mergeChrData(this.main, mainChr);
        this.main.cid = mainChr?.uid ?? "";
        this.main.skills = [];
        if (mainChr) {
          this.main.skills = [mainChr.talent, ...ss.mainSkills].filter(a => a).map(a => uidToObject(a.uid));
        }
        this.main.items = [...ss.mainEnchantPassive, ...ss.mainItems].filter(a => a).map(a => uidToObject(a.uid));
        this.main.status = ss.statMainResult.slice(0, 6);

        const supChr = uidToObject(ss.support.character.value?.uid);
        mergeChrData(this.support, supChr);
        this.support.cid = supChr?.uid ?? "";
        this.support.skills = [];
        if (supChr) {
          this.support.skills = [...supChr.skills].filter(a => a).map(a => uidToObject(a.uid));
        }
        this.support.items = ss.supportItems.filter(a => a).map(a => uidToObject(a.uid));
        this.support.status = ss.statSupportResult.slice(0, 6);

        copyArray(this.editorData, ss.serialize());
        //console.log(this);
      }
    },

    EffectHolder: class {
      effect = null;
      stack = 1;
      duration = Infinity;
      passDuration = true;
      enabled = true;

      constructor(effect) {
        this.effect = effect;
      }
      activate(bySelf) {
        if (this.effect.duration) {
          this.duration = this.effect.duration;
          if (bySelf) {
            this.passDuration = false;
          }
        }
      }
      evaluateBuff(battleCtx, baseStat) {
      }
      evaluateDebuff(battleCtx, baseStat) {
      }

      onTurnBegin() {
        this.passDuration = true;
      }
      onBattleBegin() {
      }
      onBattleEnd() {
      }
      onAttackBegin() {
      }
      onAttackEnd() {
      }
      onActionEnd() {
        if (this.passDuration && this.duration > 0) {
          if (--this.duration == 0) {
            this.enabled = false;
          }
        }
      }
      onTurnEnd() {
        this.passDuration = true;
      }

      _getValue(battleCtx, baseStat) {
        let r = 0;
        const effect = this.effect;
        if (effect.value) {
          r = effect.value;
          if (effect.maxStack) {
            // 効果が重複するタイプ
            // フルスペック時の効果を返す
            r *= this.stack;
          }
        }
        else if (effect.variable) {
          // HP 割合などに応じて効果が上下するタイプ
          // フルスペック時の効果を返す
          if (Array.isArray(effect.variable.max)) {
            r = effect.variable.max[effect.variable.max.length - 1];
          }
          else {
            r = effect.variable.max;
          }
        }
        else if (effect.add) {
          // "アタックの n% をマジックに加算" など
          // 正確な評価は困難だが 0 にはしたくないので、とりあえず 1/4 したのをスコアにしておく
          r = effect.add.rate * 0.25;
        }
        return r;
      }

      serialize() {
      }
      deserialize(r) {
      }
    },

    SkillHolder: class {
      skill = null;
      self = false;
      effects = []; // EffectHolder

      constructor(skill) {
        this.skill = skill;
        for (let effect of [...(this.skill.buff ?? []), ...(this.skill.debuff ?? [])]) {
          this.effects.push(new window.$vue.EffectHolder(effect));
        }
      }
      activate(bySelf) {
        this.self = bySelf;
        for (let e of this.effects) {
          e.activate(bySelf);
        }
      }

      onTurnBegin() {
        for (let e of this.effects) {
          e.onTurnBegin();
        }
      }
      onBattleBegin() {
        for (let e of this.effects) {
          e.onBattleBegin();
        }
      }
      onBattleEnd() {
        for (let e of this.effects) {
          e.onBattleEnd();
        }
      }
      onAttackBegin() {
        for (let e of this.effects) {
          e.onAttackBegin();
        }
      }
      onAttackEnd() {
        for (let e of this.effects) {
          e.onAttackEnd();
        }
      }
      onActionEnd() {
        for (let e of this.effects) {
          e.onActionEnd();
        }
      }
      onTurnEnd() {
        for (let e of this.effects) {
          e.onTurnEnd();
        }
      }

      serialize() {
      //  for (let e of this.effects) {
      //    e.serialize();
      //  }
      }
      deserialize(r) {
      //  for (let e of this.effects) {
      //    e.deserialize();
      //  }
      }
    },

    CustomEffect: class {
      effectType = "";
      value = 0;

      constructor() {
        this.effectType = null;
        this.value = 0;
      }
      serialize() {

      }
      deserialize(r) {

      }
    },

    BattleUnit: class {
      unit = null;
      affectedSkills = []; // SkillHolder
      activeSkills = [];
      customEffects = [];
      main = {
        bufP: [],
        bufF: [],
        status: [0, 0, 0, 0, 0, 0],
      };
      support = {
        bufP: [],
        bufF: [],
        status: [0, 0, 0, 0, 0, 0],
      };

      constructor(unit) {
        this.unit = unit;

        let vue = window.$vue;
        if (unit) {
          // パッシブ/タレントを収集
          const skills = [...(unit.main.skills ?? []), ...(unit.main.items ?? []), ...(unit.support?.skills ?? []),
            ...(unit.main ? vue.getClassPassiveMain(unit.main.class) : []),
            ...(unit.support ? vue.getClassPassiveSupport(unit.support.class) : []),
          ];
          for (let skill of skills) {
            if (skill.isTalent || skill.isPassive || skill.isItem) {
              this.applySkill(skill, true);
            }
            if (skill.isActive) {
              this.activeSkills.push(skill);
            }
          }
        }
      }

      applySkill(skill, self = false) {
        let s = this.affectedSkills.find(a => a.skill === skill);
        if (!s) {
          s = new window.$vue.SkillHolder(skill, self);
          this.affectedSkills.push(s);
        }
        s.activate(self);
      }
      applyCustomEffect(effectType, value) {
        this.customEffects.push(new window.$vue.CustomEffect(effectType, value));
      }

      evaluateEffects(battleCtx) {

      }
      onTurnBegin() {

      }
      beforeAttack() {

      }
      afterAttack() {

      }
      onActionEnd() {

      }
      onTurnEnd() {

      }

      clone() {
        let r = new window.$vue.BattleUnit();
        r.unit = this.unit;
        return r;
      }
      serialize() {

      }
      deserialize(r) {
      }
    },
    
    BattleContext: class {
      playerUnits = []; // BattleUnit
      enemyUnits = []; // BattleUnit
      turn = 1;
      isPlayerTurn = true;

      attacker = null;
      defender = null;
      results = []; // CombatResult

      constructor(playerUnits, enemyUnits) {
        const vue = window.$vue;
        this.playerUnits = playerUnits.map(a => new vue.BattleUnit(a));
        this.enemyUnits = enemyUnits.map(a => new vue.BattleUnit(a));
      }
      findUnit(u) {
        let r = this.playerUnits.find(a => a.unit === u);
        if (!r)
          r = this.enemyUnits.find(a => a.unit === u);
        return r;
      }
    },

    CombatResult: class {
      attacker = {
        unit: null,
        damageMain: 0,
        damageSupport: 0,
      };
      defender = {
        unit: null,
        damageMain: 0,
        damageSupport: 0,
      };

      constructor() {
      }
    },

    beginBattle() {
      this.battle = new this.BattleContext(this.playerUnits, this.enemyUnits);
    },
    endBattle() {
      this.battle = null;
    },
    onSelectUnit(unit, idx) {
      if (this.battle) {
        let u = this.battle.findUnit(unit);
        if (u) {
          if (idx == 0)
            this.battle.attacker = u;
          else
            this.battle.defender = u;
        }
      }
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
      for (let unit of this.units) {
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
        units: this.units.map(a => a.serialize()),
      };
      localStorage.setItem(`battle.slot${slot}`, JSON.stringify(data));
    },
    loadUnits(slot = 0) {
      let data = JSON.parse(localStorage.getItem(`battle.slot${slot}`));
      if (data) {
        this.slotName = data.name ?? "";
        for (let i = 0; i < this.units.length; ++i) {
          this.units[i].deserialize(data.units[i]);
        }
      }
      else {
        for (let unit of this.units) {
          unit.initialize();
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
  }
  .ally-cell {
    background: rgb(140, 160, 255);
  }
  .selected {
    border-color: rgb(255, 40, 40);
    background: rgb(255, 80, 80);
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
