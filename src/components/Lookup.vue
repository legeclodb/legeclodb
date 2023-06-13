<template>
  <div class="root" @mousemove="onMouseMove">
    <div class="header" :class="{ 'hidden': !showHeader }">
      <Navigation />
    </div>
    <div class="about" style="margin-top: 70px;">
      <h2 style="margin-bottom: 5px">バフ・デバフ組み合わせ検索</h2>

      <div class="menu-content">
        <div class="menu-panel">
          <b-container>
            <div style="text-align:center">
              <h3 style="margin: 5px 0px">設定</h3>
            </div>

            <b-form-row v-for="(param, name, index) in options" :key="index">
              <b-col style="text-align: right" align-self="end">
                <label style="width: 15em" :for="`bs-param-${index}`">{{param.label}}</label>
              </b-col>
              <b-col>
                <b-form-checkbox v-if="typeof(param.value) === 'boolean'" :id="`bs-param-${index}`" v-model="param.value"></b-form-checkbox>
                <b-form-input v-if="typeof(param.value) === 'number'" style="width: 3em" :id="`bs-param-${index}`" v-model.number="param.value" size="sm" type="number" class="input-param"></b-form-input>
              </b-col>
            </b-form-row>
          </b-container>

          <b-container>
            <div style="text-align:center">
              <h3 style="margin: 5px 0px">フィルタ</h3>
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
            </div>
          </b-container>
        </div>

        <div class="menu-panel">
          <b-container>
            <div style="text-align:center">
              <h3 style="margin: 5px 0px">バフ</h3>
            </div>
            <b-table small borderless hover :items="buffs" :fields="buffFields">
              <template #cell(label)="r">
                <div class="flex">
                  <b-form-checkbox v-model="r.item.enabled"></b-form-checkbox>
                  <div style="margin: auto 0; vertical-align: baseline;">
                    {{r.item.label}}
                  </div>
                </div>
              </template>
              <template #cell(weight)="r">
                <b-form-input style="width: 3.5em" v-model.number="r.item.weight" size="sm" type="number" class="input-param"></b-form-input>
              </template>
              <template #cell(limit)="r">
                <div v-if="r.item.limit != undefined">
                  <b-form-input style="width: 3.5em" v-model.number="r.item.limit" size="sm" type="number" class="input-param"></b-form-input>
                </div>
              </template>
            </b-table>
          </b-container>
        </div>

        <div class="menu-panel">
          <b-container>
            <div style="text-align:center">
              <h3 style="margin: 5px 0px">デバフ</h3>
            </div>

            <b-table small borderless hover :items="debuffs" :fields="buffFields">
              <template #cell(label)="r">
                <div class="flex">
                  <b-form-checkbox v-model="r.item.enabled"></b-form-checkbox>
                  <div style="margin: auto 0; vertical-align: baseline;">
                    {{r.item.label}}
                  </div>
                </div>
              </template>
              <template #cell(weight)="r">
                <b-form-input style="width: 3.5em" v-model.number="r.item.weight" size="sm" type="number" class="input-param"></b-form-input>
              </template>
              <template #cell(limit)="r">
                <div v-if="r.item.limit != undefined">
                  <b-form-input style="width: 3.5em" v-model.number="r.item.limit" size="sm" type="number" class="input-param"></b-form-input>
                </div>
              </template>
            </b-table>
          </b-container>
        </div>

        <div class="menu-panel">
          <b-container style="width: 270px">
            <div style="text-align:center">
              <h3 style="margin: 5px 0px">除外リスト</h3>
            </div>
            <div>
              <b-link v-for="(v, i) in excluded" :key="i" @click="excluded.splice(excluded.indexOf(v), 1)">
                <b-img-lazy :src="getImageURL(v.name)" :title="v.name" with="50" height="50" />
              </b-link>
            </div>
          </b-container>
        </div>

      </div>
    </div>

    <div class="content" :style="style">

      <template v-for="(r, ri) in result">
        <div class="character" :key="ri">

          <div class="flex">
            <div v-if="r.main" class="portrait">
              <b-img-lazy :src="getImageURL(r.main.character.name)" :title="r.main.character.name" :id="'portrait_m_'+ri" width="100" height="100" rounded />
              <b-popover v-if="displayType>=1" :target="'portrait_m_'+ri" :title="r.main.character.name" triggers="hover click blur" :delay="{show:0, hide:250}" no-fade placement="top">
                <b-button @click="excluded.push(r.main.character)">このキャラを除外</b-button>
              </b-popover>
            </div>
            <div v-if="r.main" class="detail" v-show="displayType >= 1">
              <div class="skills">
                <div class="skill" v-for="(skill, si) in r.main.skills" :class="getSkillClass(skill)" :key="si">
                  <div class="flex">
                    <div class="icon">
                      <b-img-lazy :src="getImageURL(skill.name)" :title="skill.name" with="50" height="50" :id="'skill_m_'+ri+'_'+si" />
                      <b-popover v-if="skill.skillType!='タレント'" :target="'skill_m_'+ri+'_'+si" :title="skill.name" triggers="hover focus" :delay="{show:0, hide:250}" no-fade placement="top">
                        <b-button @click="excluded.push(skill)">このスキルを除外</b-button>
                      </b-popover>
                    </div>
                    <div class="desc" v-show="displayType >= 2">
                      <div class="flex">
                        <h6>{{ skill.name }}</h6>
                        <div class="param-group" v-html="skillParamsToHtml(skill)"></div>
                      </div>
                      <p>
                        <span v-html="descToHtml(skill)" />
                        <span v-if="skill.note" class="note" v-html="noteToHtml(skill)" />
                        <span class="note" v-html="effectsToHtml(skill, r.main.usedEffects)" />
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="skills">
                <div class="skill" v-for="(skill, si) in r.main.equipments" :key="si">
                  <div class="flex">
                    <div class="icon">
                      <b-img-lazy :src="getImageURL(skill.name)" :title="skill.name" with="50" height="50" :id="'item_'+ri+'_'+si" />
                      <b-popover v-if="displayType>=1" :target="'item_'+ri+'_'+si" :title="skill.name" triggers="hover focus" :delay="{show:0, hide:250}" no-fade placement="top">
                        <b-button @click="excluded.push(skill)">このアイテムを除外</b-button>
                      </b-popover>
                    </div>
                    <div class="desc" v-show="displayType >= 2">
                      <div class="flex">
                        <h6>{{ skill.name }}</h6>
                        <div class="param-group" v-html="skillParamsToHtml(skill)"></div>
                      </div>
                      <p>
                        <span v-html="descToHtml(skill)" />
                        <span v-if="skill.note" class="note" v-html="noteToHtml(skill)" />
                        <span class="note" v-html="effectsToHtml(skill, r.main.usedEffects)" />
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex">
            <div v-if="r.summon" class="portrait">
              <b-img-lazy :src="getImageURL(r.summon.character.name)" :title="`${r.summon.character.name} (召喚ユニット)`" :id="'portrait_m_'+ri" width="100" height="100" rounded />
            </div>
            <div v-if="r.summon" class="detail" v-show="displayType >= 1">
              <div class="skills">
                <div class="skill" v-for="(skill, si) in r.summon.skills" :class="getSkillClass(skill)" :key="si">
                  <div class="flex">
                    <div class="icon">
                      <b-img-lazy :src="getImageURL(skill.name)" :title="skill.name" with="50" height="50" :id="'skill_x_'+ri+'_'+si" />
                      <b-popover v-if="skill.skillType!='タレント'" :target="'skill_x_'+ri+'_'+si" :title="skill.name" triggers="hover focus" :delay="{show:0, hide:250}" no-fade placement="top">
                        <b-button @click="excluded.push(skill)">このスキルを除外</b-button>
                      </b-popover>
                    </div>
                    <div class="desc" v-show="displayType >= 2">
                      <div class="flex">
                        <h6>{{ skill.name }}</h6>
                        <div class="param-group" v-html="skillParamsToHtml(skill)"></div>
                      </div>
                      <p>
                        <span v-html="descToHtml(skill)" />
                        <span v-if="skill.note" class="note" v-html="noteToHtml(skill)" />
                        <span class="note" v-html="effectsToHtml(skill, r.main.usedEffects)" />
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex">
            <div v-if="r.support" class="portrait">
              <b-img-lazy :src="getImageURL(r.support.character.name)" :title="r.support.character.name" :id="'portrait_s_'+ri" width="100" height="100" rounded />
              <b-popover v-if="displayType>=1" :target="'portrait_s_'+ri" :title="r.support.character.name" triggers="hover focus" :delay="{show:0, hide:250}" no-fade placement="top">
                <b-button @click="excluded.push(r.support.character)">このキャラを除外</b-button>
              </b-popover>
            </div>
            <div v-if="r.support" class="detail" v-show="displayType >= 1">
              <div class="skills">
                <div class="skill" v-for="(skill, si) in enumerate(r.support.skills)" :class="getSkillClass(skill)" :key="si">
                  <div class="flex">
                    <div class="icon">
                      <b-img-lazy :src="getImageURL(skill.name)" :title="skill.name" with="50" height="50" :id="'skill_s_'+ri+'_'+si" />
                    </div>
                    <div class="desc" v-show="displayType >= 2">
                      <div class="flex">
                        <h6>{{ skill.name }}</h6>
                        <div class="param-group" v-html="skillParamsToHtml(skill)"></div>
                      </div>
                      <p>
                        <span v-html="descToHtml(skill)" />
                        <span v-if="skill.note" class="note" v-html="noteToHtml(skill)" />
                        <span class="note" v-html="effectsToHtml(skill, r.support.usedEffects)" />
                      </p>
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

      options: [],
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
      excludedFields: [
        {
          key: "name",
          label: "対象",
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
    for (let i of this.items)
      this.setupEffects(i);

    this.searchTable = new Map();
    for (let s of [...this.mainActive, ...this.mainPassive, ...this.mainTalents, ...this.supActive, ...this.supPassive, ...this.items])
      this.searchTable.set(s.name, s);

    for (let i = 0; i < this.mainChrs.length; ++i) {
      let chr = this.mainChrs[i];
      chr.index = i + 1;
      chr.objectType = "メイン";
      chr.classId = this.classes.findIndex(v => v == chr.class);
      chr.symbolId = this.symbols.findIndex(v => v == chr.symbol);
      chr.rarityId = this.rarities.findIndex(v => v == chr.rarity);
      chr.damageTypeId = this.damageTypes.findIndex(v => v == chr.damageType);
    }
    for (let i = 0; i < this.supChrs.length; ++i) {
      let chr = this.supChrs[i];
      chr.index = i + 1;
      chr.objectType = "サポート";
      chr.classId = this.classes.findIndex(v => v == chr.class);
      chr.rarityId = this.rarities.findIndex(v => v == chr.rarity);
      chr.damageTypeId = this.damageTypes.findIndex(v => v == chr.damageType);
    }
    for (let i = 0; i < this.items.length; ++i) {
      let item = this.items[i];
      item.index = i + 1;
      item.objectType = "アイテム";
      item.status = this.getItemStatus(item);
    }

    const setSlotActive = function (skill, ownerType) {
      skill.ownerType = ownerType;
      if (skill.buff) {
        for (let v of skill.buff) {
          v.valueType = `バフ:${v.type}`
          if (!v.slot)
            v.slot = `バフ:${ownerType}${v.onBattle ? ':戦闘時' : ''}:${v.type}`;
        }
      }
      if (skill.debuff) {
        for (let v of skill.debuff) {
          v.valueType = `デバフ:${v.type}`
          if (!v.slot)
            v.slot = `デバフ${ownerType}${v.onBattle ? ':戦闘時' : ''}:${v.type}`;
        }
      }
    };
    const setSlotPassive = function (skill, ownerType) {
      skill.ownerType = ownerType;
      if (skill.buff)
        for (let v of skill.buff)
          v.valueType = `バフ:${v.type}`
      if (skill.debuff)
        for (let v of skill.debuff)
          v.valueType = `デバフ:${v.type}`
    };
    const apply = function (array, func) {
      for (let v of array)
        func(v);
    };
    apply(this.mainActive, a => setSlotActive(a, "メイン"));
    apply(this.mainPassive, a => setSlotPassive(a, "メイン"));
    apply(this.mainTalents, a => setSlotPassive(a, "メイン"));
    apply(this.supActive, a => setSlotActive(a, "サポート"));
    apply(this.supPassive, a => setSlotPassive(a, "サポート"));
    apply(this.items, a => setSlotPassive(a, "アイテム"));

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
      ["allowOnBattle", "戦闘時発動効果を含める", true],
      ["allowProbability", "確率発動効果を含める", true],
      ["allowSingleUnitBuff", "単体バフを含める", false],
      ["allowSymbolSkill", "シンボルスキルを含める", false],
      ["allowSupportActive", "サポートのアクティブを含める", true],
    ]);

    const makeParams = function (effectType, types) {
      const make = function (t) {
        return {
          label: t,
          enabled: false,
          limit: 0,
          weight: 1,
          effectType: effectType,
          valueType: `${effectType}:${t}`,
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
    getSkillClass(skill) {
      return {
        active: skill.skillType == 'アクティブ',
        passive: skill.skillType == 'パッシブ',
      }
    },
    effectsToHtml(skill, usedEffects) {
      let lines = [];
      for (const v of this.enumerate(skill.buff, skill.debuff)) {
        if (["ランダム", "クラス", "シンボル"].includes(v.type)) {
          continue
        }

        let additionalClass = "";
        let prefix = v.effectType == "デバフ" ? "-" : "+";
        let onBattle = v.onBattle ? "(戦闘時)" : "";
        let unit = "";
        if (usedEffects.includes(v)) {
          additionalClass += " caution";
        }
        if (v.type != "移動") {
          unit = "%";
        }
        lines.push(`<span class="effect ${additionalClass}">${v.type}${onBattle}${prefix}${this.getEffectValue(v)}${unit}</span>`);
      }
      return lines.length ? `[ ${lines.join(", ")} ]` : "";
    },

    filterMatchMainChr(chr) {
      return this.filterMatch(this.classFilter, chr.classId) &&
        this.filterMatch(this.symbolFilter, chr.symbolId) &&
        this.filterMatch(this.rarityFilter, chr.rarityId) &&
        this.filterMatch(this.damageTypeFilter, chr.damageTypeId);
    },
    filterMatchSupChr(chr) {
      return this.filterMatch(this.classFilter, chr.classId) &&
        this.filterMatch(this.rarityFilter, chr.rarityId) &&
        this.filterMatch(this.damageTypeFilter, chr.damageTypeId);
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

    getEffectValue(effect) {
      let r = effect.value;
      if (effect.maxStack)
        r *= effect.maxStack;
      return r;
    },

    *enumerate(...arrays) {
      for (let array of arrays) {
        if (array)
          yield* array;
      }
    },

    *enumerateEffects(skill) {
      yield* this.enumerate(skill.buff, skill.debuff);
    },

    doSearch(num) {
      let excluded = [...this.excluded];
      let targets = this.enabledEffects;

      let totalAmountGlobal = {};
      let usedSlotsGlobal = {};

      for (let v of targets)
        totalAmountGlobal[v.valueType] = 0;

      const getScore = function (chr) {
        if (excluded.includes(chr))
          return null;

        const opt = this.optionValues;
        let totalAmount = { ...totalAmountGlobal };
        let usedSlots = { ...usedSlotsGlobal };
        let usedEffects = [];

        const limitAmount = function (param, amount, tm) {
          if (param.limit > 0)
            amount = Math.min(amount, Math.max(param.limit - tm[param.valueType], 0));
          return amount;
        }.bind(this);

        const buffCondition = function(skill, effect) {
          if (effect.onBattle && !effect.duration)
            return false;

          if (effect.effectType == "デバフ") {
            return (opt.allowOnBattle || !effect.onBattle) &&
              (opt.allowProbability || !effect.probability);
          }
          else {
            return (effect.target != "自身") &&
              (opt.allowSingleUnitBuff || effect.target != "単体") &&
              (opt.allowOnBattle || !effect.onBattle) &&
              (opt.allowProbability || !effect.probability);
          }
        }.bind(this);

        const getScore = function (skill, parentState = null) {
          if (excluded.includes(skill))
            return 0;
          if (!opt.allowSymbolSkill && this.matchTags(skill.tags, /^シンボルスキル$/))
            return 0;
          if (!opt.allowSupportActive && skill.skillType == "アクティブ" && skill.ownerType == "サポート")
            return 0;

          let r = {
            skill: skill,
            score: 0,
          };
          if (parentState) {
            r.usedSlots = parentState.usedSlots;
            r.totalAmount = parentState.totalAmount;
            r.usedEffects = parentState.usedEffects;
          }
          else {
            r.usedSlots = { ...usedSlots };
            r.totalAmount = { ...totalAmount };
            r.usedEffects = [...usedEffects];
          }
 
          for (const v of this.enumerateEffects(skill)) {
            let p = targets.find(a => a.valueType == v.valueType);
            if (p && buffCondition(skill, v)) {
              const amount = limitAmount(p, this.getEffectValue(v), r.totalAmount);
              if (skill.skillType == "アクティブ") {
                let prev = usedSlots[v.slot];
                if (prev /*&& prev[0] >= amount*/) {
                  continue;
                }
                r.usedSlots[v.slot] = [v, skill, chr];
              }
              const score = amount * p.weight;
              if (score > 0) {
                r.score += score;
                r.totalAmount[v.valueType] += amount;
                r.usedEffects.push(v);
              }
            }
          }

          if (skill.summon) {
            let sch = skill.summon[0];
            r.summon = {
              character: sch,
              skills: [],
            };
            for (const s of [sch.talent, ...sch.skills]) {
              const sr = getScore(s, r);
              if (sr.score > 0) {
                r.score += sr.score;
                r.summon.skills.push(s);
              }
            }
          }
          return r;
        }.bind(this);

        const pickEquip = function (equipments) {
          equipments = equipments.filter(a => !excluded.includes(a) && this.matchClass(a, chr));
          equipments = equipments.map(a => getScore(a));
          equipments.sort((a, b) => this.compare(a.score, b.score));
          let r = null;
          if (equipments.length > 0 && equipments[0].score > 0) {
            r = equipments[0];
          }
          return r;
        }.bind(this);

        const pickSkill = function (skills) {
          let scoreList = [];
          for (const skill of skills) {
            if (excluded.includes(skill))
              continue;

            const r = getScore(skill);
            if (r.score > 0)
              scoreList.push(r);
          }
          if (scoreList.length == 0)
            return null;

          let r = scoreList.sort((a, b) => this.compare(a.score, b.score))[0];
          return r;
        }.bind(this);

        const updateState = function (score) {
          usedSlots = score.usedSlots;
          totalAmount = score.totalAmount;
          usedEffects = score.usedEffects;
        };


        let skills = [];
        let equipments = [];

        if (chr.talent) {
          let r = getScore(chr.talent);
          if (r.score > 0) {
            updateState(r);
            skills.push(r);
          }
        }

        let summon = null;
        if (chr.skills) {
          let tmpSkills = [...chr.skills];
          for (let i = 0; i < 3; ++i) {
            let r = pickSkill(tmpSkills);
            if (!r)
              break;

            tmpSkills.splice(tmpSkills.indexOf(r.skill), 1);
            skills.push(r);
            updateState(r);
            if (r.summon) {
              summon = r.summon;
            }
          }
        }
        if (chr.objectType == "メイン") {
          for (let equips of [this.weapons, this.armors, this.helmets, this.accessories]) {
            let r = pickEquip(equips);
            if (r) {
              equipments.push(r);
              updateState(r);
            }
          }
        }

        return {
          score: [...skills, ...equipments].reduce((t, a) => t + a.score, 0),
          character: chr,
          skills: skills.map(a => a.skill),
          equipments: equipments.map(a => a.skill),
          summon: summon,

          totalAmount: totalAmount,
          usedSlots: usedSlots,
          usedEffects: usedEffects,
        };
      }.bind(this);


      let result = [];
      let mainChrs = this.mainChrs.filter(a => this.filterMatchMainChr(a));
      let supChrs = this.supChrs.filter(a => this.filterMatchSupChr(a));
      for (let i = 0; i < num; ++i) {
        let r = { score: 0 };

        const pickBest = function (chrs) {
          let ordered = chrs.map(a => getScore(a)).filter(a => a && a.score > 0).sort((a, b) => this.compare(a.score, b.score));
          return ordered.length ? ordered[0] : null;
        }.bind(this);

        const updateState = function (field, t) {
          r[field] = t;
          r.score += t.score;
          if (t.summon)
            r.summon = t.summon;
          r.totalAmount = t.totalAmount; // for debug
          totalAmountGlobal = t.totalAmount;
          usedSlotsGlobal = t.usedSlots;
        };

        let bestMain = pickBest(mainChrs);
        if (bestMain)
          updateState("main", bestMain);

        let bestSup = pickBest(supChrs);
        if (bestSup)
          updateState("support", bestSup);

        for (let v of [r.main, r.support, r.summon]) {
          if (!v)
            continue;
          excluded.push(v.character);
          for (const s of this.enumerate(v.skills, v.equipments))
            excluded.push(s);
        }
        if (!bestMain && !bestSup)
          break;

        result.push(r);
      }
      //console.log(result); // for debug
      return result;
    },

  },

  computed: {
    result() {
      return this.doSearch(this.options.maxPickup.value);
    },
    optionValues() {
      return this.getValues(this.options);
    },
    enabledEffects() {
      return [...this.buffs.filter(a => a.enabled), ...this.debuffs.filter(a => a.enabled)];
    },
  }

}</script>

<style scoped>
  div.about {
  }

  .about h2 {
    font-size: 1.75em;
    margin-left: 1em;
  }
  .about h3 {
    font-size: 1.5em;
    margin-left: 1em;
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

  div.character {
    padding: 3px;
    margin: 5px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 0.3rem;
    background: rgb(245, 245, 245);
    flex-grow: initial;
    box-shadow: 0 3px 6px rgba(140,149,159,0.5);
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
