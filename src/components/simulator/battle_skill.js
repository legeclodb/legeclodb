function $vue() {
  return window.$vue;
}

export function makeSimEffect(effect) {
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
    const condExp = function (val1, cmp, val2) {
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
  self.onFire = function () {
    console.log(this);
    if (this.isActive) {
      this.coolTime = this.ct ?? Infinity;
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
  self.onActionEnd = function () {
    if (this.coolTime > 0) {
      --this.coolTime;
    }
    for (let e of this.effects) {
      e.onActionEnd();
    }
  }
  //#endregion callbacks
  return self;
}

