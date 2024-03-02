import { makeSimSkill, makeSimEffect } from "./battle_skill.js";

function $vue() {
  return window.$vue;
}

export function mergeChrData(dst, src) {
  const props = [
    "isMain", "isSupport",
    "name", "icon", "class", "rarity", "symbol", "supportType", "damageType", "range", "move",
  ];
  if (src) {
    for (const prop of props) {
      if (prop in src)
        dst[prop] = src[prop];
      else
        delete dst[prop];
    }
  }
  else {
    for (const prop of props) {
      delete dst[prop];
    }
  }
}

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
  }
  setup() {
    const defineStatusGetter = (self) => {
      const table = {
        baseHp: function () { return this.status[0]; },
        baseAtk: function () { return this.status[1]; },
        baseDef: function () { return this.status[2]; },
        baseMag: function () { return this.status[3]; },
        baseRes: function () { return this.status[4]; },
        baseTec: function () { return this.status[5]; },
      };
      for (const [key, func] of Object.entries(table)) {
        Object.defineProperty(self, key, {
          configurable: true,
          get: func,
        });
      }
    };
    defineStatusGetter(this.base.main);
    defineStatusGetter(this.base.support);
    //console.log(this);
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
    this.setup();
  }
  edit(ss) {
    const findItemByUid = $vue().findItemByUid;
    const copyArray = $vue().copyArray;
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

    this.setup();
    //console.log(this);
  }
}


export class SimUnit {

  //#region fields
  base = null; // BaseUnit
  isDormant = false; // 配置前 (出現ターン前) のユニットは true
  coord = [0, 0];
  affectedSkills = []; // SimSkill
  effects = []; // SimEffect
  main = {
    bufP: [],
    bufF: [],
    hp: 0,
    maxHp: 0,
  };
  support = {
    bufP: [],
    bufF: [],
    hp: 0,
    maxHp: 0,
  };
  //#endregion fields


  //#region props
  get fid() { return this.base.fid; }
  get phase() { return this.base.phase; }
  get isAlive() { return this.main.hp > 0; }
  get isActive() { return !this.isDormant && this.isAlive; }
  get isPlayer() { return this.base.isPlayer; }
  get isEnemy() { return this.base.isEnemy; }
  get hpRate() {
    return (this.main.hp + this.support.hp) / (this.main.maxHp + this.support.maxHp);
  }
  get activeBuffCount() {
    return this.effects.reduce((total, e) => {
      if (e.isBuff && e.parent.isActive) {
        total += 1;
      }
      return total;
    }, 0);
  }
  get activeDebuffCount() {
    return this.effects.reduce((total, e) => {
      if (e.isDebuff && e.parent.isActive) {
        total += 1;
      }
      return total;
    }, 0);
  }
  get actions() {
    return [...(this.base.main?.skills ?? []), ...(this.base.support?.skills ?? [])].filter(a => a.isActive);
  }
  //#endregion props


  //#region methods
  constructor(unit) {
    unit.sim = this;
    this.base = unit;
    this.coord = [...unit.base.coord];

    if (unit.phase && unit.phase != "0") {
      this.isDormant = true;
    }

    const addBattleProps = (chr, base) => {
      Object.defineProperty(chr, 'unit', {
        get: () => this,
      });

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

      Object.defineProperty(chr, 'baseStatus', {
        get: () => base.status,
      });

      const table = {
        baseHp: function () { return base.status[0]; },
        baseAtk: function () { return base.status[1]; },
        baseDef: function () { return base.status[2]; },
        baseMag: function () { return base.status[3]; },
        baseRes: function () { return base.status[4]; },
        baseTec: function () { return base.status[5]; },
      };
      for (const [key, func] of Object.entries(table)) {
        Object.defineProperty(chr, key, {
          get: func,
        });
      }
      chr.hp = chr.maxHp = chr.baseHp;
    };
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

    console.log(this);
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

  // ctx: {
  //  onBattle: boolean,
  //  onNormalAttack: boolean,
  //  onActiveSkill: boolean,
  //  onAreaSkill: boolean,
  //  main: boolean,
  //  support: boolean,
  //  damageType: enum ["アタック", "マジック"],
  //}
  getAttackPower(ctx) {

  }
  getDamageDealtBuff(ctx) {

  }
  geCriticalRate(ctx) {

  }
  geCriticalDamageRate(ctx) {

  }
  getDefensePower(ctx) {

  }
  getDamageTakenBuff(ctx) {

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

  evaluateEffects(battleCtx) {

  }
  //#endregion methods


  //#region callbacks
  onSimulationBegin() {
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
