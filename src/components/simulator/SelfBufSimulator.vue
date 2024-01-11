<template>
  <div class="panel" style="padding: 10px 0px 0px 0px;">

    <div class="menu-content" style="flex-wrap: nowrap">
      <div class="menu-panel">
        <b-container>
          <div>
            <h3 style="margin: 5px 0px">設定</h3>
          </div>
          <b-table small borderless hover :items="Object.values(options)" :fields="optionFields">
            <template #cell(value)="r">
              <div class="flex">
                <div style="margin-left: auto">
                  <b-form-checkbox v-if="r.item.type == 'boolean'" v-model="r.item.value"></b-form-checkbox>
                  <b-form-input v-if="r.item.type == 'number'" style="width: 3em" v-model.number="r.item.value" :min="r.item.min" :max="r.item.max" size="sm" type="number" class="input-param" lazy></b-form-input>
                </div>
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
                <b-button v-for="(c, i) in filter.class" :key="i" :pressed.sync="c.state" variant="outline-secondary">
                  <b-img-lazy :src="getImageURL(classes[i])" width="20px" />
                </b-button>
              </b-button-group>
            </div>
          </div>
          <div class="menu-widgets flex">
            <div class="widget">
              <b-button-group size="sm" id="symbol_selector">
                <b-button v-for="(c, i) in filter.symbol" :key="i" :pressed.sync="c.state" variant="outline-secondary">
                  <b-img-lazy :src="getImageURL(symbols[i])" width="20px" />
                </b-button>
              </b-button-group>
            </div>
            <div class="widget">
              <b-button-group size="sm" id="damage_type_selector">
                <b-button v-for="(c, i) in filter.damageType" :key="i" :pressed.sync="c.state" variant="outline-secondary">
                  <b-img-lazy :src="getImageURL(damageTypes[i])" width="20px" />
                </b-button>
              </b-button-group>

              <b-button @click="doSearch()">テスト</b-button>
            </div>
          </div>
        </b-container>
      </div>

      <div class="menu-panel">
        <b-container>
          <div class="flex">
            <h3 style="margin: 5px 0px">バフ</h3>
            <div class="right-align">
              <b-button size="sm" @click="buffs.forEach(a => a.reset())">リセット</b-button>
            </div>
          </div>
          <b-table small borderless hover :items="buffs" :fields="buffFields">
            <template #cell(enabled)="r">
              <b-form-checkbox v-model="r.item.enabled"></b-form-checkbox>
            </template>
            <template #cell(label)="r">
              {{r.item.label}}
            </template>
          </b-table>
        </b-container>
      </div>
      <div class="menu-panel">
        <b-container>
          <div class="flex">
            <h3 style="margin: 5px 0px">デバフ</h3>
            <div class="right-align">
              <b-button size="sm" @click="debuffs.forEach(a => a.reset())">リセット</b-button>
            </div>
          </div>
          <b-table small borderless hover :items="debuffs" :fields="buffFields">
            <template #cell(enabled)="r">
              <b-form-checkbox v-model="r.item.enabled"></b-form-checkbox>
            </template>
            <template #cell(label)="r">
              {{r.item.label}}
            </template>
          </b-table>
        </b-container>
      </div>
    </div>

    <div class="content" :style="style">
      <div v-if="progress.result.length == 0" class="menu-panel" style="padding: 10px">
        <div class="about">
          <h5 style="margin-bottom: 5px">ユニット単体バフ・デバフ検索</h5>
        </div>
      </div>

      <template v-for="(r, ri) in progress.result">
        <div class="character" :key="ri">
          <div class="flex info">
            <div><h6>合計スコア: {{r.score}}</h6></div>
            <template v-for="(e, ei) in chrEffectsToHtml(r.main)">
              <div :key="ei" v-html="e" />
            </template>
          </div>
          <div class="flex">
            <div v-if="r.main" class="portrait">
              <b-img-lazy :src="getImageURL(r.main.character.icon)" :title="r.main.character.name" :id="'portrait_m_'+ri" width="100" rounded />
              <b-popover v-if="displayType>=1" :target="'portrait_m_'+ri" :title="r.main.character.name" triggers="hover click blur" :delay="{show:0, hide:250}" no-fade placement="top">
                <div class="status flex">
                  <b-img-lazy :src="getImageURL(r.main.character.class)" :title="'クラス:'+r.main.character.class" height="25" />
                  <b-img-lazy :src="getImageURL(r.main.character.symbol)" :title="'シンボル:'+r.main.character.symbol" height="25" />
                  <b-img-lazy :src="getImageURL(r.main.character.rarity)" :title="'レアリティ:'+r.main.character.rarity" height="20" />
                  <div class="param-box"><b-img-lazy :src="getImageURL(r.main.character.damageType)" :title="'攻撃タイプ:'+r.main.character.damageType" width="20" height="20" /></div>
                  <div class="param-box"><b-img-lazy :src="getImageURL('射程')" title="射程" width="18" height="18" /><span>{{r.main.character.range}}</span></div>
                  <div class="param-box"><b-img-lazy :src="getImageURL('移動')" title="移動" width="18" height="18" /><span>{{r.main.character.move}}</span></div>
                  <div class="param-box"><span class="param-name">実装日:</span><span class="param-value">{{r.main.character.date}}</span></div>
                </div>
                <div class="status flex">
                  <template v-for="(skill, si) in r.main.character.skills">
                    <b-img-lazy :src="getImageURL(skill.icon)" :title="skill.name" width="50" :key="si" />
                  </template>
                </div>
              </b-popover>
            </div>
            <div v-if="r.main" class="detail" v-show="displayType >= 1">
              <div class="skills">
                <div class="skill" v-for="(skill, si) in r.main.skills" :class="getSkillClass(skill)" :key="si">
                  <div class="flex">
                    <div class="icon">
                      <b-img-lazy :src="getImageURL(skill.icon)" :title="skill.name" width="50" :id="'skill_m_'+ri+'_'+si" />
                      <b-popover :target="'skill_m_'+ri+'_'+si" :title="skill.name" triggers="hover click blur" :delay="{show:0, hide:250}" no-fade placement="top">
                        <div v-if="skill.owners" class="owners">
                          所持者:<br />
                          <template v-for="(owner, oi) in skill.owners">
                            <b-img-lazy :src="getImageURL(owner.icon)" :title="owner.name" width="50" :key="oi" />
                          </template>
                        </div>
                      </b-popover>
                    </div>
                    <div class="desc" v-show="displayType >= 2">
                      <div class="flex">
                        <h6>{{ skill.name }}</h6>
                        <div class="param-group" v-html="skillParamsToHtml(skill)"></div>
                      </div>
                      <p>
                        <span v-html="descToHtml(skill, true)" />
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
              <b-img-lazy :src="getImageURL(r.summon.character.icon)" :title="`${r.summon.character.name} (召喚ユニット)`" :id="'portrait_m_'+ri" width="100" rounded />
            </div>
            <div v-if="r.summon" class="detail" v-show="displayType >= 1">
              <div class="skills">
                <div class="skill" v-for="(skill, si) in r.summon.skills" :class="getSkillClass(skill)" :key="si">
                  <div class="flex">
                    <div class="icon">
                      <b-img-lazy :src="getImageURL(skill.icon)" :title="skill.name" width="50" :id="'skill_x_'+ri+'_'+si" />
                      <b-popover :target="'skill_x_'+ri+'_'+si" :title="skill.name" triggers="hover click blur" :delay="{show:0, hide:250}" no-fade placement="top">
                        <div v-if="skill.owners" class="owners">
                          所持者:<br />
                          <b-link v-for="(owner, oi) in skill.owners" :key="oi" @click="addPrioritized(owner)">
                            <b-img-lazy :src="getImageURL(owner.icon)" :title="owner.name" width="50" height="50" />
                          </b-link>
                        </div>
                      </b-popover>
                    </div>
                    <div class="desc" v-show="displayType >= 2">
                      <div class="flex">
                        <h6>{{ skill.name }}</h6>
                        <div class="param-group" v-html="skillParamsToHtml(skill)"></div>
                      </div>
                      <p>
                        <span v-html="descToHtml(skill, true)" />
                        <span v-if="skill.note" class="note" v-html="noteToHtml(skill)" />
                        <span class="note" v-html="effectsToHtml(skill, r.main)" />
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

<script>
import ChrSelector from '../parts/ChrSelector.vue'
import ItemSelector from '../parts/ItemSelector.vue'
import jsonConstants from '../../assets/constants.json'
import jsonMainActive from '../../assets/main_active.json'
import jsonMainPassive from '../../assets/main_passive.json'
import jsonMainTalents from '../../assets/main_talents.json'
import jsonMainChrs from '../../assets/main_characters.json'
import jsonSupportActive from '../../assets/support_active.json'
import jsonSupportPassive from '../../assets/support_passive.json'
import jsonSupportChrs from '../../assets/support_characters.json'
import jsonItems from '../../assets/items.json'
import common from "../common";

export default {
  name: 'SelfBufSimulator',
  components: {
  },
  props: {
  },
  mixins: [common],

  data() {
    return {
      classes: jsonConstants.classes,
      symbols: jsonConstants.symbols,
      damageTypes: jsonConstants.damageTypes,
      rarities: jsonConstants.rarities,

      filter: {
        class: [],
        symbol: [],
        damageType: [],
      },

      buffFields: [
        {
          key: "enabled",
          label: "",
        },
        {
          key: "label",
          label: "種類",
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

      buffTypes: [
        "最大HP",
        "アタック",
        "ディフェンス",
        "マジック",
        "レジスト",
        "テクニック",
        "ディフェンス無視",
        "レジスト無視",
        "与ダメージ",
        "与ダメージ(物理)",
        "与ダメージ(魔法)",
        "与ダメージ(スキル)",
        "与ダメージ(範囲スキル)",
        "与ダメージ(通常攻撃)",
        "ダメージ耐性",
        "ダメージ耐性(物理)",
        "ダメージ耐性(魔法)",
        "ダメージ耐性(範囲)",
        "クリティカル率",
        "クリティカル率耐性",
        "クリティカルダメージ倍率",
        "治療効果",
        "被治療効果",
      ],

      progress: {
        completed: true,
        pending: false,
        result: [],
      },
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
    this.setupItems(this.items);

    for (let s of this.mainActive) {
      if (this.matchTags(s.tags, /^再行動$/))
        s.hasReaction = true;
      if (this.matchTags(s.tags, /^シンボルスキル$/))
        s.isSymbolSkill = true;
    }

    this.searchTable = new Map();
    for (let s of [...this.mainActive, ...this.mainPassive, ...this.mainTalents, ...this.supActive, ...this.supPassive, ...this.items])
      this.searchTable.set(s.name, s);

    this.mainChrs.sort((a, b) => b.date.localeCompare(a.date));
    this.supChrs.sort((a, b) => b.date.localeCompare(a.date));
    this.items.sort((a, b) => b.date.localeCompare(a.date));

    for (let s of [...this.mainActive, ...this.mainPassive, ...this.mainTalents])
      this.removeEffectsOfSameType(s);

    this.weapons = this.items.filter(a => a.slot == "武器");
    this.armors = this.items.filter(a => a.slot == "鎧");
    this.helmets = this.items.filter(a => a.slot == "兜");
    this.accessories = this.items.filter(a => a.slot == "アクセサリ");
    this.amulets1 = this.items.filter(a => a.slot == "月のアミュレット");
    this.amulets2 = this.items.filter(a => a.slot == "太陽のアミュレット");

    this.validWeapons = (() => this.weapons.filter(a => this.mainCanEquip(a))).bind(this);
    this.validArmors = (() => this.armors.filter(a => this.mainCanEquip(a))).bind(this);
    this.validHelmets = (() => this.helmets.filter(a => this.mainCanEquip(a))).bind(this);
    this.validAccessories = (() => this.accessories.filter(a => this.mainCanEquip(a))).bind(this);

    this.fillFilter(this.filter.class, this.classes);
    this.fillFilter(this.filter.symbol, this.symbols);
    this.fillFilter(this.filter.damageType, this.damageTypes);


    const makeOptions = function (params) {
      let r = {};
      for (const p of params) {
        const v = p.value;
        p.type = typeof v;
        p.reset = function () { this.value = v; };
        r[p.name] = p;
      }
      return r;
    };
    this.options = makeOptions([
      { name: "maxPickup", label: "人を選出", value: 10, min: 1, max: 50 },
      { name: "maxActiveCount", label: "アクティブ数制限 (再行動ありを除く)", value: 1, min: 0, max: 3 },
      { name: "allowTalent", label: "タレントを含める", value: true },
      { name: "allowPassive", label: "パッシブスキルを含める", value: true },
      { name: "allowActive", label: "アクティブスキルを含める", value: true },
      { name: "allowEngageSkills", label: "エンゲージスキルを含める", value: true },
      { name: "allowOnBattle", label: "戦闘時発動効果を含める", value: true },
      { name: "allowProbability", label: "確率発動効果を含める", value: true },
      { name: "allowNonReaction", label: "再行動なしバフスキルを含める", value: false },
    ]);


    const makeParams = function (effectType, types) {
      const make = function (t) {
        const valueType = `${t.label}${effectType}`;
        return {
          label: t.label,
          enabled: false,
          valueType: valueType,

          reset() {
            this.enabled = false;
          }
        };
      }
      return types.map(a => make(a));
    };
    this.buffs = makeParams("+", [
      { label: "アタック/マジック" },
      { label: "ディフェンス" },
      { label: "レジスト" },
      { label: "クリティカル率" },
      { label: "クリティカルダメージ倍率" },
      { label: "与ダメージ" },
      { label: "与ダメージ(物理)" },
      { label: "与ダメージ(魔法)" },
      { label: "与ダメージ(スキル)" },
      { label: "与ダメージ(範囲スキル)" },
      { label: "与ダメージ(通常攻撃)" },
      { label: "ダメージ耐性" },
      { label: "ダメージ耐性(物理)" },
      { label: "ダメージ耐性(魔法)" },
    ]);
    this.debuffs = makeParams("-", [
      { label: "アタック", limit: 70 },
      { label: "ディフェンス", limit: 70 },
      { label: "マジック", limit: 70 },
      { label: "レジスト", limit: 70 },
      { label: "与ダメージ", limit: 70 },
      { label: "ダメージ耐性" },
      { label: "ダメージ耐性(物理)" },
      { label: "ダメージ耐性(魔法)" },
    ]);


    this.parseParamsUrl(window.location.href);
  },
  
  mounted() {
  },

  methods: {
    filterMatchMainChr(chr, filter = this.filter) {
      return (!filter.class || this.filterMatch(filter.class, chr.classId)) &&
        (!filter.symbol || this.filterMatch(filter.symbol, chr.symbolId)) &&
        (!filter.damageType || this.filterMatch(filter.damageType, chr.damageTypeId));
    },

    removeEffectsOfSameType(skill) {
      const doRemove = function (effects) {
        if (!effects)
          return;

        const countEffect = function (effect) {
          let count = 0;
          for (const e of effects) {
            if (e.type == effect.type && e.target == effect.target && e.ephemeral == effect.ephemeral && e.slot == effect.slot &&
              e.timing == effect.timing && Math.sign(e.value) == Math.sign(effect.value)) {
              ++count;
            }
          }
          return count;
        }

        for (let i = 0; i < effects.length;) {
          if (countEffect(effects[i]) > 1) {
            console.log(effects[i]);
            effects.splice(i, 1);
          }
          else
            ++i;
        }
      };
      doRemove(skill.buff);
    },

    doSearch() {
      const opt = this.optionValues;
      const enabledBuffEffects = this.buffs.filter(a => a.enabled).map(a => a.label);
      const enabledDebuffEffects = this.debuffs.filter(a => a.enabled).map(a => a.label);
      for (let chr of this.mainChrs) {
        if (chr.engage) {
          chr.skills = opt.allowEngageSkills ? chr.engage.skills : chr.skillsBase;
        }
      }

      const getSkillScore = function (chr, skill) {
        let r = {
          score: 0,
          skill: skill,
          usedEffects: [],
          conflictedEffects: [],
        };
        if ((!opt.allowTalent && skill.isTalent) || (!opt.allowPassive && skill.isPassive) || (!opt.allowActive && skill.isActive)) {
          return r;
        }

        const evalCondition = function (effect) {
          if ((!effect.value && !effect.variable) || (skill.isActive && effect.ephemeral && !effect.duration))
            return;

          const cond = effect.condition;
          const probability = cond?.probability;
          if ((!opt.allowOnBattle && effect.ephemeral) || (!opt.allowProbability && probability) ||
            (!opt.allowNonReaction && skill.isActive && !skill.hasReaction && !skill.damageRate))
            return false;
          return true;
        };

        if (skill.buff) {
          for (const effect of skill.buff) {
            if (!(enabledBuffEffects.includes(effect.type) || (enabledBuffEffects.includes("アタック/マジック") && effect.type == chr.damageType)))
              continue;
            if (!evalCondition(effect))
              continue;

            r.score += this.getEffectValue(effect);
            r.usedEffects.push(effect);
          }
        }
        if (skill.debuff) {
          for (const effect of skill.debuff) {
            if (!enabledDebuffEffects.includes(effect.type))
              continue;
            if (!evalCondition(effect))
              continue;

            r.score += this.getEffectValue(effect);
            r.usedEffects.push(effect);
          }
        }
        return r;
      }.bind(this);

      let scoreTableChr = [];
      for (const chr of this.mainChrs) {
        if (!this.filterMatchMainChr(chr))
          continue;

        let skillScore = chr.skills.map(skill => getSkillScore(chr, skill));
        skillScore = skillScore.sort((a, b) => b.score - a.score).slice(0, 3);
        skillScore = [getSkillScore(chr, chr.talent), ...skillScore].filter(a => a.score > 0);

        let score = {
          name: chr.name,
          score: 0,
          main: {
            character: chr,
            usedEffects: skillScore.reduce((total, current) => total.concat(current.usedEffects), []),
            conflictedEffects: skillScore.reduce((total, current) => total.concat(current.conflictedEffects), []),
            skills: skillScore.map(ss => ss.skill),
          }
        };
        score.score = skillScore.reduce((total, current) => total + current.score, 0);
        scoreTableChr.push(score);
      }
      scoreTableChr = scoreTableChr.sort((a, b) => b.score - a.score).slice(0, 20);

      this.progress.result = scoreTableChr;
      console.log(scoreTableChr);
    },

    getParamClass(param) {
      return param.disabled() ? "disabled" : "";
    },
    getSkillClass(skill) {
      return {
        active: skill.isActive,
        passive: skill.isPassive,
      }
    },
    effectsToHtml(skill, ctx) {
      let lines = [];
      for (const v of this.enumerate(skill.buff, skill.debuff)) {
        if (["ランダム"].includes(v.type)) {
          continue;
        }

        let additionalClass = "";
        let prefix = v.isDebuff ? "-" : "+";
        let onBattle = v.ephemeral ? "(戦闘時)" : "";
        let unit = "";
        let title = "";
        if (ctx.usedEffects.includes(v)) {
          additionalClass += " caution";
        }
        if (ctx.conflictedEffects.includes(v)) {
          additionalClass += " blue";
          title = "アクティブ同士で競合、または既に上限に達している";
        }
        if (!["移動", "射程", "範囲"].includes(v.type)) {
          unit = "%";
        }
        lines.push(`<div class="effect-box"><span class="effect ${additionalClass}" title="${title}">${v.type}${onBattle}${prefix}${this.getEffectValue(v)}${unit}</span></div>`);
      }
      return lines.length ? `<div class="effect-group">${lines.join("")}</div>` : "";
    },
    highlight(id, enabled) {
      var element = document.getElementById(id);
      if (enabled)
        element.classList.add("param-highlighted");
      else
        element.classList.remove("param-highlighted");
    },

    getEffectValue(effect) {
      let r = 0;
      if (effect.value) {
        r = effect.value;
      }
      if (effect.variable) {
        if (Array.isArray(effect.variable.max)) {
          r = effect.variable.max[effect.variable.max.length - 1];
        }
        else {
          r = effect.variable.max;
        }
      }
      if (effect.maxStack) {
        r *= effect.maxStack;
        console.log(effect);
      }
      return r;
    },

    chrEffectsToHtml(rec) {
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

    findItem(name) {
      const r = this.searchTable.get(name);
      if (!r)
        console.log(`${name} not found`);
      return r;
    },

    matchClass(item, chr) {
      if (item) {
        if (!item.classes || item.classes.includes(chr.class))
          return true;
      }
      return false;
    },
    mainCanEquip(item, slot = null) {
      if (this.matchClass(item, this.main.character.value)) {
        if (!slot || item.slot == slot)
          return true;
      }
      return false;
    },
    supportCanEquip(item, slot, aux) {
      if (item) {
        if (!slot || item.slot == slot) {
          if (slot == "アミュレット")
            return !aux || item.amuletType == aux;
          else
            return true;
        }
      }
      return false;
    },

    validateItems() {
      var mainItems = this.mainItems;
      var supItems = this.supportItems;
      if (!this.mainCanEquip(mainItems.weapon.value, '武器'))
        mainItems.weapon.value = null;
      if (!this.mainCanEquip(mainItems.armor.value, '鎧'))
        mainItems.armor.value = null;
      if (!this.mainCanEquip(mainItems.helmet.value, '兜'))
        mainItems.helmet.value = null;
      if (!this.mainCanEquip(mainItems.accessory.value, 'アクセサリ'))
        mainItems.accessory.value = null;

      if (!this.supportCanEquip(supItems.amulet1.value, 'アミュレット', '月'))
        supItems.amulet1.value = null;
      if (!this.supportCanEquip(supItems.amulet2.value, 'アミュレット', '太陽'))
        supItems.amulet2.value = null;
    },


    getParamsUrl() {
      let params = [];

      for (const v of Object.values(this.main)) {
        if (v.type == "character")
          params.push(v.value ? v.value.index : 0);
        else
          params.push(v.value);
      }
      for (const v of Object.values(this.mainBoosts))
        params.push(v.value);
      for (const v of Object.values(this.mainItems))
        params.push(v.value ? v.value.index : 0);
      for (const v of Object.values(this.mainEnchants)) {
        params.push(v.valueP);
        params.push(v.valueF);
      }

      for (const v of Object.values(this.support)) {
        if (v.type == "character")
          params.push(v.value ? v.value.index : 0);
        else
          params.push(v.value);
      }
      for (const v of Object.values(this.supportBoosts))
        params.push(v.value);
      for (const v of Object.values(this.supportItems))
        params.push(v.value ? v.value.index : 0);
      for (const v of Object.values(this.supportEnchants))
        params.push(v.valueP);

      let url = window.location.href.replace(/\?.+/, '').replace(/#.+/, '');
      url += "?stat=" + params.join(',') + "#status";
      //this.parseParamsUrl(url); // debug
      return url;
    },

    parseParamsUrl(url) {
      url = decodeURIComponent(url);
      let q = url.match(/\?stat=(.+)$/);
      if (q) {
        let params = q[1].split(',').map(this.parseValue);

        for (const v of Object.values(this.main)) {
          if (v.type == "character") {
            const idx = params.shift();
            v.value = this.mainChrs.find(a => a.index == idx);
          }
          else {
            v.value = params.shift();
          }
        }
        for (const v of Object.values(this.mainBoosts))
          v.value = params.shift();
        for (const v of Object.values(this.mainItems)) {
          const idx = params.shift();
          v.value = this.items.find(a => a.index == idx);
        }
        for (const v of Object.values(this.mainEnchants)) {
          v.valueP = params.shift();
          v.valueF = params.shift();
        }

        for (const v of Object.values(this.support)) {
          if (v.type == "character") {
            const idx = params.shift();
            v.value = this.supChrs.find(a => a.index == idx);
          }
          else {
            v.value = params.shift();
          }
        }
        for (const v of Object.values(this.supportBoosts))
          v.value = params.shift();
        for (const v of Object.values(this.supportItems)) {
          const idx = params.shift();
          v.value = this.items.find(a => a.index == idx);
        }
        for (const v of Object.values(this.supportEnchants))
          v.valueP = params.shift();

        return true;
      }
      return false;
    },
  },

  computed: {
    optionValues() {
      const opt = this.options;
      let r = {};
      for (const k in opt)
        r[k] = opt[k].value;
      return r;
    },
  }
};
</script>

<style scoped>
.input-dropdown {
  padding: 0.1em;
}

.about h2 {
  font-size: 1.75em;
  margin-left: 1em;
}

.about h3 {
  font-size: 1.5em;
  margin-left: 1em;
}
</style>
