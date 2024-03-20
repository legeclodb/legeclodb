import { $g } from "./battle_globals.js";
import { callHandler, makeSimSkill, makeSimEffect, evaluateCondition, makeActionContext, getEffectValue } from "./battle_skill.js";
import { unique, count } from "../utils.js";

function $vue() {
  return window.$vue;
}

export function mergeChrData(dst, src) {
  const props = [
    "isMain", "isSupport",
    "name", "icon", "class", "rarity", "symbol", "supportType", "damageType",
    "range", "move", "shape",
  ];
  if (src) {
    for (const prop of props) {
      if (prop in src)
        dst[prop] = src[prop];
      else
        delete dst[prop];
    }
  }
  else {
    for (const prop of props) {
      delete dst[prop];
    }
  }
}

export const Shape = {
  Diamond: 0x00, // 菱形(範囲)
  Square: 0x01, // 正方形(周囲)
  Directional: 0x02, // 直線
  Special: 0x03, // 特殊形状指定
  HollowDiamond: 0x10, // 自身を除く範囲
  HollowSquare: 0x11, // 自身を除く周囲
};
export function parseArea(args) {
  let size = 0;
  let shape = Shape.Diamond;
  if (typeof (args) === 'number') {
    size = args;
  }
  else if (Array.isArray(args)) {
    size = Array.isArray(args[0]) ? args[0].at(-1) : args[0];
    if (args[1] == '範囲') { shape = Shape.Diamond; }
    else if (args[1] == '周囲') { shape = Shape.Square; }
    else if (args[1] == '直線') { shape = Shape.Directional; }
    else if (args[1] == '特殊') { shape = Shape.Special; }
    else if (args[1] == '範囲(自身を除く)') { shape = Shape.HollowDiamond; }
    else if (args[1] == '周囲(自身を除く)') { shape = Shape.HollowSquare; }
  }
  return [size, shape];
}

export function isInside(pos, center, size, shape) {
  let dx = Math.abs(pos[0] - center[0]);
  let dy = Math.abs(pos[1] - center[1]);
  if ((shape & 0x10) != 0 && (dx + dy == 0)) {
    return false;
  }
  if ((shape & 0x0f) == Shape.Diamond) {
    return (dx + dy) <= size;
  }
  else if ((shape & 0x0f) == Shape.Square) {
    return Math.max(dx, dy) <= size;
  }
  else if (shape == Shape.Directional) {
    return Math.max(dx, dy) <= size && (pos[0] == center[0] || pos[1] == center[1]);
  }
  else if (shape == Shape.Special) {
    throw new Error("isInside(): 未対応");
  }
}


export class BaseUnit {
  isEnemy = false;
  isPlayer = false;

  base = BaseUnit.emptyUnit;
  sim = null;
  editorData = [];
  showEditor = false;

  static get emptyUnit() {
    return {
      coord: [0, 0],
      main: {
        cid: "",
        skills: [],
        items: [],
        status: [0, 0, 0, 0, 0, 0], // 基礎ステ
      },
      support: {
        cid: "",
        skills: [],
        items: [],
        status: [0, 0, 0, 0, 0, 0], // 基礎ステ
      },
      summon: [],
    };
  }

  get coord() {
    //return this.base.coord;
    return [...(this.sim ? this.sim.coord : this.base.coord)];
  }
  set coord(v) {
    if (this.sim)
      this.sim.coord = [...v];
    else
      this.base.coord = [...v];
  }
  get isValid() { return this.main.cid; }
  get main() { return this.sim ? this.sim.main : this.base.main; }
  get support() { return this.sim ? this.sim.support : this.base.support; }
  get hasSupport() { return this.base.support.cid; }
  get actions() { return this.sim ? this.sim.actions : []; }

  get move() {
    if (this.sim) {
      return this.sim.move < 0 ? this.sim.main.move : this.sim.move;
    }
    else {
      return this.main.move;
    }
  }
  get range() { return this.sim ? this.sim.main.range : this.main.range; }
  get isAlive() { return this.sim ? this.sim.isAlive : false; }
  get isActive() { return this.sim ? this.sim.isActive : false; }

  get isNxN() { return Boolean(this.base.main?.shape); }
  get shape() { return this.base.main?.shape; }
  get occupiedCells() { return this.enumerateOccupiedCells(); }

  constructor(isPlayer = true) {
    if (isPlayer)
      this.isPlayer = true;
    else
      this.isEnemy = true;
  }
  initialize() {
    const emp = BaseUnit.emptyUnit;
    Object.assign(this.base.main, emp.main);
    Object.assign(this.base.support, emp.support);
    this.showEditor = false;
    this.editorData = [];

    mergeChrData(this.base.main, null);
    mergeChrData(this.base.support, null);
  }
  setup() {
    const defineStatusGetter = (self) => {
      const table = {
        baseHp: function () { return this.status[0]; },
        baseAtk: function () { return this.status[1]; },
        baseDef: function () { return this.status[2]; },
        baseMag: function () { return this.status[3]; },
        baseRes: function () { return this.status[4]; },
        baseTec: function () { return this.status[5]; },
      };
      for (const [key, func] of Object.entries(table)) {
        Object.defineProperty(self, key, {
          configurable: true,
          get: func,
        });
      }
    };
    defineStatusGetter(this.base.main);
    defineStatusGetter(this.base.support);

    const makeSummonUnit = (chr) => {
      let main = Object.create(chr);
      Object.defineProperty(main, "skills", {
        get: () => [chr.talent, ...chr.skills],
      });
      main.cid = chr.uid;
      main.level = this.main.level ?? 114;
      main.status = $vue().getNPCChrStatus(main, main.level);

      let u = new BaseUnit(this.isPlayer);
      u.base.main = main;
      u.isSummon = true;
      u.setup();
      return u;
    };
    this.base.summon = [];
    for (let skill of this.base.main.skills) {
      if (skill.summon) {
        for (let sum of skill.summon) {
          if (!sum.makeUnit) {
            sum.makeUnit = () => makeSummonUnit(sum.chr);
          }
        }
        this.base.summon = this.base.summon.concat(skill.summon.map(a => a.makeUnit()));
      }
    }
    //console.log(this);
  }
  swap(v) {
    const swapProperty = $vue().swapProperty;
    swapProperty(this.base, v.base, "main");
    swapProperty(this.base, v.base, "support");
    swapProperty(this, v, "editorData");
  }

  saveState() {
    this.sim?.saveState();
  }
  loadState() {
    this.sim?.loadState();
  }

  serialize() {
    const serializeChr = function (src) {
      return {
        cid: src.cid,
        skills: src.skills.map(a => a.uid),
        items: src.items.map(a => a.uid),
        status: src.status,
        level: src.level,
      };
    };
    let r = {
      main: serializeChr(this.base.main),
      support: serializeChr(this.base.support),
      editorData: [...this.editorData],
    };
    return r;
  }
  deserialize(r) {
    const findItemByUid = $vue().findItemByUid;
    const deserializeChr = function (dst, src) {
      const chr = findItemByUid(src.cid);
      mergeChrData(dst, chr);
      dst.cid = src.cid;
      dst.skills = src.skills.map(findItemByUid);
      dst.items = src.items.map(findItemByUid);
      dst.status = [...src.status];
      dst.level = src.level;
    };
    deserializeChr(this.base.main, r.main);
    deserializeChr(this.base.support, r.support);
    this.editorData = [...r.editorData];
    this.setup();
  }
  edit(ss) {
    const findItemByUid = $vue().findItemByUid;
    const copyArray = $vue().copyArray;
    // エディタ側のオブジェクトとこちら側のオブジェクトは別個体なため、uid を元にこちら側のオブジェクトに差し替える。

    let main = this.base.main;
    const mainChr = findItemByUid(ss.main.character.value?.uid);
    mergeChrData(main, mainChr);
    main.cid = mainChr?.uid ?? "";
    main.skills = [];
    if (mainChr) {
      main.skills = [mainChr.talent, ...ss.mainSkills].filter(a => a).map(a => findItemByUid(a.uid));
    }
    main.items = [...ss.mainEnchantPassive, ...ss.mainItems].filter(a => a).map(a => findItemByUid(a.uid));
    main.status = ss.statMainResult.slice(0, 6);
    main.level = ss.main.level.value;

    let support = this.base.support;
    const supChr = findItemByUid(ss.support.character.value?.uid);
    mergeChrData(support, supChr);
    support.cid = supChr?.uid ?? "";
    support.skills = [];
    if (supChr) {
      support.skills = [...supChr.skills].filter(a => a).map(a => findItemByUid(a.uid));
    }
    support.items = ss.supportItems.filter(a => a).map(a => findItemByUid(a.uid));
    support.status = ss.statSupportResult.slice(0, 6);
    support.level = ss.support.level.value;

    copyArray(this.editorData, ss.serialize());

    this.setup();
    //console.log(this);
  }

  *enumerateOccupiedCells() {
    const shape = this.shape;
    if (shape) {
      for (let y = 0; y < shape.length; ++y) {
        for (let x = 0; x < shape[y].length; ++x) {
          if (shape[y][x]) {
            yield [x, y];
          }
        }
      }
    }
    else {
      yield this.coord;
    }
  }
}


export const UnitState = {
  End: 0,
  Ready: 1,
  MultiAction: 2,
  MultiMove: 3,
}

export class SimUnit {

  //#region fields
  base = null; // BaseUnit
  isDormant = false; // serializable 配置前 (出現ターン前) のユニットは true
  state = UnitState.Ready; // serializable
  move = -1; // serializable 残移動量。-1 だと main.move。
  coord = [0, 0]; // serializable
  main = {
    buf: {},
    bufCv: {}, // 変換系バフ (アタックの n% をマジックに加算 など)。内容は {"アタック": 100} などでそのまま加算する
    hp: 0, // serializable
    maxHp: 0,
  };
  support = {
    buf: {},
    bufCv: {},
    hp: 0, // serializable
    maxHp: 0,
  };
  ephemeralDebuf = {}; // 戦闘時に相手にかけるデバフ

  summon = []; // 召喚したユニット
  selfEffects = []; // SimEffect
  areaEffects = []; // SimEffect
  timedEffects = []; // serializable SimEffect
  score = 0; // serializable

  affectedEffects = {};
  affectedSkills = [];
  //#endregion fields


  //#region props
  get fid() { return this.base.fid; }
  get phase() { return this.base.phase; }
  get isAlive() { return this.main.hp > 0; }
  get isActive() { return !this.isDormant && this.isAlive; }
  get isPlayer() { return this.base.isPlayer; }
  get isEnemy() { return this.base.isEnemy; }
  get isSummon() { return this.base.isSummon; }
  get isNxN() { return this.base.isNxN; }
  get shape() { return this.base.shape; }
  get occupiedCells() { return this.base.occupiedCells; }
  get symbol() { return this.main.symbol; }
  get mainClass() { return this.main.class; }
  get hpRate() {
    if (!isFinite(this.main.hp)) {
      return 100;
    }
    else {
      return (this.main.hp + this.support.hp) / (this.main.maxHp + this.support.maxHp) * 100;
    }
  }

  get isReady() { return this.state == UnitState.Ready || this.state == UnitState.MultiAction; }
  get isEnded() { return this.state == UnitState.End; }
  get isOnMultiAction() { return this.state == UnitState.MultiAction; }
  get isOnMultiMove() { return this.state == UnitState.MultiMove; }

  get prevCoord() { return [...this.base.prevCoord]; }
  set prevCoord(v) { this.base.prevCoord = [...v]; }
  get activeBuffCount() {
    return this.timedEffects.reduce((total, e) => {
      if (e.isActiveBuff) {
        total += 1;
      }
      return total;
    }, 0);
  }
  get activeDebuffCount() {
    return this.timedEffects.reduce((total, e) => {
      if (e.isActiveDebuff) {
        total += 1;
      }
      return total;
    }, 0);
  }
  get actions() {
    return this.skills.filter(a => a.isActive);
  }
  get passives() {
    return this.skills.filter(a => a.isPassive || a.isTalent || a.isItem);
  }
  get effects() {
    return [...this.selfEffects, ...this.areaEffects, ...this.timedEffects];
  }
  //#endregion props


  //#region methods
  constructor(unit) {
    unit.sim = this;
    this.base = unit;
    this.coord = [...unit.base.coord];

    if (unit.phase && unit.phase != "0") {
      this.isDormant = true;
    }

    const addBattleProps = (chr, base) => {
      Object.defineProperty(chr, 'unit', {
        get: () => this,
      });

      Object.defineProperty(chr, 'baseStatus', {
        get: () => base.status,
      });

      let table = {
        isAlive: () => { return chr.hp > 0; },
        baseHp:  () => { return base.status[0]; },
        baseAtk: () => { return base.status[1]; },
        baseDef: () => { return base.status[2]; },
        baseMag: () => { return base.status[3]; },
        baseRes: () => { return base.status[4]; },
        baseTec: () => { return base.status[5]; },
        baseRange: () => { return base.range; },
        status: () => {
          const props = ["最大HP", "アタック", "ディフェンス", "マジック", "レジスト", "テクニック",];
          let r = [...base.status];
          for (let i = 0; i < r.length; ++i) {
            const prop = props[i];
            r[i] = Math.round(r[i] * ((chr.buf[prop] ?? 0) / 100 + 1) + (chr.bufCv[prop] ?? 0));
          }
          return r;
        },
        range: () => { return Math.max(base.range + (chr.buf["射程(通常攻撃)"] ?? 0), 0); },
      };
      if (chr.isMain) {
        table.baseMove = () => { return base.move; };
        table.move = () => { return Math.max(base.move + (chr.buf["移動"] ?? 0), 0); };
      }
      table.baseAttackPower = chr.damageType == "アタック" ?
        () => { return base.status[1]; } :
        () => { return base.status[3]; };

      for (const [key, func] of Object.entries(table)) {
        Object.defineProperty(chr, key, {
          configurable: true,
          get: func,
        });
      }
      chr.hp = chr.maxHp = chr.baseHp;
      chr.buf = {};
      chr.bufCv = {};

      chr.getBuffValue = (type) => {
        return chr.buf[type] ?? 0;
      }
      chr.getConvertedBuffValue = (type) => {
        return chr.bufCv[type] ?? 0;
      }
    };
    {
      this.main = Object.create(unit.base.main);
      addBattleProps(this.main, unit.base.main);
    }
    if (unit.base.support) {
      this.support = Object.create(unit.base.support);
      addBattleProps(this.support, unit.base.support);
    }


    let vue = $vue();
    if (unit) {
      let opt = [];
      if (!('shape' in this.main)) {
        // NxN ボス以外は通常攻撃追加
        let atk = makeSimSkill($vue().findItemByUid(this.main.damageType == "アタック" ? "9999999" : "9999998"), this);
        opt.push(atk);
      }

      let classPassiveMain = [];
      let classPassiveSup = [];
      if (unit.isEnemy || unit.isSummon) {
        classPassiveMain = vue.getClassPassiveNpcMain(unit.main?.class);
        classPassiveSup = vue.getClassPassiveNpcSupport(unit.support?.class);
      }
      else {
        classPassiveMain = vue.getClassPassiveMain(unit.main?.class);
        classPassiveSup = vue.getClassPassiveSupport(unit.support?.class);
      }
      this.skills = [
        ...opt,
        ...(unit.main.skills ?? []),
        ...(unit.main.items ?? []),
        ...classPassiveMain,
        ...(unit.support?.skills ?? []),
        ...(unit.support?.items ?? []),
        ...classPassiveSup,
      ].map(skill => makeSimSkill(skill, this));
      //console.log(this.skills.map(s => s.name).join(", "));
    }

    //console.log(this);
  }

  serialize() {
    let r = {};
    r.fid = this.fid;
    r.coord = [...this.coord];
    r.isDormant = this.isDormant;
    r.state = this.state;
    r.move = this.move;

    r.skills = this.skills.map(a => {
      return {
        uid: a.uid,
        data: { ...a.data },
      };
    });
    r.timedEffects = this.timedEffects.map(a => {
      return {
        uid: a.uid,
        data: { ...a.data },
      };
    });

    if (this.main) {
      r.main = {
        hp: this.main.hp
      };
    }
    if (this.support) {
      r.support = {
        hp: this.support.hp
      };
    }

    if (this.isSummon) {
      r.summoner = this.summoner.fid;
      r.summonUid = this.main.uid;
    }
    else {
      r.score = this.score;
      if (this.summon) {
        r.summon = this.summon.map(a => a.fid);
      }
    }
    return r;
  }
  deserialize(r) {
    this.coord = [...r.coord];
    this.isDormant = r.isDormant;
    if ('state' in r) {
      this.state = r.state;
    }
    else if ('readyToAction' in r) { // 旧フォーマット
      this.state = r.readyToAction ? UnitState.Ready : UnitState.End;
    }
    if ('move' in r) {
      this.move = r.move;
    }

    for (const so of r.skills) {
      let skill = this.skills.find(a => a.uid == so.uid);
      if (skill) {
        Object.assign(skill.data, so.data);
      }
    }

    this.timedEffects = [];
    for (const so of r.timedEffects) {
      let e = makeSimEffect($g.sim.findItem(so.uid));
      Object.assign(e.data, so.data);
      this.timedEffects.push(e);
    }

    if (this.main && r.main) {
      this.main.hp = r.main.hp;
    }
    if (this.support && r.support) {
      this.support.hp = r.support.hp;
    }

    if (r.summoner) {
      this.summoner = $g.sim.findUnit(r.summoner);
    }
    if (r.summon) {
      this.summon = r.summon.map(fid => $g.sim.findUnit(fid));
    }

    if (r?.score) {
      this.score = r.score;
    }
  }

  setSummoner(summoner) {
    this.summoner = summoner;
    summoner.summon.push(this);
    Object.defineProperty(this, "score", {
      get: () => { return summoner.score },
      set: (v) => { summoner.score = v },
    });
  }

  // effect: BaseEffect (SimEffect ではない)
  applyEffect(effect, stop = false) {
    if (effect.stack) {
      let pos = -1, count = 0;
      for (let i = 0; i < this.timedEffects.length; ++i) {
        if (this.timedEffects[i].uid == effect.uid) {
          ++count;
          if (pos == -1)
            pos = i;
        }
      }
      if (count >= effect.stack) {
        this.timedEffects.splice(pos, 1);
      }
      this.timedEffects.push(makeSimEffect(effect, stop));
    }
    else if (effect.slot) {
      if (effect.hasSpecialSlot) {
        // 特殊スロットの場合、同系統のバフであれば上書き。
        // ゲーム中の挙動と同じではないが、大体近い挙動ではあるはず。
        for (let i = 0; i < this.timedEffects.length; ++i) {
          const e = this.timedEffects[i];
          if (e.slot == effect.slot && e.type == effect.type) {
            this.timedEffects.splice(i, 1);
            break;
          }
        }
        this.timedEffects.push(makeSimEffect(effect, stop));
      }
      else {
        for (let i = 0; i < this.timedEffects.length; ++i) {
          const e = this.timedEffects[i];
          if (e.slot == effect.slot && e.type == effect.type) {
            if (e.value > effect.value) {
              return;
            }
            else {
              this.timedEffects.splice(i, 1);
              break;
            }
          }
        }
        this.timedEffects.push(makeSimEffect(effect, stop));
      }
    }
    else {
      let pos = this.timedEffects.findIndex(a => a.uid == effect.uid);
      if (pos != -1) {
        this.timedEffects.splice(pos, 1);
      }
      this.timedEffects.push(makeSimEffect(effect, stop));
    }
    console.log(`${effect.type} ${effect.value ?? effect.variant ?? effect.tokenName} ${effect.duration ?? ''}T (by ${effect.parent.name}) -> ${this.main.name}`);
  }
  // ユーザーイベント版
  applyEffect_(effect) {
    this.applyEffect(effect);
    this.evaluateBuffs();
    $g.sim.addUserEvent({
      type: "applyEffect",
      target: this.fid,
      effect: effect.uid,
    });

  }

  removeEffect(effect) {
    let i = this.timedEffects.findIndex(a => a === effect);
    if (i != -1) {
      this.timedEffects.splice(i, 1);
    }
    return i;
  }
  // ユーザーイベント版
  removeEffect_(i) {
    if (i != -1) {
      this.timedEffects.splice(i, 1);
      this.evaluateBuffs();
      $g.sim.addUserEvent({
        type: "removeEffect",
        target: this.fid,
        index: i,
      });
    }
  }

  _addAreaEffect(e) {
    // スタックするエリアエフェクトはないので単純に uid で競合を除外できる
    if (!this.areaEffects.find(a => a.uid == e.uid)) {
      this.areaEffects.push(makeSimEffect(e));
    }
  }
  beforeUpdateAreaEffects() {
    this.areaEffects = [];
  }
  updateAreaEffects() {
    const apply = (effect, cond) => {
      for (let u of $g.sim.activeUnits) {
        if (u !== this && cond(u)) {
          u._addAreaEffect(effect);
        }
      }
    };
    const applyArea = (effect, cond) => {
      $g.sim.enumerateUnitsInArea(this.coord, ...parseArea(effect.area), (u) => {
        if (u !== this && cond(u)) {
          u._addAreaEffect(effect);
        }
      }, true);
    };

    for (let p of this.passives) {
      for (let e of p?.buff ?? []) {
        if (e.target == "味方全体") {
          apply(e, u => u.isPlayer == this.isPlayer)
        }
        else if (e.target == "範囲") {
          applyArea(e, u => u.isPlayer == this.isPlayer);
        }
        else if (e.target == "召喚先") {
          apply(e, u => u.summoner === this)
        }
        else if (e.target == "召喚元") {
          apply(e, u => u.summon.find(a => a === this))
        }
      }
      for (let e of p?.debuff ?? []) {
        if (e.target == "敵全体") {
          apply(e, u => u.isPlayer != this.isPlayer)
        }
        else if (e.target == "範囲") {
          applyArea(e, u => u.isPlayer != this.isPlayer);
        }
      }
    }
  }
  afterUpdateAreaEffects() {
    this.evaluateBuffs();
  }

  evaluateBuffs(ctx = null) {
    if (!ctx) {
      ctx = makeActionContext(this);
    }
    let bufMain = {};
    let bufMainCv = {};
    let bufSup= {};
    let bufSupCv = {};
    let epDebuf = {};

    const addValue = (obj, prop, value) => {
      if (!(prop in obj)) {
        obj[prop] = 0;
      }
      obj[prop] += value;
    }

    const processEffect = (e) => {
      // ディフェンス無視, レジスト無視, クリティカル率耐性 は戦闘時に相手にかけるデバフとして扱う
      const specialDebuffTypes = {
        "ディフェンス無視": "ディフェンス",
        "レジスト無視": "レジスト",
        "クリティカル率耐性": "クリティカル率",
      };

      if (["ランダム", "トークン"].includes(e.type)) {
        // do nothing
      }
      else if ((e.isDebuff && e.ephemeral) || Object.keys(specialDebuffTypes).includes(e.type)) {
        if (e.isDebuff) {
          addValue(epDebuf, e.type, e.getValue(ctx, this));
        }
        else {
          addValue(epDebuf, specialDebuffTypes[e.type], -e.getValue(ctx, this));
        }
      }
      else {
        const add = (e, dstRate, dstConverted) => {
          if (e.isAdditive) {
            addValue(dstConverted, e.type, e.getValue(ctx, this));
          }
          else {
            addValue(dstRate, e.type, e.getValue(ctx, this));
          }
        };

        const notForSupport = ["テクニック", "クリティカル率", "クリティカルダメージ倍率", "移動", "範囲", "射程(通常攻撃)", "射程(スキル)"].includes(e.type);
        if (e.target == "自身(メイン)") {
          add(e, bufMain, bufMainCv);
        }
        else if (e.target == "自身(サポート)") {
          if (!notForSupport)
            add(e, bufSup, bufSupCv);
        }
        else {
          add(e, bufMain, bufMainCv);
          if (!notForSupport)
            add(e, bufSup, bufSupCv);
        }
      }
    };

    for (const e of this.effects) {
      e.enabled = false;
      if ((!e.ephemeral || (e.ephemeralOnBattle && ctx.onBattle) || (e.ephemeralOnAttack && ctx.onAttack)) && evaluateCondition(ctx, e.condition)) {
        e.enabled = true;
        processEffect(e);
      }
    }

    this.affectedSkills = unique([...this.passives.map(a => a.__proto__), ...this.effects.map(a => a.parent)]);
    this.affectedEffects = {};

    let deferred = [];
    // 表示用のエフェクトのリストを構築
    for (let e of this.effects) {
      const uid = e.uid;
      const makeDesc = (e) => {
        let type = e.type;
        if (e.ephemeral) {
          type += e.ephemeralOnAttack ? "(攻撃時)" : "(戦闘時)";
        }
        let value = getEffectValue(e, ctx, this);
        value = `${value >= 0 ? '+' : ''}${value}`;
        if (!e.add && !["移動", "射程(通常攻撃)", "射程(スキル)", "範囲", "トークン"].includes(e.type)) {
          value += "%";
        }
        if (e.type == "トークン") {
          type = e.tokenName;
          value = "";
        }
        let cnt = "";
        if (e?.isTimed) {
          cnt = ` (${e.count}T)`
        }
        else if (e?.duration) {
          cnt = ` (${e.duration}T)`
        }
        return `${type}${value}${cnt}`;
      };

      if (!(uid in this.affectedEffects)) {
        this.affectedEffects[uid] = [];
      }
      if (e.type == "ランダム") {
        let table = e.randomTable.map(re => {
          return {
            desc: makeDesc(re),
            append: () => {
              this.applyEffect_(re);
            },
          };
        });
        // 末尾に追加したいのでここでは追加する関数を登録
        deferred.push(() => {
          this.affectedEffects[uid].push({
            effect: e,
            isRandom: true,
            randomTable: table,
          });
        });
      }
      else {
        this.affectedEffects[uid].push({
          effect: e,
          isTimed: isFinite(e.count),
          remove: () => {
            this.removeEffect_(this.timedEffects.findIndex(a => a === e));
          },
          desc: makeDesc(e),
        });
      }
    }
    for (let d of deferred) {
      d();
    }

    const reorder = (dst) => {
      let r = {};
      for (const v of $vue().effectTypes) {
        if (v in dst) {
          r[v] = dst[v];
        }
      }
      return r;
    };
    this.main.buf = reorder(bufMain);
    this.main.bufCv = reorder(bufMainCv);
    this.support.buf = reorder(bufSup);
    this.support.bufCv = reorder(bufSupCv);
    this.ephemeralDebuf = reorder(epDebuf);
    //console.log(this);
  }


  getEphemeralDebuffValue(type) {
    return this.ephemeralDebuf[type] ?? 0;
  }

  getRange(ctx) {
    if (ctx.skill) {
      return ctx.skill.range;
    }
    let chr = ctx?.onSupportAttack ? this.support : this.main;
    return chr.range;
  }
  getAttackPower(ctx) {
    let chr = ctx.onSupportAttack ? this.support : this.main;
    let target = ctx.target;
    let base = 0, rate = 0, add = 0;
    if (ctx.onPhysicalDamage) {
      base = chr.baseAtk;
      rate = chr.getBuffValue("アタック")
      rate += target ? target.getEphemeralDebuffValue("アタック") : 0;
      add = chr.getConvertedBuffValue("アタック");
    }
    else {
      base = chr.baseMag;
      rate = chr.getBuffValue("マジック");
      rate += target ? target.getEphemeralDebuffValue("マジック") : 0;
      add = chr.getConvertedBuffValue("マジック");
    }
    return base * Math.max(rate / 100 + 1, 0.3) + add;
  }
  getDefensePower(ctx) {
    let chr = ctx.onSupportDefense ? this.support : this.main;
    let target = ctx.target;
    let base = 0, rate = 0, add = 0;
    if (ctx.onPhysicalDamage) {
      base = chr.baseDef;
      rate = chr.getBuffValue("ディフェンス");
      rate += target ? target.getEphemeralDebuffValue("ディフェンス") : 0;
      add = chr.getConvertedBuffValue("ディフェンス");
    }
    else {
      base = chr.baseRes;
      rate = chr.getBuffValue("レジスト");
      rate += target ? target.getEphemeralDebuffValue("レジスト") : 0;
      add = chr.getConvertedBuffValue("レジスト");
    }
    return base * Math.max(rate / 100 + 1, 0.3) + add;
  }
  getDamageDealBuff(ctx) {
    let chr = ctx.onSupportAttack ? this.support : this.main;
    let target = ctx.target;
    let v = 0;
    v += chr.getBuffValue("与ダメージ");
    v += target ? target.getEphemeralDebuffValue("与ダメージ") : 0;
    if (ctx.onPhysicalDamage) {
      v += chr.getBuffValue("与ダメージ(物理)");
      v += target ? target.getEphemeralDebuffValue("与ダメージ(物理)") : 0;
    }
    else {
      v += chr.getBuffValue("与ダメージ(魔法)");
      v += target ? target.getEphemeralDebuffValue("与ダメージ(魔法)") : 0;
    }
    if (ctx.onActiveSkill) {
      v += chr.getBuffValue("与ダメージ(スキル)");
      v += target ? target.getEphemeralDebuffValue("与ダメージ(スキル)") : 0;
      if (ctx.onAreaSkill) {
        v += chr.getBuffValue("与ダメージ(範囲スキル)");
        v += target ? target.getEphemeralDebuffValue("与ダメージ(範囲スキル)") : 0;
      }
    }
    else if (ctx.onNormalAttack) {
      v += chr.getBuffValue("与ダメージ(通常攻撃)");
      v += target ? target.getEphemeralDebuffValue("与ダメージ(通常攻撃)") : 0;
    }
    return Math.max(v / 100 + 1, 0.3);
  }
  getDamageTakenBuff(ctx) {
    let chr = ctx.onSupportDefense ? this.support : this.main;
    let target = ctx.target;
    let v = 0;
    v += chr.getBuffValue("ダメージ耐性");
    v += target ? target.getEphemeralDebuffValue("ダメージ耐性") : 0;
    if (ctx.onPhysicalDamage) {
      v += chr.getBuffValue("ダメージ耐性(物理)");
      v += target ? target.getEphemeralDebuffValue("ダメージ耐性(物理)") : 0;
    }
    else {
      v += chr.getBuffValue("ダメージ耐性(魔法)");
      v += target ? target.getEphemeralDebuffValue("ダメージ耐性(魔法)") : 0;
    }
    if (ctx.onAreaSkill) {
      v += chr.getBuffValue("ダメージ耐性(範囲スキル)");
      v += target ? target.getEphemeralDebuffValue("ダメージ耐性(範囲スキル)") : 0;
    }
    return 1.0 - Math.min(v / 100, 0.7);
  }
  getCriticalRate(ctx) {
    if (ctx.onSupportAttack) {
      return 0;
    }
    else {
      let chr = this.main;
      let target = ctx.target;
      let tec = chr.baseTec * (chr.getBuffValue("テクニック") / 100 + 1);
      let buf = chr.getBuffValue("クリティカル率") + (target ? target.getEphemeralDebuffValue("クリティカル率") : 0);
      return ((tec / 10) + buf) / 100;
    }
  }
  getCriticalDamageRate(ctx) {
    if (ctx?.onSupportAttack) {
      return 1.0;
    }
    else {
      let chr = this.main;
      let target = ctx.target;
      let buf = chr.getBuffValue("クリティカルダメージ倍率") + (target ? target.getEphemeralDebuffValue("クリティカルダメージ倍率") : 0);
      return 1.3 + (buf / 100);
    }
  }

  // NxN ボスは範囲内のマス分返す。
  // 1 体としてカウントしたい場合 unique() を使うこと。
  getUnitsInArea(args) {
    let r = [];
    let [size, shape] = parseArea(args);
    $g.sim.enumerateUnitsInArea(this.coord, size, shape, (u) => {
      r.push(u);
    });
    return r;
  }
  getAlliesInArea(args) {
    return this.getUnitsInArea(args).filter(u => u.isPlayer == this.isPlayer && u !== this);
  }
  getEnemiesInArea(args) {
    return this.getUnitsInArea(args).filter(u => u.isPlayer != this.isPlayer);
  }
  getTokenCount(tokenName) {
    let r = 0;
    for (let e of this.timedEffects) {
      if (e.type == "トークン" && e.tokenName == tokenName) {
        ++r;
      }
    }
    return r;
  }
  isOnEffect(skillIds) {
    for (let e of this.effects) {
      if (skillIds.includes(e.parent.uid)) {
        return true;
      }
    }
    return false;
  }

  _invokeSkillAction(ctx, act) {
    let succeeded = false;
    let skills = ctx.skill ? [ctx.skill, ...this.passives] : this.passives;
    for (let skill of skills) {
      if (skill[act](ctx)) {
        succeeded = true;
      }
    }
    return succeeded;
  }

  invokeFixedDamage(ctx) {
    return this._invokeSkillAction(ctx, "invokeFixedDamage");
  }
  invokeAreaDamage(ctx) {
    return this._invokeSkillAction(ctx, "invokeAreaDamage");
  }

  invokeSupportAttack(ctx) {
    return this._invokeSkillAction(ctx, "invokeSupportAttack");
  }
  invokeDoubleAttack(ctx) {
    return this._invokeSkillAction(ctx, "invokeDoubleAttack");
  }
  invokeMultiAction(ctx) {
    return this._invokeSkillAction(ctx, "invokeMultiAction");
  }
  invokeMultiMove(ctx) {
    return this._invokeSkillAction(ctx, "invokeMultiMove");
  }


  // バフ・デバフの効果時間減
  reduceEffectDuration() {
    for (let e of this.timedEffects) {
      if (!e.isStopped && e.count > 0) {
        --e.count;
      }
    }
    this.eraseExpiredEffects();
  }
  resumeEffectDuration() {
    for (let e of this.timedEffects) {
      if (e.isStopped) {
        e.isStopped = false;
      }
    }
  }
  eraseExpiredEffects() {
    this.timedEffects = this.timedEffects.filter(a => !a.isExpired);
  }

  // スキルの CT 減
  reduceSkillCT(n, condFunc = null) {
    for (let a of this.actions) {
      if (a.coolTime && (!condFunc || condFunc(a))) {
        a.coolTime = Math.max(a.coolTime - n, 0);
      }
    }
  }
  //#endregion methods

  _dbgLog(message) {
    //console.log(`${this.main.name}: ${message}`);
  }

  _callHandler(funcName, ctx) {
    this._dbgLog(funcName);
    if (!ctx) {
      ctx = makeActionContext(this);
    }
    let skills = ctx?.skill ? [ctx.skill, ...this.passives] : this.passives;
    callHandler(funcName, ctx, ...skills);
  }


  //#region callbacks

  onSimulationBegin(ctx) {
    this._callHandler("onSimulationBegin", ctx);
    for (let passive of this.passives) {
      for (let effect of passive.buff ?? []) {
        if (!effect.trigger) {
          this.selfEffects.push(makeSimEffect(effect));
        }
      }
      for (let effect of passive.debuff ?? []) {
        // 戦闘時デバフはエフェクトは自身に付与され、戦闘時に相手に効果を発揮 (ややこしい…)
        if (!effect.trigger && effect.ephemeral) {
          this.selfEffects.push(makeSimEffect(effect));
        }
      }
    }
  }

  // onSimulationBegin() の直後に呼ばれる。ステータスの初期化を行う。
  // onSimulationBegin() の中だと自キャラ以外への影響があるバフが対応できないケースがあるため、別パスにしている。
  setup() {
    //console.log(`${this.main.name}: 影響下にあるスキル -> ${unique(this.effects.map(a => a.parent.name)).join(", ")}`);

    const setupHp = (chr) => {
      chr.hp = chr.maxHp = Math.round(chr.baseHp * (chr.getBuffValue("最大HP") / 100 + 1));
    };
    setupHp(this.main);
    setupHp(this.support);
  }

  onSimulationEnd(ctx) {
    this._callHandler("onSimulationEnd", ctx);
    this.base.sim = null;
  }

  // 自ターン開始前/後
  onOwnTurnBegin(ctx) {
    this._callHandler("onOwnTurnBegin", ctx);
  }
  onOwnTurnEnd(ctx) {
    this._callHandler("onOwnTurnEnd", ctx);
    this.resumeEffectDuration();
    if (this.isNxN) {
      // NxN ボスは一連の行動が終わった直後にスキルのカウントが進むっぽいのだが、面倒なので自ターン終了時で代替する。
      this.reduceSkillCT(1);
      this.reduceEffectDuration();
    }
    this.state = UnitState.Ready;
  }

  // 相手ターン開始前/後
  onOpponentTurnBegin(ctx) {
    this._callHandler("onOpponentTurnBegin", ctx);
  }
  onOpponentTurnEnd(ctx) {
    this._callHandler("onOpponentTurnEnd", ctx);
  }

  // 移動後、行動確定時、戦闘開始前もしくは非戦闘を含むスキル使用前に呼ばれる
  // 攻撃の場合は直後に onAttackBegin() が、
  // 戦闘に入る場合は直後に onBattleBegin() が呼ばれる
  onActionBegin(ctx) {
    this._callHandler("onActionBegin", ctx);
  }
  onActionEnd(ctx) {
    this._callHandler("onActionEnd", ctx);
    if (!this.isNxN) {
      this.reduceSkillCT(1);
      this.reduceEffectDuration();
    }
  }

  // 移動後、行動確定時、戦闘非戦闘を問わず攻撃前に呼ばれる
  // 戦闘に入る場合は直後に onBattleBegin() が呼ばれる
  onAttackBegin(ctx) {
    this._callHandler("onAttackBegin", ctx);
  }
  onAttackEnd(ctx) {
    this._callHandler("onAttackEnd", ctx);
  }

  // 戦闘前 (非範囲攻撃、ゲーム中戦闘画面に入るもの) に呼ばれる
  // 攻撃される側も呼ばれる
  onBattleBegin(ctx) {
    this._callHandler("onBattleBegin", ctx);
  }
  onBattleEnd(ctx) {
    this._callHandler("onBattleEnd", ctx);
  }

  // 手段を問わず敵撃破時に呼ばれる
  onKill(ctx) {
    this._callHandler("onKill", ctx);
  }

  // 手段を問わず撃破されたとき呼ばれる
  onDeath(ctx) {
    this._callHandler("onDeath", ctx);
    if (this.summoner) {
      let pos = this.summoner.summon.findIndex(a => a == this);
      if (pos != -1) {
        this.summoner.summon.splice(pos, 1);
      }
    }
  }

  // ラストスタンドなどで復活した時呼ばれる
  onRevive(ctx) {
    this._callHandler("onRevive", ctx);
  }
  //#endregion callbacks


  //#region impl
  static copyProps(dst, src) {
    if (!src)
      return;
    for (const k in src) {
      if (Object.hasOwn(src, k)) {
        const v = src[k];
        if (Array.isArray(v)) {
          dst[k] = [...v];
        }
        else {
          dst[k] = v;
        }
      }
    }
  }
  //#endregion impl
}
