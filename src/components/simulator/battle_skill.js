import { $g } from "./battle_globals.js";

function $vue() {
  return window.$vue;
}

export function unique(array) {
  return array.filter((value, index, self) => {
    return self.indexOf(value) === index;
  });
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

export function getTargetUnits(ctx, json) {
  let targetTable = {
    "自身": () => [ctx.unit],
    "攻撃対象": () => ctx.targets,
    "範囲": () => ctx.getUnitsInArea(json.area),
    "範囲(ランダム)": () => ctx.getUnitsInArea(json.area),
    "味方全体": () => $g.sim.activeUnits.filter(a => a.isPlayer == ctx.unit.isPlayer),
    "敵全体": () => $g.sim.activeUnits.filter(a => a.isPlayer != ctx.unit.isPlayer),
  };
  if (json.target in targetTable) {
    return targetTable[json.target]();
  }
  else {
    console.log(`!! 未サポートの target ${json.target} !!`);
    return [];
  }
}

// parent: 防御側の時に元となる攻撃側 ctx が来る
export function makeActionContext(unit, target = null, skill = null, parent = null) {
  let sim = $g.sim;
  let ctx = {
    get turn() { return sim.turn; },
    get phase() { return sim.phase; },
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
      this.getUnitsInArea = (args) => u.getUnitsInArea(args);
      this.getNearAllyCount = (args) => u.getAlliesInArea(args).length;
      this.getNearEnemyCount = (args) => u.getEnemiesInArea(args).length;
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

  if (!parent) {
    // move は攻撃側用のパラメータ
    Object.defineProperties(ctx, {
      "move": { get: () => sim.move },
      "onOwnTurn": { get: () => true },
    });
  }
  else {
    Object.defineProperties(ctx, {
      "move": { get: () => 0 },
      "onEnemyTurn": { get: () => true },
      "onNormalAttack": { get: () => true },
      "onPhysicalDamage": { get: () => parent.onPhysicalDamage },
      "onMagicDamage": { get: () => parent.onMagicDamage },
    });
  }

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
    if (self.multiply) {
      const mul = self.multiply;
      let table = {
        "move": () => ctx.move,
        "range": () => ctx.rannge,
        "token": () => ctx.getTokenCount(mul.tokenName),
        "targetToken": () => ctx.getTargetTokenCount(mul.tokenName),
        "nearAllyCount": () => ctx.getNearAllyCount(mul.area),
        "nearEnemyCount": () => ctx.getNearEnemyCount(mul.area),
      };
      r *= Math.min(table[mul.by](), mul.max);
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
  const subactionTable = {
    heal: { prefix: 'cr' },
    areaDamage: { prefix: 'ad' },
    ctReduction: { prefix: 'cr' },
    doubleAttack: { prefix: 'da' },
    multiAction: { prefix: 'ma' },
    multiMove: { prefix: 'mm' },
  };

  let self = Object.create(skill);
  self.owner = ownerUnit;

  Object.defineProperty(self, 'area', {
    get: () => {
      if (typeof (skill.area) != 'number') {
        return skill.area;
      }
      let r = skill.area;
      if (skill.isMainSkill) {
        r += self.owner.main.bufRate["範囲"] ?? 0;
      }
      return r;
    },
  });
  Object.defineProperty(self, 'range', {
    get: () => {
      if (typeof (skill.range) != 'number') {
        return skill.range;
      }
      if (skill.isNormalAttack) {
        let chr = self.owner.main;
        return chr.range + (chr.bufRate["射程(通常攻撃)"] ?? 0);
      }
      else {
        let chr = skill.isMainSkill ? self.owner.main : self.owner.support;
        return skill.range + (chr.bufRate["射程(スキル)"] ?? 0);
      }
    },
  });

  let data = {};
  self.data = data; // serializable data
  if (self.isActive) {
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

  const setupSubaction = (name, prefix) => {
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
  for (const [name, info] of Object.entries(subactionTable)) {
    setupSubaction(name, info.prefix);
  }


  self.activate = function (bySelf) {
    for (let e of this.effects) {
      e.activate(bySelf);
    }
  }

  self.invokeHeal = function (ctx, timing = null) {
    for (let act of self?.heal ?? []) {
      if ((!timing || act.timing == timing) && !act.coolTime && evaluateCondition(ctx, act.condition)) {
        if (act.ct) {
          act.coolTime = act.ct;
        }

        let u = ctx.unit;
        for (let t of unique(getTargetUnits(ctx, act))) {
          // todo
          console.log(`!! 回復 ${u.main.name} -> ${t.main.name}!!`);
        }
      }
    }
  }
  self.invokeAreaDamage = function (ctx, timing = null) {
    for (let act of self?.areaDamage ?? []) {
      if ((!timing || act.timing == timing) && !act.coolTime && evaluateCondition(ctx, act.condition)) {
        if (act.ct) {
          act.coolTime = act.ct;
        }

        let u = ctx.unit;
        for (let t of unique(getTargetUnits(ctx, act))) {
          // todo
          console.log(`!! エリアダメージ ${u.main.name} -> ${t.main.name}!!`);
        }
      }
    }
  }

  self.invokeCtReduction = function (ctx, timing = null) {
    let succeeded = false;
    for (let act of self?.ctReduction ?? []) {
      if ((!timing || act.timing == timing) && !act.coolTime && evaluateCondition(ctx, act.condition)) {
        succeeded = true;
        if (act.ct) {
          act.coolTime = act.ct;
        }

        let u = ctx.unit;
        for (let t of unique(getTargetUnits(ctx, act))) {
          if (t.isPlayer == u.isPlayer) {
            let cond = null;
            if (act.targetSkill == "使用したスキル") {
              cond = (skill) => skill === ctx.skill;
            }
            else {
              cond = (skill) => skill !== self;
            }
            t.reduceSkillCT(act.value, cond);
            console.log(`!! CT減 ${u.main.name} -> ${t.main.name}!!`);
          }
        }
      }
    }
    return succeeded;
  }
  self.invokeDoubleAttack = function (ctx) {
    let succeeded = false;
    if (ctx.onNormalAttack) {
      for (let act of self?.doubleAttack ?? []) {
        if (!act.coolTime && evaluateCondition(ctx, act.condition)) {
          succeeded = true;
          if (act.ct) {
            act.coolTime = act.ct;
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
    for (let act of self?.multiAction ?? []) {
      if (!act.coolTime && evaluateCondition(ctx, act.condition)) {
        succeeded = true;
        if (act.ct) {
          act.coolTime = act.ct;
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
    for (let act of skill?.multiMove ?? []) {
      if (!act.coolTime && evaluateCondition(ctx, act.condition)) {
        succeeded = true;
        if (act.ct) {
          act.coolTime = act.ct;
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
        let u = ctx.unit;
        for (let t of unique(getTargetUnits(ctx, tri))) {
          if ((e.isBuff && t.isPlayer == u.isPlayer) || (e.isDebuff && t.isPlayer != u.isPlayer)) {
            t.applyEffect(e);
          }
        }
      }
    }
    self.invokeHeal(ctx, timing);
    self.invokeAreaDamage(ctx, timing);
    self.invokeCtReduction(ctx, timing);
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

    // 再行動などのクールタイム減
    for (const [name, info] of Object.entries(subactionTable)) {
      for (let act of self[name] ?? []) {
        if (act.coolTime) {
          --act.coolTime;
        }
      }
    }
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
    this.trigger(ctx, "戦闘後");
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

