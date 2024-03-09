import { $g } from "./battle_globals.js";
import { callHandler, unique, makeSimSkill, makeSimEffect, evaluateCondition, makeActionContext } from "./battle_skill.js";

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

export function parseArea(args) {
  let size = 0;
  let shape = 0;
  if (typeof (args) === 'number') {
    size = args;
  }
  else if (Array.isArray(args)) {
    size = args[0];
    if (args[1] == '周囲') {
      shape = 1;
    }
  }
  return [size, shape];
}
export function isInside(pos, center, size, shape) {
  let dx = Math.abs(pos[0] - center[0]);
  let dy = Math.abs(pos[1] - center[1]);
  if (shape == 0) {
    return (dx + dy) <= size;
  }
  else if (shape == 1) {
    return Math.max(dx, dy) <= size;
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

  get move() { return this.sim ? this.sim.main.move : this.main.move; }
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

    copyArray(this.editorData, ss.serialize());

    this.setup();
    //console.log(this);
  }
}


export class SimUnit {

  //#region fields
  base = null; // BaseUnit
  isDormant = false; // 配置前 (出現ターン前) のユニットは true
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
  selfEffects = []; // SimEffect
  areaEffects = []; // SimEffect
  timedEffects = []; // SimEffect
  //#endregion fields


  //#region props
  get fid() { return this.base.fid; }
  get phase() { return this.base.phase; }
  get isAlive() { return this.main.hp > 0; }
  get isActive() { return !this.isDormant && this.isAlive; }
  get isPlayer() { return this.base.isPlayer; }
  get isEnemy() { return this.base.isEnemy; }
  get symbol() { return this.main.symbol; }
  get mainClass() { return this.main.class; }
  get hpRate() {
    return (this.main.hp + this.support.hp) / (this.main.maxHp + this.support.maxHp) * 100;
  }
  get prevCoord() { return this.base.prevCoord; }
  get activeBuffCount() {
    return this.timedEffects.reduce((total, e) => {
      if (e.isBuff && e.parent.isActive) {
        total += 1;
      }
      return total;
    }, 0);
  }
  get activeDebuffCount() {
    return this.timedEffects.reduce((total, e) => {
      if (e.isDebuff && e.parent.isActive) {
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
        isValid: function () { return chr.maxHp > 0; },
        isAlive: function () { return chr.hp > 0; },
        baseHp: function () { return base.status[0]; },
        baseAtk: function () { return base.status[1]; },
        baseDef: function () { return base.status[2]; },
        baseMag: function () { return base.status[3]; },
        baseRes: function () { return base.status[4]; },
        baseTec: function () { return base.status[5]; },
        baseRange: function () { return base.range; },
        status: function () {
          const table = ["最大HP", "アタック", "ディフェンス", "マジック", "レジスト", "テクニック",];
          let r = [...base.status];
          for (let i = 0; i < r.length; ++i) {
            const n = table[i];
            r[i] = Math.round(r[i] * ((chr.bufRate[n] ?? 0) / 100 + 1) + (chr.bufFixed[n] ?? 0));
          }
          return r;
        },
      };
      if (chr.isMain) {
        table.baseMove = function () { return base.move; };
        table.move = function () { return base.move + (chr.bufRate["移動"] ?? 0); };
      }
      table.baseAttackPower = chr.damageType == "アタック" ?
        function () { return base.status[1]; } :
        function () { return base.status[3]; };

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

      this.skills = [
        ...opt,
        ...(unit.main.skills ?? []),
        ...(unit.main.items ?? []),
        ...(unit.main ? vue.getClassPassiveMain(unit.main.class) : []),
        ...(unit.support?.skills ?? []),
        ...(unit.support?.items ?? []),
        ...(unit.support ? vue.getClassPassiveSupport(unit.support.class) : []),
      ].map(skill => makeSimSkill(skill, this));
      //console.log(this.skills.map(s => s.name).join(", "));
    }

    //console.log(this);
  }

  serialize() {
    let r = {};
    r.coord = [...this.coord];
    SimUnit.copyProps(r.main, this.main);
    SimUnit.copyProps(r.support, this.support);
    r.skills = this.skills.map(a => { return { [a.uid]: a.data }; });
    r.timedEffects = this.timedEffects.map(a => { return { [a.uid]: a.data }; });
    return r;
  }
  deserialize(r) {
    this.coord = [...r.coord];
    SimUnit.copyProps(this.main, r.main);
    SimUnit.copyProps(this.support, r.support);
  }

  getRange(ctx) {
    if (ctx?.onSupportAttack) {
      return this.support.range;
    }
    else {
      return this.main.range;
    }
  }

  applyEffect(effect, stop = false) {
    this.timedEffects.push(makeSimEffect(effect, stop));
    //console.log(this.timedEffects);
    console.log(`${effect.parent.name} ${effect.type}`);
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
        if (e.ephemeral && !ctx.onBattle) {
          return;
        }

        if (e.isDebuff && e.ephemeral) {
          // 戦闘時デバフは扱いが難しくて保留
          console.log(e);
        }
        else if (e.isAdditive) {
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
      if (e.target == "自身(メイン)") {
        doit(e, mainRate, mainFixed);
      }
      else if (e.target == "自身(サポート)") {
        doit(e, supRate, supFixed);
      }
      else {
        doit(e, mainRate, mainFixed);
        doit(e, supRate, supFixed);
      }
    };

    for (const e of this.effects) {
      if ((!e.ephemeral || ctx.onBattle) && evaluateCondition(ctx, e.condition)) {
        add(e);
      }
    }
    this.main.bufRate = mainRate;
    this.main.bufFixed = mainFixed;
    this.support.bufRate = supRate;
    this.support.bufFixed = supFixed;
    //console.log(this);
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
    return this.getUnitsInArea(args).filter(u => u.isPlayer == this.isPlayer);
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
    for (let skill of this.passives) {
      if (skill[act](ctx)) {
        succeeded = true;
      }
    }
    return succeeded;
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


  reduceEffectDuration() {
    for (let e of this.timedEffects) {
      e.decrementCount();
    }
    this.timedEffects = this.timedEffects.filter(a => a.isAlive);
  }
  // スキルの CT 減
  reduceSkillCT(n, condFunc = null) {
    for (let a of this.actions) {
      if (a.coolTime && (!condFunc || condFunc(a))) {
        a.coolTime = Math.max(a.coolTime - n, 0);
      }
    }
  }
  // ターン経過を要する系の CT 減 (ソルジャーの再行動など)
  reduceTurnCT(n) {

  }
  //#endregion methods

  _dbgLog(message) {
    console.log(`${this.main.name}: ${message}`);
  }

  _callHandler(funcName, ctx) {
    this._dbgLog(funcName);
    callHandler(funcName, ctx, ...this.passives);
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
    console.log(`${this.main.name}: 影響下にあるスキル -> ${unique(this.effects.map(a => a.parent.name)).join(", ")}`);

    const setupHp = (chr) => {
      chr.hp = chr.maxHp = Math.round(chr.baseHp * ((chr.bufRate["最大HP"] ?? 0) / 100 + 1));
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
    this.reduceTurnCT();
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
