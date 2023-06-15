<template>
  <div class="root" @mousemove="onMouseMove">
    <div class="header" :class="{ 'hidden': !showHeader }">
      <Navigation />
    </div>
    <div class="about" style="margin-top: 55px;">

      <div class="menu-content">
        <div class="menu-panel" id="cb-settings">
          <b-container>
            <div>
              <h3 style="margin: 5px 0px">設定</h3>
            </div>

            <b-table small borderless hover :items="Object.values(options)" :fields="optionFields">
              <template #cell(value)="r">
                <div class="flex" style="flex-direction: row-reverse">
                  <b-form-checkbox v-if="r.item.type == 'boolean'" v-model="r.item.value"></b-form-checkbox>
                  <b-form-input v-if="r.item.type == 'number'" style="width: 3em" v-model.number="r.item.value" size="sm" type="number" class="input-param"></b-form-input>
                </div>
              </template>
              <template #cell(label)="r">
                <div :id="`cb-p-${r.item.name}`">{{r.item.label}}</div>
              </template>
            </b-table>

          </b-container>

          <b-container>
            <div>
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

        <div class="menu-panel" id="cb-buff-list">
          <b-container>
            <div>
              <h3 style="margin: 5px 0px">バフ</h3>
            </div>
            <b-table small borderless hover :items="buffs" :fields="buffFields">
              <template #cell(enabled)="r">
                <b-form-checkbox v-model="r.item.enabled"></b-form-checkbox>
              </template>
              <template #cell(label)="r">
                {{r.item.label}}
              </template>
              <template #cell(limit)="r">
                <b-form-input style="width: 4.5em" v-model.number="r.item.limit" size="sm" type="number" class="input-param" step="10" placeholder="無制限"></b-form-input>
              </template>
              <template #cell(weight)="r">
                <b-form-input style="width: 3.5em" v-model.number="r.item.weight" size="sm" type="number" class="input-param"></b-form-input>
              </template>
            </b-table>
          </b-container>
        </div>

        <div class="menu-panel" id="cb-debuff-list">
          <b-container>
            <div>
              <h3 style="margin: 5px 0px">デバフ</h3>
            </div>

            <b-table small borderless hover :items="debuffs" :fields="buffFields">
              <template #cell(enabled)="r">
                <b-form-checkbox v-model="r.item.enabled"></b-form-checkbox>
              </template>
              <template #cell(label)="r">
                {{r.item.label}}
              </template>
              <template #cell(limit)="r">
                <b-form-input style="width: 4.5em" v-model.number="r.item.limit" size="sm" type="number" class="input-param" step="10" placeholder="無制限"></b-form-input>
              </template>
              <template #cell(weight)="r">
                <b-form-input style="width: 3.5em" v-model.number="r.item.weight" size="sm" type="number" class="input-param"></b-form-input>
              </template>
            </b-table>
          </b-container>
        </div>

        <div class="menu-panel" id="cb-exclude-list">
          <b-container style="width: 270px">
            <div>
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

      <div v-if="result.length == 0" class="menu-panel" style="padding: 10px">

        <div class="about">
          <h5 style="margin-bottom: 5px">バフ・デバフ組み合わせ検索</h5>

          指定のバフ・デバフの最適な組み合わせを探すツールです。<br />
          メインキャラ(スキル×装備)×サポート の組み合わせから、競合を考慮しつつ、総効果量の高いものを探索します。<br />
          例えば「与ダメージバフ＋クリティカルダメージ倍率バフ＋ダメージ耐性デバフ」のいい感じの組み合わせを探したい、というようなケースで役立ちます。<br />
          <br />
          味方全体の強化の最適化が目的であるため、自己バフは考慮していません。単体のバフも「<b-link @mouseenter="highlight('cb-p-allowSingleUnitBuff', true)" @mouseleave="highlight('cb-p-allowSingleUnitBuff', false)">単体バフを含める</b-link>」にチェックしていない限り考慮しません。<br />
          特定のキャラやスキルを除外したい場合、アイコンをマウスオーバーすると出てくるポップアップから除外できます。<br />
          <br />
          なお、必ずしも本当に最適な結果になるとは限らないことに注意が必要です。<br />
          完璧に解くには時間がかかりすぎるため、若干正確性を犠牲にしつつ高速に解く方法 (貪欲法) を用いています。<br />
          また、発動に条件がある効果の条件を考慮していないため、現実的ではない結果が出ることもあります。(除外や優先度によりある程度の調整は可能)<br />
        </div>
      </div>

      <template v-for="(r, ri) in result">
        <div class="character" :key="ri">

          <div class="flex">
            <div v-if="r.main" class="portrait">
              <b-img-lazy :src="getImageURL(r.main.character.name)" :title="r.main.character.name" :id="'portrait_m_'+ri" width="100" rounded />
              <b-popover v-if="displayType>=1" :target="'portrait_m_'+ri" :title="r.main.character.name" triggers="hover click blur" :delay="{show:0, hide:250}" no-fade placement="top">
                <b-button @click="excluded.push(r.main.character)">このキャラを除外</b-button>
              </b-popover>
            </div>
            <div v-if="r.main" class="detail" v-show="displayType >= 1">
              <div class="skills">
                <div class="skill" v-for="(skill, si) in r.main.skills" :class="getSkillClass(skill)" :key="si">
                  <div class="flex">
                    <div class="icon">
                      <b-img-lazy :src="getImageURL(skill.name)" :title="skill.name" width="50" :id="'skill_m_'+ri+'_'+si" />
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
                        <span class="note" v-html="effectsToHtml(skill, r.main)" />
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="skills">
                <div class="skill" v-for="(skill, si) in r.main.equipments" :key="si">
                  <div class="flex">
                    <div class="icon">
                      <b-img-lazy :src="getImageURL(skill.name)" :title="skill.name" width="50" :id="'item_'+ri+'_'+si" />
                      <b-popover v-if="displayType>=1" :target="'item_'+ri+'_'+si" :title="skill.name" triggers="hover focus" :delay="{show:0, hide:250}" no-fade placement="top">
                        <b-button @click="excluded.push(skill)">このアイテムを除外</b-button>
                      </b-popover>
                    </div>
                    <div class="desc" v-show="displayType >= 2">
                      <div class="flex">
                        <h6><b-img-lazy :src="getImageURL(skill.slot)" :title="skill.name" width="18" />{{ skill.name }}</h6>
                        <div class="param-group" v-html="skillParamsToHtml(skill)"></div>
                      </div>
                      <p>
                        <span v-html="descToHtml(skill)" />
                        <span v-if="skill.note" class="note" v-html="noteToHtml(skill)" />
                        <span class="note" v-html="effectsToHtml(skill, r.main)" />
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex">
            <div v-if="r.summon" class="portrait">
              <b-img-lazy :src="getImageURL(r.summon.character.name)" :title="`${r.summon.character.name} (召喚ユニット)`" :id="'portrait_m_'+ri" width="100" rounded />
            </div>
            <div v-if="r.summon" class="detail" v-show="displayType >= 1">
              <div class="skills">
                <div class="skill" v-for="(skill, si) in r.summon.skills" :class="getSkillClass(skill)" :key="si">
                  <div class="flex">
                    <div class="icon">
                      <b-img-lazy :src="getImageURL(skill.name)" :title="skill.name" width="50" :id="'skill_x_'+ri+'_'+si" />
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
                        <span class="note" v-html="effectsToHtml(skill, r.main)" />
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
                        <span class="note" v-html="effectsToHtml(skill, r.support)" />
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
          key: "enabled",
          label: "",
        },
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
      optionFields: [
        {
          key: "value",
          label: "",
        },
        {
          key: "label",
          label: "項目",
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
      this.setupSkill(i);

    for (let s of this.mainActive) {
      if (this.matchTags(s.tags, /^再行動$/)) {
        s.hasReaction = true;
      }
    }

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
          else
            v.hasSpecialSlot = true;
        }
      }
      if (skill.debuff) {
        for (let v of skill.debuff) {
          v.valueType = `デバフ:${v.type}`
          if (!v.slot)
            v.slot = `デバフ${ownerType}${v.onBattle ? ':戦闘時' : ''}:${v.type}`;
          else
            v.hasSpecialSlot = true;
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
      for(const p of params) {
        r[p[0]] = {
          name: p[0],
          label: p[1],
          value: p[2],
          type: typeof(p[2]),
        };
      }
      return r;
    };
    this.options = makeOptions([
      ["maxPickup", "上位n人を選出", 10],
      ["allowOnBattle", "戦闘時発動効果を含める", true],
      ["allowProbability", "確率発動効果を含める", true],
      ["allowSingleUnitBuff", "単体バフを含める", false],
      ["allowSymbolSkill", "シンボルスキルを含める", false],
      ["allowSupportActive", "サポートのアクティブを含める", true],
      ["allowOnlyOneActive", "再行動なしアクティブを1つに制限", false],
    ]);

    const makeParams = function (effectType, types) {
      const make = function (t) {
        return {
          label: t.name,
          enabled: false,
          limit: t.limit ? t.limit : "",
          weight: t.weight ? t.weight : 10,
          effectType: effectType,
          valueType: `${effectType}:${t.name}`,
        };
      }
      return types.map(a => make(a));
    };

    this.buffs = makeParams("バフ", [
      {name: "アタック"},
      {name: "ディフェンス"},
      {name: "マジック"},
      {name: "レジスト"},
      {name: "クリティカル率"},
      {name: "クリティカルダメージ倍率"},
      {name: "与ダメージ"},
      {name: "与ダメージ(物理)"},
      {name: "与ダメージ(魔法)"},
      {name: "与ダメージ(スキル)"},
      {name: "与ダメージ(範囲スキル)"},
      //{name: "与ダメージ(単体スキル)"},
      {name: "与ダメージ(通常攻撃)"},
      {name: "ダメージ耐性", limit:70},
      {name: "ダメージ耐性(物理)", limit:70},
      {name: "ダメージ耐性(魔法)", limit:70},
    ]);
    this.debuffs = makeParams("デバフ", [
      {name: "アタック", limit:70},
      {name: "ディフェンス", limit:70},
      {name: "マジック", limit:70},
      {name: "レジスト", limit:70},
      {name: "与ダメージ", limit:70},
      {name: "ダメージ耐性"},
      {name: "ダメージ耐性(物理)"},
      {name: "ダメージ耐性(魔法)"},
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
    effectsToHtml(skill, ctx) {
      let lines = [];
      for (const v of this.enumerate(skill.buff, skill.debuff)) {
        if (["ランダム", "クラス", "シンボル"].includes(v.type) ||
          ["自身"].includes(v.target)) {
          continue
        }

        let additionalClass = "";
        let prefix = v.effectType == "デバフ" ? "-" : "+";
        let onBattle = v.onBattle ? "(戦闘時)" : "";
        let unit = "";
        let title = "";
        if (ctx.usedEffects.includes(v)) {
          additionalClass += " caution";
        }
        if (ctx.conflictedEffects.includes(v)) {
          additionalClass += " blue";
          title = "アクティブ同士で競合、もしくは既に上限に達している";
        }
        if (!["移動", "射程", "範囲"].includes(v.type)) {
          unit = "%";
        }
        lines.push(`<span class="effect ${additionalClass}" title="${title}">${v.type}${onBattle}${prefix}${this.getEffectValue(v)}${unit}</span>`);
      }
      return lines.length ? `[ ${lines.join(", ")} ]` : "";
    },
    highlight(id, enabled) {
      var element = document.getElementById(id);
      if(enabled)
        element.classList.add("param-highlighted");
      else
        element.classList.remove("param-highlighted");
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
      const opt = this.optionValues;
      let excluded = [...this.excluded];
      let targets = this.enabledEffects;

      let totalAmountGlobal = {};
      let usedSlotsGlobal = {};

      for (let v of targets)
        totalAmountGlobal[v.valueType] = 0;


      const buffCondition = function (skill, effect) {
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
      };

      const getBaseSkillScore = function (skill) {
        if (!skill)
          return 0;
        let score = 0;
        for (const v of this.enumerateEffects(skill)) {
          let p = targets.find(a => a.valueType == v.valueType);
          if (p && buffCondition(skill, v))
            score += this.getEffectValue(v) * p.weight;
        }
        if (skill.summon) {
          let sch = skill.summon[0];
          for (const s of [sch.talent, ...sch.skills])
            score += getBaseSkillScore(s);
        }
        return score;
      }.bind(this);

      const getBaseChrScore = function (chr) {
        return [chr.talent, ...chr.skills].reduce((total, skill) => total += getBaseSkillScore(skill), 0);
      }.bind(this);

      const filterSkills = function (skills) {
        return skills.filter(a => !excluded.includes(a)).filter(a => getBaseSkillScore(a));
      };

      const oederByBaseScore = function (chrs, filter) {
        let tmp = chrs.map(chr => [getBaseChrScore(chr), chr]).sort((a, b) => this.compare(a[0], b[0]));
        if (filter)
          tmp = tmp.filter(a => a[0] > 0);
        return tmp.map(a => a[1]);
      }.bind(this);

      // 高速化のため事前フィルタ
      let weapons = filterSkills(this.weapons);
      let armors = filterSkills(this.armors);
      let helmets = filterSkills(this.helmets);
      let accessories = filterSkills(this.accessories);

      // メインはここでは絞らないでおく
      let mainChrs = oederByBaseScore(this.mainChrs.filter(a => this.filterMatchMainChr(a)), false);
      let supChrs = oederByBaseScore(this.supChrs.filter(a => this.filterMatchSupChr(a)), true);


      const getChrScore = function (chr, parentState = null) {
        if (excluded.includes(chr))
          return null;

        let totalAmount = { ...(parentState ? parentState.totalAmount : totalAmountGlobal) };
        let usedSlots = { ...(parentState ? parentState.usedSlots : usedSlotsGlobal) };
        let usedEffects = [];
        let conflictedEffects = [];

        const limitAmount = function (param, amount, current) {
          if (param.limit > 0)
            amount = Math.min(amount, Math.max(param.limit - current, 0));
          return amount;
        }.bind(this);

        const getSkillScore = function (skill, parentState = null) {
          if (excluded.includes(skill))
            return 0;
          if (!opt.allowSymbolSkill && this.matchTags(skill.tags, /^シンボルスキル$/))
            return 0;
          if (!opt.allowSupportActive && skill.skillType == "アクティブ" && skill.ownerType == "サポート")
            return 0;

          let r = {
            skill: skill,
            score: 0,
            usedEffects: [],
            conflictedEffects: [],
          };
          if (parentState) {
            r.totalAmount = parentState.totalAmount;
            r.usedSlots = parentState.usedSlots;
            r.usedEffects = parentState.usedEffects;
            r.conflictedEffects = parentState.conflictedEffects;
          }
          else {
            r.totalAmount = { ...totalAmount };
            r.usedSlots = { ...usedSlots };
          }

          let scoreBoost = 1;
          if(skill.hasReaction && skill.area >= 5 && skill.range == "自ユニット") {
              scoreBoost += 0.5;
          }
 
          for (const v of this.enumerateEffects(skill)) {
            let p = targets.find(a => a.valueType == v.valueType);
            if (p && buffCondition(skill, v)) {
              if (skill.isActive) {
                if (usedSlots[v.slot]) {
                  r.conflictedEffects.push(v);
                  continue;
                }
                r.usedSlots[v.slot] = [v.value];
              }
              const current = r.totalAmount[p.valueType];
              const amount = limitAmount(p, this.getEffectValue(v), current);
              let score = amount * (p.weight * 0.1) * scoreBoost;
              if (amount == v.value && skill.isActive)
                score *= Math.min(Math.pow(v.value / 20, 2), 1); // 中途半端な効果量のアクティブは選ばれにくいようにスコア補正

              if (score > 0) {
                r.score += score;
                r.totalAmount[v.valueType] += amount;
                r.usedEffects.push(v);
              }
              if (amount == 0) {
                r.conflictedEffects.push(v);
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
              const sr = getSkillScore(s, r);
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
          equipments = equipments.map(a => getSkillScore(a));
          equipments.sort((a, b) => this.compare(a.score, b.score));
          let r = null;
          if (equipments.length > 0 && equipments[0].score > 0) {
            r = equipments[0];
          }
          return r;
        }.bind(this);

        const pickSkill = function (skills, ignoreActive) {
          let scoreList = [];
          for (const skill of skills) {
            if (excluded.includes(skill) || (ignoreActive && skill.isActive && !skill.hasReaction))
              continue;

            const r = getSkillScore(skill);
            if (r.score > 0)
              scoreList.push(r);
          }
          if (scoreList.length == 0)
            return null;

          let r = scoreList.sort((a, b) => this.compare(a.score, b.score))[0];
          return r;
        }.bind(this);



        let result = { character: chr };
        let score = 0;
        let skills = [];
        let equipments = null;
        let summon = null;
        let support = null;

        const updateState = function (s) {
          score += s.score;
          usedSlots = s.usedSlots;
          totalAmount = s.totalAmount;
          usedEffects = usedEffects.concat(s.usedEffects);
          conflictedEffects = conflictedEffects.concat(s.conflictedEffects);
        };

        if (chr.talent) {
          let r = getSkillScore(chr.talent);
          if (r.score > 0) {
            updateState(r);
            skills.push(r);
          }
        }

        if (chr.skills) {
          let tmpSkills = [...chr.skills];
          let ignoreActive = false;
          for (let i = 0; i < 3; ++i) {
            let r = pickSkill(tmpSkills, ignoreActive);
            if (!r)
              break;

            tmpSkills.splice(tmpSkills.indexOf(r.skill), 1);
            skills.push(r);
            updateState(r);
            if (r.summon)
              summon = r.summon;
            if (opt.allowOnlyOneActive && (r.skill.isActive && !r.skill.hasReaction))
              ignoreActive = true;
          }
        }

        if (chr.objectType == "メイン") {
          equipments = [];
          for (let equips of [weapons, armors, helmets, accessories]) {
            let r = pickEquip(equips);
            if (r) {
              equipments.push(r);
              updateState(r);
            }
          }
          result.scoreMain = score;

          let state = {
            totalAmount: totalAmount,
            usedSlots: usedSlots,
          };
          let sups = supChrs.map(a => getChrScore(a, state)).filter(a => a && a.score > 0).sort((a, b) => this.compare(a.score, b.score));
          if (sups.length) {
            support = sups[0];
            score += support.score;
            totalAmount = support.totalAmount;
            usedSlots = support.usedSlots;
            usedEffects = usedEffects.concat(support.usedEffects);
          }
        }

        result.score = score;
        result.skills = skills.map(a => a.skill);
        if (equipments)
          result.equipments = equipments.map(a => a.skill);
        if (summon)
          result.summon = summon;
        if (support)
          result.support = support;
        result.totalAmount = totalAmount;
        result.usedSlots = usedSlots;
        result.usedEffects = usedEffects;
        result.conflictedEffects = conflictedEffects;
        return result;
      }.bind(this);


      let result = [];
      for (let i = 0; i < num; ++i) {

        let ordered = mainChrs.map(a => getChrScore(a)).filter(a => a && a.score > 0).sort((a, b) => this.compare(a.score, b.score));
        if (ordered.length == 0)
          break;

        let best = ordered[0];
        let r = {
          score: best.score,
          main: best,
          totalAmount: best.totalAmount, // for debug
        };

        if (best.summon)
          r.summon = best.summon;
        if (best.support)
          r.support = best.support;
        totalAmountGlobal = best.totalAmount;
        usedSlotsGlobal = best.usedSlots;

        for (let v of [r.main, r.summon, r.support]) {
          if (!v)
            continue;
          for (const s of this.enumerate(v.skills, v.equipments))
            excluded.push(s);
        }
        result.push(r);

        ordered.shift();
        ordered = ordered.filter(a => a.scoreMain > 0).sort((a, b) => this.compare(a.scoreMain, b.scoreMain));
        mainChrs = ordered.map(a => a.character);

        if (best.support) {
          supChrs.splice(supChrs.indexOf(best.support.character), 1);
        }
      }
      console.log(result); // for debug
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

  label {
    margin: 0.2rem 0 !important;
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
    vertical-align: baseline;
  }

  input::placeholder {
    color: rgb(190, 190, 190) !important;
    font-size: small !important;
  }

  .param-highlighted {
    background-color: rgb(255, 190, 190) !important;
  }


</style>
