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
              <b-dropdown :text="battleData ? battleData.uid : ''" size="sm" id="battle_selector">
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
                      <div class="talent">
                        <div class="flex">
                          <div class="icon" :id="'enemy_'+ene.fid+'_talent'">
                            <b-img-lazy :src="getImageURL(ene.main.talent.icon)" with="50" height="50" />
                            <b-popover v-if="displayType==1" :target="'enemy_'+ene.fid+'_talent'" triggers="hover focus" :delay="{show:0, hide:250}" no-fade :title="ene.main.talent.name" placement="top">
                              <div class="flex">
                                <div v-html="descToHtml(ene.main.talent)"></div>
                              </div>
                            </b-popover>
                          </div>
                          <div class="desc" v-show="displayType >= 2">
                            <h5>
                              {{ ene.main.talent.name }}
                            </h5>
                            <p><span v-html="descToHtml(ene.main.talent)"></span><span v-if="ene.main.talent.note" class="note" v-html="noteToHtml(ene.main.talent)"></span></p>
                          </div>
                        </div>
                      </div>
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

    <div class="content" style="margin-top: 20px" :style="style">
      <div>
        <div v-for="(unit, ui) in units" class="unit-panel" style="padding: 10px; margin: 5px;" :key="ui">
          <b-button :id="`btn-edit-unit${ui}`" @click="unit.showEditor=!unit.showEditor">ユニット{{ui+1}}</b-button>
          <b-popover :target="`btn-edit-unit${ui}`" custom-class="status-simulator-popover" :show.sync="unit.showEditor" :delay="{show:0, hide:250}" no-fade>
            <StatusSimulator embed :data="unit.editorData" @change="onEditUnit($event, unit)" />
            <div class="flex">
              <b-button size="sm" @click="unit.showEditor=false">閉じる</b-button>
            </div>
          </b-popover>

          <div v-if="unit.mainChr" class="character">
            <div class="flex">
              <div class="portrait">
                <b-img-lazy :src="getImageURL(unit.mainChr.icon)" :title="unit.mainChr.name" width="100" height="100" rounded />
              </div>
              <div class="detail" v-show="displayType >= 1">
                <div class="info">
                  <h5 v-html="chrNameToHtml(unit.mainChr.name)"></h5>
                  <div class="status">
                    <b-img-lazy :src="getImageURL(unit.mainChr.class)" :title="'クラス:'+unit.mainChr.class" height="25" />
                    <div class="param-box"><b-img-lazy :src="getImageURL(unit.mainChr.damageType)" :title="'攻撃タイプ:'+unit.mainChr.damageType" width="20" height="20" /></div>
                    <div class="param-box"><b-img-lazy :src="getImageURL('射程')" title="射程" width="18" height="18" /><span>{{unit.mainChr.range}}</span></div>
                    <div class="param-box"><b-img-lazy :src="getImageURL('移動')" title="移動" width="18" height="18" /><span>{{unit.mainChr.move}}</span></div>
                  </div>
                  <div v-if="unit.mainStat" class="status2" v-html="statusToHtml(unit.mainStat)" />
                </div>
                <div class="skills">
                  <div class="skill" v-for="(skill, si) in unit.mainSkills" :class="getSkillClass(skill)" :key="`skill${si}`">
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
                  <div class="skill" v-for="(skill, si) in unit.mainItems" :class="getSkillClass(skill)" :key="`item${si}`">
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

            <div v-if="unit.supChr" class="flex">
              <div class="portrait">
                <b-img-lazy :src="getImageURL(unit.supChr.icon)" :title="unit.supChr.name" width="100" height="100" rounded />
              </div>
              <div class="detail" v-show="displayType >= 1">
                <div class="info">
                  <h5 v-html="chrNameToHtml(unit.supChr.name)"></h5>
                  <div class="status">
                    <b-img-lazy :src="getImageURL(unit.supChr.class)" :title="'クラス:'+unit.supChr.class" height="25" />
                    <div class="param-box"><b-img-lazy :src="getImageURL(unit.supChr.damageType)" :title="'攻撃タイプ:'+unit.supChr.damageType" width="20" height="20" /></div>
                    <div class="param-box"><b-img-lazy :src="getImageURL('射程')" title="射程" width="18" height="18" /><span>{{unit.supChr.range}}</span></div>
                  </div>
                  <div v-if="unit.supStat" class="status2" v-html="statusToHtml(unit.supStat)" />
                </div>

                <div class="skills">
                  <div class="skill" v-for="(skill, si) in unit.supSkills" :class="getSkillClass(skill)" :key="`skill${si}`">
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
                  <div class="skill" v-for="(skill, si) in unit.supItems" :class="getSkillClass(skill)" :key="`item${si}`">
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
    </div>

    <div class="content">
      <div class="unit-panel">
        <b-button size="sm" @click="saveUnits()">編成をセーブ</b-button>
      </div>
      <div class="unit-panel">
        <b-button size="sm" @click="loadUnits()">編成をロード</b-button>
      </div>
      <div class="unit-panel">
        <b-button size="sm" @click="clearUnits()">編成をクリア</b-button>
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

export default {
  name: 'Battle',
  components: {
    Navigation,
    StatusSimulator,
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

      units: [
        new this.BattleUnit(),
        new this.BattleUnit(),
        new this.BattleUnit(),
        new this.BattleUnit(),
        new this.BattleUnit(),
      ],
    };
  },

  created() {
    document.title = "れじぇくろDB: 戦闘データ";

    this.setupDB();

    this.enemyMainChrs = structuredClone(jsonEnemyMainChrs).filter(a => !a.hidden);
    this.enemySupChrs = structuredClone(jsonEnemySupportChrs).filter(a => !a.hidden);
    this.setupCharacters(this.enemyMainChrs, this.mainActive, this.mainPassive, this.mainTalents);
    this.setupCharacters(this.enemySupChrs, this.supActive, this.supPassive);

    const mergeChrData = function (dst, src) {
      dst.name = src.name;
      dst.class = src.class;
      dst.damageType = src.damageType;
      dst.range = src.range;
      dst.move = src.move;
      dst.icon = src.icon;
    };

    this.battleList = structuredClone(jsonBattle);
    for (let battle of this.battleList) {
      for (let enemy of battle.enemies) {
        enemy.cellID = `c${this.zeroPad(enemy.coord[0])}${this.zeroPad(enemy.coord[1])}`;
        {
          const chr = this.enemyMainChrs.find(c => c.uid == enemy.main.cid);
          mergeChrData(enemy.main, chr);
          enemy.main.status = this.getNPCChrStatus(chr, enemy.main.level, enemy.main.statusRate);
          enemy.main.talent = this.searchTableWithUid.get(enemy.main.talent);
          enemy.main.skills = enemy.main.skills.map(id => this.searchTableWithUid.get(id));
        }
        if (enemy.support) {
          const chr = this.enemySupChrs.find(c => c.uid == enemy.support.cid);
          mergeChrData(enemy.support, chr);
          enemy.support.status = this.getNPCChrStatus(chr, enemy.support.level, enemy.support.statusRate);
        }
      }
    }

    for (let unit of this.units) {
      unit.vue = this;
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

    BattleContext: class {
      constructor() {
        this.turn = 0;
        this.isPlayerTurn = true;
        this.moveAmount = 0;
        this.range = 1;
        this.terrain = null;
      }
    },
    BattleEffect: class {
      constructor(effect) {
        this.effect = effect;
        this.stack = 0;
        this.duration = 0;
        this.enabled = true;
      }
      evaluate(battleCtx, baseStat) {
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
      passTurn() {

      }
    },
    BattleUnit: class {
      constructor() {
        this.vue = null;
        this.initialize();
      }
      initialize() {
        this.mainChr = null;
        this.mainSkills = [];
        this.mainItems = [];
        this.supChr = null;
        this.supSkills = [];
        this.supItems = [];

        this.mainHiddenSkills = [];
        this.supHiddenSkills = [];
        this.mainStat = [0, 0, 0, 0, 0, 0]; // 基礎ステ
        this.supStat = [0, 0, 0, 0, 0, 0];

        this.appliedSkills = [];
        this.mainEffects = {}; // 
        this.supEffects = {}; // evaluateEffects() で設定

        this.showEditor = false;
        this.editorData = [];
      }
      setup() {
        // mainHiddenSkills や supHiddenSkills などを設定
      }
      applySkill(skill, self=false) {

      }
      evaluateEffects(battleCtx) {

      }
      actionEnd() {

      }
      passTurn() {

      }

      serialize() {
        let r = {};
        r.mainChr = this.mainChr?.uid;
        r.mainSkills = this.mainSkills.map(a => a.uid);
        r.mainItems = this.mainItems.map(a => a.uid);
        r.mainStat = [...this.mainStat];

        r.supChr = this.supChr?.uid;
        r.supSkills = this.supSkills.map(a => a.uid);
        r.supItems = this.supItems.map(a => a.uid);
        r.supStat = [...this.supStat];

        r.editorData = [...this.editorData];
        return r;
      }
      deserialize(r) {
        const uidToObject = this.vue.uidToObject;
        this.mainChr = uidToObject(r.mainChr);
        this.mainSkills = r.mainSkills.map(uidToObject);
        this.mainItems = r.mainItems.map(uidToObject);
        this.mainStat = [...r.mainStat];

        this.supChr = uidToObject(r.supChr);
        this.supSkills = r.supSkills.map(uidToObject);
        this.supItems = r.supItems.map(uidToObject);
        this.supStat = [...r.supStat];

        this.editorData = [...r.editorData];
      }
    },

    onEditUnit(ss, unit) {
      unit.mainChr = this.uidToObject(ss.main.character.value?.uid);
      unit.mainItems = ss.mainItems.toArray().map(a => this.uidToObject(a.uid));
      unit.mainSkills = [];
      if (unit.mainChr) {
        unit.mainSkills = [unit.mainChr.talent, ...ss.mainSkills].map(a => this.uidToObject(a.uid));
      }
      unit.mainStat = ss.statMainResult.slice(0, 6);

      unit.supChr = this.uidToObject(ss.support.character.value?.uid);
      unit.supSkills = [];
      if (unit.supChr) {
        unit.supSkills = [...unit.supChr.skills].map(a => this.uidToObject(a.uid));
      }
      unit.supItems = ss.supportItems.toArray().map(a => this.uidToObject(a.uid));
      unit.supStat = ss.statSupportResult.slice(0, 6);

      this.copyArray(unit.editorData, ss.serialize());
      //console.log(unit);
    },

    uidToObject(uid) {
      return this.searchTableWithUid.get(uid);
    },

    // in-place array copy
    copyArray(dst, src) {
      dst.length = src.length;
      for (let i = 0; i < dst.length; ++i)
        dst[i] = src[i];
    },

    clearUnits() {
      for (let unit of this.units) {
        unit.initialize();
      }
    },
    saveUnits(slot = 0) {
      let data = {
        units: this.units.map(a => a.serialize())
      };
      localStorage.setItem(`battle.slot${slot}`, JSON.stringify(data));
    },
    loadUnits(slot = 0) {
      let data = JSON.parse(localStorage.getItem(`battle.slot${slot}`));
      if (data && data.units) {
        for (let i = 0; i < this.units.length; ++i) {
          this.units[i].deserialize(data.units[i]);
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
  .status-simulator-popover {
    max-width: 880px !important;
    width: 880px !important;
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

</style>
