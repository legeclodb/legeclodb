export * from "./battle_unit.js";
export * from "./battle_skill.js";
import { callHandler, makeActionContext, evaluateCondition } from "./battle_skill.js";
import { BaseUnit, SimUnit, UnitState, isInside } from "./battle_unit.js";
import { $g } from "./battle_globals.js";

export class SimContext {

  //#region fields (serializable)
  turn = 1;
  phase = Phase.Player;
  score = 0; // 途中でプレイヤーユニットが死ぬことがあるため、ユニット毎のスコアの合計ではなく別に持つ必要がある
  unitIdSeed = 0; // 追加ユニットの ID 生成用の数
  units = [];

  targetCell = [0, 0]; // リプレイに対象マスを記録する用
  desc = { // プレイバック用のアイコン
    unitIcon: "",
    skillIcon: "",
    targetIcon: "",
  };
  states = [];
  //#endregion fields (serializable)

  //#region fields (non-serializable)
  battleId = "";
  maxTurn = 0;
  divX = 0;
  divY = 0;
  fidTable = {};
  range = 0;
  move = 0;
  statePos_ = -1;
  //#endregion fields (non-serializable)


  //#region props
  get activeUnits() { return this.units.filter(u => !u.isDormant); }
  get isPlayerTurn() { return this.phase == Phase.Player; }
  get isEnemyTurn() { return this.phase == Phase.Enemy; }
  get phaseId() { return `${this.turn}${this.isPlayerTurn ? 'P' : 'E'}`; }

  get statePos() { return this.statePos_; }
  set statePos(v) {
    this.loadState(this.states.at(v));
    this.statePos_ = v;
  }
  //#endregion props


  //#region methods
  constructor(battleData, baseUnits) {
    $g.sim = this;
    this.battleId = battleData.uid;
    this.maxTurn = battleData.turn;
    [this.divX, this.divY] = battleData.mapSize;

    this.units = baseUnits.map(a => new SimUnit(a)).filter(a => a.isAlive);
    for (let u of this.units) {
      this.fidTable[u.fid] = u;
    }
    //console.log(this);
  }

  serialize() {
    return this.states;
  }
  deserialize(r) {
    this.states = r;
    this.statePos = -1;
  }

  saveState() {
    let r = {
      turn: this.turn,
      phase: this.phase,
      score: this.score,
      unitIdSeed: this.unitIdSeed,
      units: this.units.map(a => a.serialize()),
      targetCell: this.targetCell,
      desc: this.desc,
    };
    return r;
  }
  loadState(r) {
    if (!r) {
      return;
    }

    this.turn = r.turn;
    this.phase = r.phase;
    this.score = r.score;
    this.unitIdSeed = r.unitIdSeed;
    this.targetCell = r.targetCell;

    const constructUnit = (json) => {
      let base = this.findBaseUnit(json.fid);
      if (!base && json.summoner) {
        // 召喚ユニットは召喚元ユニットのスキルから BaseUnit を作成する必要がある
        let summoner = this.findBaseUnit(json.summoner);
        for (let skill of summoner.main.skills) {
          let so = (skill.summon ?? []).find(o => o.uid == json.summonUid);
          if (so) {
            base = so.makeUnit();
            base.fid = json.fid;
            break;
          }
        }
      }
      let r = new SimUnit(base);
      this.fidTable[r.fid] = r;
      return r;
    };
    this.units = r.units.map(a => constructUnit(a));
    for (let i = 0; i < r.units.length; ++i) {
      let u = this.units[i];
      u.deserialize(r.units[i]);
    }
    this.onSimulationBegin();
  }
  // unit, skill, target: 説明用
  pushState(unit = null, skill = null, target = null) {
    // リプレイ再生中の場合現在位置以降のレコードを切り捨てる
    if (this.statePos_ != -1) {
      this.states.splice(this.statePos_ + 1, this.states.length);
      this.statePos_ = -1;
    }

    this.desc = {
      unitIcon: unit ? unit.main.icon : "",
      skillIcon: skill ? skill.icon : "",
      targetIcon: target ? target.main.icon : "",
    };
    this.states.push(this.saveState());
  }

  addUnit(unit) {
    ++this.unitIdSeed;
    unit.base.fid = `X${this.unitIdSeed}`;
    this.fidTable[unit.fid] = unit;
    this.units.push(unit);

    unit.onSimulationBegin();
    unit.setup();
    this.updateAreaEffectsAll();
  }
  notifyDead(unit) {
    this.units = this.units.filter(a => a !== unit);
    delete this.fidTable[unit.fid];
  }

  findItem(uid) {
    return window.$vue.findItemByUid(uid);
  }
  findUnit(fid) {
    return this.fidTable[fid];
  }
  findBaseUnit(fid) {
    let r = window.$vue.playerUnits.find(a => a.fid == fid) ?? window.$vue.enemyUnits.find(a => a.fid == fid);
    return r;
  }

  isOwnTurn(unit) {
    return unit && ((unit.isPlayer && this.isPlayerTurn) || (unit.isEnemy && this.isEnemyTurn));
  }

  doAttack(_ctx, attacker, targetQueue, skill) {
    let actx = Object.create(_ctx);
    actx.skill = skill;
    actx.damageToSupport = 0;
    actx.damageToMain = 0;
    actx.addDamage = (v) => {
      actx.damageToSupport += v.damageToSupport;
      actx.damageToMain += v.damageToMain;
    },
    Object.defineProperty(actx, "totalDamage", {
      get: () => actx.damageToSupport + actx.damageToMain,
    });

    if (!targetQueue.find(a => a.isValid)) {
      return actx;
    }

    let aunit = attacker.unit;
    if (attacker.isMain)
      actx.onMainAttack = true;
    else
      actx.onSupportAttack = true;
    if (attacker.damageType == "アタック")
      actx.onPhysicalDamage = true;
    else
      actx.onMagicDamage = true;
    if (actx.onBattle && attacker.baseRange > 1 && actx.range <= 1)
      actx.onRangedPenarty = true;

    aunit.evaluateBuffs(actx);
    if (!attacker.isAlive) {
      // 既に死んでたら何もしない (サポートが死んでる場合ここに来る)
      return actx;
    }
    if (actx.range > aunit.getRange(actx) && !actx.forceJoinSupport) {
      // 射程外でサポート同時攻撃もない場合何もしない
      return actx;
    }

    let attackCount = 10;
    let atk = aunit.getAttackPower(actx);
    let damageRate = skill ? skill.getDamageRate(actx) : 1.0;
    let dmgDealtBuff = Math.max(1.0 + aunit.getDamageDealBuff(actx), 0.3);
    let critDmgRate = aunit.getCriticalDamageRate(actx);
    let rangedPenarty = actx.onRangedPenarty ? 0.6 : 1.0;

    const calcDamage = (t, breakOnKill) => {
      let dunit = t.chr.unit;
      // 防御側コンテキスト
      let dctx = makeActionContext(dunit, aunit, null, false, actx);
      let addDamage = null;
      if (t.chr.isSupport) {
        dctx.onSupportDefense = true;
        addDamage = (v) => { actx.damageToSupport += v; }
      }
      else {
        dctx.onMainDefense = true;
        addDamage = (v) => { actx.damageToMain += v; }
      }
      dunit.evaluateBuffs(dctx);

      let def = dunit.getDefensePower(dctx);
      let baseDmg = Math.max(atk - def, 1);
      let dmgTakenBuff = Math.max(1.0 - dunit.getDamageTakenBuff(dctx), 0.3);
      let finalDmg = baseDmg * damageRate * dmgDealtBuff * dmgTakenBuff * critDmgRate * rangedPenarty;

      let totalDamage = 0;
      while (attackCount) {
        if (t.dealDamage(finalDmg)) {
          totalDamage += finalDmg;
        }
        --attackCount;
        if (breakOnKill && !t.isAlive) {
          break;
        }
      }
      addDamage(Math.round(totalDamage));
    };

    while (attackCount) {
      let t = targetQueue.at(-1);
      if (!t.isAlive && targetQueue.length > 1) {
        targetQueue.pop();
        continue;
      }
      calcDamage(t, targetQueue.length > 1);
    }

    return actx;
  }

  makeTarget(chr) {
    return {
      chr: chr,
      hp: chr.hp,
      shield: 0,
      get isValid() { return this.chr.maxHp > 0; },
      get isAlive() { return this.hp > 0; },
      dealDamage(v) {
        if (this.shield > 0) {
          this.shield -= v;
          return false;
        }
        else {
          this.hp -= v;
          return true;
        }
      },
    };
  }

  getBattleResult(unit, skill, target, ctx) {
    // 攻撃側コンテキスト
    ctx.onAttack = ctx.onBattle = true;
    let actx = Object.create(ctx);

    // 防御側コンテキスト
    let dctx = makeActionContext(target, unit, null, false);
    dctx.onAttack = dctx.onBattle = true;

    let attacker = [
      this.makeTarget(unit.main),
      this.makeTarget(unit.support),
    ];
    let defender = [
      this.makeTarget(target.main),
      this.makeTarget(target.support),
    ];

    callHandler("onAttackBegin", actx, unit);
    callHandler("onBattleBegin", actx, unit);
    callHandler("onAttackBegin", dctx, target);
    callHandler("onBattleBegin", dctx, target);
    if (unit.invokeSupportAttack(actx)) {
      actx.forceJoinSupport = true;
    }
    let aSup = this.doAttack(actx, unit.support, defender, null);
    let aMain = this.doAttack(actx, unit.main, defender, skill);
    if (defender.at(-1).isAlive && unit.invokeDoubleAttack(actx)) {
      aMain.addDamage(this.doAttack(actx, unit.main, defender, skill));
    }

    let dSup = this.doAttack(dctx, target.support, attacker, null);
    let dMain = this.doAttack(dctx, target.main, attacker, null);
    if (attacker.at(-1).isAlive && target.invokeDoubleAttack(actx)) {
      dMain.addDamage(this.doAttack(dctx, target.main, attacker, null));
    }

    let result = {
      ctxAttackerMain: aMain,
      ctxAttackerSupport: aSup,
      ctxDefenderMain: dMain,
      ctxDefenderSupport: dSup,
      attackerScore: aSup.totalDamage + aMain.totalDamage,
      defenderScore: dSup.totalDamage + dMain.totalDamage,
      apply() {
        target.support.hp -= aSup.damageToSupport + aMain.damageToSupport;
        target.main.hp -= aSup.damageToMain + aMain.damageToMain;
        unit.support.hp -= dSup.damageToSupport + dMain.damageToSupport;
        unit.main.hp -= dSup.damageToMain + dMain.damageToMain;
      },
    };
    if (result.attackerScore) {
      ctx.onCriticalHit = true; // とりあえずダメージを与えたらクリティカル扱い
      ctx.onDamage = true;
    }
    if (result.defenderScore) {
      dctx.onCriticalHit = true;
      dctx.onDamage = true;
    }

    callHandler("onAttackEnd", actx, unit);
    callHandler("onBattleEnd", actx, unit);
    callHandler("onAttackEnd", dctx, target);
    callHandler("onBattleEnd", dctx, target);

    unit.eraseExpiredEffects();
    target.eraseExpiredEffects();
    return result;
  }

  getAreaAttackResult(unit, skill, targets, ctx) {
    let result = {
      attackerScore: 0,
      callbacks: [],
      contexts: [],
      apply() {
        for (let cb of this.callbacks) {
          cb();
        }
      },
    };

    ctx.onAttack = !skill.isSupportSkill;
    if (ctx.onAttack) {
      callHandler("onAttackBegin", ctx, unit);
    }

    let attacker = skill.isSupportSkill ? unit.support : unit.main;
    for (let target of targets ?? []) {
      // 攻撃側コンテキスト
      // target に依存するバフなどがあるので、ループの内側である必要がある
      let actx = Object.create(ctx);
      actx.target = target;

      let r = [
        this.doAttack(actx, attacker, [this.makeTarget(target.main)], skill),
        this.doAttack(actx, attacker, [this.makeTarget(target.support)], skill),
      ];
      result.attackerScore += r[0].totalDamage + r[1].totalDamage;
      result.callbacks.push(() => {
        target.support.hp -= r[0].damageToSupport + r[1].damageToSupport;
        target.main.hp -= r[0].damageToMain + r[1].damageToMain;
      });
      result.contexts.push(ctx);
    }

    if (result.attackerScore) {
      ctx.onCriticalHit = true; // とりあえずダメージを与えたらクリティカル扱い
      ctx.onDamage = true;
    }
    if (ctx.onAttack) {
      callHandler("onAttackEnd", ctx, unit);
    }

    unit.eraseExpiredEffects();
    return result;
  }

  fireSkill(unit, skill, targets, cell) {
    this.updateAreaEffectsAll();
    unit = unit.sim ?? unit;
    // targets は配列なら複数、非配列なら単体
    let target = null;
    if (Array.isArray(targets)) {
      targets = targets.map(a => a.sim ?? a);
    }
    else {
      target = targets?.sim ?? targets;
      targets = target ? [target] : [];
    }

    this.range = 0;
    this.move = 0;

    let doAction = (skill?.isSupportSkill || unit.isOnMultiMove) ? false : true;
    let doAttack = false;
    let doBattle = false;
    let multiAction = false;
    let multiMove = false;
    let doSupportAttackSkill = false;
    if (unit.prevCoord) {
      this.move = Math.abs(unit.coord[0] - unit.prevCoord[0]) + Math.abs(unit.coord[1] - unit.prevCoord[1]);
    }
    if (target) {
      // NxN ボス対策として target.coord ではなく cell.coord との距離を取る
      this.range = Math.abs(unit.coord[0] - cell.coord[0]) + Math.abs(unit.coord[1] - cell.coord[1]);
    }

    // 条件変数を設定
    // 攻撃側
    let ctx = makeActionContext(unit, target, skill, true);
    ctx.targetCell = cell;
    ctx.targets = targets;
    if (skill && skill.isMainSkill && skill.isAttackSkill) {
      doAttack = true;
      doBattle = ctx.onTargetEnemy;
    }
    else if (skill && skill.isSupportSkill && skill.isAttackSkill) {
      doSupportAttackSkill = true;
    }
    if (doAction) { ctx.onAction = true; }
    if (doAttack) { ctx.onAttack = true; }
    if (doBattle) { ctx.onBattle = true; }

    if (doAction) {
      callHandler("onActionBegin", ctx, unit);
    }

    // 待機の場合 skill は null
    if (skill) {
      skill.startCoolTime();

      // 攻撃処理
      let result = null;
      if (doBattle) {
        result = this.getBattleResult(unit, skill, target, ctx);
      }
      else if (doAttack || doSupportAttackSkill) {
        // 敵にダメージ味方にバフ系のスキルの場合 targets には両陣営のユニットが入っている
        let enemies = targets.filter(a => a.isPlayer != unit.isPlayer);
        result = this.getAreaAttackResult(unit, skill, enemies, ctx);
      }

      if (result) {
        ctx.damageDealt = result.attackerScore;
        unit.score += result.attackerScore;
        if (unit.isPlayer) {
          this.score += result.attackerScore;
        }

        if (target) {
          ctx.damageTaken = result.defenderScore;
          target.score += result.defenderScore;
          if (target.isPlayer) {
            this.score += result.defenderScore;
          }
        }
        console.log(result);
      }

      skill.onFire(ctx);
    }
    else {
      ctx.onWait = true;
    }

    let killed = targets.filter(a => !a.isAlive);
    if (killed.length) {
      ctx.onKill = true;
      for (let u of killed) {
        this.notifyDead(u);
      }
    }
    if (!unit.isAlive) {
      this.notifyDead(unit);
    }

    if (doAction) {
      callHandler("onActionEnd", ctx, unit);
    }

    if (killed?.length) {
      callHandler("onKill", ctx, unit);

      for (let k of killed) {
        callHandler("onDeath", ctx, k);
        if (k.isAlive) {
          callHandler("onRevive", ctx, k);
        }
      }
    }

    if (!unit.isAlive) {
      callHandler("onDeath", ctx, unit);
      if (unit.isAlive) {
        callHandler("onRevive", ctx, unit);
      }
      unit.state = UnitState.End;
    }
    else if (doAction) {
      if (!unit.main.isNxNBoss) {
        if (unit.invokeMultiAction(ctx)) {
          multiAction = true;
        }
        if (unit.invokeMultiMove(ctx)) {
          multiMove = true;
          unit.move = ctx.multiMoveValue;
        }

        if (multiAction) {
          unit.state = UnitState.MultiAction;
        }
        else if (multiMove) {
          unit.state = UnitState.MultiMove;
        }
        else {
          unit.state = UnitState.End;
        }
      }
    }
    else {
      if (skill?.isSupportSkill) {
        unit.move = unit.main.move - ctx.move;
      }
      else if (unit.isOnMultiMove) {
        unit.state = UnitState.End;
      }
    }

    if (unit.state == UnitState.MultiAction || unit.state == UnitState.End) {
      unit.move = unit.main.move;
    }

    this.updateAreaEffectsAll();

    if (cell) {
      this.targetCell = [...cell.coord];
      let t = this.findUnitByCoord(cell.coord);
      if (t !== unit) {
        target = t;
      }
    }
    else {
      this.targetCell = [-1, -1]
    }
    this.pushState(unit, skill, target);
    console.log(ctx);
  }

  updateAreaEffectsAll() {
    for (let u of this.activeUnits) {
      u.updateAreaEffects();
      u.evaluateBuffs();
    }
  }

  start() {
    this.onSimulationBegin();
    this.onPlayerTurnBegin();
  }
  finish() {
    this.onSimulationEnd();
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
    this.updateAreaEffectsAll();
    for (let u of this.units) {
      u.setup();
    }
    this.updateAreaEffectsAll();
  }
  onSimulationEnd() {
    for (let u of this.units) {
      u.onSimulationEnd();
    }
    if ($g.sim == this) {
      $g.sim = null;
    }
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
    this.updateAreaEffectsAll();
    this.pushState();
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
    this.updateAreaEffectsAll();
    this.pushState();
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
      if (u.main.shape) {
        // NxN ボス
        if (u.main.shape[coord[1]][coord[0]]) {
          return u;
        }
      }
      else if (u.coord[0] == coord[0] && u.coord[1] == coord[1]) {
        return u;
      }
    }
    return null;
  }
  enumerateUnitsInArea(center, size, shape, callback) {
    for (const u of this.activeUnits) {
      if (u.main.shape) {
        // NxN ボスは該当マス分コールバックを呼ぶ
        for (let y = 0; y < u.main.shape.length; ++y) {
          let l = u.main.shape[y];
          for (let x = 0; x < l.length; ++x) {
            const pos = [x, y];
            if (l[x] && isInside(center, pos, size, shape)) {
              callback(u, pos);
            }
          }
        }
      }
      else if (isInside(center, u.coord, size, shape)) {
        callback(u);
      }
    }
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
        this.updateAreaEffectsAll();
        return true;
      }
    }
    return false;
  }

  eraseWeakEnemies() {
    for (const u of this.activeUnits) {
      if (u.isEnemy && !u.invulnerable) {
        u.main.hp = 0;
        u.support.hp = 0;
      }
    }
    this.updateAreaEffectsAll();
  }
  eraseUnit(unit) {
    let u = unit?.sim;
    if (u) {
      u.main.hp = 0;
      u.onDeath();
      this.notifyDead(u);
    }
    this.updateAreaEffectsAll();
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
  setShootRangeShape(shape) {
    for (let y = 0; y < this.ydiv; ++y) {
      for (let x = 0; x < this.xdiv; ++x) {
        if (shape[y][x]) {
          this.getCell(x, y).shootDistance = 0;
        }
      }
    }
  }
  setStartShape(shape) {
    for (let y = 0; y < this.ydiv; ++y) {
      for (let x = 0; x < this.xdiv; ++x) {
        if (shape[y][x]) {
          this.getCell(x, y).moveDistance = 0;
        }
      }
    }
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
