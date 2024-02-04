export class BaseUnit
{
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
  get main() {
    return this.sim ? this.sim.main : this.base.main;
  }
  get support() {
    return this.sim ? this.sim.support : this.base.support;
  }
  get hasSupport() {
    return this.base.support.cid;
  }

  constructor(isPlayer = true) {
    if (isPlayer)
      this.isPlayer = true;
    else
      this.isEnemy = true;
    this.initialize();
  }
  initialize() {
    const emp = BaseUnit.emptyUnit;
    Object.assign(this.base.main, emp.main);
    Object.assign(this.base.support, emp.support);
    this.showEditor = false;
    this.editorData = [];

    const mergeChrData = window.$vue.mergeChrData;
    mergeChrData(this.base.main, null);
    mergeChrData(this.base.support, null);
  }
  swap(v) {
    const swapProperty = window.$vue.swapProperty;
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
    const uidToObject = window.$vue.uidToObject;
    const mergeChrData = window.$vue.mergeChrData;
    const deserializeChr = function (dst, src) {
      const chr = uidToObject(src.cid);
      mergeChrData(dst, chr);
      dst.cid = src.cid;
      dst.skills = src.skills.map(uidToObject);
      dst.items = src.items.map(uidToObject);
      dst.status = [...src.status];
    };
    deserializeChr(this.base.main, r.main);
    deserializeChr(this.base.support, r.support);
    this.editorData = [...r.editorData];
  }
  edit(ss) {
    const uidToObject = window.$vue.uidToObject;
    const copyArray = window.$vue.copyArray;
    const mergeChrData = window.$vue.mergeChrData;
    // エディタ側のオブジェクトとこちら側のオブジェクトは別個体なため、uid を元にこちら側のオブジェクトに差し替える。

    let main = this.base.main;
    const mainChr = uidToObject(ss.main.character.value?.uid);
    mergeChrData(main, mainChr);
    main.cid = mainChr?.uid ?? "";
    main.skills = [];
    if (mainChr) {
      main.skills = [mainChr.talent, ...ss.mainSkills].filter(a => a).map(a => uidToObject(a.uid));
    }
    main.items = [...ss.mainEnchantPassive, ...ss.mainItems].filter(a => a).map(a => uidToObject(a.uid));
    main.status = ss.statMainResult.slice(0, 6);

    let support = this.base.support;
    const supChr = uidToObject(ss.support.character.value?.uid);
    mergeChrData(support, supChr);
    support.cid = supChr?.uid ?? "";
    support.skills = [];
    if (supChr) {
      support.skills = [...supChr.skills].filter(a => a).map(a => uidToObject(a.uid));
    }
    support.items = ss.supportItems.filter(a => a).map(a => uidToObject(a.uid));
    support.status = ss.statSupportResult.slice(0, 6);

    copyArray(this.editorData, ss.serialize());
    //console.log(this);
  }
}

export class EffectHolder
{
  effect = null;
  stack = 1;
  duration = Infinity;
  passDuration = true;
  enabled = true;

  constructor(effect) {
    this.effect = effect;
  }
  activate(bySelf) {
    if (this.effect.duration) {
      this.duration = this.effect.duration;
      if (bySelf) {
        this.passDuration = false;
      }
    }
  }
  evaluateCondition(target, caster, battleCtx) {
    const condExp = function(val1, cmp, val2) {
      const table = {
        "==": () => val1 == val2,
        ">": () => val1 > val2,
        "<": () => val1 < val2,
        ">=": () => val1 >= val2,
        "<=": () => val1 <= val2,
        "!=": () => val1 != val2,
      };
      return table[cmp];
    }

    const cond = this.effect.condition;
    let ok = true;
    if (cond) {
      if (cond.turn) {
        const params = cond.turn;
        if (!condExp(battleCtx.turn, params[0], params[1])) {
          ok = false;
        }
      }
      if (cond.hp || cond.targetHp) {
        const params = cond.hp ?? cond.targetHp;
        if (!condExp(target.hpRate, params[0], params[1])) {
          ok = false;
        }
      }
      if (cond.mainHp) {
        const params = cond.mainHp;
        if (!condExp(target.hpRateMain, params[0], params[1])) {
          ok = false;
        }
      }
      if (cond.supportHp) {
        const params = cond.supportHp;
        if (!condExp(target.hpRateSupport, params[0], params[1])) {
          ok = false;
        }
      }
      if (cond.nearAllyCount) {
        const params = cond.nearAllyCount.condition;
        if (!condExp(target.getNearAllyCount(cond.nearAllyCount.area), params[0], params[1])) {
          ok = false;
        }
      }
      if (cond.nearEnemyCount) {
        const params = cond.nearEnemyCount.condition;
        if (!condExp(target.getNearEnemyCount(cond.nearAllyCount.area), params[0], params[1])) {
          ok = false;
        }
      }
      if (cond.activeBuffCount || cond.targetActiveBuffCount) {
        const params = cond.activeBuffCount ?? cond.targetActiveBuffCount;
        if (!condExp(target.activeBuffCount, params[0], params[1])) {
          ok = false;
        }
      }
      if (cond.activeDebuffCount || cond.targetActiveDebuffCount) {
        const params = cond.activeDebuffCount ?? cond.targetActiveDebuffCount;
        if (!condExp(target.activeDebuffCount, params[0], params[1])) {
          ok = false;
        }
      }
      if (cond.token || cond.targetToken) {
        const params = cond.token ?? cond.targetToken;
        // todo
      }

      if (cond.onClass || cond.onEnemyClass) {
        if (!cond.onClass.includes(target.main.class)) {
          ok = false;
        }
      }
      if (cond.onSymbol) {
        if (!cond.onSymbol.includes(target.main.symbol)) {
          ok = false;
        }
      }
      if (cond.onOwnTurn) {
        if ((battleCtx.isPlayerTurn && !target.isPlayer) || (battleCtx.isEnemyTurn && !target.isEnemy)) {
          ok = false;
        }
      }
      if (cond.onEnemyTurn) {
        if ((battleCtx.isPlayerTurn && target.isPlayer) || (battleCtx.isEnemyTurn && target.isEnemy)) {
          ok = false;
        }
      }
      if (cond.onCloseCombat) {
        if (battleCtx.range > 1) {
          ok = false;
        }
      }
      if (cond.onRangedCombat) {
        if (battleCtx.range == 1) {
          ok = false;
        }
      }
      if (cond.onDamage) {
        // todo
      }
      if (cond.onCriticalit) {
        // todo
      }
      if (cond.onKill) {
        // todo
      }
    }
    return ok;
  }
  evaluateBuff(target, caster, battleCtx) {
  }
  evaluateDebuff(target, caster, battleCtx) {
  }

  onTurnBegin() {
    this.passDuration = true;
  }
  onSimulationBegin() {
  }
  onSimulationEnd() {
  }
  onAttackBegin() {
  }
  onAttackEnd() {
  }
  onActionEnd() {
    if (this.passDuration && this.duration > 0) {
      if (--this.duration == 0) {
        this.enabled = false;
      }
    }
  }
  onTurnEnd() {
    this.passDuration = true;
  }

  _getValue(battleCtx, baseStat) {
    let r = 0;
    const effect = this.effect;
    if (effect.value) {
      r = effect.value;
      if (effect.maxStack) {
        // 効果が重複するタイプ
        // フルスペック時の効果を返す
        r *= this.stack;
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
  }

  serialize() {
  }
  deserialize(r) {
  }
}

export class SkillHolder
{
  skill = null;
  self = false;
  effects = []; // EffectHolder

  constructor(skill) {
    this.skill = skill;
    for (let effect of [...(this.skill.buff ?? []), ...(this.skill.debuff ?? [])]) {
      this.effects.push(new EffectHolder(effect));
    }
  }
  activate(bySelf) {
    this.self = bySelf;
    for (let e of this.effects) {
      e.activate(bySelf);
    }
  }

  onTurnBegin() {
    for (let e of this.effects) {
      e.onTurnBegin();
    }
  }
  onSimulationBegin() {
    for (let e of this.effects) {
      e.onSimulationBegin();
    }
  }
  onSimulationEnd() {
    for (let e of this.effects) {
      e.onSimulationEnd();
    }
  }
  onAttackBegin() {
    for (let e of this.effects) {
      e.onAttackBegin();
    }
  }
  onAttackEnd() {
    for (let e of this.effects) {
      e.onAttackEnd();
    }
  }
  onActionEnd() {
    for (let e of this.effects) {
      e.onActionEnd();
    }
  }
  onTurnEnd() {
    for (let e of this.effects) {
      e.onTurnEnd();
    }
  }

  serialize() {
    //  for (let e of this.effects) {
    //    e.serialize();
    //  }
  }
  deserialize(r) {
    //  for (let e of this.effects) {
    //    e.deserialize();
    //  }
  }
}

export class CustomEffect
{
  effectType = 0;
  value = 0;

  constructor(type) {
    this.effectType = typeof (type) === 'string' ? window.$vue.getEffectIndex(type) : type;
    this.value = 0;
  }
  serialize() {
    return {
      effectType: this.effectType,
      value: this.value,
    };
  }
  deserialize(r) {
    this.effectType = r.effectType;
    this.value = r.value;
  }
}

export class SimUnit
{
  base = null;
  coord = [0, 0];
  affectedSkills = []; // SkillHolder
  customEffects = [];
  main = {
    bufP: [],
    bufF: [],
    status: [0, 0, 0, 0, 0, 0],
    hp: 0,
  };
  support = {
    bufP: [],
    bufF: [],
    status: [0, 0, 0, 0, 0, 0],
    hp: 0,
  };

  constructor(unit) {
    unit.sim = this;
    this.base = unit;
    this.fid = unit.fid;
    this.coord = [...unit.base.coord];

    const addBattleProps = function (u, base) {
      u.bufP = [];
      u.bufF = [];
      u.status = [...base.status];
      u.hp = u.status[0];

      Object.defineProperty(u, 'statusBase', {
        value: base.status,
        writable: false,
      });
    };
    {
      this.main = Object.create(unit.base.main);
      addBattleProps(this.main, unit.base.main);
    }
    if (unit.base.support) {
      this.support = Object.create(unit.base.support);
      addBattleProps(this.support, unit.base.support);
    }

    let vue = window.$vue;
    if (unit) {
      // パッシブ/タレントを収集
      const skills = [...(unit.main.skills ?? []), ...(unit.support?.skills ?? []),
      ...(unit.main ? vue.getClassPassiveMain(unit.main.class) : []),
      ...(unit.support ? vue.getClassPassiveSupport(unit.support.class) : []),
      ...(unit.main.items ?? []),
      ];
      for (let skill of skills) {
        if (skill.isTalent || skill.isPassive || skill.isItem) {
          this.applySkill(skill, true);
        }
      }
    }
  }

  onSimulationBegin() {
  }
  onSimulationEnd() {
    this.base.sim = null;
  }

  get hpRate() { return 0; }
  get hpRateMain() { return 0; }
  get hpRateSupport() { return 0; }
  get activeBuffCount() { return 0; }
  get activeDebuffCount() { return 0; }

  getNearAllyCount(args) {
    return 0;
  }
  getNearEnemyCount(args) {
    return 0;
  }

  get actions() {
    return [...(this.base.main?.skills ?? []), ...(this.base.support?.skills ?? [])].filter(a => a.isActive);
  }

  applySkill(skill, self = false) {
    let s = this.affectedSkills.find(a => a.skill === skill);
    if (!s) {
      s = new SkillHolder(skill, self);
      this.affectedSkills.push(s);
    }
    s.activate(self);
  }
  applyCustomEffect(effectType, value) {
    this.customEffects.push(new CustomEffect(effectType, value));
  }

  evaluateEffects(battleCtx) {

  }

  onTurnBegin() {
  }
  beforeAttack() {
  }
  afterAttack() {
  }
  onActionEnd() {
  }
  onTurnEnd() {
  }

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

  serialize() {
    let r = {};
    r.coord = [...this.coord];
    SimUnit.copyProps(r.main, this.main);
    SimUnit.copyProps(r.support, this.support);
    return r;
  }
  deserialize(r) {
    this.coord = [...r.coord];
    SimUnit.copyProps(this.main, r.main);
    SimUnit.copyProps(this.support, r.support);
  }
}

export class SimContext
{
  battleId = "";
  playerUnits = []; // SimUnit
  enemyUnits = []; // SimUnit
  turn = 1;
  isPlayerTurn = true;

  attacker = null;
  defender = null;
  results = []; // CombatResult

  constructor(playerUnits, enemyUnits) {
    this.playerUnits = playerUnits.map(a => new SimUnit(a));
    this.enemyUnits = enemyUnits.map(a => new SimUnit(a));
  }
  findUnit(u) {
    let r = this.playerUnits.find(a => a.unit === u);
    if (!r)
      r = this.enemyUnits.find(a => a.unit === u);
    return r;
  }

  get isEnemyTurn() { return !this.isPlayerTurn; }
  set isEnemyTurn(v) { this.isPlayerTurn = !v; }

  isOwnTurn(unit) {
    return unit && ((unit.isPlayer && this.isPlayerTurn) || (unit.isEnemy && this.isEnemyTurn));
  }

  passTurn() {
    if (this.isPlayerTurn) {
      this.isPlayerTurn = false;
      this.onPlayerTurnEnd();
      this.onEnemyTurnBegin();
    }
    else {
      ++this.turn;
      this.isPlayerTurn = true;
      this.onEnemyTurnEnd();
      this.onPlayerTurnBegin();
    }
  }

  onSimulationBegin() {
    for (let u of [...this.playerUnits, ...this.enemyUnits]) {
      u.onSimulationBegin();
    }
    this.onPlayerTurnBegin();
  }
  onSimulationEnd() {
    for (let u of [...this.playerUnits, ...this.enemyUnits]) {
      u.onSimulationEnd();
    }
  }

  onPlayerTurnBegin() {
    for (let u of this.playerUnits) {
      u.onTurnBegin();
    }
  }
  onPlayerTurnEnd() {
    for (let u of this.playerUnits) {
      u.onTurnEnd();
    }
  }

  onEnemyTurnBegin() {
    for (let u of this.enemyUnits) {
      u.onTurnBegin();
    }
  }
  onEnemyTurnEnd() {
    for (let u of this.enemyUnits) {
      u.onTurnEnd();
    }
  }
}

export class CombatResult
{
  attacker = {
    unit: null,
    damageMain: 0,
    damageSupport: 0,
  };
  defender = {
    unit: null,
    damageMain: 0,
    damageSupport: 0,
  };

  constructor() {
  }
}


export class PathFinder
{
  cells = [];
  xdiv = 0;
  ydiv = 0;

  constructor(xdiv, ydiv) {
    this.xdiv = xdiv;
    this.ydiv = ydiv;
    this.cells = new Array(xdiv * ydiv);
    for (let y = 0; y < this.ydiv; ++y) {
      for (let x = 0; x < this.xdiv; ++x) {
        this.cells[this.ydiv * y + x] = {
          moveDistance: -1,
          shootDistance: -1,
          isObstacle: false,
        };
      }
    }
  }
  getCell(x, y) {
    if ((x >= 0 && x < this.xdiv) && (y >= 0 && y < this.ydiv)) {
      return this.cells[this.ydiv * y + x];
    }
    return null;
  }

  isReachable(pos) {
    return (this.getCell(pos[0], pos[1])?.moveDistance ?? -1) >= 0;
  }
  isShootable(pos) {
    return (this.getCell(pos[0], pos[1])?.shootDistance ?? -1) >= 0;
  }
  setStart(pos) {
    let c = this.getCell(pos[0], pos[1]);
    if (c) {
      c.moveDistance = 0;
    }
  }
  setObstacles(units) {
    for (const u of units) {
      let c = this.getCell(u.coord[0], u.coord[1]);
      if (c) {
        c.isObstacle = true;
      }
    }
  }
  build(move, range) {
    const chartCell = function (x, y, m) {
      let c = this.getCell(x, y);
      if (c.isObstacle || c.moveDistance > -1) {
        return;
      }
      const neighbors = [
        this.getCell(x + 1, y + 0),
        this.getCell(x + 0, y + 1),
        this.getCell(x - 1, y + 0),
        this.getCell(x + 0, y - 1),
      ];
      for (let n of neighbors) {
        if (n && n.moveDistance == m) {
          c.moveDistance = m + 1;
        }
      }
    }.bind(this);

    const shootCell = function (x, y) {
      let c = this.getCell(x, y);
      if (c.moveDistance < 0) {
        return;
      }
      for (let rx = -range; rx <= range; ++rx) {
        for (let ry = -range; ry <= range; ++ry) {
          let d = Math.abs(rx) + Math.abs(ry);
          if (d <= range) {
            let c = this.getCell(x + rx, y + ry);
            if (c && (c.shootDistance < 0 || (c.shootDistance > -1 &&  d < c.shootDistance))) {
              c.shootDistance = d;
            }
          }
        }
      }
    }.bind(this);

    for (let m = 0; m < move; ++m) {
      for (let y = 0; y < this.ydiv; ++y) {
        for (let x = 0; x < this.xdiv; ++x) {
          chartCell(x, y, m);
        }
      }
    }
    for (let y = 0; y < this.ydiv; ++y) {
      for (let x = 0; x < this.xdiv; ++x) {
        shootCell(x, y);
      }
    }
  }
}
