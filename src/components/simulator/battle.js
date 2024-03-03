export * from "./battle_unit.js";
export * from "./battle_skill.js";
import { makeSimSkill, makeSimEffect, callHandler } from "./battle_skill.js";
import { BaseUnit, SimUnit } from "./battle_unit.js";

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
    unit = unit.sim ?? unit;
    // targets は配列なら複数、非配列なら単体
    let target = null;
    if (Array.isArray(targets))
      targets = targets.map(a => a.sim ?? a);
    else
      target = targets?.sim ?? targets;

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

    callHandler("onActionBegin", unit);
    if (doAttack)
      callHandler("onAttackBegin", unit);
    if (doBattle)
      callHandler("onBattleBegin", unit, target);

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
    }

    if (doBattle)
      callHandler("onBattleEnd", unit, target);
    if (doAttack)
      callHandler("onAttackEnd", unit);
    callHandler("onActionEnd", unit);

    if (killed?.length) {
      callHandler("onKill", unit);
      for (let k of killed)
        callHandler("onDeath", k);
    }
    if (!unit.isAlive)
      callHandler("onDeath", unit);
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
    else if (range == "単体" || range == "自ユニット")
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


function $vue() {
  return window.$vue;
}
function $sim() {
  return SimContext.instance;
}
function $findObjectByUid(uid) {
  return $vue().findObjectByUid(uid);
}
