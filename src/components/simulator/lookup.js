import jsonConstants from '../../assets/constants.json'
import jsonMainActive from '../../assets/main_active.json'
import jsonMainPassive from '../../assets/main_passive.json'
import jsonMainTalents from '../../assets/main_talents.json'
import jsonMainChrs from '../../assets/main_characters.json'
import jsonSupportActive from '../../assets/support_active.json'
import jsonSupportPassive from '../../assets/support_passive.json'
import jsonSupportChrs from '../../assets/support_characters.json'
import jsonItems from '../../assets/items.json'
import common from "../common.js";

export default {
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
        rarity: [],
      },

      options: [],
      buffs: [],
      debuffs: [],
      excluded: [],
      prioritized: [],

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
    this.weapons = this.items.filter(a => a.slot == "武器");
    this.armors = this.items.filter(a => a.slot == "鎧");
    this.helmets = this.items.filter(a => a.slot == "兜");
    this.accessories = this.items.filter(a => a.slot == "アクセサリ");

    this.setupCharacters(this.mainChrs, this.mainActive, this.mainPassive, this.mainTalents);
    this.setupCharacters(this.supChrs, this.supActive, this.supPassive);
    this.setupItems(this.items);

    let idx = 0;
    for (let list of [this.mainChrs, this.mainActive, this.mainPassive,
      this.mainTalents, this.supChrs, this.supActive, this.supPassive,
      this.items])
    {
      for (let item of list)
        item.index = ++idx;
    }
    this.itemCount = idx;

    this.searchTableWithId = new Map();
    this.searchTableWithName = new Map();
    for (let s of [...this.mainActive, ...this.mainPassive, ...this.mainTalents, ...this.supActive, ...this.supPassive, ...this.items]) {
      this.searchTableWithId.set(s.uid, s);
      this.searchTableWithName.set(s.name, s);
    }

    let effectTypeIndex = 1;
    let effectTypeNames = ["???"];
    let effectTypeTable = new Map();
    let slotIndex = 1;
    let slotTable = new Map();
    const effectTypes = [
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
      "射程(通常攻撃)",
      "射程(スキル)",
      "範囲",
      "移動",
      "ランダム",
    ];
    for (const et of effectTypes) {
      const key = `${et}+`;
      effectTypeTable.set(key, effectTypeIndex);
      effectTypeNames.push(key);
      effectTypeIndex++;
    }
    for (const et of effectTypes) {
      const key = `${et}-`;
      effectTypeTable.set(key, effectTypeIndex);
      effectTypeNames.push(key);
      effectTypeIndex++;
    }
    for (let skill of this.enumerate(this.mainActive, this.mainPassive, this.mainTalents, this.supActive, this.supPassive, this.items)) {
      for (let effect of this.enumerateEffects(skill)) {
        let effectType = effect.type;
        if (effect.isBuff)
          effectType += "+";
        else if (effect.isDebuff)
          effectType += "-";
        effect.effectType = effectType;

        if (effect.target == "単体")
          effect.isSingleTarget = true;

        effect.effectTypeIndex = effectTypeTable.get(effectType);
        if (!effect.effectTypeIndex) {
          effectTypeTable.set(effectType, effectTypeIndex);
          effect.effectTypeIndex = effectTypeIndex++;
          effectTypeNames.push(effectType);
        }

        if (skill.isActive) {
          const slot = effect.slot;
          effect.slotIndex = slotTable.get(slot);
          if (!effect.slotIndex) {
            slotTable.set(slot, slotIndex);
            effect.slotIndex = slotIndex++;
          }
        }
      }
    }
    this.effectTypeIndex = effectTypeIndex;
    this.effectTypeNames = effectTypeNames;
    this.effectTypeTable = effectTypeTable;
    this.slotIndex = slotIndex;
    this.slotTable = slotTable;

    this.mainChrs.sort((a, b) => b.date.localeCompare(a.date));
    this.supChrs.sort((a, b) => b.date.localeCompare(a.date));
    this.items.sort((a, b) => b.date.localeCompare(a.date));

    this.fillFilter(this.filter.class, this.classes);
    this.fillFilter(this.filter.symbol, this.symbols);
    this.fillFilter(this.filter.damageType, this.damageTypes);
    this.fillFilter(this.filter.rarity, this.rarities);
  },

  methods: {
    BitFlags: class {
      constructor(arg) {
        if (typeof arg == "number") {
          const size = arg;
          // (size / 32) + (size % 32 ? 1 : 0)
          // 整数のまま処理するためビット演算
          const n = (size >> 5) + (size & 31 ? 1 : 0);
          this.data_ = new Uint32Array(n);
        }
        else if (arg.constructor === this.constructor) {
          const parent = arg;
          this.data_ = new Uint32Array(parent.data_);
        }
        else {
          throw "BitFlags(??????)";
        }
      }
      get(i) {
        const byte = i >> 5;
        const bit = i & 31;
        return (this.data_[byte] & (1 << bit)) != 0;
      }
      set(i, v) {
        const byte = i >> 5;
        const bit = i & 31;
        if (v)
          this.data_[byte] |= 1 << bit;
        else
          this.data_[byte] &= ~(1 << bit);
      }
    },

    filterMatchMainChr(chr, filter = this.filter) {
      return (!filter.class || this.filterMatch(filter.class, chr.classId)) &&
        (!filter.symbol || this.filterMatch(filter.symbol, chr.symbolId)) &&
        (!filter.damageType || this.filterMatch(filter.damageType, chr.damageTypeId)) &&
        (!filter.rarity || this.filterMatch(filter.rarity, chr.rarityId));
    },
    filterMatchSupChr(chr, filter = this.filter) {
      // チャレンジクエストはサポートのクラスは無制限なので、クラスフィルタは考慮しない
      return (!filter.rarity || this.filterMatch(filter.rarity, chr.rarityId));
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
            //console.log(effects[i]);
            effects.splice(i, 1);
          }
          else {
            ++i;
          }
        }
      };
      doRemove(skill.buff);
      doRemove(skill.debuff);
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

      if (skill.multiAction) {
        lines.push(`<div class="effect-box"><span class="effect">再行動</span></div>`);
      }
      for (const effect of this.enumerate(skill.buff, skill.debuff)) {
        if (["ランダム"].includes(effect.type)) {
          continue;
        }

        let value = this.getEffectValue(effect);
        if (effect.add) {
          value = `${effect.add.from}${effect.add.rate}`;
        }

        let additionalClass = "";
        let prefix = effect.isDebuff ? "-" : "+";
        let onBattle = effect.ephemeral ? "(戦闘時)" : "";
        let unit = "";
        let title = "";
        if (ctx.usedEffects.includes(effect)) {
          additionalClass += " caution";
        }
        if (ctx.conflictedEffects.includes(effect)) {
          additionalClass += " blue";
          title = "アクティブ同士で競合、または既に上限に達している";
        }
        if (!["移動", "射程(通常攻撃)", "射程(スキル)", "範囲"].includes(effect.type)) {
          unit = "%";
        }

        lines.push(`<div class="effect-box"><span class="effect ${additionalClass}" title="${title}">${effect.type}${onBattle}${prefix}${value}${unit}</span></div>`);
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

    getEffectValues(effectList, dst = null) {
      if (!dst) {
        dst = new Int32Array(this.effectTypeIndex);
        dst.fill(0);
      }
      for (const e of effectList)
        dst[e.effectTypeIndex] += this.getEffectValue(e);
      return dst;
    },
    effectParamsToHtml(data) {
      let lines = [];
      for (let i = 0; i < this.effectTypeIndex; ++i) {
        const name = this.effectTypeNames[i];
        let v = data[i];
        let unit = ["移動+"].includes(name) ? "" : "%";
        if (v) {
          lines.push(`<div class="effect-box"><span class="effect caution">${name}${v}${unit}</span></div>`);
        }
      }
      return lines;
    },
    chrEffectsToHtml(r) {
      const data = this.getEffectValues(r.main.usedEffects);
      return this.effectParamsToHtml(data);
    },
    allEffectsToHtml(recs) {
      let data = null;
      for (let r of recs)
        data = this.getEffectValues(r.usedEffects, data);
      return this.effectParamsToHtml(data);
    },


    // 優先/除外処理
    _addPriorityItem(list, item, owner) {
      const cb = owner ?
        a => a.owner == owner && a.item == item :
        a => a == item;
      let i = list.findIndex(cb);
      if (i >= 0)
        list.splice(i, 1);

      list.splice(0, 0, owner ? { item: item, owner: owner } : item);
    },
    _isInPrioritizeList(list, item, owner = null) {
      if (list.includes(item))
        return true;
      else if (owner)
        return list.find(a => a.owner == owner && a.item == item) != null;
      return false;
    },
    addPrioritized(item, owner = null) {
      this._addPriorityItem(this.prioritized, item, owner);
    },
    removePrioritized(item) {
      this.prioritized.splice(this.prioritized.indexOf(item), 1);
    },
    isPrioritized(item, owner = null) {
      return this._isInPrioritizeList(this.prioritized, item, owner);
    },
    addExcluded(item, owner = null) {
      this._addPriorityItem(this.excluded, item, owner);
    },
    removeExcluded(item) {
      this.excluded.splice(this.excluded.indexOf(item), 1);
    },
    isExcluded(item, owner = null) {
      return this._isInPrioritizeList(this.excluded, item, owner);
    },


    // バフやデバフの効果量取得処理
    getEffectValue(effect) {
      let r = 0;
      if (effect.value) {
        r = effect.value;
        if (effect.maxStack) {
          // 効果が重複するタイプ
          // フルスペック時の効果を返す
          r *= effect.maxStack;
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

    findItemById(id) {
      const r = this.searchTableWithId.get(id);
      if (!r)
        console.log(`id:${id} not found`);
      return r;
    },
    findItemByName(name) {
      const r = this.searchTableWithName.get(name);
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
  },

  watch: {
    filter: { handler: function () { this.updateQuery(); }, deep: true },
    options: { handler: function () { this.updateQuery(); }, deep: true },
    buffs: { handler: function () { this.updateQuery(); }, deep: true },
    debuffs: { handler: function () { this.updateQuery(); }, deep: true },
    prioritized: function () { this.updateQuery(); },
    excluded: function () { this.updateQuery(); },
  },

  updated: function () {
    // ペンディングリクエストが残っていたら再検索
    if (this.progress.pending && this.progress.completed) {
      if (this.beginSearch()) {
        this.progress.pending = false;
      }
    }
  },
}