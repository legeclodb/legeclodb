<template>
  <div class="root" @mousemove="onMouseMove">
    <div class="header" :class="{ 'hidden': !showHeader }">
      <Navigation />
    </div>
    <div class="about" style="margin-top: 55px;">

      <div class="menu-content" style="flex-wrap: nowrap">
        <div class="menu-panel" id="cb-settings">
        </div>
      </div>
    </div>

    <div class="content">
      <div class="main-panel">
        <b-tabs nav-class="tab-index" v-model="searchTabIndex">
          <b-tab v-for="(v, k) in phaseNames" :title="v" @click="selectPhase(k)" :key="k"></b-tab>
        </b-tabs>

        <div style="margin-top: 10px; padding: 10px; display: flex">
          <div class="grid-container">
            <div v-for="(cell, i) in cells" :key="i" :class="`grid-cell ${cell.enemy ? 'enemy-cell' : ''} ${cell.ally ? 'ally-cell' : ''}`" :id="cell.id">
              <b-img-lazy v-if="cell.enemy" :src="getImageURL(cell.enemy.main.class)" @click="selectEnemy(cell.enemy)" width="30" height="30" class="center" />
            </div>
          </div>

          <div class="enemy-list">

            <template v-for="ene in enemies">
              <div class="character" :id="'chr_'+ene.fid" :key="ene.fid">
                <div class="flex">
                  <div class="portrait">
                    <b-img-lazy :src="getImageURL(ene.main.icon)" :title="ene.main.name" width="100" height="100" rounded />
                  </div>
                  <div class="detail" v-show="displayType >= 1">
                    <div class="info">
                      <h5 v-html="chrNameToHtml(ene.main.name)"></h5>
                      <div class="status">
                        <b-img-lazy :src="getImageURL(ene.main.class)" :title="'クラス:'+ene.main.class" height="25" />
                        <div class="param-box"><b-img-lazy :src="getImageURL(ene.main.damageType)" :title="'攻撃タイプ:'+ene.main.damageType" width="20" height="20" /></div>
                        <div class="param-box"><b-img-lazy :src="getImageURL('射程')" title="射程" width="18" height="18" /><span>{{ene.main.range}}</span></div>
                        <div class="param-box"><b-img-lazy :src="getImageURL('移動')" title="移動" width="18" height="18" /><span>{{ene.main.move}}</span></div>
                      </div>
                      <div v-if="ene.main.status" class="status2" v-html="statusToHtml(ene.main.status)" />
                    </div>
                    <div class="skills">
                      <div class="talent">
                        <div class="flex">
                          <div class="icon" :id="'chr_'+ene.fid+'_talent'">
                            <b-img-lazy :src="getImageURL(ene.main.talent.icon)" with="50" height="50" />
                            <b-popover v-if="displayType==1" :target="'chr_'+ene.fid+'_talent'" triggers="hover focus" :title="ene.main.talent.name" placement="top">
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
                          <div class="icon" :id="'chr_'+ene.fid+'_skill'+si">
                            <b-link><b-img-lazy :src="getImageURL(skill.icon)" with="50" height="50" /></b-link>
                            <b-popover v-if="displayType>=1" :target="'chr_'+ene.fid+'_skill'+si" triggers="hover focus" :delay="{show:0, hide:250}" no-fade :title="skill.name" placement="top">
                              <div class="flex" v-if="displayType==1">
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

              </div>
            </template>

          </div>

        </div>
      </div>

    </div>

  </div>
</template>

<script>import Navigation from './Navigation.vue'
import jsonMainActive from '../assets/main_active.json'
import jsonMainPassive from '../assets/main_passive.json'
import jsonMainTalents from '../assets/main_talents.json'
import jsonMainChrs from '../assets/enemy_main_characters.json'
import jsonSupportActive from '../assets/support_active.json'
import jsonSupportPassive from '../assets/support_passive.json'
import jsonSupportChrs from '../assets/enemy_support_characters.json'
import jsonConstants from '../assets/constants.json'
import jsonBattle from '../assets/battle.json'
import common from "./common";

export default {
  name: 'Battle',
  components: {
    Navigation,
  },
  mixins: [common],

  data() {
    return {
      classes: jsonConstants.classes,
      symbols: jsonConstants.symbols,
      damageTypes: jsonConstants.damageTypes,
      rarities: jsonConstants.rarities,

      phaseNames: {
        "0": "開始時",
        "1E": "1T敵フェイズ",
        "2E": "2T敵フェイズ",
        "3E": "3T敵フェイズ",
        "4E": "4T敵フェイズ",
      },

      battleId: null,
      battleData: null,
      cells: [],
      phase: "0",

      enemies: [],
      allies: [],
    };
  },

  created() {
    this.mainActive = structuredClone(jsonMainActive);
    this.mainPassive = structuredClone(jsonMainPassive);
    this.mainTalents = structuredClone(jsonMainTalents);
    this.mainChrs = structuredClone(jsonMainChrs).filter(a => !a.hidden);

    this.supActive = structuredClone(jsonSupportActive);
    this.supPassive = structuredClone(jsonSupportPassive);
    this.supChrs = structuredClone(jsonSupportChrs).filter(a => !a.hidden);

    this.setupCharacters(this.mainChrs, this.mainActive, this.mainPassive, this.mainTalents);
    this.setupCharacters(this.supChrs, this.supActive, this.supPassive);

    let skillTable = new Map();
    for (let s of [...this.mainActive, ...this.mainPassive, ...this.mainTalents]) {
      skillTable.set(s.uid, s);
    }

    const mergeChrData = function (dst, src) {
      dst.name = src.name;
      dst.class = src.class;
      dst.damageType = src.damageType;
      dst.range = src.range;
    };

    this.battleList = structuredClone(jsonBattle);
    for (let battle of this.battleList) {
      for (let enemy of battle.enemies) {
        {
          const chr = this.mainChrs.find(c => c.uid == enemy.main.cid);
          mergeChrData(enemy.main, chr);
          enemy.main.status = this.getNPCChrStatus(chr, enemy.main.level, enemy.main.statusRate);
          enemy.main.talent = skillTable.get(enemy.main.talent);
          enemy.main.skills = enemy.main.skills.map(id => skillTable.get(id));
          enemy.main.icon = chr.icon;
        }
        if (enemy.support) {
          const chr = this.supChrs.find(c => c.uid == enemy.support.cid);
          mergeChrData(enemy.support, chr);
          enemy.support.status = this.getNPCChrStatus(chr, enemy.support.level, enemy.support.statusRate);
          enemy.support.icon = chr.icon;
        }
      }
    }

    this.displayType = 2;
  },

  mounted() {
    const zeroPad = (num, pad = 2) => String(num).padStart(pad, '0');

    const div_x = 15;
    const div_y = 15;
    let cells = new Array(div_x * div_y);
    for (let y = 0; y < div_y; ++y) {
      for (let x = 0; x < div_x; ++x) {
        let i = y * div_x + x;
        cells[i] = {
          id: `c${zeroPad(x)}${zeroPad(y)}`,
          x: x,
          y: y,
          enemy: null,
          ally: null,
        };
      }
    }
    this.cells = cells;
    this.selectBattle(this.battleList.slice(-1)[0].uid);
  },

  destroyed() {
  },

  methods: {
    selectBattle(bid) {
      const battle = this.battleList.find(a => a.uid == bid);
      if (battle) {
        this.battleId = bid;
        this.battleData = battle;
        this.selectPhase("0");
      }
    },

    selectPhase(phase) {
      this.phase = phase;
      this.enemies = this.battleData.enemies.filter(e => e.phase == phase || e.fid == "E01");
      this.allies = this.battleData.allies.filter(e => e.phase == phase);

      for (let cell of this.cells) {
        cell.enemy = null;
        cell.ally = null;

        for (let enemy of this.enemies) {
          if (enemy.coord[0] == cell.x && enemy.coord[1] == cell.y) {
            cell.enemy = enemy;
          }
        }
        for (let ally of this.allies) {
          if (ally.coord[0] == cell.x && ally.coord[1] == cell.y) {
            cell.ally = ally;
          }
        }
      }
    },

    getSkillClass(skill) {
      return {
        active: skill.skillType == 'アクティブ',
        passive: skill.skillType == 'パッシブ',
      }
    },
  },

  computed: {
  },

  updated: function () {
  },

}
</script>

<style scoped>
  .main-panel {
    padding-top: 10px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 0.3rem;
    display: inline-block;
    background: white;
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

  .enemy-list {
  }
  .enemy-panel {
  }

  .center {
    margin: auto;
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
