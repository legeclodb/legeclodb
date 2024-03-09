import { $g } from "./battle_globals.js";

function $vue() {
  return window.$vue;
}

export function callHandler(funcName, ctx, ...callees) {
  for (let c of callees) {
    c[funcName](ctx);
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
    "onBattle", "onCloseCombat", "onRangedCombat",
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
    ["onTerrain", "terrain"]
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
    ["token", "tokenName", "getTokenCount"],
    ["targetToken", "tokenName", "getTargetTokenCount"],
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

export function makeActionContext(unit, target = null, skill = null) {
  let sim = $g.sim;
  let ctx = {
    get turn() { return sim.turn; },
    get phase() { return sim.phase; },
    get move() { return sim.move; },
    get range() { return sim.range; },
    get onCloseCombat() { return this.onBattle && this.range == 1; },
    get onRangedCombat() { return this.onBattle && this.range > 1; },
    get terrain() { return ""; },

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

    get unit() { return this.unit_; },
    set unit(u) {
      this.unit_ = u;
      Object.defineProperties(this, {
        class: {
          configurable: true,
          get: () => u.mainClass
        },
        hp: {
          configurable: true,
          get: () => u.hpRate
        },
        activeBuffCount: {
          configurable: true,
          get: () => u.activeBuffCount
        },
        activeDebuffCount: {
          configurable: true,
          get: () => u.activeDebuffCount
        },
      });
      this.isOnEffect = (args) => u.isOnEffect(args);
      this.getTokenCount = (args) => u.getTokenCount(args);
      this.getNearAllyCount = (args) => u.getNearAllyCount(args);
      this.getNearEnemyCount = (args) => u.getNearEnemyCount(args);
    },

    get target() { return this.target_; },
    set target(u) {
      this.target_ = u;
      Object.defineProperties(this, {
        targetClass: {
          configurable: true,
          get: () => u.mainClass
        },
        targetHp: {
          configurable: true,
          get: () => u.hpRate
        },
        targetActiveBuffCount: {
          configurable: true,
          get: () => u.activeBuffCount
        },
        targetActiveDebuffCount: {
          configurable: true,
          get: () => u.activeDebuffCount
        },
      });
      this.getTargetTokenCount = (args) => u.getTokenCount(args);
    },
  };

  if (unit) {
    ctx.unit = unit;
  }
  if (target) {
    ctx.target = target;
  }
  if (skill) {
    ctx.skill = skill;
  }
  return ctx;
}

export function makeSimEffect(effect, stop = false) {
  let self = Object.create(effect);
  let data = {};
  self.data = data; // serializable data

  if (self.duration) {
    data.count = self.duration; // 残有効時間
    data.isStopped = stop; // 自己バフはかけたターンは時間経過しない。そのためのフラグ。
    Object.defineProperty(self, "count", {
      get: () => data.count,
      set: (v) => { data.count = v },
    });
    Object.defineProperty(self, "isStopped", {
      get: () => data.isStopped,
      set: (v) => { data.isStopped = v },
    });
  }
  else {
    Object.defineProperty(self, "count", {
      get: () => Infinity,
      set: (v) => { },
    });
  }

  Object.defineProperty(self, "isAlive", {
    get: () => self.count > 0,
  });
  Object.defineProperty(self, "isAdditive", {
    get: () => 'add' in self,
  });

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
  self.getValue = function (ctx, unit) {
    let r = 0;
    if ('value' in self) {
      r = self.value;
    }
    else if ('variable' in self) {
      // HP 割合などに応じて効果が上下するタイプ
      const v = self.variable;
      if (Array.isArray(v.max)) {
        r = v.max.at(-1);
      }
      else {
        r = v.max;
      }
    }
    else if ('add' in self) {
      // "アタックの n% をマジックに加算" など
      const v = self.add;
      let chr = v.source == "サポート" ? unit.support : unit.main;
      let table = {
        "最大HP": () => chr.baseHp,
        "アタック": () => chr.baseAtk,
        "ディフェンス": () => chr.baseDef,
        "マジック": () => chr.baseMag,
        "レジスト": () => chr.baseRes,
      };
      r = table[v.from]() * (v.rate / 100);
    }
    // 効果が重複するタイプ
    if (self.multiply?.max) {
      r *= self.multiply.max;
    }
    return self.isDebuff ? -r : r;
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

  self.onActionBegin = function (ctx) {
  }
  self.onActionEnd = function (ctx) {
  }

  self.onAttackBegin = function (ctx) {
  }
  self.onAttackEnd = function (ctx) {
  }

  self.onBattleBegin = function (ctx) {
  }
  self.onBattleEnd = function (ctx) {
  }

  self.onKill = function (ctx) {
  }

  self.onDeath = function (ctx) {
  }

  self.onRevive = function (ctx) {
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

export function makeSimSkill(skill, ownerUnit) {
  let self = Object.create(skill);
  self.owner = ownerUnit;

  let data = {};
  self.data = data; // serializable data
  if (self.isActive && self.ct) {
    let pname = 'coolTime';
    let id = `${self.uid}.${pname}`;
    data[id] = 0;
    Object.defineProperty(self, pname, {
      get: () => { return data[id]; },
      set: (v) => { data[id] = v; },
    });
  }
  Object.defineProperty(self, 'available', {
    get: function () { return !this.isActive || this.coolTime <= 0; },
  });

  const setupActions = (name, prefix) => {
    if (!(name in self)) {
      return;
    }

    let list = self[name].map(a => Object.create(a));
    Object.defineProperty(self, name, {
      get: () => list,
    });
    for (let i = 0; i < list.length; ++i) {
      let obj = list[i];
      if ('ct' in obj) {
        let pname = 'coolTime';
        let id = `${self.uid}.${prefix}${i}.${pname}`;
        data[id] = 0;
        Object.defineProperty(obj, pname, {
          get: () => { return data[id]; },
          set: (v) => { data[id] = v; },
        });
      }
      if ('count' in obj) {
        let pname = 'remain';
        let id = `${self.uid}.${prefix}${i}.${pname}`;
        data[id] = obj.count;
        Object.defineProperty(obj, pname, {
          get: () => { return data[id]; },
          set: (v) => { data[id] = v; },
        });
      }
    }
  };
  setupActions('ctReduction', 'cr');
  setupActions('doubleAttack', 'da');
  setupActions('multiAction', 'ma');
  setupActions('multiMove', 'mm');

  self.activate = function (bySelf) {
    for (let e of this.effects) {
      e.activate(bySelf);
    }
  }
  self.invokeDoubleAttack = function (ctx) {
    let succeeded = false;
    if (ctx.onNormalAttack) {
      for (let v of self?.doubleAttack ?? []) {
        if (!v.coolTime && evaluateCondition(ctx, v.condition)) {
          succeeded = true;
          if (v.ct) {
            v.coolTime = v.ct;
          }
        }
        if (succeeded) {
          console.log("!! 2回攻撃 !!");
        }
      }
    }
    return succeeded;
  }
  self.invokeMultiAction = function (ctx) {
    let succeeded = false;
    for (let v of self?.multiAction ?? []) {
      if (!v.coolTime &&evaluateCondition(ctx, v.condition)) {
        succeeded = true;
        if (v.ct) {
          v.coolTime = v.ct;
        }
      }
      if (succeeded) {
        console.log("!! 再行動 !!");
      }
    }
    return succeeded;
  }
  self.invokeMultiMove = function (ctx) {
    let succeeded = false;
    for (let v of skill?.multiMove ?? []) {
      if (!v.coolTime &&evaluateCondition(ctx, v.condition)) {
        succeeded = true;
        if (v.ct) {
          v.coolTime = v.ct;
        }
      }
      if (succeeded) {
        console.log("!! 再移動 !!");
      }
    }
    return succeeded;
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

  self.trigger = function (ctx, timing) {
    for (let e of [...(this?.buff ?? []), ...(this?.debuff ?? [])]) {
      let tri = e?.trigger;
      if (tri && tri.timing == timing && evaluateCondition(ctx, tri.condition)) {
        console.log(e);
        let targets = [];
        if (tri.target == "攻撃対象") {
          targets = ctx.targets;
        }
        for (let t of targets) {
          t.applyEffect(e);
        }
      }
    }
  };

  //#region callbacks
  self.onSimulationBegin = function (ctx) {
  }
  self.onSimulationEnd = function (ctx) {
  }
  self.onOwnTurnBegin = function (ctx) {
    this.trigger(ctx, "自ターン開始時");
  }
  self.onOwnTurnEnd = function (ctx) {
    this.trigger(ctx, "自ターン終了時");
  }
  self.onOpponentTurnBegin = function (ctx) {
    this.trigger(ctx, "敵ターン開始時");
  }
  self.onOpponentTurnEnd = function (ctx) {
    this.trigger(ctx, "敵ターン終了時");
  }

  self.onActionBegin = function (ctx) {
    this.trigger(ctx, "行動前");
  }
  self.onActionEnd = function (ctx) {
    this.trigger(ctx, "行動後");
    if (this.coolTime > 0) {
      --this.coolTime;
    }
  }

  self.onAttackBegin = function (ctx) {
    this.trigger(ctx, "攻撃前");
  }
  self.onAttackEnd = function (ctx) {
    this.trigger(ctx, "攻撃後");
  }

  self.onBattleBegin = function (ctx) {
    this.trigger(ctx, "戦闘前");
  }
  self.onBattleEnd = function (ctx) {
    this.trigger(ctx, "戦闘前");
  }

  self.onKill = function (ctx) {
    this.trigger(ctx, "敵撃破時");
  }

  self.onDeath = function (ctx) {
    this.trigger(ctx, "死亡時");
  }

  self.onRevive = function (ctx) {
    this.trigger(ctx, "復活時");
  }

  //#endregion callbacks
  return self;
}

