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
              <h5 style="margin-bottom: 5px">バフ・デバフ組み合わせ検索</h5>
            </b-col>
          </b-row>
        </b-container>

        <div class="flex">
          <div class="text-nowrap">
            <b-container>
              <div style="text-align:center">
                <h6 style="margin: 5px 0px">バフ</h6>
              </div>
              <b-table small borderless hover :items="buffs" :fields="buffFields">
                <template #cell(label)="r">
                  <div class="flex">
                    <b-form-checkbox v-model="r.item.enabled" size="sm" plain></b-form-checkbox>
                    <div style="margin: auto 0; vertical-align: baseline;">
                      {{r.item.label}}
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

          <div class="text-nowrap">
            <b-container>
              <div style="text-align:center">
                <h6 style="margin: 5px 0px">デバフ</h6>
              </div>

              <b-table small borderless hover :items="debuffs" :fields="buffFields">
                <template #cell(label)="r">
                  <div class="flex">
                    <b-form-checkbox v-model="r.item.enabled" size="sm" plain></b-form-checkbox>
                    <div style="margin: auto 0; vertical-align: baseline;">
                      {{r.item.label}}
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

          <div class="text-nowrap">
            <div>
              <b-container>
                <div style="text-align:center">
                  <h6 style="margin: 5px 0px">設定</h6>
                </div>

                <b-form-row v-for="(param, name, index) in options" :key="index">
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
                      <b-img-lazy :src="getImageURL(classes[i])" width="20%" />
                    </b-button>
                  </b-button-group>
                </div>
              </div>
              <div class="menu-widgets flex">
                <div class="widget">
                  <b-button-group size="sm" id="symbol_selector">
                    <b-button v-for="(c, i) in symbolFilter" :key="i" :pressed.sync="c.state" variant="outline-secondary">
                      <b-img-lazy :src="getImageURL('シンボル:'+symbols[i])" width="20%" />
                    </b-button>
                  </b-button-group>
                </div>
                <div class="widget">
                  <b-button-group size="sm" id="rareiry_selector">
                    <b-button v-for="(c, i) in rarityFilter" :key="i" :pressed.sync="c.state" variant="outline-secondary">
                      <b-img-lazy :src="getImageURL(rarities[i])" width="30%" />
                    </b-button>
                  </b-button-group>
                </div>
                <div class="widget">
                  <b-button-group size="sm" id="attack_type_selector">
                    <b-button v-for="(c, i) in damageTypeFilter" :key="i" :pressed.sync="c.state" variant="outline-secondary">
                      <b-img-lazy :src="getImageURL(damageTypes[i])" width="20%" />
                    </b-button>
                  </b-button-group>
                </div>
              </div>
            </div>
          </div>
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

      optiond: [],
      buffs: [],
      debuffs: [],
      excluded: [],

      buffFields: [
        {
          key: "label",
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
    this.weapons = this.items.filter(a => a.slot == "武器");
    this.armors = this.items.filter(a => a.slot == "鎧");
    this.helmets = this.items.filter(a => a.slot == "兜");
    this.accessories = this.items.filter(a => a.slot == "アクセサリ");

    this.setupCharacters(this.mainChrs, this.mainActive, this.mainPassive, this.mainTalents);
    this.setupCharacters(this.supChrs, this.supActive, this.supPassive);

    this.searchTable = new Map();
    for (let s of [...this.mainActive, ...this.mainPassive, ...this.mainTalents, ...this.supActive, ...this.supPassive, ...this.items])
      this.searchTable.set(s.name, s);

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

    const setSlotActive = function (skill, prefix) {
      if (skill.buff) {
        for (let v of skill.buff) {
          v.valueType = `バフ:${v.type}`
          if (!v.slot)
            v.slot = `バフ${prefix}${v.onBattle ? ':戦闘時' : ''}:${v.type}`;
        }
      }
      if (skill.debuff) {
        for (let v of skill.debuff) {
          v.valueType = `デバフ:${v.type}`
          if (!v.slot)
            v.slot = `デバフ${prefix}${v.onBattle ? ':戦闘時' : ''}:${v.type}`;
        }
      }
    };
    const setSlotPassive = function (skill) {
      if (skill.buff) {
        for (let v of skill.buff) {
          v.valueType = `バフ:${v.type}`
        }
      }
      if (skill.debuff) {
        for (let v of skill.debuff) {
          v.valueType = `デバフ:${v.type}`
        }
      }
    };
    const apply = function (array, func) {
      for (let v of array)
        func(v);
    };
    apply(this.mainActive, a => setSlotActive(a, ":メイン"));
    apply(this.mainPassive, a => setSlotPassive(a));
    apply(this.mainTalents, a => setSlotPassive(a));
    apply(this.supActive, a => setSlotActive(a, ":サポート"));
    apply(this.supPassive, a => setSlotPassive(a));
    apply(this.items, a => setSlotPassive(a));

    this.mainChrs.sort((a, b) => b.date.localeCompare(a.date));
    this.supChrs.sort((a, b) => b.date.localeCompare(a.date));
    this.items.sort((a, b) => b.date.localeCompare(a.date));


    this.classFilter = [];
    this.symbolFilter = [];
    this.rarityFilter = [];
    this.damageTypeFilter = [];
    this.fillFilter(this.classFilter, this.classes);
    this.fillFilter(this.symbolFilter, this.symbols);
    this.fillFilter(this.rarityFilter, this.rarities);
    this.fillFilter(this.damageTypeFilter, this.damageTypes);

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
    this.options = makeOptions([
      ["maxPickup", "上位n人を選出", 10],
      ["allowOnBattle", "戦闘時発動系を含める", true],
      ["allowProbability", "確率発動系を含める", true],
      ["allowSingleUnitBuff", "単体バフを含める", false],
      ["allowSymbolSkill", "シンボルスキルを含める", false],
      ["allowSupportActive", "サポートのアクティブを含める", false],
    ]);

    const makeParams = function (buffOrDebuff, types) {
      const make = function (t) {
        return {
          label: t,
          enabled: false,
          limit: 0,
          weight: 1,
          valueType: `${buffOrDebuff}:${t}`,
          isDebuff: buffOrDebuff == "デバフ"
        };
      }
      return types.map(a => make(a));
    };
    this.buffs = makeParams("バフ", [
      "アタック", "ディフェンス", "マジック", "レジスト", "クリティカル率", "クリティカルダメージ倍率",
      "与ダメージ", "与ダメージ(物理)", "与ダメージ(魔法)", "与ダメージ(スキル)", "与ダメージ(範囲スキル)", "与ダメージ(通常攻撃)",
      "ダメージ耐性", "ダメージ耐性(物理)", "ダメージ耐性(魔法)",
    ]);
    this.debuffs = makeParams("デバフ", [
      "アタック", "ディフェンス", "マジック", "レジスト",
      "与ダメージ", "与ダメージ(物理)", "与ダメージ(魔法)",
      "ダメージ耐性", "ダメージ耐性(物理)", "ダメージ耐性(魔法)",
    ]);
    this.excluded = [];
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
      let r = this.doSearch(this.options.maxPickup.value);
      console.log(r);
    },

    matchClass(item, chr) {
      return item && (!item.classes || item.classes.includes(chr.class));
    },
    compare(a, b) {
      return a == b ? 0 : a < b ? 1 : -1;
    },

    getValues(opt) {
      let r = {};
      for (const k in opt)
        r[k] = opt[k].value;
      return r;
    },

    enumerateEffects(skill) {
      if (skill.buff && skill.debuff)
        return [...skill.buff, ...skill.debuff];
      else if (skill.buff)
        return skill.buff;
      else if (skill.debuff)
        return skill.debuff;
      return [];
    },

    doSearch(num) {
      let excluded = [...this.excluded];
      let targets = [...this.buffs.filter(a => a.enabled), ...this.debuffs.filter(a => a.enabled)];
      const opt = this.getValues(this.options);

      let usedActiveSlotsGlobal = {};
      let totalAmountGlobal = {};

      for (let v of targets)
        totalAmountGlobal[v.valueType] = 0;

      const buffCondition = function (skill, buff) {
        if (buff.isDebuff) {
          return (opt.allowOnBattle || !buff.onBattle) &&
            (opt.allowProbability || !buff.probability);
        }
        else {
          return (buff.target != "自身") &&
            (opt.allowSingleUnitBuff || buff.target != "単体") &&
            (opt.allowOnBattle || !buff.onBattle) &&
            (opt.allowProbability || !buff.probability);
        }
      };

      const getScore = function (chr) {
        if (excluded.includes(chr))
          return null;

        let usedActiveSlots = { ...usedActiveSlotsGlobal };
        let totalAmount = { ...totalAmountGlobal };

        const limitAmount = function (param, amount) {
          if (param.limit > 0)
            amount = Math.min(amount, Math.max(param.limit - totalAmount[param.valueType], 0));
          return amount;
        }.bind(this);

        const countSkill = function (skill, updateState = false) {
          if (!opt.allowSymbolSkill && this.matchTags(skill.tags, /^シンボルスキル$/))
            return 0;

          let score = 0;
          for (const v of this.enumerateEffects(skill)) {
            let p = targets.find(a => a.valueType == v.valueType);
            if (p && buffCondition(skill, v)) {
              if (updateState) {
                totalAmount[v.valueType] += v.value;
              }
              if (skill.skillType == "アクティブ") {
                if (usedActiveSlots[v.slot])
                  continue;
                else if (updateState)
                  usedActiveSlots[v.slot] = v.value;
              }
              score += limitAmount(p, v.value) * p.weight;
            }
          }
          return score;
        }.bind(this);

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
        countSkill(talent[1], true);

        let skills = [];
        {
          let tmpSkills = [...chr.skills];
          for (let i = 0; i < 3; ++i) {
            let r = pickSkill(tmpSkills);
            if (!r)
              break;
            skills.push(r);
            tmpSkills.splice(tmpSkills.indexOf(r[1]), 1);
            countSkill(r[1], true);
          }
        }

        let equipments = [];
        for (let equips of [this.weapons, this.armors, this.helmets, this.accessories]) {
          let r = pickEquip(equips);
          if (r) {
            equipments.push(r);
            countSkill(r[1], true);
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
        for (const v of this.enumerateEffects(skill)) {
          let p = targets.find(a => a.valueType == v.valueType);
          if (p) {
            totalAmountGlobal[v.valueType] += v.value;
            if (skill.skillType == "アクティブ") {
              if (usedActiveSlotsGlobal[v.slot])
                continue;
              else
                usedActiveSlotsGlobal[v.slot] = v.value;
            }
            p.amount += v.value;
          }
        }
      }.bind(this);


      let result = [];
      let mainChrs = this.mainChrs.filter(a => this.filterMatchMainChr(a));
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
