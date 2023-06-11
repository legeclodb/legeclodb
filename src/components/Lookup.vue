<template>
  <div class="root" @mousemove="onMouseMove">
    <div class="header" :class="{ 'hidden': !showHeader }">
      <Navigation />
    </div>

    <div class="content" style="margin-top: 70px;" :style="style">
      <div class="about">

        <h2><a name="status" href="#status"></a></h2>
        <div class="panel" style="padding: 10px 0px 0px 0px;">
          <b-container>
            <b-row>
              <b-col style="text-align:center">
                <h5 style="margin-bottom: 5px">バフ組み合わせ検索</h5>
              </b-col>
            </b-row>
          </b-container>

          <div class="flex">
            <div>
              <b-container>
                <div style="text-align:center">
                  <h6 style="margin: 5px 0px">オプション</h6>
                </div>

                <b-form-row v-for="(param, name, index) in bs.options" :key="index">
                  <b-col style="text-align: right" align-self="end">
                    <label style="width: 12em" :for="`bs-param-${index}`">{{param.label}}</label>
                  </b-col>
                  <b-col>
                    <b-form-checkbox v-if="typeof(param.value) === 'boolean'" :id="`bs-param-${index}`" v-model="param.value" size="sm" plain></b-form-checkbox>
                    <b-form-input v-if="typeof(param.value) === 'number'" style="width: 3em" :id="`bs-param-${index}`" v-model.number="param.value" size="sm" type="number" class="input-param"></b-form-input>
                  </b-col>
                </b-form-row>
              </b-container>
            </div>
          </div>

          <div class="flex">
            <div>
              <b-container>
                <div style="text-align:center">
                  <h6 style="margin: 5px 0px">バフ</h6>
                </div>

                <b-form-row v-for="(param, index) in bs.buffs" :key="index">
                  <b-col style="text-align: right" align-self="end">
                    <label style="width: 12em" :for="`bs-buff-${index}-e`">{{param.type}}</label>
                  </b-col>
                  <b-col>
                    <b-form-checkbox :id="`bs-buff-${index}-e`" v-model="param.enabled" size="sm" plain></b-form-checkbox>
                  </b-col>
                  <b-col class="flex">
                    <label style="width: 3em" :for="`bs-buff-${index}-e`">重み</label>
                    <b-form-input style="width: 3em" :id="`bs-buff-${index}-w`" v-model.number="param.weight" size="sm" type="number" class="input-param"></b-form-input>
                  </b-col>
                  <b-col class="flex">
                    <label style="width: 3em" :for="`bs-buff-${index}-e`">上限</label>
                    <b-form-input style="width: 3em" :id="`bs-buff-${index}-w`" v-model.number="param.limit" size="sm" type="number" class="input-param"></b-form-input>
                  </b-col>
                </b-form-row>
              </b-container>
            </div>

            <div>
              <b-container>
                <div style="text-align:center">
                  <h6 style="margin: 5px 0px">デバフ</h6>
                </div>

                <b-form-row v-for="(param, index) in bs.debuffs" :key="index">
                  <b-col style="text-align: right" align-self="end">
                    <label style="width: 12em" :for="`bs-debuff-${index}-e`">{{param.type}}</label>
                  </b-col>
                  <b-col>
                    <b-form-checkbox style="width: 5em" :id="`bs-debuff-${index}-e`" v-model="param.enabled" size="sm" plain></b-form-checkbox>
                  </b-col>
                  <b-col>
                    <b-form-input style="width: 5em" :id="`bs-debuff-${index}-w`" v-model.number="param.weight" size="sm" type="number" class="input-param"></b-form-input>
                  </b-col>
                </b-form-row>
              </b-container>
            </div>
          </div>
          <div>
            <b-container>
              <div class="status flex" style="margin-bottom: 10px">
                <h5></h5>
              </div>
            </b-container>
          </div>

          <div style="padding: 0px 10px 10px 10px">
            <b-container>
              <div style="margin-bottom: 10px">
                <b-button id="stat-highscore" @click="doTest()" style="margin-left: 5px">テスト</b-button>
              </div>
            </b-container>
          </div>
        </div>
        <p class="desc">
        </p>

      </div>
    </div>

  </div>
</template>

<script>import Navigation from './Navigation.vue'
import jsonMainActive from '../assets/main_active.json'
import jsonMainPassive from '../assets/main_passive.json'
import jsonMainTalents from '../assets/main_talents.json'
import jsonMainChrs from '../assets/main_characters.json'
import jsonSupportActive from '../assets/support_active.json'
import jsonSupportPassive from '../assets/support_passive.json'
import jsonSupportChrs from '../assets/support_characters.json'
import jsonItems from '../assets/items.json'
import common from "./common";

export default {
  name: 'Lookup',
  components: {
    Navigation,
  },
  mixins: [common],

  data() {
    return {
      BuffSearch: class {
        constructor(vue, mainChrs, supChrs, equipments) {

          const makeParams = function (types) {
            const make = function (t) {
              return {
                type: t,
                enabled: false,
                weight: 1,
                limit: 0,
                includeOnBattle: false,
                value: 0,
              };
            }
            return types.map(a => make(a));
          };
          const makeOptions = function (params) {
            let r = {};
            const add = function (name, label, value) {
              r[name] = {
                label: label,
                value: value,
              };
            }
            for (const v of params)
              add(v[0], v[1], v[2]);
            return r;
          };

          this.vue = vue;
          this.options = makeOptions([
            ["maxPickup", "上位n人を抽出", 10],
            ["allowOnBattle", "戦闘時発動系を含める", true],
            ["allowProbability", "確率発動系を含める", true],
            ["allowSingleUnitBuff", "単体バフを含める", false],
            ["allowSymbolSkill", "シンボルスキルを含める", false]
          ]);

          this.buffs = makeParams([
            "HP", "アタック", "ディフェンス", "マジック", "レジスト", "クリティカル率", "クリティカルダメージ倍率",
            "与ダメージ", "与ダメージ(物理)", "与ダメージ(魔法)", "与ダメージ(スキル)", "与ダメージ(範囲スキル)", "与ダメージ(通常攻撃)",
            "ダメージ耐性", "ダメージ耐性(物理)", "ダメージ耐性(魔法)",
          ]);
          this.debuffs = makeParams([
            "アタック", "ディフェンス", "マジック", "レジスト", "被治療効果",
            "与ダメージ", "与ダメージ(物理)", "与ダメージ(魔法)",
            "ダメージ耐性", "ダメージ耐性(物理)", "ダメージ耐性(魔法)",
          ]);
          this.excluded = [];

          this.mainChrs = mainChrs;
          this.supChrs = supChrs;
          this.weapons = equipments.filter(a => a.slot == "武器");
          this.armors = equipments.filter(a => a.slot == "鎧");
          this.helmets = equipments.filter(a => a.slot == "兜");
          this.accessories = equipments.filter(a => a.slot == "アクセサリ");
        }

        matchClass(item, chr) {
          return item && (!item.classes || item.classes.includes(chr.class));
        }
        compare(a, b) {
          return a == b ? 0 : a < b ? 1 : -1;
        }

        doSearch(num) {
          let excluded = [...this.excluded];
          let usedActiveBuffGlobal = {};
          let usedActiveDebuffGlobal = {};
          let buffs = this.buffs.filter(a => a.enabled);
          let debuffs = this.debuffs.filter(a => a.enabled);
          const opt = this.options;
          const matchTags = this.vue.matchTags;

          const buffCondition = function (skill, buff) {
            let ok =
              (buff.target != "自身") &&
              (opt.allowSingleUnitBuff.value || buff.target != "単体") &&
              (opt.allowOnBattle.value || !buff.onBattle) &&
              (opt.allowProbability.value || !buff.probability);
            return ok;
          };
          const debuffCondition = function (skill, debuff) {
            let ok =
              (opt.allowOnBattle.value || !debuff.onBattle) &&
              (opt.allowProbability.value || !debuff.probability);
            return ok;
          };

          const getScore = function (chr) {
            if (excluded.includes(chr))
              return null;

            let usedActiveBuff = { ...usedActiveBuffGlobal };
            let usedActiveDebuff = { ...usedActiveDebuffGlobal };

            const countSkill = function (skill, updateUsedActive = false) {
              if (!opt.allowSymbolSkill.value && matchTags(skill.tags, /^シンボルスキル$/))
                return 0;

              let score = 0;
              if (skill.buff) {
                for (const buff of skill.buff) {
                  let p = buffs.find(a => a.type == buff.type);
                  if (p && buffCondition(skill, buff)) {
                    if (skill.skillType == "アクティブ") {
                      if (usedActiveBuff[buff.type])
                        continue;
                      else if (updateUsedActive)
                        usedActiveBuff[buff.type] = buff.value;
                    }
                    score += buff.value * p.weight;
                  }
                }
              }
              if (skill.debuff) {
                for (const debuff of skill.debuff) {
                  let p = debuffs.find(a => a.type == debuff.type);
                  if (p && debuffCondition(skill, debuff)) {
                    if (skill.skillType == "アクティブ") {
                      if (usedActiveDebuff[debuff.type])
                        continue;
                      else if (updateUsedActive)
                        usedActiveDebuff[debuff.type] = debuff.value;
                    }
                    score += debuff.value * p.weight;
                  }
                }
              }
              return score;
            };

            const pickEquip = function (equipments) {
              equipments = equipments.filter(a => !excluded.includes(a) && this.matchClass(a, chr));
              equipments = equipments.map(a => [countSkill(a), a]);
              equipments.sort((a, b) => this.compare(a[0], b[0]));
              if (equipments.length > 0 && equipments[0][0] > 0)
                return equipments[0];
              return null;
            }.bind(this);

            let talent = [countSkill(chr.talent), chr.talent];
            let passive = [];
            for (const skill of chr.skills.filter(a => a.skillType != "アクティブ")) {
              if (excluded.includes(skill))
                continue;

              const score = countSkill(skill);
              if (score > 0)
                passive.push([score, skill]);
            }

            let active = [];
            for (const skill of chr.skills.filter(a => a.skillType == "アクティブ")) {
              const score = countSkill(skill);
              if (score > 0)
                active.push([score, skill]);
            }
            active = active.sort((a, b) => this.compare(a[0], b[0]));
            for (let a of active)
              a[0] = countSkill(a[1], true);
            active = active.filter(a => a[0] > 0);

            let skills = [...passive, ...active].sort((a, b) => this.compare(a[0], b[0])).slice(0, 3);

            let equipments = [pickEquip(this.weapons), pickEquip(this.armors), pickEquip(this.helmets), pickEquip(this.accessories)].filter(a => a);
            let totalScore = 0;
            for (let s of [talent, ...skills, ...equipments]) {
              if (s)
                totalScore += s[0];
            }
            return [
              totalScore,
              chr,
              talent[1],
              skills.map(a => a[1]),
              equipments.map(a => a != null ? a[1] : null)
            ];
          }.bind(this);

          const countActive = function (skill) {
            if (skill.buff) {
              for (const v of skill.buff) {
                let p = buffs.find(a => a.type == v.type);
                if (p) {
                  if (skill.skillType == "アクティブ") {
                    if (usedActiveBuffGlobal[v.type])
                      continue;
                    else
                      usedActiveBuffGlobal[v.type] = v.value;
                  }
                }
              }
            }
            if (skill.debuff) {
              for (const v of skill.debuff) {
                let p = debuffs.find(a => a.type == v.type);
                if (p) {
                  if (skill.skillType == "アクティブ") {
                    if (usedActiveDebuffGlobal[v.type])
                      continue;
                    else
                      usedActiveDebuffGlobal[v.type] = v.value;
                  }
                }
              }
            }
          }.bind(this);


          let result = [];
          for (let i = 0; i < num; ++i) {
            let candidates = this.mainChrs.map(a => getScore(a)).filter(a => a != null);
            if (candidates.length == 0)
              break;

            candidates.sort((a, b) => this.compare(a[0], b[0]));
            const chosen = candidates[0];
            if (chosen[0] == 0)
              break;

            const r = {
              score: chosen[0],
              character: chosen[1],
              talent: chosen[2],
              skills: chosen[3],
              equipments: chosen[4]
            };
            result.push(r);

            for (const s of [r.character, r.talent, ...r.skills, ...r.equipments]) {
              if (s)
                excluded.push(s);
            }
            for (const s of r.skills) {
              if (s.skillType == "アクティブ")
                countActive(s);
            }
          }
          return result;
        }
      }

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
    this.items = structuredClone(jsonItems).filter(a => !a.hidden || a.slot == "アミュレット");

    for (let i = 0; i < this.mainChrs.length; ++i) {
      let chr = this.mainChrs[i];
      chr.index = i + 1;
    }
    for (let i = 0; i < this.supChrs.length; ++i) {
      let chr = this.supChrs[i];
      chr.index = i + 1;
    }
    for (let i = 0; i < this.items.length; ++i) {
      let item = this.items[i];
      item.index = i + 1;
      item.status = this.getItemStatus(item);
    }

    this.setupCharacters(this.mainChrs, this.mainActive, this.mainPassive, this.mainTalents);
    this.setupCharacters(this.supChrs, this.supActive, this.supPassive);

    this.searchTable = new Map();
    for (let s of [...this.mainActive, ...this.mainPassive, ...this.mainTalents, ...this.supActive, ...this.supPassive, ...this.items])
      this.searchTable.set(s.name, s);

    this.mainChrs.sort((a, b) => b.date.localeCompare(a.date));
    this.supChrs.sort((a, b) => b.date.localeCompare(a.date));
    this.items.sort((a, b) => b.date.localeCompare(a.date));

    this.weapons = this.items.filter(a => a.slot == "武器");
    this.armors = this.items.filter(a => a.slot == "鎧");
    this.helmets = this.items.filter(a => a.slot == "兜");
    this.accessories = this.items.filter(a => a.slot == "アクセサリ");

    this.bs = new this.BuffSearch(this, this.mainChrs, this.supChrs, this.items);
  },

  mounted() {
  },

  methods: {
    findItem(name) {
      const r = this.searchTable.get(name);
      if (!r)
        console.log(`${name} not found`);
      return r;
    },

    getParamClass(param) {
      return param.disabled() ? "disabled" : "";
    },

    doTest() {
      let r = this.bs.doSearch(this.bs.options.maxPickup.value);
      console.log(r);
    },
  },

  computed: {
  }

}</script>

<style scoped>
  div.about {
    padding: 20px;
    margin: 5px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 0.3rem;
    background: rgb(245, 245, 245);
    box-shadow: 0 3px 6px rgba(140,149,159,0.5);
  }

  .about h2 {
    font-size: 1.75em;
  }

  .about p {
    margin-bottom: 30px;
  }

  .about ul {
    list-style-type: disc;
    margin: 0;
  }

  .about li {
    display: list-item;
    margin: 0 15px;
  }

  .note {
    font-size: 80%;
    color: rgb(150, 150, 150);
  }

  label.disabled {
    color: rgb(180, 180, 180);
  }

  .panel {
    padding: 10px;
    margin-top: 10px;
    margin-bottom: 10px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 0.3rem;
    display: inline-block;
    background: white;
  }

    .panel h6 {
      margin-bottom: 5px;
    }
</style>
<style>
  .desc .table {
    width: auto;
    margin: 3px;
  }

  .input-dropdown button {
    padding: 0.1em;
  }
</style>
