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
    this.initialize();
  }
  initialize() {
    const emp = BaseUnit.emptyUnit;
    Object.assign(this.base.main, emp.main);
    Object.assign(this.base.support, emp.support);
    this.showEditor = false;
    this.editorData = [];

    const mergeChrData = $vue().mergeChrData;
    mergeChrData(this.base.main, null);
    mergeChrData(this.base.support, null);
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
    const mergeChrData = $vue().mergeChrData;
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
  }
  edit(ss) {
    const findItemByUid = $vue().findItemByUid;
    const copyArray = $vue().copyArray;
    const mergeChrData = $vue().mergeChrData;
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
    //console.log(this);
  }
}

function makeSimEffect(effect) {
  let self = Object.create(effect);
  self.stack = 1;
  self.time = Infinity; // 残有効時間
  self.isStopped = true; // 自己バフはかけたターンは時間経過しない。そのためのフラグ。
  self.enabled = true; // 有効か。基本的には time > 0 なら有効、そうでなければ無効だが、ユーザーが強制的に有効にすることもある。

  self.serialize = function () {
    return {
      stack: self.stack,
      time: self.time,
      isStopped: self.isStopped,
      enabled: self.enabled,
    };
  }
  self.deserialize = function (r) {
    self.stack = r.stack;
    self.time = r.time;
    self.isStopped = r.isStopped;
    self.enabled = r.enabled;
  }

  self.activate = function (bySelf) {
    if (self.duration) {
      self.time = self.duration;
      if (bySelf) {
        self.isStopped = false;
      }
    }
  }
  self.evaluateCondition = function (target, caster, battleCtx) {
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

    const cond = self.condition;
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
  self.evaluateBuff = function (target, caster, battleCtx) {
  }
  self.evaluateDebuff = function (target, caster, battleCtx) {
  }

  //#region callbacks
  self.onSimulationBegin = function () {
  }
  self.onSimulationEnd = function () {
  }

  self.onOwnTurnBegin = function () {
  }
  self.onOwnTurnEnd = function () {
    self.isStopped = false;
  }

  self.onOpponentTurnBegin = function () {
  }
  self.onOpponentTurnEnd = function () {
  }

  self.onActionBegin = function () {
  }
  self.onActionEnd = function () {
    if (!self.isStopped && self.time > 0) {
      if (--self.time == 0) {
        self.enabled = false;
      }
    }
  }

  self.onBattleBegin = function () {
  }
  self.onBattleEnd = function () {
  }
  //#endregion callbacks

  self._getValue = function (battleCtx, baseStat) {
    let r = 0;
    const effect = self;
    if (effect.value) {
      r = effect.value;
      if (effect.maxStack) {
        // 効果が重複するタイプ
        // フルスペック時の効果を返す
        r *= self.stack;
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
  return self;
}

function makeSimCustomEffect(type) {
  let self = {
    effectType: 0,
    value: 0,
  };
  let vue = $vue();
  self.effectType = typeof (type) === 'string' ? vue.getEffectIndex(type) : type;

  self.serialize = function () {
    return {
      effectType: this.effectType,
      value: this.value,
    };
  }
  self.deserialize = function (r) {
    this.effectType = r.effectType;
    this.value = r.value;
  }
  return self;
}

function makeSimSkill(skill, ownerChr) {
  let self = Object.create(skill);
  self.owner = ownerChr;
  if (self.isActive) {
    self.coolTime = 0;
  }
  self.effects = []; // SimEffect

  for (let effect of [...(self.buff ?? []), ...(self.debuff ?? [])]) {
    self.effects.push(makeSimEffect(effect));
  }

  self.serialize = function () {
    let r = {
      effects: self.effects.map(a => a.serialize()),
    };
    if (self.isActive) {
      r.coolTime = self.coolTime;
    }
    return r;
  }
  self.deserialize = function (r) {
    if (self.isActive) {
      self.coolTime = r.coolTime;
    }
    self.effects = r.effects.map(function (data) {
      let tmp = makeSimEffect();
      tmp.deserialize(data);
      return tmp;
    });
  }

  Object.defineProperty(self, 'available', {
    get: () => { return !self.isActive || self.coolTime <= 0; },
  });

  self.activate = function (bySelf) {
    for (let e of self.effects) {
      e.activate(bySelf);
    }
  }
  self.onFire = function () {
    console.log(self);
    if (self.isActive) {
      self.coolTime = self.ct ?? Infinity;
    }
  }

  //#region callbacks
  self.onSimulationBegin = function () {
    for (let e of self.effects) {
      e.onSimulationBegin();
    }
  }
  self.onSimulationEnd = function () {
    for (let e of self.effects) {
      e.onSimulationEnd();
    }
  }
  self.onOwnTurnBegin = function () {
    for (let e of self.effects) {
      e.onOwnTurnBegin();
    }
  }
  self.onOwnTurnEnd = function () {
    for (let e of self.effects) {
      e.onOwnTurnEnd();
    }
  }
  self.onOpponentTurnBegin = function () {
    for (let e of self.effects) {
      e.onOpponentTurnBegin();
    }
  }
  self.onOpponentTurnEnd = function () {
    for (let e of self.effects) {
      e.onOpponentTurnEnd();
    }
  }
  self.onAttackBegin = function () {
    for (let e of self.effects) {
      e.onAttackBegin();
    }
  }
  self.onAttackEnd = function () {
    for (let e of self.effects) {
      e.onAttackEnd();
    }
  }
  self.onActionEnd = function () {
    if (self.coolTime > 0) {
      --self.coolTime;
    }
    for (let e of self.effects) {
      e.onActionEnd();
    }
  }
  //#endregion callbacks
  return self;
}

class SimUnit {

  //#region fields
  base = null; // BaseUnit
  isDormant = false; // 配置前 (出現ターン前) のユニットは true
  coord = [0, 0];
  affectedSkills = []; // SimSkill
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
  //#endregion fields


  //#region props
  get fid() { return this.base.fid; }
  get phase() { return this.base.phase; }
  get isAlive() { return this.main.hp > 0; }
  get isActive() { return !this.isDormant && this.isAlive; }
  get isPlayer() { return this.base.isPlayer; }
  get isEnemy() { return this.base.isEnemy; }
  get hpRate() { return 0; }
  get hpRateMain() { return 0; }
  get hpRateSupport() { return 0; }
  get activeBuffCount() { return 0; }
  get activeDebuffCount() { return 0; }
  get actions() {
    return [...(this.base.main?.skills ?? []), ...(this.base.support?.skills ?? [])].filter(a => a.isActive);
  }
  //#endregion props


  //#region methods
  constructor(unit) {
    unit.sim = this;
    this.base = unit;
    this.coord = [...unit.base.coord];

    if (this.phase != "0") {
      this.isDormant = true;
    }

    const addBattleProps = function (chr, base) {
      chr.unit = this;
      chr.bufP = [];
      chr.bufF = [];
      chr.status = [...base.status];
      chr.hp = chr.status[0];

      let skills = base.skills ? base.skills.map(skill => makeSimSkill(skill, chr)) : [];
      if (chr.isMain) {
        // メインのスキルリストに通常攻撃を追加
        let atk = makeSimSkill($vue().findItemByUid(chr.damageType == "アタック" ? "9999999" : "9999998"));
        Object.defineProperty(atk, 'range', {
          get: () => chr.range,
        });
        skills = [atk, ...skills];
      }
      if (skills.length) {
        Object.defineProperty(chr, 'skills', {
          get: () => skills,
        });
      }

      Object.defineProperty(chr, 'statusBase', {
        value: base.status,
        writable: false,
      });
    }.bind(this);
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

  getNearAllyCount(args) {
    return 0;
  }
  getNearEnemyCount(args) {
    return 0;
  }

  applySkill(skill, self = false) {
    let s = this.affectedSkills.find(a => a.skill === skill);
    if (!s) {
      s = makeSimSkill(skill, self);
      this.affectedSkills.push(s);
    }
    s.activate(self);
  }
  applyCustomEffect(effectType, value) {
    this.customEffects.push(makeSimCustomEffect(effectType, value));
  }

  evaluateEffects(battleCtx) {

  }
  //#endregion methods


  //#region callbacks
  onSimulationBegin () {
  }
  onSimulationEnd() {
    this.base.sim = null;
  }

  // 自ターン開始前/後
  onOwnTurnBegin() {
  }
  onOwnTurnEnd() {
  }

  // 相手ターン開始前/後
  onOpponentTurnBegin() {
  }
  onOpponentTurnEnd() {
  }

  // 移動後、行動確定時、戦闘開始前もしくは非戦闘を含むスキル使用前に呼ばれる
  // 攻撃の場合は直後に onAttackBegin() が、
  // 戦闘に入る場合は直後に onBattleBegin() が呼ばれる
  onActionBegin() {
  }
  onActionEnd() {
  }

  // 移動後、行動確定時、戦闘非戦闘を問わず攻撃前に呼ばれる
  // 戦闘に入る場合は直後に onBattleBegin() が呼ばれる
  onAttackBegin() {
  }
  onAttackEnd() {
  }

  // 戦闘前 (非範囲攻撃、ゲーム中戦闘画面に入るもの) に呼ばれる
  // 攻撃される側も呼ばれる
  onBattleBegin() {
  }
  onBattleEnd() {
  }

  // 手段を問わず敵撃破時に呼ばれる
  onKill() {
  }

  // 手段を問わず撃破されたとき呼ばれる
  onDeath() {
  }

  // ラストスタンドなどで復活した時呼ばれる
  onRevive() {
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

export class ActionContext {
  attacker = null;
  defender = null;
  skill = null;
  move = 0;
  range = 1;
  dmgAttacker = {
    main: 0,
    support: 0,
  };
  dmgDefender = {
    main: 0,
    support: 0,
  };

  constructor(attacker, defender, skill) {
    this.attacker = attacker;
    this.defender = defender;
    this.skill = skill;
  }

  serialize() {
    let r = {};
    return r;
  }
  deserialize(r) {
  }
}

export class SimContext {

  //#region fields
  static instance = null;
  battleId = "";

  divX = 15;
  divY = 15;
  maxTurn = 5;

  units = [];
  turn = 1;
  phase = Phase.Player;

  attacker = null;
  defender = null;
  results = []; // CombatResult
  //#endregion fields


  //#region props
  get activeUnits() { return this.units.filter(u => !u.isDormant); }

  get isPlayerTurn() { return this.phase == Phase.Player; }
  get isEnemyTurn() { return this.phase == Phase.Enemy; }
  get phaseId() { return `${this.turn}${this.isPlayerTurn ? 'P' : 'E'}`; }
  //#endregion props


  //#region methods
  constructor(xd, yd, baseUnits) {
    SimContext.instance = this;
    this.divX = xd;
    this.divY = yd;
    this.units = baseUnits.map(a => new SimUnit(a));
  }

  findUnitByBase(baseUnit) {
    return this.units.find(a => a.base === baseUnit);
  }

  isOwnTurn(unit) {
    return unit && ((unit.isPlayer && this.isPlayerTurn) || (unit.isEnemy && this.isEnemyTurn));
  }

  getBattleResult(unit, skill, target, ctx) {
    const attack = (attacker, defender, skl = null) => {
      let result = {
        damageToSupport: 0,
        damageToMain: 0,
        get total() { return this.damageToSupport + this.damageToMain; },
      };

      let attackCount = 10;
      let atk = this.getAttackPower(attacker);
      let damageRate = this.getDamageRate(skl, attacker, defender);
      let dmgDealtBuff = this.getDamageDealtBuff(attacker);
      let critDmgRate = this.getCriticalDamageRate(attacker);
      let rangedPenarty = 1.0;

      // 対サポート
      if (defender.support && defender.support.hp > 0) {
        let def = this.getDefensePower(defender.support, attacker.damageType);
        let baseDmg = Math.max(atk - def, 1);
        let dmgTakenBuff = this.getDamageTakenBuff(defender.support, attacker.damageType);
        let finalDmg = baseDmg * damageRate * dmgDealtBuff * dmgTakenBuff * critDmgRate * rangedPenarty;

        let totalDamage = 0;
        while (attackCount && totalDamage < defender.support.hp) {
          totalDamage += finalDmg;
          --attackCount;
        }
        result.damageToSupport = finalDmg;
      }
      // 対メイン
      if (attackCount) {
        let def = this.getDefensePower(defender.main, attacker.damageType);
        let baseDmg = Math.max(atk - def, 1);
        let dmgTakenBuff = this.getDamageTakenBuff(defender.main, attacker.damageType);
        let finalDmg = baseDmg * damageRate * dmgDealtBuff * dmgTakenBuff * critDmgRate * rangedPenarty;

        let totalDamage = 0;
        while (attackCount) {
          totalDamage += finalDmg;
          --attackCount;
        }
        result.damageToMain = finalDmg;
      }

      return result;
    };

    let aSup = attack(unit.support, target, skill);
    let aMain = attack(unit.main, target, skill);
    let dSup = attack(target.support, unit);
    let dMain = attack(target.main, unit);
    return {
      attackerScore: aSup.total + aMain.total,
      defenderScore: dSup.total + dMain.total,
      apply() {
        target.support.hp -= aSup.damageToSupport + aMain.damageToSupport;
        target.main.hp    -= aSup.damageToMain + aMain.damageToMain;
        unit.support.hp   -= dSup.damageToSupport + dMain.damageToSupport;
        unit.main.hp      -= dSup.damageToMain + dMain.damageToMain;
      },
    };
  }

  fireSkill(unit, skill, targets, cell) {
    // targets は配列なら複数、非配列なら単体
    let target = Array.isArray(targets) ? null : targets;
    let range = 0;
    let move = 0;

    let doAttack = false;
    let doBattle = false;
    if (unit.prevCoord) {
      move = Math.abs(unit.coord[0] - unit.prevCoord[0]) + Math.abs(unit.coord[1] - unit.prevCoord[1]);
    }
    if (target) {
      range = Math.abs(unit.coord[0] - target.coord[0]) + Math.abs(unit.coord[1] - target.coord[1]);
    }

    // 条件変数を設定
    // 攻撃側
    let cond = {
      onOwnTurn: true,
      move: move,
    };
    if (skill) {
      if (skill.isNormalAttack) {
        cond.onNormalAttack = true;
      }
      else {
        cond.onActiveSkill = true;
        if (skill.isAreaTarget) {
          cond.onAreaSkill = true;
        }
        else {
          cond.onSingleSkill = true;
        }
      }

      if (target) {
        // 単体スキルの場合
        cond.range = range;
        if (skill.isTargetAlly) {
          cond.onTargetAlly = true;
        }
        if (skill.isTargetEnemy) {
          cond.onTargetEnemy = true;
        }
        if (range == 1) {
          cond.onCloseCombat = true;
        }
        else if (range > 1) {
          cond.onRangedCombat = true;
        }
      }

      if (skill.isMainSkill && skill.damageRate) {
        doAttack = true;
        doBattle = cond.onTargetEnemy;
      }
    }

    // fire onActionBegin()
    // fire onAttackBegin()
    // fire onBattleBegin()

    // 待機の場合 skill は null
    if (skill) {
      console.log(targets);
      console.log(cond);
      skill.onFire();
    }

    //cond.onCriticalhit = true;
    //cond.onDamage = true;

    let killed = (target ? [target] : targets)?.filter(a => !a.isAlive);
    if (killed?.length) {
      cond.onKill = true;

      for (let k of killed) {
        // fire onDeath
      }

      // fire onKill()
    }

    // fire onBattleEnd()
    // fire onAttackEnd()
    // fire onActionEnd()
  }

  passTurn() {
    if (this.isPlayerTurn) {
      this.phase = Phase.Enemy;
      this.onPlayerTurnEnd();
      this.onEnemyTurnBegin();
    }
    else if (this.turn < this.maxTurn) {
      ++this.turn;
      this.phase = Phase.Player;
      this.onEnemyTurnEnd();
      this.onPlayerTurnBegin();
    }
    else {
      console.log("End of Battle");
    }
  }

  onSimulationBegin() {
    for (let u of this.units) {
      u.onSimulationBegin();
    }
    this.onPlayerTurnBegin();
  }
  onSimulationEnd() {
    for (let u of this.units) {
      u.onSimulationEnd();
    }
    SimContext.instance = null;
  }

  onPlayerTurnBegin() {
    for (let u of this.activeUnits) {
      if (u.isPlayer) {
        u.onOwnTurnBegin();
      }
    }
    for (let u of this.activeUnits) {
      if (!u.isPlayer) {
        u.onOpponentTurnBegin();
      }
    }
  }
  onPlayerTurnEnd() {
    for (let u of this.activeUnits) {
      if (u.isPlayer) {
        u.onOwnTurnEnd();
      }
    }
    for (let u of this.activeUnits) {
      if (!u.isPlayer) {
        u.onOpponentTurnEnd();
      }
    }
  }

  onEnemyTurnBegin() {
    // 増援配置
    const pid = this.phaseId;
    for (let u of this.units) {
      if (u.isDormant && u.phase == pid) {
        this.placeUnit(u, u.coord);
      }
    }

    for (let u of this.activeUnits) {
      if (u.isEnemy) {
        u.onOwnTurnBegin();
      }
    }
    for (let u of this.activeUnits) {
      if (!u.isEnemy) {
        u.onOpponentTurnBegin();
      }
    }
  }
  onEnemyTurnEnd() {
    for (let u of this.activeUnits) {
      if (u.isEnemy) {
        u.onOwnTurnEnd();
      }
    }
    for (let u of this.activeUnits) {
      if (!u.isEnemy) {
        u.onOpponentTurnEnd();
      }
    }
  }
  //#endregion methods


  //#region impl
  findUnitByCoord(coord) {
    for (const u of this.activeUnits) {
      if (u.coord[0] == coord[0] && u.coord[1] == coord[1])
        return u;
    }
    return null;
  }
  isValidCoord(coord) {
    return (coord[0] >= 0 && coord[0] < this.divX) &&
      (coord[1] >= 0 && coord[1] < this.divY);
  }
  placeUnit(unit, coord) {
    // 指定座標が専有されていた場合はずらす
    const subCoord = [
      [0, 0],
      [0, -1], [1, 0], [0, 1], [-1, 0],
      [0, -2], [1, -1], [2, 0], [1, 1], [0, 2], [-1, 1], [-2, 0], [-1, -1]
    ];
    for (const sc of subCoord) {
      let c = [coord[0] + sc[0], coord[1] + sc[1]];
      if (this.isValidCoord(c) && !this.findUnitByCoord(c)) {
        unit.coord = c;
        unit.isDormant = false;
        return true;
      }
    }
    return false;
  }

  eraseWeakEnemies() {
    for (const u of this.activeUnits) {
      if (u.isEnemy && u.fid != "E01") {
        u.main.hp = 0;
        u.support.hp = 0;
      }
    }
  }
  //#endregion impl
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
          isOccupied: false,
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

  isInMoveRange(pos) {
    return pos && (this.getCell(pos[0], pos[1])?.moveDistance ?? -1) >= 0;
  }
  isInFireRange(pos) {
    return pos && (this.getCell(pos[0], pos[1])?.shootDistance ?? -1) >= 0;
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
  setOccupied(units) {
    for (const u of units) {
      let c = this.getCell(u.coord[0], u.coord[1]);
      if (c) {
        c.isOccupied = true;
      }
    }
  }
  buildPath(move, range, rangeShape = null, dir = Direction.None) {
    if (range == "自ユニット")
      range = 0;
    if (range == "単体" || range == "自ユニット")
      range = 1;
    else if (range == "全体")
      range = 99;

    for (let m = 0; m < move; ++m) {
      for (let y = 0; y < this.ydiv; ++y) {
        for (let x = 0; x < this.xdiv; ++x) {
          this._chartCell(x, y, m);
        }
      }
    }
    for (let y = 0; y < this.ydiv; ++y) {
      for (let x = 0; x < this.xdiv; ++x) {
        this._shootCell(x, y, range, rangeShape, dir);
      }
    }
  }

  _chartCell(x, y, distance) {
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
      if (n && n.moveDistance == distance) {
        c.moveDistance = distance + 1;
      }
    }
  }
  _shootCell(x, y, range, shape, dir) {
    let c = this.getCell(x, y);
    if (c.moveDistance < 0 || c.isOccupied) {
      return;
    }

    const fillCell = function (rx, ry, distance) {
      let c = this.getCell(x + rx, y + ry);
      if (c && (c.shootDistance < 0 || distance < c.shootDistance)) {
        c.shootDistance = distance;
      }
    }.bind(this);

    let df = null;
    if (shape == "周囲") {
      df = function (rx, ry) {
        let d = Math.max(Math.abs(rx), Math.abs(ry));
        if (d <= range) {
          fillCell(rx, ry, d);
        }
      };
    }
    else if (shape == "直線") {
      df = function (rx, ry) {
        let d = Math.abs(rx) + Math.abs(ry);
        if (d <= range && (rx == 0 || ry == 0)) {
          if (dir == Direction.None || (dir == Direction.Up && ry < 0) || (dir == Direction.Right && rx > 0) || (dir == Direction.Down && ry > 0) || (dir == Direction.Left && rx < 0)) {
            fillCell(rx, ry, d);
          }
        }
      };
    }
    else {
      df = function (rx, ry) {
        let d = Math.abs(rx) + Math.abs(ry);
        if (d <= range) {
          fillCell(rx, ry, d);
        }
      };
    }

    for (let rx = -range; rx <= range; ++rx) {
      for (let ry = -range; ry <= range; ++ry) {
        df(rx, ry);
      }
    }
  }
}

export const Phase = {
  Player: 0,
  Enemy: 1,
}

export const Direction = {
  None: 0,
  Up: 1,
  Right: 2,
  Down: 3,
  Left: 4,
}
export function calcDirection(base, target) {
  const dir = [target[0] - base[0], target[1] - base[1]];
  if (dir[1] < 0) {
    return Direction.Up;
  }
  else if (dir[0] > 0) {
    return Direction.Right;
  }
  else if (dir[1] > 0) {
    return Direction.Down;
  }
  else if (dir[0] < 0) {
    return Direction.Left;
  }
  return Direction.None; // base == target
}

export function $vue() {
  return window.$vue;
}
export function $sim() {
  return SimContext.instance;
}
export function $findObjectByUid(uid) {
  return $vue().findObjectByUid(uid);
}
