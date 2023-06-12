<template>
  <div class="root" @mousemove="onMouseMove">
    <div class="header" :class="{ 'hidden': !showHeader }">
      <Navigation />
    </div>

    <div class="content" style="margin-top: 70px;" :style="style">
      <div class="about">


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
                  <label style="width: 15em" :for="`bs-param-${index}`">{{param.label}}</label>
                </b-col>
                <b-col>
                  <b-form-checkbox v-if="typeof(param.value) === 'boolean'" :id="`bs-param-${index}`" v-model="param.value" size="sm" plain></b-form-checkbox>
                  <b-form-input v-if="typeof(param.value) === 'number'" style="width: 3em" :id="`bs-param-${index}`" v-model.number="param.value" size="sm" type="number" class="input-param"></b-form-input>
                </b-col>
              </b-form-row>
            </b-container>
          </div>

          <div>
            <div style="text-align:center">
              <h6 style="margin: 5px 0px">フィルタ</h6>
            </div>
            <div class="menu-widgets flex">
              <div class="widget">
                <b-button-group size="sm" id="class_selector">
                  <b-button v-for="(c, i) in classFilter" :key="i" :pressed.sync="c.state" variant="outline-secondary">
                    <b-img-lazy :src="getImageURL(classes[i])" width="25" height="25" />
                  </b-button>
                </b-button-group>
              </div>
            </div>
            <div class="menu-widgets flex">
              <div class="widget">
                <b-button-group size="sm" id="symbol_selector">
                  <b-button v-for="(c, i) in symbolFilter" :key="i" :pressed.sync="c.state" variant="outline-secondary">
                    <b-img-lazy :src="getImageURL('シンボル:'+symbols[i])" height="25" />
                  </b-button>
                </b-button-group>
              </div>
              <div class="widget">
                <b-button-group size="sm" id="rareiry_selector">
                  <b-button v-for="(c, i) in rarityFilter" :key="i" :pressed.sync="c.state" variant="outline-secondary">
                    <b-img-lazy :src="getImageURL(rarities[i])" width="36" height="20" />
                  </b-button>
                </b-button-group>
              </div>
              <div class="widget">
                <b-button-group size="sm" id="attack_type_selector">
                  <b-button v-for="(c, i) in damageTypeFilter" :key="i" :pressed.sync="c.state" variant="outline-secondary">
                    <b-img-lazy :src="getImageURL(damageTypes[i])" width="25" height="25" />
                  </b-button>
                </b-button-group>
              </div>
            </div>
          </div>
        </div>

        <div class="flex">
          <div>
            <b-container>
              <div style="text-align:center">
                <h6 style="margin: 5px 0px">バフ</h6>
              </div>
              <b-table small borderless hover :items="bs.buffs" :fields="buffFields">
                <template #cell(type)="r">
                  <div class="flex">
                    <b-form-checkbox v-model="r.item.enabled" size="sm" plain></b-form-checkbox>
                    <div style="margin: auto 0; vertical-align: baseline;">
                      {{r.item.type}}
                    </div>
                  </div>
                </template>
                <template #cell(weight)="r">
                  <b-form-input style="width: 4em" v-model.number="r.item.weight" size="sm" type="number" class="input-param"></b-form-input>
                </template>
                <template #cell(limit)="r">
                  <div v-if="r.item.limit != undefined">
                    <b-form-input style="width: 4em" v-model.number="r.item.limit" size="sm" type="number" class="input-param"></b-form-input>
                  </div>
                </template>
              </b-table>
            </b-container>
          </div>

          <div>
            <b-container>
              <div style="text-align:center">
                <h6 style="margin: 5px 0px">デバフ</h6>
              </div>

              <b-table small borderless hover :items="bs.debuffs" :fields="buffFields">
                <template #cell(type)="r">
                  <div class="flex">
                    <b-form-checkbox v-model="r.item.enabled" size="sm" plain></b-form-checkbox>
                    <div style="margin: auto 0; vertical-align: baseline;">
                      {{r.item.type}}
                    </div>
                  </div>
                </template>
                <template #cell(weight)="r">
                  <b-form-input style="width: 4em" v-model.number="r.item.weight" size="sm" type="number" class="input-param"></b-form-input>
                </template>
                <template #cell(limit)="r">
                  <div v-if="r.item.limit != undefined">
                    <b-form-input style="width: 4em" v-model.number="r.item.limit" size="sm" type="number" class="input-param"></b-form-input>
                  </div>
                </template>
              </b-table>
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
import jsonConstants from '../assets/constants.json'
import common from "./common";

export default {
  name: 'Lookup',
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

      classFilter: [],
      symbolFilter: [],
      rarityFilter: [],
      damageTypeFilter: [],

      buffFields: [
        {
          key: "type",
          label: "種類",
        },
        {
          key: "limit",
          label: "上限",
        },
        {
          key: "weight",
          label: "優先度",
        },
      ],


      BuffSearch: class {
        constructor(vue, mainChrs, supChrs, equipments) {

          const makeParams = function (types) {
            const make = function (t) {
              return {
                type: t,
                enabled: false,
                limit: 0,
                weight: 1,
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
            ["allowSymbolSkill", "シンボルスキルを含める", false],
            ["allowSupportActive", "サポートのアクティブを含める", false],
          ]);

          this.buffs = makeParams([
            "アタック", "ディフェンス", "マジック", "レジスト", "クリティカル率", "クリティカルダメージ倍率",
            "与ダメージ", "与ダメージ(物理)", "与ダメージ(魔法)", "与ダメージ(スキル)", "与ダメージ(範囲スキル)", "与ダメージ(通常攻撃)",
            "ダメージ耐性", "ダメージ耐性(物理)", "ダメージ耐性(魔法)",
          ]);
          this.debuffs = makeParams([
            "アタック", "ディフェンス", "マジック", "レジスト",
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

        getValues(opt) {
          let r = {};
          for (const k in opt)
            r[k] = opt[k].value;
          return r;
        }

        doSearch(num) {
          let excluded = [...this.excluded];
          let buffs = this.buffs.filter(a => a.enabled);
          let debuffs = this.debuffs.filter(a => a.enabled);
          const opt = this.getValues(this.options);
          const matchTags = this.vue.matchTags;
          const filterMatchMainChr = this.vue.filterMatchMainChr;

          let usedActiveBuffGlobal = {};
          let usedActiveDebuffGlobal = {};
          let totalBuffAmountGlobal = {};
          let totalDebuffAmountGlobal = {};

          for (let v of buffs)
            totalBuffAmountGlobal[v.type] = 0;
          for (let v of debuffs)
            totalDebuffAmountGlobal[v.type] = 0;

          const buffCondition = function (skill, buff) {
            let ok =
              (buff.target != "自身") &&
              (opt.allowSingleUnitBuff || buff.target != "単体") &&
              (opt.allowOnBattle || !buff.onBattle) &&
              (opt.allowProbability || !buff.probability);
            return ok;
          };
          const debuffCondition = function (skill, debuff) {
            let ok =
              (opt.allowOnBattle || !debuff.onBattle) &&
              (opt.allowProbability || !debuff.probability);
            return ok;
          };

          const getScore = function (chr) {
            if (excluded.includes(chr))
              return null;

            let usedActiveBuff = { ...usedActiveBuffGlobal };
            let usedActiveDebuff = { ...usedActiveDebuffGlobal };
            let totalBuffAmount = { ...totalBuffAmountGlobal };
            let totalDebuffAmount = { ...totalDebuffAmountGlobal };

            const limitAmount = function (table, param, amount) {
              if (param.limit > 0)
                amount = Math.min(amount, Math.max(param.limit - table[param.type], 0));
              return amount;
            };

            const countSkill = function (skill, updateUsedActive = false, updateTotalAmount = false) {
              if (!opt.allowSymbolSkill && matchTags(skill.tags, /^シンボルスキル$/))
                return 0;

              let score = 0;
              if (skill.buff) {
                for (const buff of skill.buff) {
                  let p = buffs.find(a => a.type == buff.type);
                  if (p && buffCondition(skill, buff)) {
                    if (updateTotalAmount) {
                      totalBuffAmount[buff.type] += buff.value;
                    }
                    if (skill.skillType == "アクティブ") {
                      if (usedActiveBuff[buff.type])
                        continue;
                      else if (updateUsedActive)
                        usedActiveBuff[buff.type] = buff.value;
                    }
                    score += limitAmount(totalBuffAmount, p, buff.value) * p.weight;
                  }
                }
              }
              if (skill.debuff) {
                for (const debuff of skill.debuff) {
                  let p = debuffs.find(a => a.type == debuff.type);
                  if (p && debuffCondition(skill, debuff)) {
                    if (updateTotalAmount) {
                      totalDebuffAmount[debuff.type] += debuff.value;
                    }
                    if (skill.skillType == "アクティブ") {
                      if (usedActiveDebuff[debuff.type])
                        continue;
                      else if (updateUsedActive)
                        usedActiveDebuff[debuff.type] = debuff.value;
                    }
                    score += limitAmount(totalDebuffAmount, p, debuff.value) * p.weight;
                  }
                }
              }
              return score;
            };

            const pickEquip = function (equipments) {
              equipments = equipments.filter(a => !excluded.includes(a) && this.matchClass(a, chr));
              equipments = equipments.map(a => [countSkill(a), a]);
              equipments.sort((a, b) => this.compare(a[0], b[0]));
              let r = null;
              if (equipments.length > 0 && equipments[0][0] > 0) {
                r = equipments[0];
              }
              return r;
            }.bind(this);

            const pickSkill = function (skills) {
              let passive = [];
              for (const skill of skills.filter(a => a.skillType != "アクティブ")) {
                if (excluded.includes(skill))
                  continue;

                const score = countSkill(skill);
                if (score > 0)
                  passive.push([score, skill]);
              }

              let active = [];
              for (const skill of skills.filter(a => a.skillType == "アクティブ")) {
                const score = countSkill(skill);
                if (score > 0)
                  active.push([score, skill]);
              }
              active = active.sort((a, b) => this.compare(a[0], b[0]));
              for (let a of active)
                a[0] = countSkill(a[1]);
              active = active.filter(a => a[0] > 0);

              let r = [...passive, ...active].sort((a, b) => this.compare(a[0], b[0]))[0];
              if (!r)
                return null;
              else
                return r[0] > 0 ? r : null;
            }.bind(this);

            let talent = [countSkill(chr.talent), chr.talent];
            countSkill(talent[1], false, true);

            let skills = [];
            {
              let tmpSkills = [...chr.skills];
              for (let i = 0; i < 3; ++i) {
                let r = pickSkill(tmpSkills);
                if (!r)
                  break;
                skills.push(r);
                tmpSkills.splice(tmpSkills.indexOf(r[1]), 1);
                countSkill(r[1], true, true);
              }
            }

            let equipments = [];
            for (let equips of [this.weapons, this.armors, this.helmets, this.accessories]) {
              let r = pickEquip(equips);
              if (r) {
                equipments.push(r);
                countSkill(r[1], false, true);
              }
            }

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

          const countGlobal = function (skill) {
            if (skill.buff) {
              for (const v of skill.buff) {
                let p = buffs.find(a => a.type == v.type);
                if (p) {
                  totalBuffAmountGlobal[v.type] += v.value;
                  if (skill.skillType == "アクティブ") {
                    if (usedActiveBuffGlobal[v.type])
                      continue;
                    else
                      usedActiveBuffGlobal[v.type] = v.value;
                  }
                  p.amount += v.value;
                }
              }
            }
            if (skill.debuff) {
              for (const v of skill.debuff) {
                let p = debuffs.find(a => a.type == v.type);
                if (p) {
                  totalDebuffAmountGlobal[v.type] += v.value;
                  if (skill.skillType == "アクティブ") {
                    if (usedActiveDebuffGlobal[v.type])
                      continue;
                    else
                      usedActiveDebuffGlobal[v.type] = v.value;
                  }
                  p.amount += v.value;
                }
              }
            }
          }.bind(this);


          let result = [];
          let mainChrs = this.mainChrs.filter(a => filterMatchMainChr(a));
          for (let i = 0; i < num; ++i) {
            let candidates = mainChrs.map(a => getScore(a)).filter(a => a != null);
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

            excluded.push(r.character);
            for (const s of [r.talent, ...r.skills, ...r.equipments]) {
              if (s) {
                excluded.push(s);
                countGlobal(s);
              }
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

    this.classFilter = [];
    this.symbolFilter = [];
    this.rarityFilter = [];
    this.damageTypeFilter = [];
    this.fillFilter(this.classFilter, this.classes);
    this.fillFilter(this.symbolFilter, this.symbols);
    this.fillFilter(this.rarityFilter, this.rarities);
    this.fillFilter(this.damageTypeFilter, this.damageTypes);

    for (let i = 0; i < this.mainChrs.length; ++i) {
      let chr = this.mainChrs[i];
      chr.index = i + 1;
      chr.classId = this.classes.findIndex(v => v == chr.class);
      chr.symbolId = this.symbols.findIndex(v => v == chr.symbol);
      chr.rarityId = this.rarities.findIndex(v => v == chr.rarity);
      chr.damageTypeId = this.damageTypes.findIndex(v => v == chr.damageType);
    }
    for (let i = 0; i < this.supChrs.length; ++i) {
      let chr = this.supChrs[i];
      chr.index = i + 1;
      chr.classId = this.classes.findIndex(v => v == chr.class);
      chr.rarityId = this.rarities.findIndex(v => v == chr.rarity);
      chr.damageTypeId = this.damageTypes.findIndex(v => v == chr.damageType);
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

    filterMatchMainChr(chr) {
      return this.filterMatch(this.classFilter, chr.classId) &&
        this.filterMatch(this.symbolFilter, chr.symbolId) &&
        this.filterMatch(this.rarityFilter, chr.rarityId) &&
        this.filterMatch(this.damageTypeFilter, chr.damageTypeId);
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
    background: white;
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

  .table-sm td {
    padding: 0.1rem;
  }
</style>
