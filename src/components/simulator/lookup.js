import jsonConstants from '../../assets/constants.json'
import jsonMainActive from '../../assets/main_active.json'
import jsonMainPassive from '../../assets/main_passive.json'
import jsonMainTalents from '../../assets/main_talents.json'
import jsonMainChrs from '../../assets/main_characters.json'
import jsonSupportActive from '../../assets/support_active.json'
import jsonSupportPassive from '../../assets/support_passive.json'
import jsonSupportChrs from '../../assets/support_characters.json'
import jsonItems from '../../assets/items.json'

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

    isGetSet(obj, name) {
      const desc = Object.getOwnPropertyDescriptor(obj, name);
      if (desc) {
        if (desc.get)
          return true;
        if (desc.set)
          return true;
      }
      return false;
    },


    setupDB() {
      let g = this;

      g.mainActive = structuredClone(jsonMainActive);
      g.mainPassive = structuredClone(jsonMainPassive);
      g.mainTalents = structuredClone(jsonMainTalents);
      g.mainChrs = structuredClone(jsonMainChrs).filter(a => !a.hidden);

      g.supActive = structuredClone(jsonSupportActive);
      g.supPassive = structuredClone(jsonSupportPassive);
      g.supChrs = structuredClone(jsonSupportChrs).filter(a => !a.hidden);

      g.items = structuredClone(jsonItems).filter(a => !a.hidden);

      this.setupCharacters(g.mainChrs, g.mainActive, g.mainPassive, g.mainTalents);
      this.setupCharacters(g.supChrs, g.supActive, g.supPassive);
      this.setupItems(g.items);

      g.mainChrs.sort((a, b) => b.date.localeCompare(a.date));
      g.supChrs.sort((a, b) => b.date.localeCompare(a.date));
      g.items.sort((a, b) => b.date.localeCompare(a.date));

      g.weapons = g.items.filter(a => a.slot == "武器");
      g.armors = g.items.filter(a => a.slot == "鎧");
      g.helmets = g.items.filter(a => a.slot == "兜");
      g.accessories = g.items.filter(a => a.slot == "アクセサリ");
      g.amulets1 = g.items.filter(a => a.slot == "月のアミュレット");
      g.amulets2 = g.items.filter(a => a.slot == "太陽のアミュレット");

      g.searchTableWithUid = new Map();
      g.searchTableWithName = new Map();
      let idx = 0;
      for (let list of [
        g.mainChrs, g.mainActive, g.mainPassive, g.mainTalents,
        g.supChrs, g.supActive, g.supPassive,
        g.items
      ]) {
        for (let item of list) {
          item.index = ++idx;
          g.searchTableWithUid.set(item.uid, item);
          g.searchTableWithName.set(item.name, item);
        }
      }
      g.itemCount = idx;

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
      for (let skill of this.enumerate(g.mainActive, g.mainPassive, g.mainTalents, g.supActive, g.supPassive, g.items)) {
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
      g.effectTypeIndex = effectTypeIndex;
      g.effectTypeNames = effectTypeNames;
      g.effectTypeTable = effectTypeTable;
      g.slotIndex = slotIndex;
      g.slotTable = slotTable;
    },
    setupFilter() {
      this.fillFilter(this.filter.class, this.classes);
      this.fillFilter(this.filter.symbol, this.symbols);
      this.fillFilter(this.filter.damageType, this.damageTypes);
      this.fillFilter(this.filter.rarity, this.rarities);
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

    findItemByUid(uid) {
      const r = this.searchTableWithUid.get(uid);
      if (!r)
        console.log(`uid:${uid} not found`);
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


    serializeParams() {
      const isGetSet = this.isGetSet;

      const handleOptions = function (obj) {
        return Object.values(obj).map(a => a.value);
      };
      const handleFilter = function (obj) {
        return Object.values(obj).map(a => this.serializeFilter(a));
      }.bind(this);
      const handleBuffs = function (list) {
        let r = [];
        const props = ["enabled", "limit_", "weight"];
        for (const obj of list) {
          let tmp = [];
          for (const prop of props) {
            if (Object.hasOwn(obj, prop)) {
              tmp.push(obj[prop]);
            }
          }
          r.push(tmp);
        }
        return r;
      };
      const handleExcludes = function (list) {
        let r = [];
        for (let v of list) {
          if (v.owner != undefined)
            r.push([v.item.uid, v.owner.uid]);
          else
            r.push(v.uid);
        }
        return r;
      };

      let r = {};
      r.options = handleOptions(this.options);
      r.filter = handleFilter(this.filter);
      r.buffs = handleBuffs(this.buffs);
      r.debuffs = handleBuffs(this.debuffs);
      r.excluded = handleExcludes(this.excluded);
      r.prioritized = handleExcludes(this.prioritized);
      return r;
    },
    deserializeParams(obj) {
      const isGetSet = this.isGetSet;
      const findItemByUid = this.findItemByUid;

      const handleOptions = function (dst, src) {
        dst = Object.values(dst);
        if (src && dst.length == src.length) {
          for (let i = 0; i < dst.length; ++i) {
            if (typeof dst[i].value == typeof src[i])
              dst[i].value = src[i];
          }
        }
      };
      const handleFilter = function (dst, src) {
        dst = Object.values(dst);
        if (src && dst.length == src.length) {
          for (let i = 0; i < dst.length; ++i) {
            this.deserializeFilter(dst[i], src[i]);
          }
        }
      }.bind(this);
      const handleBuffs = function (dst, src) {
        if (src && dst.length == src.length) {
          for (let i = 0; i < dst.length; ++i) {
            let d = dst[i];
            let s = src[i];
            const props = ["enabled", "limit_", "weight"];
            for (const prop of props) {
              if (Object.hasOwn(d, prop)) {
                d[prop] = s.shift();
              }
            }
          }
        }
      };
      const handleExcludes = function (dst, src) {
        if (src) {
          dst.splice(0, dst.length);
          for (let v of src) {
            if (Array.isArray(v)) {
              let t = {
                item: findItemByUid(v[0]),
                owner: findItemByUid(v[1]),
              }
              if (t.item && t.owner)
                dst.push(t);
            }
            else {
              let t = findItemByUid(v);
              if (t)
                dst.push(t);
            }
          }
        }
        return dst;
      };

      handleOptions(this.options, obj.options);
      handleFilter(this.filter, obj.filter);
      handleBuffs(this.buffs, obj.buffs);
      handleBuffs(this.debuffs, obj.debuffs);
      handleExcludes(this.excluded, obj.excluded);
      handleExcludes(this.prioritized, obj.prioritized);
    },

    getParamsUrl() {
      let params = this.serializeParams();
      let t = "";

      let url = window.location.href.replace(/\?.+/, '').replace(/#.+/, '');
      url += "?";

      let m = window.location.href.match(/(t=\d)/, '');
      if (m) {
        url += m[1];
        url += "&";
      }
      url += "p=" + encodeURIComponent(JSON.stringify(params));
      return url;
    },
    parseParamsUrl(url) {
      let params = {};

      let q = url.match(/\bt=(\d)/);
      if (q) {
        params.t = parseInt(q[1]);
      }

      q = url.match(/\bp=(.+)$/);
      if (q) {
        params.p = JSON.parse(decodeURIComponent(q[1]));
      }
      //console.log(params);
      return params;
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