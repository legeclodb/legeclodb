export * from "./battle_unit.js";
export * from "./battle_skill.js";
import { genDiamondCoords, callHandler, makeActionContext, evaluateCondition, isInside } from "./battle_skill.js";
import { BaseUnit, SimUnit, UnitState } from "./battle_unit.js";
import { $g } from "./battle_globals.js";

export const replayVersion = "1.0.0";

export const Phase = {
  Player: 0,
  Enemy: 1,
}

export class SimContext {

  //#region fields (serializable)
  config = {
    autoBuffCancel: true,
    autoRandomBuff: true,
    autoRandomSelection: true,
    selfDamage: false,
  };
  turn = 1;
  phase = Phase.Player;
  unitIdSeed = 0; // 追加ユニットの ID 生成用の数
  units = [];

  userEvents = [];
  desc = { // プレイバック用データ
    score: 0,
    unit: "", // fid
    skill: "", // uid
    target: "", // fid or [fid]
    cell: [-1, -1],
    comment: "",
  };
  states = [];
  //#endregion fields (serializable)

  //#region fields (non-serializable)
  battleId = "";
  maxTurn = 0;
  divX = 0;
  divY = 0;
  terrain = [];
  unitTable = {};
  statePos_ = -1;
  //#endregion fields (non-serializable)


  //#region props
  get activeUnits() { return this.units.filter(u => !u.isDormant); }
  get activePlayerUnits() { return this.units.filter(u => !u.isDormant && u.isPlayer); }
  get activeEnemyUnits() { return this.units.filter(u => !u.isDormant && !u.isPlayer); }
  get isPlayerTurn() { return this.phase == Phase.Player; }
  get isEnemyTurn() { return this.phase == Phase.Enemy; }
  get phaseId() { return `${this.turn}${this.isPlayerTurn ? 'P' : 'E'}`; }

  get score() {
    return Object.values(this.unitTable).reduce((total, u) => total + (u.isPlayer && !u.isSummon ? u.score : 0), 0);
  }
  get statePos() { return this.statePos_; }
  set statePos(v) {
    const state = this.states.at(v);
    this.loadState(state);
    this.statePos_ = v;
    if (state.desc?.skillArgs?.coord) {
      $vue().blinkCell(state.desc.skillArgs.coord);
    }
    $vue().resetUnitPositionAll(true);
  }
  //#endregion props


  //#region construct, serialize, playback
  constructor(battleData, baseUnits) {
    $g.sim = this;
    this.battleId = battleData.uid;
    this.maxTurn = battleData.turn;

    [this.divX, this.divY] = battleData.mapSize;
    this.terrain = battleData.terrain;

    this.units = baseUnits.filter(a => a.isValid).map(a => new SimUnit(a));
    for (let u of this.units) {
      this.unitTable[u.fid] = u;
    }
  }

  serialize() {
    return this.states;
  }
  deserialize(r) {
    this.states = r;
    this.statePos = -1;
    for (let s of this.states) {
      s.desc = this.makeDesc(s.desc);
    }
  }

  makeDesc(desc) {
    let r = { ...desc };
    if (!r.unitIcon) {
      r.unitIcon = $g.sim.findUnit(r.unit)?.main?.icon;
      r.skillIcon = $g.sim.findItem(r.skill)?.icon;
      r.targetIcon = $g.sim.findUnitByCoord(r.skillArgs?.coord)?.main?.icon;
    }
    r.isAction = Boolean(r.unitIcon);
    return r;
  }
  saveState() {
    let r = {
      config: { ...this.config },
      turn: this.turn,
      phase: this.phase,
      unitIdSeed: this.unitIdSeed,
      // 配置されたユニットは死んだものも記録
      units: Object.values(this.unitTable).filter(a => !a.isDormant).map(a => a.serialize()),
      userEvents: this.userEvents,
      desc: this.makeDesc(this.desc),
    };
    return r;
  }
  loadState(r) {
    if (!r) {
      return;
    }

    if ("config" in r) {
      this.config = { ...r.config };
    }
    this.turn = r.turn;
    this.phase = r.phase;
    this.unitIdSeed = r.unitIdSeed;

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
      this.unitTable[r.fid] = r;
      return r;
    };
    let units = r.units.map(a => constructUnit(a));
    for (let i = 0; i < r.units.length; ++i) {
      let u = units[i];
      u.deserialize(r.units[i]);
    }
    this.units = units.filter(a => a.isAlive); // 死んだユニットも入っているので除外しておく
    this.onSimulationBegin();
  }
  // unit, skill, target: 説明用
  pushState(unit = null, skill = null, skillArgs = null) {
    // リプレイ再生中の場合現在位置以降のレコードを切り捨てる
    if (this.statePos_ != -1) {
      this.states.splice(this.statePos_ + 1, this.states.length);
      this.statePos_ = -1;
    }

    this.desc.score = Math.round(this.score);
    this.desc.unit = unit ? unit.fid : "";
    this.desc.skill = skill ? skill.uid : "";
    if (skillArgs) {
      this.desc.skillArgs = { ...skillArgs };
    }
    else {
      delete this.desc.skillArgs;
    }
    this.states.push(this.saveState());

    this.desc.comment = "";
    this.userEvents = [];
  }
  // opt: {
  //   interval: Number,
  //   next: Function,
  //}
  playback(state, opt) {
    const callNext = () => {
      if (opt?.next)
        opt.next();
    };
    const handlers = {
      eraseUnit: (e) => {
        this.eraseUnit(this.findUnit(e.target));
      },
      applyEffect: (e) => {
        let u = this.findUnit(e.target);
        if (u) {
          u.applyEffect_(this.findItem(e.effect));
        }
      },
      removeEffect: (e) => {
        let u = this.findUnit(e.target);
        if (u) {
          u.removeEffect_(e.index);
        }
      },
    };
    for (let evt of state.userEvents ?? []) {
      handlers[evt.type](evt);
    }
    if ("config" in state && !this.config.override) {
      Object.assign(this.config, state.config);
    }

    const desc = state.desc;
    if (desc.unit) {
      let unit = this.findUnit(desc.unit);
      let uop = state.units.find(u => u.fid == desc.unit);
      let skill = null;
      if (!unit || !uop) {
        $g.log("ユニットが見つからないため中断しました。");
        throw new Error("unit not found");
      }
      if (desc.skill) {
        skill = unit.skills.find(a => a.uid == desc.skill);
        if (!skill) {
          $g.log("スキルが見つからないため中断しました。");
          throw new Error("skill not found");
        }
      }

      let pf = this.makePathFinder(unit, true);
      let dist = pf.getMoveDistance(uop.coord);
      let prev = unit.coord;
      unit.moveDistance = dist < 0 ? unit.move : dist;
      unit.coord = uop.coord;
      $vue().setUnitPath(unit.base, pf.getPath(uop.coord, prev), {
        interval: opt?.interval,
        onfinish: () => {
          this.fireSkill(unit, skill, desc.skillArgs);
          callNext();
        },
      });
    }
    else {
      if (state.turn != this.turn || state.phase != this.phase) {
        this.passTurn();
      }
      callNext();
    }
  }

  addUserEvent(e) {
    this.userEvents.push(e);
    //console.log(e);
  }

  addUnit(unit) {
    ++this.unitIdSeed;
    unit.base.fid = `X${this.unitIdSeed}`;
    this.unitTable[unit.fid] = unit;
    this.units.push(unit);

    unit.onSimulationBegin();
    unit.setup();
    this.updateAreaEffects();
    $vue().resetUnitPosition(unit.base, true);
  }
  notifyDead(unit) {
    this.units = this.units.filter(a => a.isAlive);
    // 死んだユニットの情報が必要なケースもあるため、unitTable からは消さない
  }
  //#endregion construct, serialize, playback


  //#region unit operation
  findItem(uid) {
    return window.$vue.findItemByUid(uid);
  }
  findUnit(fid) {
    return this.unitTable[fid];
  }
  findBaseUnit(fid) {
    let r = window.$vue.playerUnits.find(a => a.fid == fid) ?? window.$vue.enemyUnits.find(a => a.fid == fid);
    return r;
  }
  findUnitByCoord(coord) {
    if (!coord)
      return null;
    for (const u of this.activeUnits) {
      if (u.isNxN) {
        // NxN ボス
        if (u.shape[coord[1]][coord[0]]) {
          return u;
        }
      }
      else if (u.coord[0] == coord[0] && u.coord[1] == coord[1]) {
        return u;
      }
    }
    return null;
  }
  enumerateUnitsInArea(center, params, callback, once = false) {
    params = { center: center, ...params };
    for (const u of this.activeUnits) {
      // NxN ボスは該当マス分コールバックを呼ぶ
      // ただし once == true の場合 1 回で切り上げる
      for (let pos of u.occupiedCells) {
        if (isInside(pos, params)) {
          callback(u, pos);
          if (once) {
            break;
          }
        }
      }
    }
  }
  getUnitsInArea(center, params) {
    // ソート用距離関数
    // 同距離の場合、0 時方向から時計回り順に並べる
    const dist = (base, target) => {
      if (!base || !target) {
        return 0;
      }
      let dx = target[0] - base[0];
      let dy = target[1] - base[1];
      let md = Math.abs(dx) + Math.abs(dy); // マンハッタン距離
      if (md == 0) {
        return 0;
      }
      else {
        let ed = Math.sqrt((dx * dx) + (dy * dy)); // ユークリッド距離
        let r = Math.atan2(dx / ed, -dy / ed); // 0 時方向からのラジアン角
        let cd = (r / (Math.PI * 2) + 1) % 1; // 時計回り距離 (0～1)
        return md + cd;
      }
    };
    let r = [];
    this.enumerateUnitsInArea(center, params, (u, pos) => {
      r.push({ unit: u, distance: dist(center, pos) });
    });
    r.sort((a, b) => a.distance - b.distance);
    return r.map(a => a.unit);
  }

  makePathFinder(unit = null, build = false) {
    let pf = new PathFinder(this.divX, this.divY, this.terrain);
    if (unit) {
      pf.setObstacles(this.activeUnits.filter(u => u.isPlayer != unit.isPlayer));
      pf.setOccupied(this.activeUnits.filter(u => u.isPlayer == unit.isPlayer && u.fid != unit.fid));
      for (let pos of unit.occupiedCells) {
        pf.setStart(pos);
      }
      if (build) {
        let sim = unit.sim ?? unit;
        pf.buildPath(sim.base.move, sim.isOnMultiMove ? 0 : unit.range);
      }
    }
    return pf;
  }

  isOwnTurn(unit) {
    return unit && ((unit.isPlayer && this.isPlayerTurn) || (unit.isEnemy && this.isEnemyTurn));
  }

  getTerrain(pos) {
    const [x, y] = pos;
    if (x >= 0 && y >= 0 && x < this.divX && y < this.divY) {
      return this.terrain[y][x];
    }
    return null;
  }
  isTerrainPassable(pos) {
    // 現状通行可能か不可能かの 2 値。ちゃんとサポートするならもっと複雑になる
    return this.getTerrain(pos) == 0;
  }
  canMoveInto(pos) {
    return this.isTerrainPassable(pos) && !this.findUnitByCoord(pos);
  }


  placeUnit(unit, pos) {
    // 指定座標が占有されていた場合はずらす
    // 上から時計回りの菱形の順でトライしていく
    const maxRadius = 5;
    for (let r = 0; r < maxRadius; ++r) {
      for (let s of genDiamondCoords(r)) {
        let c = [pos[0] + s[0], pos[1] + s[1]];
        if (this.canMoveInto(c)) {
          unit.coord = c;
          unit.isDormant = false;
          $vue().resetUnitPosition(unit.base, true);
          return true;
        }
      }
    }
    return false;
  }

  // ユーザー操作により呼ばれる
  eraseUnit(unit) {
    let u = unit?.sim ?? unit;
    if (u) {
      let ctx = makeActionContext(u);
      u.main.hp = 0;
      u.onDeath(ctx);
      if (!u.isAlive) { // 復活持ちはここでも生きている
        this.notifyDead(u);
      }
      this.updateAreaEffects();

      this.addUserEvent({
        type: "eraseUnit",
        target: u.fid
      });
    }
  }
  //#endregion unit operation


  //#region attack
  // attacker: chr
  doAttack(ctx, attacker, targetStack, skill) {
    let actx = ctx.makeChild();
    actx.attacker = attacker;
    actx.skill = skill;

    if (!targetStack.find(a => a.isValid)) {
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
    let dmgDealBuff = aunit.getDamageDealBuff(actx);
    let critDmgRate = aunit.getCriticalDamageRate(actx);
    let damageRate = skill ? skill.getDamageRate(actx) : 1.0;
    let rangedPenarty = actx.onRangedPenarty ? 0.6 : 1.0;

    const calcDamage = (t, breakOnKill) => {
      actx.defender = t;
      let dunit = t.unit;
      // 防御側コンテキスト
      let dctx = makeActionContext(dunit, aunit, null);
      dctx.inheritAttackerParams(actx);
      dctx.attacker = actx.attacker;
      dctx.defender = actx.defender;
      if (t.isSupport)
        dctx.onSupportDefense = true;
      else
        dctx.onMainDefense = true;

      let def = dunit.getDefensePower(dctx);
      let baseDmg = Math.max(atk - def, 1);
      let dmgTakenBuff = dunit.getDamageTakenBuff(dctx);
      let damage = baseDmg * damageRate * dmgDealBuff * dmgTakenBuff * critDmgRate * rangedPenarty;

      let totalDamage = 0;
      while (attackCount) {
        totalDamage += t.receiveDamage(damage, attacker, ctx);
        --attackCount;
        if (breakOnKill && !t.isAlive) {
          break;
        }
      }
    };

    while (attackCount) {
      let t = targetStack.at(-1);
      if (!t.isAlive && targetStack.length > 1) {
        targetStack.pop();
        continue;
      }
      calcDamage(t, targetStack.length > 1);
    }

    return actx;
  }

  getBattleResult(unit, skill, target, ctx) {
    // 攻撃側コンテキスト
    ctx.onAttack = ctx.onBattle = true;
    let actx = ctx.makeChild();

    // 防御側コンテキスト
    let dctx = makeActionContext(target, unit, null);
    dctx.inheritBattleParams(actx);
    dctx.inheritDamage(ctx);

    callHandler("onAttackBegin", actx, unit);
    callHandler("onBattleBegin", actx, unit);
    callHandler("onAttackBegin", dctx, target);
    callHandler("onBattleBegin", dctx, target);
    unit.evaluateBuffs(actx);
    target.evaluateBuffs(dctx);

    let attacker = [ unit.main, unit.support].filter(c => c.isAlive);
    let defender = [target.main, target.support].filter(c => c.isAlive);
    if (attacker.length && defender.length) {
      // 戦闘前に相手が固定ダメージで死んだ場合などはここに来ないまま戦闘終了となる
      ctx.attackInProgress = true;
      if (unit.invokeSupportAttack(actx)) {
        actx.forceJoinSupport = true;
      }

      // 攻撃側の攻撃
      this.doAttack(actx, unit.support, defender, null);
      this.doAttack(actx, unit.main, defender, skill);
      if (defender.at(-1).isAlive && unit.invokeDoubleAttack(actx)) {
        // 対象が生き残っていて2回攻撃の条件を満たしていたらもう一度攻撃
        this.doAttack(actx, unit.main, defender, skill);
      }

      // 防御側の反撃
      this.doAttack(dctx, target.support, attacker, null);
      this.doAttack(dctx, target.main, attacker, null);
      if (attacker.at(-1).isAlive && target.invokeDoubleAttack(dctx)) {
        // 対象が生き残っていて2回攻撃の条件を満たしていたらもう一度攻撃
        this.doAttack(dctx, target.main, attacker, null);
      }
      ctx.attackInProgress = false;
    }

    if (ctx.damageDealt.get(unit.fid).total > 0) {
      actx.onCriticalHit = ctx.onCriticalHit = true; // とりあえずダメージを与えたらクリティカル扱い
      actx.onDamage = ctx.onDamage = true;
    }
    if (ctx.damageDealt.get(target.fid).total > 0) {
      dctx.onCriticalHit = true;
      dctx.onDamage = true;
    }

    if (unit.isAlive) {
      callHandler("onAttackEnd", actx, unit);
      callHandler("onBattleEnd", actx, unit);
    }
    if (target.isAlive) {
      callHandler("onAttackEnd", dctx, target);
      callHandler("onBattleEnd", dctx, target);
    }
    unit.eraseExpiredEffects();
    target.eraseExpiredEffects();
  }

  getAreaAttackResult(unit, skill, targets, ctx) {
    ctx.onAttack = !skill.isSupportSkill;
    if (ctx.onAttack) {
      callHandler("onAttackBegin", ctx, unit);
    }

    ctx.attackInProgress = true;
    let attacker = skill.isSupportSkill ? unit.support : unit.main;
    for (let target of targets ?? []) {
      // 攻撃側コンテキスト
      // target に依存するバフがあるので、ループの内側である必要がある
      let actx = ctx.makeChild();
      actx.target = target;
      unit.evaluateBuffs(actx);

      // 防御側コンテキスト (継承不要)
      let dctx = makeActionContext(target, unit, null);
      target.evaluateBuffs(dctx);

      this.doAttack(actx, attacker, [target.main], skill);
      this.doAttack(actx, attacker, [target.support], skill);
    }
    ctx.attackInProgress = false;

    if (ctx.damageDealt.get(unit.fid).total > 0) {
      ctx.onCriticalHit = true; // とりあえずダメージを与えたらクリティカル扱い
      ctx.onDamage = true;
    }

    if (ctx.onAttack) {
      callHandler("onAttackEnd", ctx, unit);
    }
    unit.eraseExpiredEffects();
  }

  fireSkill(unit, skill, skillArgs) {
    if (!$g.sim) { // シミュレーションが中断された場合対策
      return;
    }
    this.updateAreaEffects();
    unit = unit.sim ?? unit;
    let target = null;
    let targets = [];
    let targetCell = null;
    if (skill) {
      if (skillArgs.coord) {
        targetCell = [...skillArgs.coord];
      }
      if (skill.isSelfTarget) {
        target = unit;
      }
      else if (skill.isTargetCell) {
      }
      else if (skill.isSingleTarget) {
        target = this.findUnitByCoord(skillArgs.coord);
      }
      else if (skill.isAreaTarget) {
        if (skill.isGlobalTarget || skill.isRadialAreaTarget || skill.isDirectionalAreaTarget) {
          targets = this.getUnitsInArea(unit.coord, { ...skillArgs, ...skill.makeAreaParams() });
        }
        else {
          targets = this.getUnitsInArea(skillArgs.coord, { ...skillArgs, ...skill.makeAreaParams() });
        }
      }
    }
    if (target) {
      targets = [target];
    }

    let doActionBegin = (skill?.isSupportSkill || unit.isOnMultiMove) ? false : true;
    // ややこしいが、行動終了時は再移動でも発動
    let doActionEnd = (skill?.isSupportSkill) ? false : true;
    let doAttack = false;
    let doBattle = false;
    let multiAction = false;
    let multiMove = false;
    let onGuard = false;
    let doSupportAttackSkill = false;

    // 戦闘・非戦闘の区分け
    if (skill && skill.isMainSkill && skill.isAttackSkill) {
      doAttack = true;
      doBattle = skill.isNormalAttack || skill.isSingleTarget;
      if (doBattle) {
        // ガード処理
        let ctx = makeActionContext(unit);
        for (let guard of target.guardians) {
          if (guard.condition(ctx)) {
            $g.log(`!! ガード ${guard.unit.main.name} -> ${target.main.name} !!`);
            target = guard.unit;
            onGuard = true;
            break;
          }
        }
      }
    }
    else if (skill && skill.isSupportSkill && skill.isAttackSkill) {
      // サポートのスキルは 戦闘時/攻撃時 効果を発動しない
      doSupportAttackSkill = true;
    }

    // 条件変数を設定
    // ここでは通常攻撃の場合も必ず skill が設定されている
    // (getBattleResult で反撃側やサポートの場合 ctx.skill は null になる)
    let ctx = makeActionContext(unit, target, skill);
    ctx.targetCell = targetCell ? [...targetCell] : null;
    ctx.targets = targets;
    if (doActionBegin) { ctx.onAction = true; }
    if (doAttack) { ctx.onAttack = true; }
    if (doBattle) { ctx.onBattle = true; }
    if (onGuard) { ctx.isTargetGuardian = true; }
    if (!skill) { // 待機
      ctx.onWait = true;
      if (skillArgs?.onIdle) { ctx.onIdle = true; } // 明示的に「待機」指示せずターン終了した場合
    }
    if (targetCell) {
      // NxN ボス対策として target.coord ではなく targetCell との距離を取る
      ctx.range = Math.abs(unit.coord[0] - targetCell[0]) + Math.abs(unit.coord[1] - targetCell[1]);
    }

    if (doActionBegin) {
      callHandler("onActionBegin", ctx, unit);
    }

    // 待機の場合 skill は null
    if (skill) {
      skill.startCoolTime();
      // 攻撃処理
      if (doBattle) {
        this.getBattleResult(unit, skill, target, ctx);
      }
      else if (doAttack || doSupportAttackSkill) {
        // 敵にダメージ味方にバフ系のスキルの場合 targets には両陣営のユニットが入っている
        let enemies = targets.filter(a => a.isPlayer != unit.isPlayer);
        this.getAreaAttackResult(unit, skill, enemies, ctx);
      }
      skill.onFire(ctx);
      this.updateAreaEffects();
    }
    else {
      ctx.onWait = true;
    }

    const handleDeath = (t) => {
      let r = false;
      if (!t.isAlive) {
        r = true;
        let dctx = makeActionContext(t);
        callHandler("onDeath", dctx, t);
        if (!t.isAlive) {
          this.notifyDead(t);
        }
      }
      return r;
    };
    let deadUnits = [];
    const checkKill = () => {
      for (let fid of Object.keys(ctx.damageTaken)) {
        let t = this.findUnit(fid);
        if (!deadUnits.find(u => u.fid == fid) && handleDeath(t)) {
          if (t.isPlayer != unit.isPlayer) {
            ctx.onKill = true;
          }
          if (!t.isAlive) {
            deadUnits.push(t);
          }
        }
      }
    };

    checkKill();
    if (unit.isAlive) {
      if (doActionEnd) {
        callHandler("onActionEnd", ctx, unit);
        checkKill();
      }
      if (ctx.onKill) {
        callHandler("onKill", ctx, unit);
      }
    }
    if (target?.isAlive) {
      if (!unit.isAlive) {
        // 攻撃側が反撃で倒れた場合、防御側の onKill を呼ぶ
        let dctx = makeActionContext(target, unit);
        callHandler("onKill", dctx, target);
      }
    }

    if (!unit.isAlive) {
      unit.state = UnitState.End;
    }
    else if (doActionEnd) {
      if (!unit.isNxN || ctx.onWait) {
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
        // サポートアクティブ使用時は残移動量を設定
        unit.move = unit.main.move - ctx.move;
      }
    }

    // 移動量リセット
    if (unit.state == UnitState.MultiAction || unit.state == UnitState.End) {
      unit.move = -1;
    }
    unit.prevMoveDistance = doActionEnd ? 0 : unit.moveDistance;
    unit.moveDistance = 0;

    this.updateAreaEffects();
    this.pushState(unit, skill, skillArgs);
    console.log(ctx);

    this.deadUnits = [];
    $vue().addBalloons(ctx);
    if (skillArgs?.coord) {
      $vue().blinkCell(skillArgs.coord);
    }
    return ctx;
  }
  //#endregion attack


  //#region simulation & callbacks
  updateAreaEffects() {
    for (let u of this.activeUnits) {
      u.beforeUpdateAreaEffects();
    }
    for (let u of this.activeUnits) {
      u.updateAreaEffects();
    }
    for (let u of this.activeUnits) {
      u.afterUpdateAreaEffects();
    }
  }

  start(replay) {
    this.onSimulationBegin();
    if (!replay) {
      this.onPlayerTurnBegin();
    }
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
    this.updateAreaEffects();
    for (let u of this.units) {
      u.setup();
    }
    this.updateAreaEffects();
  }
  onSimulationEnd() {
    for (let u of Object.values(this.unitTable)) {
      u.onSimulationEnd();
    }
    if ($g.sim == this) {
      $g.sim = null;
    }
  }

  onPlayerTurnBegin() {
    for (let u of this.activePlayerUnits) {
      u.onOwnTurnBegin();
    }
    for (let u of this.activeEnemyUnits) {
      u.onOpponentTurnBegin();
    }
    this.updateAreaEffects();
    this.pushState();
  }
  onPlayerTurnEnd() {
    for (let u of this.activePlayerUnits) {
      u.wait();
    }
    for (let u of this.activePlayerUnits) {
      u.onOwnTurnEnd();
    }
    for (let u of this.activeEnemyUnits) {
      u.onOpponentTurnEnd();
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
    this.updateAreaEffects();

    for (let u of this.activeEnemyUnits) {
      u.onOwnTurnBegin();
    }
    for (let u of this.activePlayerUnits) {
      u.onOpponentTurnBegin();
    }
    this.updateAreaEffects();
    this.pushState();
  }
  onEnemyTurnEnd() {
    for (let u of this.activeEnemyUnits) {
      u.wait();
    }
    for (let u of this.activeEnemyUnits) {
      u.onOwnTurnEnd();
    }
    for (let u of this.activePlayerUnits) {
      u.onOpponentTurnEnd();
    }
  }
  //#endregion simulation & callbacks
}


export class PathFinder
{
  cells = [];
  xdiv = 0;
  ydiv = 0;

  constructor(xdiv, ydiv, terrain = null) {
    this.xdiv = xdiv;
    this.ydiv = ydiv;
    this.cells = Array(xdiv * ydiv);
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

    if (this.xdiv == terrain?.length) {
      for (let y = 0; y < this.ydiv; ++y) {
        for (let x = 0; x < this.xdiv; ++x) {
          if (terrain[y][x] != 0) {
            this.cells[this.ydiv * y + x].isObstacle = true;
          }
        }
      }
    }
  }
  getCell(x, y) {
    if ((x >= 0 && x < this.xdiv) && (y >= 0 && y < this.ydiv)) {
      return this.cells[this.ydiv * y + x];
    }
    return null;
  }

  getDistance(pos) {
    return this.getCell(pos[0], pos[1])?.shootDistance ?? -1;
  }
  getMoveDistance(pos) {
    return this.getCell(pos[0], pos[1])?.moveDistance ?? -1;
  }
  isPassable(pos) {
    const c = this.getCell(pos[0], pos[1]);
    return c && !c.isObstacle;
  }
  isInMoveRange(pos) {
    return pos && (this.getCell(pos[0], pos[1])?.moveDistance ?? -1) >= 0;
  }
  isInFireRange(pos) {
    return pos && (this.getCell(pos[0], pos[1])?.shootDistance ?? -1) >= 0;
  }
  setShootRangeShape(shape, center) {
    for (let y = 0; y < this.ydiv; ++y) {
      for (let x = 0; x < this.xdiv; ++x) {
        if (shape[y][x]) {
          let d = 0;
          if (center) {
            d = Math.abs(x - center[0]) + Math.abs(y - center[1]);
          }
          this.getCell(x, y).shootDistance = d;
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
  setStartUnit(unit) {
    for (let pos of unit.occupiedCells) {
      this.setStart(pos);
    }
  }
  setObstacles(units) {
    for (const u of units) {
      for (let pos of u.occupiedCells) {
        let c = this.getCell(pos[0], pos[1]);
        if (c) {
          c.isObstacle = true;
        }
      }
    }
  }
  setOccupied(units) {
    for (const u of units) {
      for (let pos of u.occupiedCells) {
        let c = this.getCell(pos[0], pos[1]);
        if (c) {
          c.isOccupied = true;
        }
      }
    }
  }
  buildPath(move, rangeParams = null) {
    for (let m = 0; m < move; ++m) {
      for (let y = 0; y < this.ydiv; ++y) {
        for (let x = 0; x < this.xdiv; ++x) {
          this._chartCell(x, y, m);
        }
      }
    }
    if (rangeParams) {
      for (let y = 0; y < this.ydiv; ++y) {
        for (let x = 0; x < this.xdiv; ++x) {
          this._shootCell(x, y, rangeParams);
        }
      }
    }
  }
  getPath(pos, from) {
    let d = this.getMoveDistance(pos);
    if (d < 0)
      return [from, pos];
    let path = [pos];
    let cur = [...pos];
    while (d > 0) {
      let len = path.length;
      for (let n of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
        let next = [cur[0] + n[0], cur[1] + n[1]];
        let nd = this.getMoveDistance(next);
        if (nd != -1 && nd < d) {
          path.push(next);
          cur = next;
          d = nd;
          break;
        }
      }
      if (path.length == len) {
        return null;
      }
    }
    return path.toReversed();
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
        c.shootDistance = c.moveDistance = distance + 1;
      }
    }
  }
  _shootCell(x, y, rangeParams) {
    let c = this.getCell(x, y);
    if (c.moveDistance < 0 || c.isOccupied) {
      return;
    }
    let params = {
      center: [x, y],
      ...rangeParams,
    };
    const apply = (pos) => {
      if (isInside(pos, params)) {
        let tc = this.getCell(pos[0], pos[1]);
        if (tc) {
          let d = Math.max(c.moveDistance, 0) + (Math.abs(pos[0] - x) + Math.abs(pos[1] - y));
          tc.shootDistance = tc.shootDistance == -1 ? d : Math.min(tc.shootDistance, d);
        }
      }
    };
    if (rangeParams.shapeData) {
      apply([x, y]);
    }
    else if (rangeParams.size) {
      let size = rangeParams.size;
      for (let ry = -size; ry <= size; ++ry) {
        for (let rx = -size; rx <= size; ++rx) {
          apply([x + rx, y + ry]);
        }
      }
    }
    else {
      apply([x, y]);
    }
  }
  toString() {
    const cellToChr = (c) => {
      if (c.isObstacle) {
        return 'x';
      }
      else if (c.moveDistance == -1) {
        return ' ';
      }
      else {
        return `${c.moveDistance}`
      }
    };
    let r = "";
    for (let y = 0; y < this.ydiv; ++y) {
      r += this.cells.slice(this.ydiv * y, this.ydiv * (y + 1)).map(c => cellToChr(c)).join(', ') + '\n';
    }
    return r;
  }
}

function $vue() {
  return window.$vue;
}
