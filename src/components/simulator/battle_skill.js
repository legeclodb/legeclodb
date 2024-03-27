import { $g } from "./battle_globals.js";
import { SimUnit, UnitState } from "./battle_unit.js";
import { unique, count, minElement } from "../utils.js";

export function scalar(v) {
  return Array.isArray(v) ? v.at(-1) : v;
}

export const Shape = {
  Diamond: 0x00, // 菱形(範囲)
  Square: 0x01, // 正方形(周囲)
  Directional: 0x02, // 直線
  Special: 0x03, // 特殊形状指定
  HollowDiamond: 0x10, // 自身を除く範囲
  HollowSquare: 0x11, // 自身を除く周囲
};
export const Direction = {
  None: 0,
  Up: 1,
  Right: 2,
  Down: 3,
  Left: 4,
}

export function calcDistace(pos1, pos2) {
  return Math.abs(pos1[0] - pos2[0]) + Math.abs(pos1[1] - pos2[1]);
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
export function areaStringToEnum(s) {
  if (s == '範囲') { return Shape.Diamond; }
  else if (s == '周囲') { return Shape.Square; }
  else if (s == '直線') { return Shape.Directional; }
  else if (s == '特殊') { return Shape.Special; }
  else if (s == '範囲(自身を除く)') { return Shape.HollowDiamond; }
  else if (s == '周囲(自身を除く)') { return Shape.HollowSquare; }
  return null;
}
export function parseArea(args) {
  let size = 0;
  let shape = Shape.Diamond;
  if (typeof (args) === 'number') {
    size = args;
  }
  else if (Array.isArray(args)) {
    size = Array.isArray(args[0]) ? args[0].at(-1) : args[0];
    shape = areaStringToEnum(args[1]) ?? Shape.Diamond;
  }
  return {
    size: size,
    shape: shape
  };
}

export function genDiamondCoords(radius) {
  const seqX = (n) => {
    if (n == 0)
      return [0];
    let r = [];
    for (let i = 0; i <= n; ++i)
      r.push(i);
    for (let i = n - 1; i >= -n; --i)
      r.push(i);
    for (let i = -n + 1; i < 0; ++i)
      r.push(i);
    return r;
  };
  const seqY = (n) => {
    if (n == 0)
      return [0];
    let r = [];
    for (let i = -n; i <= n; ++i)
      r.push(i);
    for (let i = n - 1; i > -n; --i)
      r.push(i);
    return r;
  };
  let sx = seqX(radius);
  let sy = seqY(radius);
  return sx.map((x, i) => [sx[i], sy[i]])
}

// params: {
//  shape: Shape,
//  center: [x,y],
//  size: Number,
//  direction: Direction, (Shape.Directional) の場合
//  shapeData: [], (Shape.Special) の場合
//}
export function isInside(pos, params) {
  const distance = () => {
    return [Math.abs(pos[0] - params.center[0]), Math.abs(pos[1] - params.center[1])];
  };

  let shape = params.shape ?? Shape.Diamond;
  if ((shape & 0x0f) == Shape.Diamond) { // 範囲
    let [dx, dy] = distance();
    if ((shape & 0x10) != 0 && (dx + dy == 0))
      return false; // 自身を除く
    return (dx + dy) <= params.size;
  }
  else if ((shape & 0x0f) == Shape.Square) { // 周囲
    let [dx, dy] = distance();
    if ((shape & 0x10) != 0 && (dx + dy == 0))
      return false; // 自身を除く
    return Math.max(dx, dy) <= params.size;
  }
  else if (shape == Shape.Directional) { // 直線
    let [dx, dy] = distance();
    let center = params.center;
    if (Math.max(dx, dy) <= params.size && (pos[0] == center[0] || pos[1] == center[1])) {
      // 4 方向いずれかに入っていたらここに来る
      let dir = params.direction;
      return !dir || dir == Direction.None || dir == calcDirection(center, pos);
    }
    return false;
  }
  else if (shape == Shape.Special) { // 特殊
    if (params.shapeData) {
      const line = params.shapeData[pos[1]];
      if (line)
        return line[pos[0]] == 1;
    }
    return false;
  }
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
    "onActiveSkill", "onSingleSkill", "onAreaSkill",
    "onBattle", "onCloseCombat", "onRangedCombat",
    "onDamage", "onCriticalHit", "onKill", "onClassAdvantage",
    "onMultiMove", "onMultiAction", "onIdle"
  ];
  for (const p of boolProps) {
    if (p in cond) {
      if (Boolean(ctx[p]) != cond[p]) {
        ok = false;
        break;
      }
    }
  }

  const includesProps = [
    ["onClass", "class"],
    ["onTargetClass", "targetClass"],
    ["onSymbol", "symbol"],
    ["onTerrain", "terrain"]
  ];
  for (const [cname, pname] of includesProps) {
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
  const getAllyWithLowestHpRate = () => {
    let allies = $g.sim.activeUnits.filter(a => a.isPlayer == ctx.unit.isPlayer);
    let lowest = minElement(allies, (a, b) => a.hpRate < b.hpRate);
    return lowest ? [lowest] : [];
  };

  let targetTable = {
    "自身": () => [ctx.unit],
    "攻撃対象": () => ctx.targets ?? (ctx.target ? [ctx.target] : []),
    "スキル対象": () => ctx.targets ?? (ctx.target ? [ctx.target] : []),
    "範囲": () => ctx.getUnitsInArea(json.area),
    "乱択": () => ctx.getUnitsInArea(json.area),
    "味方(低HP)": () => getAllyWithLowestHpRate(),
    "味方全体": () => $g.sim.activeUnits.filter(a => a.isPlayer == ctx.unit.isPlayer),
    "敵全体": () => $g.sim.activeUnits.filter(a => a.isPlayer != ctx.unit.isPlayer),
    "召喚先": () => ctx.unit.summon,
    "召喚元": () => ctx.unit.summoner ? [ctx.unit.summoner] : [],
  };
  if (json.target in targetTable) {
    return targetTable[json.target]();
  }
  else {
    console.log(`!! 未サポートの target ${json.target} !!`);
    return [];
  }
}

export function makeActionContext(unit, target, skill) {
  let sim = $g.sim;

  const damageProps = [
    "damageToSupport", "damageToMain",
    "additionalDamageToSupport", "additionalDamageToMain",
  ];
  const damageRecordBase = {
    get(fid) {
      let r = this[fid];
      if (r === undefined) {
        r = this[fid] = {
          main: 0,
          support: 0,
          additional: 0,
          get total() { return this.main + this.support + this.additional; }
        };
      }
      return r;
    },
    clear() {
      for (const k of Object.keys(this)) {
        if (typeof (this[k]) == "object") {
          delete this[k];
        }
      }
    }
  };

  let ctx = {
    move: 0,
    range: 0,
    get turn() { return sim.turn; },
    get phase() { return sim.phase; },
    get onCloseCombat() { return this.onBattle && this.range == 1; },
    get onRangedCombat() { return this.onBattle && this.range > 1; },
    get terrain() { return ""; },

    // skill 関連
    skill: skill,
    get onNormalAttack() { return this.skill === null || this.skill.isNormalAttack; }, // skill が undefined の場合は false 
    get onActiveSkill() { return this.skill && !this.skill.isNormalAttack; },
    get onAreaSkill() { return this.onActiveSkill && this.skill.isAreaTarget; },
    get onSingleSkill() { return this.onActiveSkill && this.skill.isSingleTarget; },

    // unit 関連
    unit: unit,
    get class() { return this.unit.mainClass; },
    get symbol() { return this.unit.symbol; },
    get hp() { return this.unit.hpRate; },
    get activeBuffCount() { return this.unit.activeBuffCount },
    get activeDebuffCount() { return this.unit.activeDebuffCount; },
    get onOwnTurn() { return sim.isOwnTurn(this.unit); },
    get onEnemyTurn() { return !sim.isOwnTurn(this.unit); },
    isOnEffect(args) { return this.unit.isOnEffect(args); },
    getTokenCount(args) { return this.unit.getTokenCount(args); },
    getUnitsInArea(args) { return this.unit.getUnitsInArea(args); },
    getNearAllyCount(args) { return unique(this.unit.getAlliesInArea(args)).length; },
    getNearEnemyCount(args) { return unique(this.unit.getEnemiesInArea(args)).length; },

    // target 関連
    target: target,
    get targetClass() { return this.target?.mainClass; },
    get targetHp() { return this.target?.hpRate ?? 0; },
    get targetActiveBuffCount() { return this.target?.activeBuffCount ?? 0; },
    get targetActiveDebuffCount() { return this.target?.activeDebuffCount ?? 0; },
    getTargetTokenCount(args) { return this.target ? this.target.getTokenCount(args) : 0; },

    // ダメージ関連
    damageDealt: Object.create(damageRecordBase),
    damageTaken: Object.create(damageRecordBase),
    healDealt: Object.create(damageRecordBase),
    healTaken: Object.create(damageRecordBase),
    addDamage(v, fromChr, toChr) {
      let from = fromChr.unit;
      let to = toChr.unit;

      let dealt = this.damageDealt.get(from.fid);
      if (!this.attackInProgress) {
        dealt.additional += v;
      }
      else if (fromChr.isSupport) {
        dealt.support += v;
      }
      else {
        dealt.main += v;
      }

      let taken = this.damageTaken.get(to.fid);
      if (toChr.isSupport) {
        taken.support += v;
      }
      else {
        taken.main += v;
      }
    },
    addHeal(v, fromChr, toChr) {
      let from = fromChr.unit;
      let to = toChr.unit;

      let dealt = this.healDealt.get(from.fid);
      if (fromChr.isSupport) {
        dealt.support += v;
      }
      else {
        dealt.main += v;
      }

      let taken = this.healTaken.get(to.fid);
      if (toChr.isSupport) {
        taken.support += v;
      }
      else {
        taken.main += v;
      }
    },

    makeChild() {
      let r = Object.create(this);
      // base 側に変更を伝達するため、直接 base 側の関数を呼ぶ
      r.addDamage = (...args) => { this.addDamage(...args); };
      r.addHeal = (...args) => { this.addHeal(...args); };
      return r;
    },
    inheritDamage(parent) {
      this.addDamage = (...args) => { parent.addDamage(...args); };
      this.addHeal = (...args) => { parent.addHeal(...args); };
    },

    _inheritProps(parent, props) {
      for (const p of props) {
        if (p in parent) {
          this[p] = parent[p];
        }
      }
    },
    inheritBattleParams(parent) {
      this._inheritProps(parent, ["range", "onAttack", "onBattle"]);
    },
    inheritAttackerParams(parent) {
      this.inheritBattleParams(parent);
      this._inheritProps(parent, ["onPhysicalDamage", "onMagicDamage"]);
      if (parent.isTargetGuardian) {
        this.onGuard = true;
      }
    },
  };

  if (skill?.isAttackSkill) {
    ctx.onAttack = true;
    if (skill?.isBattleSkill)
      ctx.onBattle = true;
  }
  ctx.move = (unit?.moveDistance ?? 0) + (unit?.prevMoveDistance ?? 0);

  return ctx;
}

export function getEffectMultiply(self, ctx) {
  // 効果が重複するタイプの重複率
  const mul = self.multiply;
  if (mul) {
    const table = {
      "move": () => ctx.move,
      "distance": () => Math.max(ctx.range - 1, 0),
      "token": () => ctx.getTokenCount(mul.tokenName),
      "targetToken": () => ctx.getTargetTokenCount(mul.tokenName),
      "activeBuffCount": () => ctx.activeBuffCount,
      "targetActiveBuffCount": () => ctx.targetActiveBuffCount,
      "nearAllyCount": () => ctx.getNearAllyCount(mul.area),
      "nearEnemyCount": () => ctx.getNearEnemyCount(mul.area),
    };
    return Math.min(table[mul.by](), mul.max);
  }
  return 1;
}

export function getEffectValue(self, ctx, unit) {
  let r = 0;
  if ('value' in self) {
    r = self.value;
  }
  else if ('variable' in self) {
    // HP 割合などに応じて効果が上下するタイプ
    // とりあえず常に最大値を返すようにしておく
    r = scalar(self.variable.max);
  }
  else if ('add' in self) {
    // "アタックの n% をマジックに加算" など
    const v = self.add;
    const chr = v.source == "サポート" ? unit.support : unit.main;
    const table = {
      "最大HP": () => chr.baseHp,
      "アタック": () => chr.baseAtk,
      "ディフェンス": () => chr.baseDef,
      "マジック": () => chr.baseMag,
      "レジスト": () => chr.baseRes,
    };
    r = Math.round(table[v.from]() * scalar(v.rate));
  }

  r *= getEffectMultiply(self, ctx);
  return self.isDebuff ? -r : r;
}

export function makeSimEffect(effect, stop = false) {
  let self = Object.create(effect);
  self.enabled = false; // シリアライズ不要

  let data = {};
  self.data = data; // serializable data

  if ('duration' in self) {
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
  Object.defineProperty(self, "isTimed", {
    get: () => isFinite(self.count),
  });
  Object.defineProperty(self, "isExpired", {
    get: () => self.count <= 0,
  });
  Object.defineProperty(self, "isAdditive", {
    get: () => 'add' in self,
  });

  self.activate = function (bySelf) {
    if ('duration' in self) {
      self.count = self.duration;
      if (bySelf) {
        self.isStopped = false;
      }
    }
  }
  self.getValue = function (ctx, unit) {
    return getEffectValue(self, ctx, unit);
  }

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

  const subactionTable = {
    shield: {
      prefix: 's',
      invoke: (ctx) => self.invokeShield(ctx),
    },
    revive: {
      prefix: 'r',
      invoke: (ctx) => self.invokeRevive(ctx),
    },
    heal: {
      prefix: 'h',
      invoke: (ctx) => self.invokeHeal(ctx),
    },
    areaDamage: {
      prefix: 'ad',
      invoke: (ctx) => self.invokeAreaDamage(ctx),
    },
    fixedDamage: {
      prefix: 'fd',
      invoke: (ctx) => self.invokeFixedDamage(ctx),
      triggerOnMultiMove: true
    },
    ctReduction: {
      prefix: 'cr',
      invoke: (ctx) => self.invokeCtReduction(ctx),
    },
    buffCancel: {
      prefix: 'bc',
      invoke: (ctx) => self.invokeBuffCanel(ctx),
    },
    debuffCancel: {
      prefix: 'dc',
      invoke: (ctx) => self.invokeDebuffCanel(ctx),
    },
    doubleAttack: {
      prefix: 'da',
      invoke: (ctx) => self.invokeDoubleAttack(ctx),
    },
    multiAction: {
      prefix: 'ma',
      invoke: (ctx) => self.invokeMultiAction(ctx),
    },
    multiMove: {
      prefix: 'mm',
      invoke: (ctx) => self.invokeMultiMove(ctx),
    },
  };

  if (skill?.area) {
    Object.defineProperty(self, 'area', {
      get: () => {
        if (typeof (skill.area) != 'number') {
          return skill.area;
        }
        let r = skill.area;
        if (skill.isMainSkill) {
          r += self.owner.main.getBuffValue("範囲");
        }
        return r;
      },
    });
  }
  if (skill?.range) {
    Object.defineProperty(self, 'range', {
      get: () => {
        if (typeof (skill.range) != 'number') {
          return skill.range;
        }
        if (skill.isNormalAttack) {
          let chr = self.owner.main;
          return chr.range + chr.getBuffValue("射程(通常攻撃)");
        }
        else {
          let chr = skill.isMainSkill ? self.owner.main : self.owner.support;
          return skill.range + chr.getBuffValue("射程(スキル)");
        }
      },
    });
  }

  let data = {};
  self.data = data; // serializable data

  if (self.isActive) {
    let pname = 'coolTime';
    let id = `${pname}`;
    data[id] = 0;
    Object.defineProperty(self, pname, {
      get: () => { return data[id]; },
      set: (v) => { data[id] = v; },
    });

    self.makeRangeParams = function () {
      let r = {};
      if (this.range == "自ユニット")
        r.size = 0;
      else if (this.range == "単体")
        r.size = 1;
      else if (this.range == "全体")
        r.size = 99;
      else
        r.size = this.range;
      r.shape = areaStringToEnum(this.rangeShape) ?? Shape.Diamond;
      return r;
    };
    self.makeAreaParams = function () {
      let r = {};
      if (this.area == "自ユニット")
        r.size = 0;
      else if (this.area == "単体")
        r.size = 1;
      else if (this.area == "全体")
        r.size = 99;
      else
        r.size = this.area;
      r.shape = areaStringToEnum(this.areaShape) ?? Shape.Diamond;
      if (this.shapeData)
        r.shapeData = this.shapeData;
      return r;
    };
  }
  Object.defineProperty(self, 'available', {
    get: function () { return !this.isActive || this.coolTime <= 0; },
  });


  const wrapEffect = (baseEffect) => {
    let e = Object.create(baseEffect);
    Object.defineProperty(e, 'parent', {
      get: () => self,
    });
    if (baseEffect.trigger?.ct) {
      e.trigger = Object.create(baseEffect.trigger);

      let pname = 'coolTime';
      let id = `${e.index}.${pname}`;
      data[id] = 0;
      Object.defineProperty(e.trigger, pname, {
        get: () => { return data[id]; },
        set: (v) => { data[id] = v; },
      });
    }
    return e;
  };
  if (self.buff) {
    self.buff = self.buff.map(e => wrapEffect(e));
  }
  if (self.debuff) {
    self.debuff = self.debuff.map(e => wrapEffect(e));
  }

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
        let id = `${prefix}${i}.${pname}`;
        data[id] = 0;
        Object.defineProperty(obj, pname, {
          get: () => { return data[id]; },
          set: (v) => { data[id] = v; },
        });
      }
      if ('count' in obj) {
        let pname = 'remain';
        let id = `${prefix}${i}.${pname}`;
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

  self.invokeSummon = function (ctx) {
    for (let sum of this.summon ?? []) {
      if (evaluateCondition(ctx, sum.condition)) {
        let unit = new SimUnit(sum.makeUnit());
        unit.coord = [...ctx.targetCell];
        unit.setSummoner(ctx.unit);
        $g.sim.addUnit(unit);
        $g.log(`!! 召喚 ${ctx.unit.main.name} (${self.name}) -> ${unit.main.name}!!`);
        break;
      }
    }
  };
  self.invokePositionManipulate = function (ctx) {
    for (let act of this.positionManipulate ?? []) {
      let u = ctx.unit;
      let t = ctx.target;
      if (u && t && (t.isPlayer == u.isPlayer || !t.hasResist("位置移動"))) {
        const getDir = (pos, center) => {
          const [dx,dy] = [pos[0] - center[0], pos[1] - center[1]];
          if (dx == 0 || dy == 0) { // どちらかの軸が合ってないと無効としておく
            if      (dy < 0) { return [ 0, -1]; } // top
            else if (dx > 0) { return [ 1,  0]; } // right
            else if (dy > 0) { return [ 0,  1]; } // down
            else if (dx < 0) { return [-1,  0]; } // left
          }
          return null;
        };
        const directionalMove = (dir, maxMove) => {
          if (!dir || t.hasResist("位置移動")) {
            return;
          }
          let pos = t.coord;
          for (let i = 0; i < maxMove; ++i) {
            let next = [pos[0] + dir[0], pos[1] + dir[1]];
            if ($g.sim.canMoveInto(next)) {
              pos = next;
            }
            else {
              break;
            }
          }
          t.coord = pos;
        };
        const teleport = () => {
          if (t.isPlayer != u.isPlayer) {
            return;
          }
          // todo:
        };
        const table = {
          "引き寄せ": () => directionalMove(getDir(u.coord, t.coord), self.range),
          "後退": () => directionalMove(getDir(t.coord, u.coord), act.value),
          "テレポート": () => teleport(),
        };
        table[act.type]();
      }
    }
    //positionManipulate
  };

  self.invokeShield = function (ctx) {
    for (let act of self?.shield ?? []) {
      if (!act.coolTime && evaluateCondition(ctx, act.condition)) {
        if (act.ct) {
          act.coolTime = act.ct;
        }

      let u = ctx.unit;
        let target = act.target == "自身(サポート)" ? u.support : u.main;
        if (target.isAlive) {
          let src = act.source == "サポート" ? u.support : u.main;
          let rate = scalar(act.rate);
        const table = {
            "最大HP": () => { return src.baseHp * rate; },
            "アタック": () => { return src.baseAtk * rate; },
            "ディフェンス": () => { return src.baseDef * rate; },
            "マジック": () => { return src.baseMag * rate; },
            "レジスト": () => { return src.baseRes * rate; },
            "固定値": () => { return act.value; },
        };
          target.shield = Math.max(table[act.base](), target.shield);
          $g.log(`!! シールド ${target.name} (${self.name})!!`);
        }
      }
    }
  };
  self.invokeRevive = function (ctx) {
    for (let act of self?.revive ?? []) {
      if (act.remain && evaluateCondition(ctx, act.condition)) {
        --act.remain;
        let u = ctx.unit;
        let rate = scalar(act.rate);
        u.main.receiveHeal(u.main.maxHp * rate, u.main, ctx);
        u.support.receiveHeal(u.support.maxHp * rate, u.main, ctx);
        $g.log(`!! 復活 ${u.main.name} (${self.name})!!`);
      }
    }
  };
  self.invokeHeal = function (ctx, timing = null) {
    for (let act of self?.heal ?? []) {
      if (act.timing == timing && !act.coolTime && evaluateCondition(ctx, act.condition)) {
        if (act.ct) {
          act.coolTime = act.ct;
        }

        let u = ctx.unit;
        let from = self.isSupportSkill ? u.support : u.main;
        let rate = scalar(act.rate);
        let buf = (from.getBuffValue("治療効果") / 100 + 1);
        const apply = (chr, value) => {
          let base = value * rate;
          // 治療効果 と 被治療効果 は乗算の関係
          let boost = buf * (chr.getBuffValue("被治療効果") / 100 + 1);
          chr.receiveHeal(base * boost, from, ctx);
        };
        const table = {
          "マジック": (t) => {
            let value = from.status[3];
            apply(t.main, value);
            apply(t.support, value);
          },
          "最大HP": (t) => {
            apply(t.main, t.main.maxHp);
            apply(t.support, t.support.maxHp);
          },
          "与ダメージ": (t) => {
            let dmg = ctx.damageDealt.get(u.fid);
            let value = (from.isMain ? dmg.main : dmg.support);
            apply(t.main, value);
            apply(t.support, value);
          },
        };
        for (let t of getTargetUnits(ctx, act)) {
          if (u.isPlayer == t.isPlayer) {
            table[act.base](t);
            $g.log(`!! 回復 ${u.main.name} (${self.name}) -> ${t.main.name}!!`);
          }
        }
      }
    }
  };
  self.invokeBuffSteal = function (ctx, timing = null) {
    if (!$g.config.enableAutoBuffCancel) {
      return;
    }
    for (let act of self?.buffSteal ?? []) {
      if (act.timing == timing && !act.coolTime && evaluateCondition(ctx, act.condition)) {
        if (act.ct) {
          act.coolTime = act.ct;
        }

        let u = ctx.unit;
        let count = scalar(act.value);
        for (let t of unique(getTargetUnits(ctx, act))) {
          if (u.isPlayer != t.isPlayer) {
            let buff = t.removeEffectsByCondition(count, (e) => e.isBuff && e.isCancelable);
            for (let b of buff) {
              let t = u.applyEffect(b.__proto__);
              if (t) {
                t.count = b.count + 1;
              }
            }
            $g.log(`!! バフ奪取 ${u.main.name} (${self.name}) -> ${t.main.name}!!`);
          }
        }
      }
    }
  };
  self.invokeBuffCancel = function (ctx, timing = null) {
    if (!$g.config.enableAutoBuffCancel) {
      return;
    }
    for (let act of self?.buffCancel ?? []) {
      if (act.timing == timing && !act.coolTime && evaluateCondition(ctx, act.condition)) {
        if (act.ct) {
          act.coolTime = act.ct;
        }

        let u = ctx.unit;
        let count = scalar(act.value);
        for (let t of unique(getTargetUnits(ctx, act))) {
          if (u.isPlayer != t.isPlayer) {
            t.removeEffectsByCondition(count, (e) => e.isBuff && e.isCancelable);
            $g.log(`!! バフ解除 ${u.main.name} (${self.name}) -> ${t.main.name}!!`);
          }
        }
      }
    }
  };
  self.invokeDebuffCancel = function (ctx, timing = null) {
    if (!$g.config.enableAutoDebuffCancel) {
      return;
    }
    for (let act of self?.debuffCancel ?? []) {
      if (act.timing == timing && !act.coolTime && evaluateCondition(ctx, act.condition)) {
        if (act.ct) {
          act.coolTime = act.ct;
        }

        let u = ctx.unit;
        let count = scalar(act.value);
        for (let t of unique(getTargetUnits(ctx, act))) {
          if (u.isPlayer == t.isPlayer) {
            t.removeEffectsByCondition(count, (e) => e.isDebuff && e.isCancelable);
            $g.log(`!! デバフ解除 ${u.main.name} (${self.name}) -> ${t.main.name}!!`);
          }
        }
      }
    }
  };
  self.invokeAreaDamage = function (ctx, timing = null) {
    for (let act of self?.areaDamage ?? []) {
      if (act.timing == timing && !act.coolTime && evaluateCondition(ctx, act.condition)) {
        if (act.ct) {
          act.coolTime = act.ct;
        }

        let u = ctx.unit;
        for (let t of getTargetUnits(ctx, act)) {
          if (u.isPlayer != t.isPlayer) {
            // todo
            $g.log(`!! エリアダメージ ${u.main.name} (${self.name}) -> ${t.main.name}!!`);
          }
        }
      }
    }
  };
  self.invokeFixedDamage = function (ctx, timing = null) {
    for (let act of self?.fixedDamage ?? []) {
      if (act.timing == timing && !act.coolTime && evaluateCondition(ctx, act.condition)) {
        if (act.ct) {
          act.coolTime = act.ct;
        }

        let u = ctx.unit;
        let from = self.isSupportSkill ? u.support : u.main;
        let rate = scalar(act.rate) * getEffectMultiply(act, ctx);
        const apply = (chr, value) => {
          if (chr.isAlive) {
            chr.receiveDamage(value * rate, from, ctx);
          }
        };
        const table = {
          "最大HP": (t) => {
            apply(t.main, t.main.maxHp);
            apply(t.support, t.support.maxHp);
          },
          "アタック": (t) => {
            let value = from.status[1];
            apply(t.main, value);
            apply(t.support, value);
          },
          "ディフェンス": (t) => {
            let value = from.status[2];
            apply(t.main, value);
            apply(t.support, value);
          },
          "マジック": (t) => {
            let value = from.status[3];
            apply(t.main, value);
            apply(t.support, value);
          },
          "レジスト": (t) => {
            let value = from.status[4];
            apply(t.main, value);
            apply(t.support, value);
          },
          "与ダメージ": (t) => {
            let dmg = ctx.damageTaken[t.fid];
            apply(t.main, dmg.main);
            apply(t.support, dmg.support);
          },
        };
        for (let t of unique(getTargetUnits(ctx, act))) {
          if (u.isPlayer != t.isPlayer || act.target == "自身") {
            // 自傷ダメージはオプションで有効にしない限り発動しないようにしておく
            if (($g.config.enableSelfDamage || act.target != "自身")) {
              table[act.base](t);
              $g.log(`!! 固定ダメージ ${u.main.name} (${self.name}) -> ${t.main.name}!!`);
            }
          }
        }
      }
    }
  };

  self.invokeCtReduction = function (ctx, timing = null) {
    let succeeded = false;
    for (let act of self?.ctReduction ?? []) {
      if (act.timing == timing && !act.coolTime && evaluateCondition(ctx, act.condition)) {
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
            $g.log(`!! CT減 ${u.main.name} (${self.name}) -> ${t.main.name}!!`);
          }
        }
      }
    }
    return succeeded;
  };

  self.invokeSupportAttack = function (ctx) {
    let succeeded = false;
    for (let act of self?.supportAttack ?? []) {
      if (!act.coolTime && evaluateCondition(ctx, act.condition)) {
        succeeded = true;
        if (act.ct) {
          act.coolTime = act.ct;
        }
      }
      if (succeeded) {
        $g.log(`!! サポート同時攻撃 ${ctx.unit.main.name} (${self.name}) !!`);
      }
    }
    return succeeded;
  };
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
          $g.log(`!! 2回攻撃 ${ctx.unit.main.name} (${self.name}) !!`);
        }
      }
    }
    return succeeded;
  };
  self.invokeMultiAction = function (ctx) {
    if (ctx.unit.hasBadStatus("強化不可")) {
      return false;
    }
    let succeeded = false;
    for (let act of self?.multiAction ?? []) {
      if (!act.coolTime && ctx.onOwnTurn && evaluateCondition(ctx, act.condition)) {
        if (act.target == "スキル対象") {
          ctx.target.state = UnitState.Ready;
          // 他者への再行動の場合 succeeded は false
        }
        else {
          ctx.onMultiAction = true;
          succeeded = true;
        }
        if (act.ct) {
          act.coolTime = act.ct;
        }
      }
      if (succeeded) {
        $g.log(`!! 再行動 ${ctx.unit.main.name} (${self.name}) !!`);
      }
    }
    return succeeded;
  };
  self.invokeMultiMove = function (ctx) {
    let succeeded = false;
    for (let act of skill?.multiMove ?? []) {
      if (!act.coolTime && !ctx.onWait && evaluateCondition(ctx, act.condition)) {
        succeeded = true;
        ctx.onMultiMove = true;

        let m = -1; // -1: バフ込みの元の移動力
        if (act.type == "基本移動力") {
        }
        else if (act.type == "固定値移動力") {
          m = act.value;
        }
        else if (act.type == "残移動力") {
          m = ctx.unit.main.move - ctx.move;
        }
        // 複数の multiMove が同時に発動する可能性があり、その場合 -1 が最優先、それ以外だと最も移動量が高い方を優先
        ctx.multiMoveValue = m == -1 ? m : Math.max(m, ctx.multiMoveValue ?? 0);

        if (act.ct) {
          act.coolTime = act.ct;
        }
      }
      if (succeeded) {
        $g.log(`!! 再移動 ${ctx.unit.main.name} (${self.name}) !!`);
      }
    }
    return succeeded;
  };


  self.getDamageRate = function (ctx) {
    for (const s of self.damageRateSp ?? []) {
      if (evaluateCondition(ctx, s.condition)) {
        return scalar(s.value);
      }
    }
    return scalar(self.damageRate);
  };

  self.startCoolTime = function () {
    if (this.isActive) {
      if (this.isSupportSkill) {
        this.coolTime = Infinity;
      }
      else if (this.ct) {
        this.coolTime = this.ct + 1;
      }
    }
  };

  self.onFire = function (ctx) {
    // バフ・デバフ発動
    // ここで処理するのはスキル発動時効果のみで、攻撃前後や戦闘前後に発動するものは別途 trigger で処理される
    let u = ctx.unit;
    for (let t of unique(ctx.targets)) {
      let tctx = makeActionContext(t);
      // trigger がない効果を即時起動していく
      // condition は付与時ではなく発動時の条件なのでここでは評価不要
      for (let e of this.effects) {
        if (!e.trigger && ((e.isBuff && t.isPlayer == u.isPlayer) || (e.isDebuff && t.isPlayer != u.isPlayer))) {
          if ([undefined, "スキル対象", "攻撃対象"].includes(e.target) || (this.isSelfTarget && t === u)) {
            t.applyEffect(e, u === t);
          }
        }
      }
    }

    this.invokeSummon(ctx);
    this.invokePositionManipulate(ctx);
    this.invokeFixedDamage(ctx);
    this.invokeAreaDamage(ctx);
    this.invokeHeal(ctx);
    this.invokeBuffSteal(ctx);
    this.invokeBuffCancel(ctx);
    this.invokeDebuffCancel(ctx);
    this.invokeCtReduction(ctx);
    //console.log(this);
  };

  self.trigger = function (ctx, timing) {
    let u = ctx.unit;
    for (let e of this.effects) {
      let tri = e.trigger;
      if (tri && tri.timing == timing && !tri.coolTime) {
        if (tri.ct) {
          tri.coolTime = tri.ct;
        }
        let prevTarget = ctx.target;
        for (let t of unique(getTargetUnits(ctx, tri))) {
          ctx.target = t;
          if (((e.isBuff && t.isPlayer == u.isPlayer) || (e.isDebuff && t.isPlayer != u.isPlayer)) && evaluateCondition(ctx, tri.condition)) {
            t.applyEffect(e, u === t);
          }
        }
        ctx.target = prevTarget;
      }
    }
    this.invokeFixedDamage(ctx, timing);
    this.invokeAreaDamage(ctx, timing);
    this.invokeHeal(ctx, timing);
    this.invokeBuffSteal(ctx, timing);
    this.invokeBuffCancel(ctx, timing);
    this.invokeDebuffCancel(ctx, timing);
    this.invokeCtReduction(ctx, timing);
  };

  //#region callbacks
  self.onSimulationBegin = function (ctx) {
  };
  self.onSimulationEnd = function (ctx) {
  };
  self.onOwnTurnBegin = function (ctx) {
    this.trigger(ctx, "自ターン開始時");
  };
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
    for (let e of this.effects) {
      if (e.trigger?.coolTime) {
        --e.trigger.coolTime;
      }
    }
  };
  self.onOpponentTurnBegin = function (ctx) {
    this.trigger(ctx, "敵ターン開始時");
  };
  self.onOpponentTurnEnd = function (ctx) {
    this.trigger(ctx, "敵ターン終了時");
  };

  self.onActionBegin = function (ctx) {
    this.trigger(ctx, "行動前");
  };
  self.onActionEnd = function (ctx) {
    this.trigger(ctx, "行動後");
  };

  self.onAttackBegin = function (ctx) {
    this.trigger(ctx, "攻撃前");
  };
  self.onAttackEnd = function (ctx) {
    this.trigger(ctx, "攻撃後");
  };

  self.onBattleBegin = function (ctx) {
    this.trigger(ctx, "戦闘前");
  };
  self.onBattleEnd = function (ctx) {
    this.trigger(ctx, "戦闘後");
  };

  self.onKill = function (ctx) {
    this.trigger(ctx, "敵撃破時");
  };

  self.onDeath = function (ctx) {
    this.trigger(ctx, "死亡時");
  };

  self.onRevive = function (ctx) {
    this.trigger(ctx, "復活時");
  };

  //#endregion callbacks
  return self;
}

