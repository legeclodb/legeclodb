<template>
  <div class="root">

    <div class="menu-content" style="flex-wrap: nowrap">
      <div class="menu-panel">
        <b-container>
          <div>
            <h3 style="margin: 5px 0px">設定</h3>
          </div>
          <b-table small borderless hover :items="Object.values(options)" :fields="optionFields">
            <template #cell(value)="r">
              <div class="flex">
                <div style="margin-left: auto">
                  <template v-if="r.item.type == 'boolean'">
                    <b-form-checkbox v-model="r.item.value"></b-form-checkbox>
                  </template>
                  <template v-else-if="r.item.type == 'number'">
                    <b-form-input style="width: 3em" v-model.number="r.item.value" :min="r.item.min" :max="r.item.max" size="sm" type="number" class="input-param" lazy></b-form-input>
                  </template>
                  <template v-else-if="r.item.type == 'sortMode'">
                    <b-dropdown :text="`${sortModes[r.item.value].label}`" size="sm">
                      <b-dropdown-item v-for="(v, i) in sortModes" :key="i" class="d-flex flex-column" size="sm" @click="r.item.value=i">
                        {{sortModes[i].label}}
                      </b-dropdown-item>
                    </b-dropdown>
                  </template>
                </div>
              </div>
            </template>
            <template #cell(label)="r">
              <template>
                <div :id="`sb-p-${r.item.name}`">{{r.item.label}}</div>
              </template>
            </template>
          </b-table>
        </b-container>

        <b-container>
          <div>
            <h3 style="margin: 5px 0px">フィルタ</h3>
          </div>
          <div class="menu-widgets flex">
            <div class="widget">
              <b-button-group size="sm" id="sb-class-selector">
                <b-button v-for="(c, i) in filter.class" :key="i" :pressed.sync="c.state" variant="outline-secondary">
                  <b-img-lazy :src="getImageURL(classes[i])" width="20px" />
                </b-button>
              </b-button-group>
            </div>
          </div>
          <div class="menu-widgets flex">
            <div class="widget filter">
              <b-button-group size="sm" id="sb-symbol-selector">
                <b-button v-for="(c, i) in filter.symbol" :key="i" :pressed.sync="c.state" variant="outline-secondary">
                  <b-img-lazy :src="getImageURL(symbols[i])" width="20px" />
                </b-button>
              </b-button-group>
            </div>
            <div class="widget filter">
              <b-button-group size="sm" id="sb-damage-type-selector">
                <b-button v-for="(c, i) in filter.damageType" :key="i" :pressed.sync="c.state" variant="outline-secondary">
                  <b-img-lazy :src="getImageURL(damageTypes[i])" width="20px" />
                </b-button>
              </b-button-group>
            </div>
            <div class="widget rareiry-filter">
              <b-button-group size="sm" id="sb-rareiry-selector">
                <b-button v-for="(c, i) in filter.rarity" :key="i" :pressed.sync="c.state" variant="outline-secondary">
                  <b-img-lazy :src="getImageURL(rarities[i])" width="30px" />
                </b-button>
              </b-button-group>
            </div>
          </div>
        </b-container>

        <b-container>
          <div class="button-box">
            <div class="left-align">
              <b-button size="sm" @click="presetPAtk()" style="margin-right: 3px">物攻系</b-button>
              <b-button size="sm" @click="presetMAtk()" style="margin-right: 3px">魔攻系</b-button>
              <b-button size="sm" @click="presetPDef()" style="margin-right: 3px">物防系</b-button>
              <b-button size="sm" @click="presetMDef()" style="margin-right: 3px">魔防系</b-button>
              <b-button size="sm" @click="presetAll()" style="margin-right: 3px">全て</b-button>
            </div>
          </div>
          <div class="button-box">
            <div class="left-align">
              <b-button size="sm" @click="onCopyUrl()">パラメータを URL としてコピー</b-button>
            </div>
          </div>
        </b-container>
      </div>

      <div class="menu-panel">
        <b-container>
          <div class="flex">
            <h3 style="margin: 5px 0px">バフ</h3>
            <div class="right-align">
              <b-button size="sm" @click="buffs.forEach(a => a.reset())">リセット</b-button>
            </div>
          </div>
          <b-table small borderless hover :items="buffs" :fields="buffFields">
            <template #cell(enabled)="r">
              <b-form-checkbox v-model="r.item.enabled"></b-form-checkbox>
            </template>
            <template #cell(label)="r">
              {{r.item.label}}
            </template>
          </b-table>
        </b-container>
      </div>
      <div class="menu-panel">
        <b-container>
          <div class="flex">
            <h3 style="margin: 5px 0px">デバフ</h3>
            <div class="right-align">
              <b-button size="sm" @click="debuffs.forEach(a => a.reset())">リセット</b-button>
            </div>
          </div>
          <b-table small borderless hover :items="debuffs" :fields="buffFields">
            <template #cell(enabled)="r">
              <b-form-checkbox v-model="r.item.enabled"></b-form-checkbox>
            </template>
            <template #cell(label)="r">
              {{r.item.label}}
            </template>
          </b-table>
        </b-container>
      </div>

      <div class="menu-panel" id="sb-exclude-list">
        <b-container>
          <div>
            <div class="flex">
              <h3 style="margin: 5px 0px">優先リスト</h3>
              <div class="right-align">
                <b-button size="sm" @click="prioritized=[]" style="margin-left: 5px">クリア</b-button>
              </div>
            </div>
            <div class="flex exclude-box">
              <b-link v-for="(v, i) in prioritized" :key="i" @click="prioritized.splice(prioritized.indexOf(v), 1)">
                <div v-if="!v.owner" :title="v.name">
                  <b-img-lazy :src="getImageURL(v.icon)" :title="v.name" width="50" />
                </div>
                <div v-if="v.owner" style="width: 50px; height: 50px;" :title="v.owner.name + ' & ' + v.item.name">
                  <b-img-lazy :src="getImageURL(v.owner.icon)" :title="v.name" width="35" style="position: relative; left: 0px; top: 0px; " />
                  <b-img-lazy :src="getImageURL(v.item.icon)" :title="v.name" width="35" style="position: relative; left: -20px; top: 15px; " />
                </div>
              </b-link>
            </div>
          </div>
          <div>
            <div class="flex">
              <h3 style="margin: 5px 0px">除外リスト</h3>
              <div class="right-align">
                <b-button size="sm" @click="excluded=[]" style="margin-left: 5px">クリア</b-button>
              </div>
            </div>
            <div class="flex exclude-box">
              <b-link v-for="(v, i) in excluded" :key="i" @click="excluded.splice(excluded.indexOf(v), 1)">
                <div v-if="!v.owner" :title="v.name">
                  <b-img-lazy :src="getImageURL(v.icon)" :title="v.name" width="50" />
                </div>
                <div v-if="v.owner" style="width: 50px; height: 50px; " :title="v.owner.name + ' & ' + v.item.name">
                  <b-img-lazy :src="getImageURL(v.owner.icon)" :title="v.name" width="35" style="position: relative; left: 0px; top: 0px; " />
                  <b-img-lazy :src="getImageURL(v.item.icon)" :title="v.name" width="35" style="position: relative; left: -20px; top: 15px; " />
                </div>
              </b-link>
            </div>
          </div>
        </b-container>
      </div>
    </div>

    <div class="content" :style="style">
      <div v-if="!progress.completed" class="menu-panel" style="padding: 10px; position: absolute;">
        <b-spinner small label="Spinning"></b-spinner>
      </div>
      <div v-if="progress.result.length == 0" class="menu-panel" style="padding: 10px">
        <div class="about">
          <h5 style="margin-bottom: 5px">自己バフ検索</h5>
          こちらは自己バフを含むメインキャラ単身のタレント＋スキルのバフ・デバフの総合値を算出します。<br />
          キャラ性能を測る一つの指標になるでしょう。<br />
          <br />
          こちらもアクティブ同士の競合は考慮されています。<br />
          特定のスキルを除外or優先採用したい場合、アイコンをマウスオーバーすると出てくるポップアップから可能です。
        </div>
      </div>

      <template v-for="(r, ri) in progress.result">
        <div class="character" :key="ri">
          <div class="flex info">
            <div><h6>合計 {{r.score}}:</h6></div>
            <template v-for="(e, ei) in chrEffectsToHtml(r)">
              <div :key="ei" v-html="e" />
            </template>
          </div>
          <div class="flex">
            <div v-if="r.main" class="portrait">
              <b-img-lazy :src="getImageURL(r.main.character.icon)" :title="r.main.character.name" :id="'portrait_sbm_'+ri" width="100" rounded />
              <b-popover v-if="displayType>=1" :target="'portrait_sbm_'+ri" :title="r.main.character.name" triggers="hover click blur" :delay="{show:0, hide:250}" no-fade placement="top">
                <div class="status flex">
                  <b-img-lazy :src="getImageURL(r.main.character.class)" :title="'クラス:'+r.main.character.class" height="25" />
                  <b-img-lazy :src="getImageURL(r.main.character.symbol)" :title="'シンボル:'+r.main.character.symbol" height="25" />
                  <b-img-lazy :src="getImageURL(r.main.character.rarity)" :title="'レアリティ:'+r.main.character.rarity" height="20" />
                  <div class="param-box"><b-img-lazy :src="getImageURL(r.main.character.damageType)" :title="'攻撃タイプ:'+r.main.character.damageType" width="20" height="20" /></div>
                  <div class="param-box"><b-img-lazy :src="getImageURL('射程')" title="射程" width="18" height="18" /><span>{{r.main.character.range}}</span></div>
                  <div class="param-box"><b-img-lazy :src="getImageURL('移動')" title="移動" width="18" height="18" /><span>{{r.main.character.move}}</span></div>
                  <div class="param-box"><span class="param-name">実装日:</span><span class="param-value">{{r.main.character.date}}</span></div>
                </div>
                <div class="status flex">
                  <b-link v-for="(skill, si) in r.main.character.skills" :key="si" @click="addPrioritized(skill)">
                    <b-img-lazy :src="getImageURL(skill.icon)" :title="skill.name" width="50" />
                  </b-link>
                </div>
              </b-popover>
            </div>
            <div v-if="r.main" class="detail" v-show="displayType >= 1">
              <div class="skills">
                <div class="skill" v-for="(skill, si) in r.main.skills" :class="getSkillClass(skill)" :key="si">
                  <div class="flex">
                    <div class="icon">
                      <b-img-lazy :src="getImageURL(skill.icon)" :title="skill.name" width="50" :id="'skill_sbm_'+ri+'_'+si" />
                      <b-popover :target="'skill_sbm_'+ri+'_'+si" :title="skill.name" triggers="hover click blur" :delay="{show:0, hide:250}" no-fade placement="top">
                        <div v-if="skill.owners" class="owners">
                          所持者:<br />
                          <b-link v-for="(owner, oi) in skill.owners" :key="oi" @click="addPrioritized(owner)">
                            <b-img-lazy :src="getImageURL(owner.icon)" :title="owner.name" width="50" />
                          </b-link>
                        </div>
                        <div v-if="!skill.isTalent">
                          <div class="flex exclude-menu">
                            <b-button size="sm" @click="addPrioritized(skill)">このスキルを優先</b-button>
                            <b-button size="sm" @click="addPrioritized(skill, r.main.character)">このキャラとスキルの組み合わせを優先</b-button>
                          </div>
                          <div class="flex exclude-menu">
                            <b-button size="sm" @click="addExcluded(skill)">このスキルを除外</b-button>
                            <b-button size="sm" @click="addExcluded(skill, r.main.character)">このキャラとスキルの組み合わせを除外</b-button>
                          </div>
                        </div>
                      </b-popover>
                    </div>
                    <div class="desc" v-show="displayType >= 2">
                      <div class="flex">
                        <h6>{{ skill.name }}</h6>
                        <div class="param-group" v-html="skillParamsToHtml(skill)"></div>
                      </div>
                      <p>
                        <span v-html="descToHtml(skill, true)" />
                        <span v-if="skill.note" class="note" v-html="noteToHtml(skill)" />
                        <span class="note" v-html="effectsToHtml(skill, r.main)" />
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex">
            <div v-if="r.summon" class="portrait">
              <b-img-lazy :src="getImageURL(r.summon.character.icon)" :title="`${r.summon.character.name} (召喚ユニット)`" :id="'portrait_sbx_'+ri" width="100" rounded />
            </div>
            <div v-if="r.summon" class="detail" v-show="displayType >= 1">
              <div class="skills">
                <div class="skill" v-for="(skill, si) in r.summon.skills" :class="getSkillClass(skill)" :key="si">
                  <div class="flex">
                    <div class="icon">
                      <b-img-lazy :src="getImageURL(skill.icon)" :title="skill.name" width="50" :id="'skill_sbx_'+ri+'_'+si" />
                      <b-popover :target="'skill_sbx_'+ri+'_'+si" :title="skill.name" triggers="hover click blur" :delay="{show:0, hide:250}" no-fade placement="top">
                        <div v-if="skill.owners" class="owners">
                          所持者:<br />
                          <b-link v-for="(owner, oi) in skill.owners" :key="oi" @click="addPrioritized(owner)">
                            <b-img-lazy :src="getImageURL(owner.icon)" :title="owner.name" width="50" height="50" />
                          </b-link>
                        </div>
                      </b-popover>
                    </div>
                    <div class="desc" v-show="displayType >= 2">
                      <div class="flex">
                        <h6>{{ skill.name }}</h6>
                        <div class="param-group" v-html="skillParamsToHtml(skill)"></div>
                      </div>
                      <p>
                        <span v-html="descToHtml(skill, true)" />
                        <span v-if="skill.note" class="note" v-html="noteToHtml(skill)" />
                        <span class="note" v-html="effectsToHtml(skill, r.main)" />
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </template>
    </div>

  </div>
</template>

<script>
import commonjs from "../common.js";
import lookupjs from "./lookup.js";

export default {
  name: 'SelfBufSimulator',
  components: {
  },
  props: {
  },
  mixins: [commonjs, lookupjs],

  data() {
    return {
      buffFields: [
        {
          key: "enabled",
          label: "",
        },
        {
          key: "label",
          label: "種類",
        },
      ],
      optionFields: [
        {
          key: "value",
          label: "",
        },
        {
          key: "label",
          label: "項目",
        },
      ],

      sortModes: [
        {
          label: "スコア"
        },
        {
          label: "実装日"
        },
        {
          label: "エンゲージ実装日"
        },
      ],
      sortMode: 0,
    };
  },

  created() {
    this.setupDB();
    this.setupFilter();
    for (let s of [...this.mainActive, ...this.mainPassive, ...this.mainTalents]) {
      this.removeEffectsOfSameType(s);
    }

    this.sortModes[0].compare = (a, b) => this.compare(a.score, b.score); // スコア
    this.sortModes[1].compare = (a, b) => b.main.character.date.localeCompare(a.main.character.date); // 実装日
    this.sortModes[2].compare = (a, b) => this.compareEngageDate(a.main.character, b.main.character); // エンゲージ実装日

    const makeOptions = function (params) {
      let r = {};
      for (const p of params) {
        const v = p.value;
        if (!p.type)
          p.type = typeof v;
        p.reset = function () { this.value = v; };
        r[p.name] = p;
      }
      return r;
    };
    this.options = makeOptions([
      { name: "sortMode", label: "ソート", value: 0, type: "sortMode" },
      { name: "maxPickup", label: "人まで表示", value: 20, min: 1, max: 200 },
      { name: "maxActiveCount", label: "アクティブ数制限 (再行動ありを除く)", value: 2, min: 0, max: 3 },
      { name: "allowTalent", label: "タレントを含める", value: true },
      { name: "allowPassive", label: "パッシブスキルを含める", value: true },
      { name: "allowActive", label: "アクティブスキルを含める", value: true },
      { name: "allowEngageSkills", label: "エンゲージスキルを含める", value: true },
      { name: "allowOnBattle", label: "戦闘時発動効果を含める", value: true },
      { name: "allowProbability", label: "確率発動効果を含める", value: true },
    ]);

    const makeParams = function (effectType, types) {
      const make = function (t) {
        return {
          label: t.label,
          enabled: false,

          reset() {
            this.enabled = false;
          }
        };
      }
      return types.map(a => make(a));
    };
    this.buffs = makeParams("+", [
      { label: "アタック" },
      { label: "ディフェンス" },
      { label: "マジック" },
      { label: "レジスト" },
      { label: "クリティカル率" },
      { label: "クリティカルダメージ倍率" },
      { label: "与ダメージ" },
      { label: "与ダメージ(物理)" },
      { label: "与ダメージ(魔法)" },
      { label: "与ダメージ(スキル)" },
      { label: "与ダメージ(範囲スキル)" },
      { label: "与ダメージ(通常攻撃)" },
      { label: "ダメージ耐性" },
      { label: "ダメージ耐性(物理)" },
      { label: "ダメージ耐性(魔法)" },
      { label: "最大HP" },
      { label: "移動" },
    ]);
    this.debuffs = makeParams("-", [
      { label: "アタック", limit: 70 },
      { label: "ディフェンス", limit: 70 },
      { label: "マジック", limit: 70 },
      { label: "レジスト", limit: 70 },
      { label: "与ダメージ", limit: 70 },
      { label: "ダメージ耐性" },
      { label: "ダメージ耐性(物理)" },
      { label: "ダメージ耐性(魔法)" },
    ]);
  },
  
  mounted() {
  },

  methods: {
    doSearch() {
      let vue = this;
      const opt = this.optionValues;
      const enabledBuffEffects = this.buffs.filter(a => a.enabled).map(a => a.label);
      const enabledDebuffEffects = this.debuffs.filter(a => a.enabled).map(a => a.label);
      for (let chr of this.mainChrs) {
        if (chr.engage) {
          chr.engage.enabled = opt.allowEngageSkills;
        }
      }

      let ctx = {
        reset() {
          this.activeCount = 0;
          this.usedEffects = [];
          this.conflictedEffects = [];
          this.usedSlots = new vue.BitFlags(vue.effectTypeIndex);
        }
      };

      const getSkillScore = function (chr, skill) {
        let r = {
          score: 0,
          prioritized: this.isPrioritized(skill, chr) ? 1 : 0,
          excluded: this.isExcluded(skill, chr) ? 1 : 0,
          skill: skill,
          usedEffects: [],
          conflictedEffects: [],
        };
        if (r.excluded ||
          (!opt.allowTalent && skill.isTalent) ||
          (!opt.allowPassive && skill.isPassive) ||
          (!opt.allowActive && skill.isActive) ||
          (skill.isActive && !skill.multiAction && ctx.activeCount >= opt.maxActiveCount))
        {
          return r;
        }

        const evalCondition = function (effect) {
          if ((!effect.value && !effect.variable && !effect.add) ||
            (skill.isActive && !effect.duration))
            return;

          const cond = effect.condition;
          const probability = cond?.probability;
          if ((!opt.allowOnBattle && effect.ephemeral) ||
            (!opt.allowProbability && probability))
            return false;
          return true;
        };

        if (skill.buff) {
          for (const effect of skill.buff) {
            if (!(enabledBuffEffects.includes(effect.type)))
              continue;
            if (!evalCondition(effect))
              continue;

            if (effect.slotIndex && ctx.usedSlots.get(effect.slotIndex)) {
              r.conflictedEffects.push(effect);
            }
            else {
              r.score += this.getEffectValue(effect);
              r.usedEffects.push(effect);
            }
          }
        }
        if (skill.debuff) {
          for (const effect of skill.debuff) {
            if (!enabledDebuffEffects.includes(effect.type))
              continue;
            if (!evalCondition(effect))
              continue;

            if (effect.slotIndex && ctx.usedSlots.get(effect.slotIndex)) {
              r.conflictedEffects.push(effect);
            }
            else {
              r.score += this.getEffectValue(effect);
              r.usedEffects.push(effect);
            }
          }
        }
        return r;
      }.bind(this);

      let scoreTableChr = [];
      for (const chr of this.mainChrs) {
        if (!this.filterMatchMainChr(chr))
          continue;

        ctx.reset();
        let skillScore = [];

        const addSkill = function (score) {
          skillScore.push(score);
          for (const effect of score.usedEffects) {
            if (effect.slotIndex) {
              ctx.usedSlots.set(effect.slotIndex, true);
            }
          }
          ctx.usedEffects = ctx.usedEffects.concat(score.usedEffects);
          ctx.conflictedEffects = ctx.conflictedEffects.concat(score.conflictedEffects);
          if (score.skill.isActive && !score.skill.multiAction)
            ++ctx.activeCount;
        };

        addSkill(getSkillScore(chr, chr.talent));
        let skills = [...chr.skills];
        for (let si = 0; si < 3; ++si) {
          // スキルを選ぶ度に他のスキルのスコアが変動しうるので、再評価が必要
          let tmp = skills.map(skill => getSkillScore(chr, skill));
          tmp = tmp.sort((a, b) => b.score - a.score).sort((a, b) => b.prioritized - a.prioritized);
          addSkill(tmp[0]);
          skills.splice(skills.indexOf(tmp[0].skill), 1);
        }
        skillScore = skillScore.filter(a => a.score > 0 || a.prioritized);

        let score = {
          name: chr.name,
          score: 0,
          main: {
            character: chr,
            usedEffects: ctx.usedEffects,
            conflictedEffects: ctx.conflictedEffects,
            skills: skillScore.map(ss => ss.skill),
          }
        };
        score.score = skillScore.reduce((total, current) => total + current.score, 0);
        scoreTableChr.push(score);
      }

      const compare = this.sortModes[opt.sortMode].compare;
      return scoreTableChr.filter(a => a.score > 0).sort(compare).slice(0, opt.maxPickup);
    },

    beginSearch() {
      if (!this.progress.completed) {
        this.pending = true;
        return false;
      }

      this.progress.completed = false;
      const body = function () {
        this.progress.result = this.doSearch(this.options.maxPickup.value);
        this.progress.completed = true;
      }.bind(this);
      setTimeout(body, 300);
      return true;
    },

    updateQuery() {
      this.beginSearch();
    },

    onCopyUrl() {
      const url = this.getParamsUrl();
      this.copyToClipboard(url);
      this.toast(`コピーしました`);
    },


    enableBuf(label) {
      for (let e of this.buffs) {
        if (e.label == label) {
          e.enabled = true;
          break;
        }
      }
    },
    enableDebuf(label) {
      for (let e of this.debuffs) {
        if (e.label == label) {
          e.enabled = true;
          break;
        }
      }
    },

    presetAll() {
      for (let e of this.buffs) {
        e.enabled = true;
      }
      for (let e of this.debuffs) {
        e.enabled = true;
      }
    },
    presetPAtk() {
      for (const l of ["アタック", "クリティカルダメージ倍率", "与ダメージ", "与ダメージ(物理)", "与ダメージ(スキル)", "与ダメージ(範囲スキル)", "与ダメージ(通常攻撃)"]) {
        this.enableBuf(l);
      }
      for (const l of ["ダメージ耐性", "ダメージ耐性(物理)"]) {
        this.enableDebuf(l);
      }
    },
    presetMAtk() {
      for (const l of ["マジック", "クリティカルダメージ倍率", "与ダメージ", "与ダメージ(魔法)", "与ダメージ(スキル)", "与ダメージ(範囲スキル)"]) {
        this.enableBuf(l);
      }
      for (const l of ["ダメージ耐性", "ダメージ耐性(魔法)"]) {
        this.enableDebuf(l);
      }
    },
    presetPDef() {
      for (const l of ["ディフェンス", "ダメージ耐性", "ダメージ耐性(物理)", "最大HP"]) {
        this.enableBuf(l);
      }
      for (const l of ["アタック", "与ダメージ"]) {
        this.enableDebuf(l);
      }
    },
    presetMDef() {
      for (const l of ["レジスト", "ダメージ耐性", "ダメージ耐性(魔法)", "最大HP"]) {
        this.enableBuf(l);
      }
      for (const l of ["マジック", "与ダメージ"]) {
        this.enableDebuf(l);
      }
    },
  },
};
</script>

<style scoped src="./lookup.css">
</style>
