import { $g } from "./battle_globals.js";
import { callHandler, makeSimSkill, makeSimEffect, evaluateCondition, makeActionContext } from "./battle_skill.js";
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
    return this.sim ? this.sim.coord : this.base.coord;
  }
  set coord(v) {
    if (this.sim)
      this.sim.coord = v;
    else
      this.base.coord = v;
  }
  get main() { return this.sim ? this.sim.main : this.base.main; }
  get support() { return this.sim ? this.sim.support : this.base.support; }
  get hasSupport() { return this.base.support.cid; }
  get actions() { return this.sim ? this.sim.actions : []; }

  get move() { return this.sim ? this.sim.move : this.main.move; }
  get range() { return this.sim ? this.sim.main.range : this.main.range; }
  get isAlive() { return this.sim ? this.sim.isAlive : false; }
  get isActive() { return this.sim ? this.sim.isActive : false; }

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
  isDormant = false; // 配置前 (出現ターン前) のユニットは true
  state = UnitState.Ready;
  move = 0; // 再移動やサポートスキル後などで元の move より少なくなることがある
  coord = [0, 0];
  main = {
    bufRate: {},
    bufFixed: {},
    hp: 0,
    maxHp: 0,
  };
  support = {
    bufRate: {},
    bufFixed: {},
    hp: 0,
    maxHp: 0,
  };
  summon = [];
  selfEffects = []; // SimEffect
  areaEffects = []; // SimEffect
  timedEffects = []; // SimEffect
  score = 0;

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

  get prevCoord() { return this.base.prevCoord; }
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
        isValid: () => { return chr.maxHp > 0; },
        isAlive: () => { return chr.hp > 0; },
        baseHp:  () => { return base.status[0]; },
        baseAtk: () => { return base.status[1]; },
        baseDef: () => { return base.status[2]; },
        baseMag: () => { return base.status[3]; },
        baseRes: () => { return base.status[4]; },
        baseTec: () => { return base.status[5]; },
        baseRange: () => { return base.range; },
        status: () => {
          const table = ["最大HP", "アタック", "ディフェンス", "マジック", "レジスト", "テクニック",];
          let r = [...base.status];
          for (let i = 0; i < r.length; ++i) {
            const n = table[i];
            r[i] = Math.round(r[i] * ((chr.bufRate[n] ?? 0) / 100 + 1) + (chr.bufFixed[n] ?? 0));
          }
          return r;
        },
        range: () => { return Math.max(base.range + (chr.bufFixed["射程(通常攻撃)"] ?? 0), 0); },
      };
      if (chr.isMain) {
        table.baseMove = () => { return base.move; };
        table.move = () => { return Math.max(base.move + (chr.bufFixed["移動"] ?? 0), 0); };
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
      chr.bufRate = {};
      chr.bufFixed = {};
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

  eraseActiveBuff(count) {
    let erased = 0;
    for (let i = 0; i < this.timedEffects.length && erased < count; /**/) {
      if (this.timedEffects[i].isActiveBuff) {
        this.timedEffects.splice(i, 1);
        ++erased;
      }
      else {
        ++i;
      }
    }
  }
  eraseActiveDebuff(count) {
    let erased = 0;
    for (let i = 0; i < this.timedEffects.length && erased < count; /**/) {
      if (this.timedEffects[i].isActiveDebuff) {
        this.timedEffects.splice(i, 1);
        ++erased;
      }
      else {
        ++i;
      }
    }
  }

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

  updateAreaEffects() {
    this.areaEffects = [];
    const add = (e) => {
      if (!this.areaEffects.find(a => a.uid == e.uid)) {
        this.areaEffects.push(makeSimEffect(e));
      }
    };

    for (let u of $g.sim.activeUnits) {
      if (u == this) { continue; }
      for (let p of u.passives) {
        if (u.isPlayer == this.isPlayer) {
          for (let e of p?.buff ?? []) {
            if (e.target == "味方全体") {
              add(e);
            }
            else if (e.target == "範囲" && isInside(this.coord, u.coord, ...parseArea(e.area))) {
              add(e);
            }
            else if (e.target == "召喚先" && u.summon.find(a => a === this)) {
              add(e);
            }
            else if (e.target == "召喚元" && u.summoner === this) {
              add(e);
            }
          }
        }
        else {
          for (let e of p?.debuff ?? []) {
            if (e.target == "敵全体") {
              add(e);
            }
            else if (e.target == "範囲" && isInside(this.coord, u.coord, ...parseArea(e.area))) {
              add(e);
            }
          }
        }
      }
    }
  }
  evaluateBuffs(ctx = null) {
    if (!ctx) {
      ctx = makeActionContext(this);
    }
    let mainRate = {};
    let mainFixed = {};
    let supRate = {};
    let supFixed = {};

    const add = (e) => {
      const doit = (e, tRate, rFixed) => {
        if (["ランダム", "トークン"].includes(e.type)) {
          return;
        }

        if (e.isDebuff && e.ephemeral) {
          // 戦闘時デバフは扱いが難しくて保留
          console.log(e);
        }

        else if (e.isAdditive || ["移動", "射程(通常攻撃)", "射程(スキル)", "範囲"].includes(e.type)) {
          if (!(e.type in rFixed)) {
            rFixed[e.type] = 0;
          }
          rFixed[e.type] += e.getValue(ctx, this);
        }
        else {
          if (!(e.type in tRate)) {
            tRate[e.type] = 0;
          }
          tRate[e.type] += e.getValue(ctx, this);
        }
      };

      const notForSupport = ["テクニック", "クリティカル率", "クリティカルダメージ倍率", "移動", "範囲"].includes(e.type);
      if (e.target == "自身(メイン)") {
        doit(e, mainRate, mainFixed);
      }
      else if (e.target == "自身(サポート)") {
        if (!notForSupport)
          doit(e, supRate, supFixed);
      }
      else {
        doit(e, mainRate, mainFixed);
        if (!notForSupport)
          doit(e, supRate, supFixed);
      }
    };

    for (const e of this.effects) {
      e.enabled = false;
      if ((!e.ephemeral || (e.ephemeralOnBattle && ctx.onBattle) || (e.ephemeralOnAttack && ctx.onAttack)) && evaluateCondition(ctx, e.condition)) {
        e.enabled = true;
        add(e);
      }
    }

    this.affectedSkills = unique([...this.passives.map(a => a.__proto__), ...this.effects.flatMap(a => a.enabled ? a.parent : [])]);
    this.affectedEffects = {};
    for (let e of this.effects) {
      if (["ランダム"].includes(e.type)) {
        continue;
      }
      const uid = e.uid;
      const gen = () => {
        let type = e.type;
        if (e.ephemeral) {
          type += e.ephemeralOnAttack ? "(攻撃時)" : "(戦闘時)";
        }
        let value = e.getValue(ctx, this);
        value = `${value >= 0 ? '+' : ''}${value}`;
        if (!e.add && !["移動", "射程(通常攻撃)", "射程(スキル)", "範囲", "トークン"].includes(e.type)) {
          value += "%";
        }
        if (e.type == "トークン") {
          type = e.tokenName;
          value = "";
        }
        let cnt = "";
        if (isFinite(e.count)) {
          cnt = ` (${e.count}T)`
        }
        return {
          desc: `${type}${value}${cnt}`,
          effect: e,
        };
      };

      if (!(uid in this.affectedEffects)) {
        this.affectedEffects[uid] = [];
      }
      this.affectedEffects[uid].push(gen()); 
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
    this.main.bufRate = reorder(mainRate);
    this.main.bufFixed = reorder(mainFixed);
    this.support.bufRate = reorder(supRate);
    this.support.bufFixed = reorder(supFixed);
    //console.log(this);
  }


  getRange(ctx) {
    if (ctx.skill) {
      return ctx.skill.range;
    }
    let chr = ctx?.onSupportAttack ? this.support : this.main;
    return chr.range;
  }

  getAttackPower(ctx) {
    let chr = ctx?.onSupportAttack ? this.support : this.main;
    if (ctx.onPhysicalDamage) {
      return chr.baseAtk * ((chr.bufRate["アタック"] ?? 0) / 100 + 1) + (chr.bufFixed["アタック"] ?? 0);
    }
    else {
      return chr.baseMag * ((chr.bufRate["マジック"] ?? 0) / 100 + 1) + (chr.bufFixed["マジック"] ?? 0);
    }
  }
  getDamageDealBuff(ctx) {
    let chr = ctx?.onSupportAttack ? this.support : this.main;
    let v = 0;
    v += chr.bufRate["与ダメージ"] ?? 0;
    if (ctx.onPhysicalDamage) {
      v += chr.bufRate["与ダメージ(物理)"] ?? 0;
    }
    else {
      v += chr.bufRate["与ダメージ(魔法)"] ?? 0;
    }
    if (ctx.onActiveSkill) {
      v += chr.bufRate["与ダメージ(スキル)"] ?? 0;
      if (ctx.onAreaSkill) {
        v += chr.bufRate["与ダメージ(範囲スキル)"] ?? 0;
      }
    }
    else if (ctx.onNormalAttack) {
      v += chr.bufRate["与ダメージ(通常攻撃)"] ?? 0;
    }
    return v / 100;
  }
  getCriticalRate(ctx) {
    if (ctx?.onSupportAttack) {
      return 0;
    }
    else {
      return (this.main.baseTec / 10) + this.evaluateEffects(ctx, "クリティカル率");
    }
  }
  getCriticalDamageRate(ctx) {
    if (ctx?.onSupportAttack) {
      return 1.0;
    }
    else {
      return 1.3 + ((this.main.bufRate["クリティカルダメージ倍率"] ?? 0) / 100);
    }
  }
  getDefensePower(ctx) {
    let chr = ctx?.onSupportDefense ? this.support : this.main;
    if (ctx.onPhysicalDamage) {
      return chr.baseDef * ((chr.bufRate["ディフェンス"] ?? 0) / 100 + 1) + (chr.bufFixed["ディフェンス"] ?? 0);
    }
    else {
      return chr.baseDef * ((chr.bufRate["レジスト"] ?? 0) / 100 + 1) + (chr.bufFixed["レジスト"] ?? 0);
    }
  }
  getDamageTakenBuff(ctx) {
    let chr = ctx?.onSupportDefense ? this.support : this.main;
    let v = 0;
    v += chr.bufRate["ダメージ耐性"] ?? 0;
    if (ctx.onPhysicalDamage)
      v += chr.bufRate["ダメージ耐性(物理)"] ?? 0;
    else
      v += chr.bufRate["ダメージ耐性(魔法)"] ?? 0;
    if (ctx.onAreaSkill)
      v += chr.bufRate["ダメージ耐性(範囲スキル)"] ?? 0;
    return v / 100;
  }

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

  evaluateEffects(ctx, type) {
    let r = 100;
    for (let e of this.effects) {
      if (e.type == type && evaluateCondition(ctx, e.condition)) {
        if ((e.target == "自身(メイン)" && !ctx.onMainAttack) || (e.target == "自身(サポート)" && !ctx.onSupportAttack)) {
          continue;
        }
        r += e.value;
        //console.log(e);
      }
    }
    return r / 100.0;
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
    }
  }

  // onSimulationBegin() の直後に呼ばれる。ステータスの初期化を行う。
  // onSimulationBegin() の中だと自キャラ以外への影響があるバフが対応できないケースがあるため、別パスにしている。
  setup() {
    //console.log(`${this.main.name}: 影響下にあるスキル -> ${unique(this.effects.map(a => a.parent.name)).join(", ")}`);

    const setupHp = (chr) => {
      chr.hp = chr.maxHp = Math.round(chr.baseHp * ((chr.bufRate["最大HP"] ?? 0) / 100 + 1));
    };
    setupHp(this.main);
    setupHp(this.support);
    if (!this.move) {
      this.move = this.main.move;
    }
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
    if (this.main.isNxNBoss) {
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
    if (!this.main.isNxNBoss) {
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
