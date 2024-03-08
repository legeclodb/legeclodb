import { $g } from "./battle_globals.js";

function $vue() {
  return window.$vue;
}

export function callHandler(funcName, ...callees) {
  for (let c of callees) {
    c[funcName]();
  //  try {
  //    c[funcName]();
  //  }
  //  catch (except) {
  //    console.log(`!!! ${funcName}`);
  //    console.log(c);
  //  }
  }
}

export function evaluateCondition(ctx, cond)
{
  if (!cond)
    return true;

  const condExp = function (val1, cmp, val2) {
    if (val1 == null)
      val1 = 0;
    if (typeof (val2) == "string")
      val2 = ctx[val2];
    const table = {
      "==": () => val1 == val2,
      ">": () => val1 > val2,
      "<": () => val1 < val2,
      ">=": () => val1 >= val2,
      "<=": () => val1 <= val2,
      "!=": () => val1 != val2,
    };
    return table[cmp]();
  }

  let ok = true;

  const boolProps = [
    "onOwnTurn", "onEnemyTurn",
    "onTargetAlly", "onTargetEnemy",
    "onActiveSkill", "onSingleSkill", "onAreaSkill",
    "onCloseCombat", "onRangedCombat",
    "onDamage", "onCriticalHit", "onKill", "onClassAdvantage"
  ];
  for (const p of boolProps) {
    if (p in cond) {
      if (!ctx[p]) {
        ok = false;
        break;
      }
    }
  }

  const includesPros = [
    ["onClass", "class"],
    ["onTargetClass", "targetClass"],
    ["onSymbol", "symbol"],
  ];
  for (const [cname, pname] of includesPros) {
    if (cname in cond) {
      if (!cond[cname].includes(ctx[pname])) {
        ok = false;
        break;
      }
    }
  }

  const queryFuncPros = [
    ["onEffect", "isOnEffect"],
  ];
  for (const [cname, fname] of queryFuncPros) {
    if (cname in cond) {
      if (!ctx[fname](cond[cname])) {
        ok = false;
        break;
      }
    }
  }

  const binaryExpressionProps = [
    "turn",
    "hp", "targetHp",
    "activeBuffCount", "targetActiveBuffCount",
    "activeDebuffCount", "targetActiveDebuffCount",
  ];
  for (const p of binaryExpressionProps) {
    if (p in cond) {
      if (!condExp(ctx[p], ...cond[p])) {
        ok = false;
        break;
      }
    }
  }

  const getExpressionProps = [
    ["nearAllyCount", "area", "getNearAllyCount"],
    ["nearEnemyCount", "area", "getNearEnemyCount"],
    ["token", "tokenName", "getToken"],
    ["targetToken", "tokenName", "getTargetToken"],
  ];
  for (const [cname, pname, fname] of getExpressionProps) {
    if (cname in cond) {
      const c = cond[cname];
      if (!condExp(ctx[fname](c[pname]), ...c.compare)) {
        ok = false;
        break;
      }
    }
  }

  return ok;
}

export function makeBattleContext(unit, target) {
  let sim = $g.sim;
  let ctx = {
    get turn() { return sim.turn; },
    get phase() { return sim.phase; },
    get move() { return sim.move; },
    get range() { return sim.range; },
    get onCloseCombat() { return this.range == 1; },
    get onRangedCombat() { return this.range > 1; },

    get class() { return unit.mainClass },
    get hp() { return unit.hpRate },
    get activeBuffCount() { return unit.activeBuffCount; },
    get activeDebuffCount() { return unit.activeDebuffCount; },
    isOnEffect(args) { return unit.isOnEffect(args); },
    getToken(args) { return unit.getToken(args); },
    getNearAllyCount(args) { return unit.getNearAllyCount(args); },
    getNearEnemyCount(args) { return unit.getNearEnemyCount(args); },

    get targetClass() { return target.mainClass },
    get targetHp() { return target.hpRate },
    get targetActiveBuffCount() { return target.activeBuffCount; },
    get targetActiveDebuffCount() { return target.activeDebuffCount; },
    getTargetToken(args) { return target.getToken(args); },

    get skill() { return this.skill_; },

    set skill(skill) {
      this.skill_ = skill;
      if (!skill || skill.isNormalAttack) {
        this.onNormalAttack = true;
        this.onTargetEnemy = true;
      }
      else {
        this.onActiveSkill = true;
        if (skill.isAreaTarget) {
          this.onAreaSkill = true;
        }
        else {
          this.onSingleSkill = true;
        }

        if (skill.isMainSkill && skill.isSingleTarget) {
          if (skill.isTargetAlly) {
            this.onTargetAlly = true;
          }
          if (skill.isTargetEnemy) {
            this.onTargetEnemy = true;
          }
        }
      }
    },
  };
  return ctx;
}

export function makeSimEffect(effect) {
  let self = Object.create(effect);
  self.count = self.duration ?? Infinity; // 残有効時間
  self.isStopped = true; // 自己バフはかけたターンは時間経過しない。そのためのフラグ。

  Object.defineProperty(self, "isAlive", {
    get: () => self.count > 0,
  });

  self.serialize = function () {
    return {
      count: self.count,
      isStopped: self.isStopped,
    };
  }
  self.deserialize = function (r) {
    self.count = r.count;
    self.isStopped = r.isStopped;
  }

  self.decrementCount = function () {
    if (!this.isStopped && this.count > 0) {
      --this.count;
    }
  }

  self.activate = function (bySelf) {
    if (self.duration) {
      self.count = self.duration;
      if (bySelf) {
        self.isStopped = false;
      }
    }
  }
  self.evaluateBuff = function (target, caster, ctx) {
  }
  self.evaluateDebuff = function (target, caster, ctx) {
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
  }

  self.onAttackBegin = function () {
  }
  self.onAttackEnd = function () {
  }

  self.onBattleBegin = function () {
  }
  self.onBattleEnd = function () {
  }

  self.onKill = function () {
  }

  self.onDeath = function () {
  }

  self.onRevive = function () {
  }
  //#endregion callbacks

  self._getValue = function (ctx, baseStat) {
    let r = 0;
    const effect = self;
    if (effect.value) {
      r = effect.value;
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

export function makeSimCustomEffect(type) {
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

export function makeSimSkill(skill, ownerChr) {
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
      effects: this.effects.map(a => a.serialize()),
    };
    if (this.isActive) {
      r.coolTime = this.coolTime;
    }
    return r;
  }
  self.deserialize = function (r) {
    if (this.isActive) {
      this.coolTime = r.coolTime;
    }
    this.effects = r.effects.map(function (data) {
      let tmp = makeSimEffect();
      tmp.deserialize(data);
      return tmp;
    });
  }

  Object.defineProperty(self, 'available', {
    get: function () { return !this.isActive || this.coolTime <= 0; },
  });

  self.activate = function (bySelf) {
    for (let e of this.effects) {
      e.activate(bySelf);
    }
  }
  self.getDamageRate = function (ctx) {
    return self.damageRate;
  }
  self.onFire = function () {
    console.log(this);
    if (this.isActive) {
      this.coolTime = this.ct + 1 ?? Infinity;
    }
  }

  //#region callbacks
  self.onSimulationBegin = function () {
    for (let e of this.effects) {
      e.onSimulationBegin();
    }
  }
  self.onSimulationEnd = function () {
    for (let e of this.effects) {
      e.onSimulationEnd();
    }
  }
  self.onOwnTurnBegin = function () {
    for (let e of this.effects) {
      e.onOwnTurnBegin();
    }
  }
  self.onOwnTurnEnd = function () {
    for (let e of this.effects) {
      e.onOwnTurnEnd();
    }
  }
  self.onOpponentTurnBegin = function () {
    for (let e of this.effects) {
      e.onOpponentTurnBegin();
    }
  }
  self.onOpponentTurnEnd = function () {
    for (let e of this.effects) {
      e.onOpponentTurnEnd();
    }
  }

  self.onActionBegin = function () {
    for (let e of this.effects) {
      e.onActionBegin();
    }
  }
  self.onActionEnd = function () {
    if (this.coolTime > 0) {
      --this.coolTime;
    }
    for (let e of this.effects) {
      e.onActionEnd();
    }
  }

  self.onAttackBegin = function () {
    for (let e of this.effects) {
      e.onAttackBegin();
    }
  }
  self.onAttackEnd = function () {
    for (let e of this.effects) {
      e.onAttackEnd();
    }
  }

  self.onBattleBegin = function () {
    for (let e of this.effects) {
      e.onBattleBegin();
    }
  }
  self.onBattleEnd = function () {
    for (let e of this.effects) {
      e.onBattleEnd();
    }
  }

  self.onKill = function () {
    for (let e of this.effects) {
      e.onKill();
    }
  }

  self.onDeath = function () {
    for (let e of this.effects) {
      e.onDeath();
    }
  }

  self.onRevive = function () {
    for (let e of this.effects) {
      e.onRevive();
    }
  }

  //#endregion callbacks
  return self;
}

