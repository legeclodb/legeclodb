<template>
  <div class="panel" style="padding: 10px 0px 0px 0px;">
    <b-container v-if="!embed">
      <b-row>
        <b-col style="text-align:center">
          <h5 style="margin-bottom: 5px">ステータスシミュレータ</h5>
        </b-col>
      </b-row>
    </b-container>

    <b-tabs v-model="tabIndex">
      <b-tab title="メインキャラ" style="padding: 10px 10px 10px 10px" ref="tabMainChr">
        <div class="flex">
          <div>
            <b-container>
              <div style="text-align:center">
                <h6 style="margin: 5px 0px">基本情報</h6>
              </div>
              <b-form-row v-for="(param, name, i) in main" :key="i">
                <b-col style="text-align: right; margin: auto 0 auto 0;" align-self="end">
                  <label :for="`stat-main-${name}`" style="width: 8em">{{param.label}}</label>
                </b-col>
                <b-col>
                  <b-form-input v-if="param.type == 'number'" style="width: 5em" :id="`ss${uid}-main-${name}`" v-model.number="param.value" size="sm" type="number" class="input-param" :min="param.min" :max="param.max"></b-form-input>
                  <b-form-checkbox v-if="param.type == 'bool'" style="width: 5em" :id="`ss${uid}-main-${name}`" v-model="param.value" size="sm" plain></b-form-checkbox>
                  <b-button v-if="param.type == 'character'" variant="outline-secondary" class="paddingless small-margin" :id="`ss${uid}-main-${name}`">
                    <b-img-lazy :src="getSkillIcon(param.value)" :title="descToTitle(param.value)" width="100" height="100" />
                    <ChrSelector :target="`ss${uid}-main-${name}`" :chrs="mainChrs" :nullable="embed ? true : false" classfilter symbolfilter closeonclick @click="setMainChr" />
                  </b-button>
                </b-col>
              </b-form-row>

            </b-container>
          </div>
          <div>
            <b-container>
              <div style="text-align:center">
                <h6 style="margin: 5px 0px">記憶の書＋強化ボード</h6>
              </div>
              <b-form-row v-for="(param, name, i) in mainBoosts" :key="i">
                <b-col style="text-align: right" align-self="end">
                  <label style="width: 9em" :for="`ss${uid}-main-${name}`">{{param.label}}</label>
                </b-col>
                <b-col>
                  <b-form-input v-if="param.type == 'number'" style="width: 4em" :id="`ss${uid}-main-${name}`" v-model.number="param.value" size="sm" type="number" class="input-param" :min="param.min" :max="param.max"></b-form-input>
                </b-col>
              </b-form-row>
            </b-container>
          </div>
          <div ref="mainSkillField">
            <b-container>
              <div>
                <div style="text-align:center">
                  <h6 style="margin: 5px 0px">スキル</h6>
                </div>
                <b-form-row>
                  <b-col style="text-align: center">
                    <b-button v-for="(skill, si) in mainSkills" :key="si" :id="`ss${uid}-main-skill${si}`" variant="outline-secondary" class="paddingless small-margin"
                              draggable @dragstart="onSkillDrag(si)" @drop="onSkillDrop(si)" @dragover.prevent="dummyHandler()">
                      <b-img-lazy :src="getSkillIcon(skill)" :title="descToTitle(skill)" width="50" height="50" />
                      <SkillSelector :target="`ss${uid}-main-skill${si}`" nullable closeonclick
                                     :skills="mainSkillList" :excludes="mainSkills" @click="setArrayElement(mainSkills, si, $event)" />
                    </b-button>
                  </b-col>
                </b-form-row>
              </div>

              <div style="text-align:center">
                <h6 style="margin: 5px 0px">装備</h6>
              </div>
              <b-row>
                <b-col style="text-align:center">
                  <span v-for="(item, i) in mainItems" :key="i">
                    <b-button variant="outline-secondary" class="paddingless small-margin" :id="`ss${uid}-main-item${i}`">
                      <b-img-lazy :src="getSkillIcon(item)" :title="descToTitle(item)" width="50" height="50" />
                      <ItemSelector :target="`ss${uid}-main-item${i}`" :items="items" @click="setArrayElement(mainItems, i, $event)"
                                    :slotfilter="mainItemSlots[i]" :classfilter="mainClass" nullable closeonclick />
                    </b-button>
                  </span>
                </b-col>
              </b-row>

              <div style="text-align:center">
                <h6 style="margin: 5px 0px">エンチャント</h6>
              </div>
              <b-form-row>
                <b-col style="text-align: center">
                  <span v-for="(item, i) in mainEnchantPassive" :key="i">
                    <b-button variant="outline-secondary" class="paddingless small-margin" :id="`ss${uid}-main-enchant${i}`">
                      <b-img-lazy :src="getSkillIcon(item)" :title="descToTitle(item)" width="50" height="50" />
                      <SkillSelector :target="`ss${uid}-main-enchant${i}`" nullable closeonclick
                                     :skills="getEnchantPassiveList()" @click="setArrayElement(mainEnchantPassive, i, $event)" />
                    </b-button>
                  </span>
                </b-col>
              </b-form-row>
              <b-form-row v-for="(param, name, i) in mainEnchants" :key="'enchant' + i">
                <b-col style="text-align: right" align-self="end">
                  <label style="width: 10em" :for="`ss${uid}-main-enchant-${name}P`">{{param.label}} (%)</label>
                </b-col>
                <b-col>
                  <b-form-input style="width: 4em" :id="`ss${uid}-main-enchant-${name}P`" v-model.number="param.valueP" size="sm" type="number" class="input-param" :min="0"></b-form-input>
                </b-col>
                <b-col style="text-align: right" align-self="end">
                  <label style="width: 4em" :for="`ss${uid}-main-enchant-${name}F`"> (固定値)</label>
                </b-col>
                <b-col>
                  <b-form-input style="width: 4em" :id="`ss${uid}-main-enchant-${name}F`" v-model.number="param.valueF" size="sm" type="number" class="input-param" :min="0"></b-form-input>
                </b-col>
              </b-form-row>
            </b-container>
          </div>
        </div>
        <div>
          <div v-if="main.character.value" class="status flex">
            <div class="param-box"><b-img-lazy :src="getImageURL('HP')" title="HP" width="18" height="18" /><span>{{statMainResult[0]}}</span></div>
            <div class="param-box"><b-img-lazy :src="getImageURL('アタック')" title="アタック" width="18" height="18" /><span>{{statMainResult[1]}}</span></div>
            <div class="param-box"><b-img-lazy :src="getImageURL('ディフェンス')" title="ディフェンス" width="18" height="18" /><span>{{statMainResult[2]}}</span></div>
            <div class="param-box"><b-img-lazy :src="getImageURL('マジック')" title="マジック" width="18" height="18" /><span>{{statMainResult[3]}}</span></div>
            <div class="param-box"><b-img-lazy :src="getImageURL('レジスト')" title="レジスト" width="18" height="18" /><span>{{statMainResult[4]}}</span></div>
            <div class="param-box"><b-img-lazy :src="getImageURL('テクニック')" title="テクニック" width="18" height="18" /><span>{{statMainResult[5]}}</span></div>
            <div class="param-box"><span class="param-name">戦闘力:</span><span class="param-value">{{statMainResult[6]}}</span></div>
            <div class="param-box" v-if="statMainResult[7]"><span class="param-name">サポート込み戦闘力:</span><span class="param-value">{{statMainResult[7]}}</span></div>
          </div>
        </div>
      </b-tab>
      <b-tab title="サポートキャラ" style="padding: 10px 10px 10px 10px;" ref="tabSupportChr">
        <div class="flex">
          <div>
            <b-container>
              <div style="text-align:center">
                <h6 style="margin: 5px 0px">基本情報</h6>
              </div>
              <b-form-row v-for="(param, name, i) in support" :key="i">
                <b-col style="text-align: right; margin: auto 0 auto 0;" align-self="end">
                  <label style="width: 8em" :for="`ss${uid}-sup-${name}`">{{param.label}}</label>
                </b-col>
                <b-col>
                  <b-form-input v-if="param.type == 'number'" style="width: 5em" :id="`ss${uid}-sup-${name}`" v-model.number="param.value" size="sm" type="number" class="input-param" :min="param.min" :max="param.max"></b-form-input>
                  <b-form-checkbox v-if="param.type == 'bool'" style="width: 5em" :id="`ss${uid}-sup-${name}`" v-model="param.value" size="sm" plain></b-form-checkbox>
                  <b-button v-if="param.type == 'character'" variant="outline-secondary" class="paddingless small-margin" :id="`ss${uid}-sup-${name}`">
                    <b-img-lazy :src="getSkillIcon(param.value)" :title="descToTitle(param.value)" width="100" height="100" />
                    <ChrSelector v-if="main.character.value" :target="`ss${uid}-sup-${name}`" :chrs="supChrs" nullable classfilter closeonclick @click="setSupChr($event)" />
                  </b-button>
                </b-col>
              </b-form-row>
            </b-container>
          </div>
          <div>
            <b-container>
              <div style="text-align:center">
                <h6 style="margin: 5px 0px">記憶の書＋強化ボード</h6>
              </div>
              <b-form-row v-for="(param, name, i) in supportBoosts" :key="i">
                <b-col style="text-align: right" align-self="end">
                  <label style="width: 9em" :for="`ss${uid}-sup-${name}`">{{param.label}}</label>
                </b-col>
                <b-col>
                  <b-form-input v-if="param.type == 'number'" style="width: 4em" :id="`ss${uid}-sup-${name}`" v-model.number="param.value" size="sm" type="number" class="input-param" :min="param.min" :max="param.max"></b-form-input>
                </b-col>
              </b-form-row>
            </b-container>
          </div>
          <div ref="supportSkillField">
            <b-container>
              <div style="text-align:center">
                <h6 style="margin: 5px 0px">装備</h6>
              </div>
              <b-row>
                <b-col style="text-align:center">
                  <span v-for="(item, i) in supportItems" :key="i">
                    <b-button variant="outline-secondary" class="paddingless small-margin" :id="`ss${uid}-sup-item${i}`">
                      <b-img-lazy :src="getSkillIcon(item)" :title="descToTitle(item)" width="50" height="50" />
                      <ItemSelector :target="`ss${uid}-sup-item${i}`" :items="items" @click="setArrayElement(supportItems, i, $event)"
                                    :slotfilter="supItemSlots[i]" nullable closeonclick />
                    </b-button>
                  </span>
                </b-col>
              </b-row>

              <div style="text-align:center">
                <h6 style="margin: 5px 0px">アミュレットスキル</h6>
              </div>
              <b-form-row>
                <b-col style="text-align: center">
                  <span v-for="(item, i) in supportAmuletSkills" :key="i">
                    <b-button variant="outline-secondary" class="paddingless small-margin" :id="`ss${uid}-support-amskill${i}`">
                      <b-img-lazy :src="getSkillIcon(item)" :title="descToTitle(item)" width="50" height="50" />
                      <SkillSelector :target="`ss${uid}-support-amskill${i}`" nullable closeonclick
                                     :skills="getAmuletSkillList(i)" @click="setArrayElement(supportAmuletSkills, i, $event)" />
                    </b-button>
                  </span>
                </b-col>
              </b-form-row>
              <b-form-row v-for="(param, name, i) in supportEnchants" :key="'enchant' + i">
                <b-col style="text-align: right" align-self="end">
                  <label style="width: 10em" :for="`ss${uid}-sup-enchant-${name}P`">{{param.label}} (%)</label>
                </b-col>
                <b-col>
                  <b-form-input style="width: 4em" :id="`ss${uid}-sup-enchant-${name}P`" v-model.number="param.valueP" size="sm" type="number" class="input-param" :min="0" step="0.5"></b-form-input>
                </b-col>
              </b-form-row>
            </b-container>
          </div>
        </div>
        <div>
          <div v-if="support.character.value" class="status flex">
            <div class="param-box"><b-img-lazy :src="getImageURL('HP')" title="HP" width="18" height="18" /><span>{{statSupportResult[0]}}</span></div>
            <div class="param-box" v-if="support.character.value.damageType=='アタック'"><b-img-lazy :src="getImageURL('アタック')" title="アタック" width="18" height="18" /><span>{{statSupportResult[1]}}</span></div>
            <div class="param-box" v-if="support.character.value.damageType=='マジック'"><b-img-lazy :src="getImageURL('マジック')" title="マジック" width="18" height="18" /><span>{{statSupportResult[3]}}</span></div>
            <div class="param-box"><b-img-lazy :src="getImageURL('ディフェンス')" title="ディフェンス" width="18" height="18" /><span>{{statSupportResult[2]}}</span></div>
            <div class="param-box"><b-img-lazy :src="getImageURL('レジスト')" title="レジスト" width="18" height="18" /><span>{{statSupportResult[4]}}</span></div>
            <div class="param-box"><span class="param-name">戦闘力:</span><span class="param-value">{{statSupportResult[6]}}</span></div>
          </div>
        </div>
      </b-tab>
    </b-tabs>
    <div style="padding: 0px 10px 10px 10px">
      <div class="flex">
        <b-dropdown text="自動装備＆エンチャント" size="sm">
          <b-dropdown-item class="d-flex flex-column" v-for="(c, i) in autoEquipTypes" :key="i" @click="autoEquip(i)">
            {{ c }}
          </b-dropdown-item>
        </b-dropdown>
        <template v-if="!embed">
          <b-button size="sm" @click="onCopyUrl()" style="margin-left: 0.5em;">
            パラメータを URL としてコピー
          </b-button>
        </template>
      </div>
      <div v-if="!embed">
        <div class="flex" style="margin: 10px 0 5px 0;">
          <b-button size="sm" @click="highscoreSearch()">このレベルで戦闘力が高い組み合わせを探す</b-button>
          <b-form-checkbox v-model="hssCharOnce" style="margin-left: 1.0em;">一度出たキャラを除外</b-form-checkbox>
        </div>
        <b-table v-if="highscoreData.length" small outlined sticky-header :items="highscoreData" :fields="highscoreFields">
          <template #cell(actions)="row">
            <b-button size="sm" @click="highscoreReplay(row.item)" style="padding: 1px 10px">
              再現
            </b-button>
          </template>
        </b-table>
      </div>
    </div>
  </div>
</template>

<script>
import ChrSelector from '../parts/ChrSelector.vue'
import ItemSelector from '../parts/ItemSelector.vue'
import SkillSelector from '../parts/SkillSelector.vue'
import commonjs from "../common.js";
import lookupjs from "./lookup.js";

export default {
  name: 'StatusSimulator',
  components: {
    ChrSelector,
    ItemSelector,
    SkillSelector,
  },
  props: {
    embed: {
      type: Boolean,
      default: false,
    },
    data: {
      type: Array,
      default: () => [],
    },
  },
  mixins: [commonjs, lookupjs],

  data() {
    return {
      uid: this.$genUniqueId(),

      mainItemSlots: ["武器", "鎧", "兜", "アクセサリ"],
      supItemSlots: ["月のアミュレット", "太陽のアミュレット"],

      main: {
        character: {
          label: "キャラ",
          type: "character",
          value: null,
        },
        star: {
          label: "⭐",
          type: "number",
          min: 1,
          max: 6,
          value: 6,
        },
        level: {
          label: "レベル",
          type: "number",
          min: 1,
          value: 114,
        },
        master: {
          label: "マスターレベル",
          type: "number",
          min: 0,
          max: 3,
          value: 3,
        },
        loveBonus: {
          label: "好感度ボーナス",
          type: "bool",
          value: true,
        },
        engage: {
          label: "エンゲージ",
          type: "bool",
          value: true,
        },
      },
      mainBoosts: {
        hp: {
          label: "HP (%)",
          type: "number",
          min: 0,
          value: 150,
        },
        atk: {
          label: "アタック (%)",
          type: "number",
          min: 0,
          value: 140,
        },
        def: {
          label: "ディフェンス (%)",
          type: "number",
          min: 0,
          value: 130,
        },
        mag: {
          label: "マジック (%)",
          type: "number",
          min: 0,
          value: 140,
        },
        res: {
          label: "レジスト (%)",
          type: "number",
          min: 0,
          value: 130,
        },
        tec: {
          label: "テクニック (%)",
          type: "number",
          min: 0,
          value: 50,
        },
      },
      mainEnchants: {
        hp: {
          label: "HP",
          valueP: 0,
          valueF: 0,
        },
        atk: {
          label: "アタック",
          valueP: 0,
          valueF: 0,
        },
        def: {
          label: "ディフェンス",
          valueP: 0,
          valueF: 0,
        },
        mag: {
          label: "マジック",
          valueP: 0,
          valueF: 0,
        },
        res: {
          label: "レジスト",
          valueP: 0,
          valueF: 0,
        },
      },
      mainSkills: [null, null, null],
      mainItems: [null, null, null, null],
      mainEnchantPassive: [null],

      support: {
        character: {
          label: "キャラ",
          type: "character",
          value: null,
        },
        star: {
          label: "⭐",
          type: "number",
          min: 1,
          max: 6,
          value: 6,
        },
        level: {
          label: "レベル",
          type: "number",
          min: 1,
          value: 114,
        },
        master: {
          label: "マスターレベル",
          type: "number",
          min: 0,
          max: 3,
          value: 3,
        },
        loveBonus: {
          label: "好感度ボーナス",
          type: "bool",
          value: true,
        },
      },
      supportBoosts: {
        hp: {
          label: "HP (%)",
          type: "number",
          min: 0,
          value: 110,
        },
        atk: {
          label: "アタック (%)",
          type: "number",
          min: 0,
          value: 120,
        },
        def: {
          label: "ディフェンス (%)",
          type: "number",
          min: 0,
          value: 110,
        },
        mag: {
          label: "マジック (%)",
          type: "number",
          min: 0,
          value: 120,
        },
        res: {
          label: "レジスト (%)",
          type: "number",
          min: 0,
          value: 110,
        },
      },
      supportEnchants: {
        hp: {
          label: "HP",
          valueP: 0,
          valueF: 0,
        },
        atk: {
          label: "アタック",
          valueP: 0,
          valueF: 0,
        },
        def: {
          label: "ディフェンス",
          valueP: 0,
          valueF: 0,
        },
        mag: {
          label: "マジック",
          valueP: 0,
          valueF: 0,
        },
        res: {
          label: "レジスト",
          valueP: 0,
          valueF: 0,
        },
      },
      supportItems: [null, null],
      supportAmuletSkills: [null, null],

      autoEquipTypes: [
        "戦闘力優先",
        "ダメージ優先",
        "デバフ優先",
        "攻撃力優先",
        "HP 優先",
        "ディフェンス優先",
        "レジスト優先",
        "リセット",
      ],
      AutoEquipType: {
        BattlePower: 0,
        Damage: 1,
        Debuf: 2,
        AttackPower: 3,
        HP: 4,
        Def: 5,
        Res: 6,
        Reset: 7,
      },

      tabIndex: 0,
      highscoreData: [],
      highscoreFields: [
        {
          key: "index",
          label: "順位",
        },
        {
          key: "bp",
          label: "戦闘力",
        },
        {
          key: "main",
          label: "メイン",
        },
        {
          key: "support",
          label: "サポート",
        },
        {
          key: "actions",
          label: "アクション",
        }
      ],
      hssCharOnce: false,

      prevMainEngage: true,
      draggingSkillIdx: -1,
    };
  },

  created() {
    this.setupDB();
    this.deserialize(structuredClone(this.data));
    if (!this.embed) {
      this.setMainChr(this.mainChrs[0]);
      this.parseParamsUrl(window.location.href);
    }
  },
  
  mounted() {
    this.$nextTick(() => {
      // サポートのタブも同じサイズにしておく
      // (そうしないと popover 内で使う際タブを切り替えると移動が起きるため)
      this.$refs.tabSupportChr.$el.style.minHeight = `${this.$refs.tabMainChr.$el.clientHeight}px`;
      this.$refs.tabSupportChr.$el.style.minWidth = `${this.$refs.tabMainChr.$el.clientWidth}px`;

      this.$refs.supportSkillField.style.minWidth = `${this.$refs.mainSkillField.clientWidth}px`;
    });
  },

  methods: {
    setMainChr(chr) {
      this.main.character.value = chr;
      if (!chr) {
        this.support.character.value = null;
      }
      this.validateItems();

      for (let k in this.mainEnchants) {
        let params = this.mainEnchants[k];
        params.valueP = 0;
        params.valueF = 0;
        if (chr && chr.damageType == params.label) {
          params.valueP = 35;
        }
      }
      this.autoMainSkill();
      this.autoEquip(this.embed ? 1 : 0);
    },
    updateItemScore() {
      let dmgTypes = [];
      let debufTypes = [];

      const chr = this.main.character.value;
      if (chr) {
        if (chr.damageType == "アタック") {
          dmgTypes = ["アタック", "与ダメージ", "与ダメージ(物理)", "クリティカルダメージ倍率"];
          debufTypes = ["ダメージ耐性", "ダメージ耐性(物理)"];
        }
        else {
          dmgTypes = ["マジック", "与ダメージ", "与ダメージ(魔法)", "クリティカルダメージ倍率"];
          debufTypes = ["ダメージ耐性", "ダメージ耐性(魔法)"];
        }

        // 攻撃スキルがセットされていたら 与ダメージ(スキル) を考慮
        let isAttackSkillSet = false;
        for (const skill of this.mainSkills) {
          if (skill && skill.isActive && skill.damageRate) {
            isAttackSkillSet = true;
            dmgTypes.push("与ダメージ(スキル)");
            break;
          }
        }

        // アサシン、2回攻撃持ち、攻撃スキルなしの場合 与ダメージ(通常攻撃) を考慮
        if (chr.class == "アサシン" || chr.talent?.doubleAttack || !isAttackSkillSet) {
          dmgTypes.push("与ダメージ(通常攻撃)");
        }
      }

      const condMatch = (effect) => {
        if (effect.condition) {
          if (effect.value > 0 && effect.condition.turn) {
            // ターン経過が必要なバフは除外
            // (マイナス効果は考慮)
            return false;
          }

          // 近接攻撃時/遠距離攻撃時バフを考慮
          if (effect.condition.onCloseCombat && chr.range > 1) {
            return false;
          }
          if (effect.condition.onRangedCombat && chr.range == 1) {
            return false;
          }

          if (effect.condition.onClass) {
            // 特定クラスに対してのみ有効な効果を考慮
            if (!effect.condition.onClass.includes(chr?.class)) {
              return false;
            }
          }
        }
        return true;
      };

      for (let item of this.items) {
        let dmgEffects = new Array(this.effectTypes.length);
        let debufEffects = new Array(this.effectTypes.length);
        for (let effect of (item.buff ?? [])) {
          if (dmgTypes.includes(effect.type) && condMatch(effect)) {
            dmgEffects[effect.typeId] = effect.value; // += ではなく = 、ブループラネット等対策。
          }
        }
        for (let effect of (item.debuff ?? [])) {
          if (debufTypes.includes(effect.type)) {
            debufEffects[effect.typeId] = effect.value;
          }
        }
        item.dmgScore = dmgEffects.reduce((t, v) => v ? t + v : t, 0);
        item.debufScore = debufEffects.reduce((t, v) => v ? t + v : t, 0);
      }
    },

    autoMainSkill() {
      this.mainSkills = this.autoMainSkillImpl(this.main.character.value);
    },
    autoMainSkillImpl(chr) {
      if (!chr) {
        return [null, null, null];
      }
      if (chr.engage) {
        chr.engage.enabled = this.main.engage.value;
      }
      let skills = [...chr.skills];
      skills = skills.sort((a, b) => this.getSkillBPRate(b) - this.getSkillBPRate(a));
      return skills.slice(0, 3);
    },
    setSupChr(chr) {
      this.support.character.value = chr;

      for (let k in this.supportEnchants) {
        let params = this.supportEnchants[k];
        params.valueP = 0;
        params.valueF = 0;
        if (chr && chr.damageType == params.label) {
          params.valueP = 15;
        }
      }
      this.autoEquip(this.embed ? 1 : 0);
    },

    getParamClass(param) {
      return param.disabled() ? "disabled" : "";
    },

    findItem(name) {
      const r = this.searchTableWithName.get(name);
      if (!r)
        console.log(`${name} not found`);
      return r;
    },

    getSkillIcon(skill) {
      return this.getImageURL(skill ? skill.icon : null);
    },
    getSkillBPRate(skill) {
      let score = 0;
      if (skill) {
        score += skill.cost * 0.03;
        if (skill.isEngageSkill)
          score += 0.05;
      }
      return score;
    },

    matchClass(item, chr) {
      if (item && chr) {
        if (!item.classes || item.classes.includes(chr.class))
          return true;
      }
      return false;
    },
    mainCanEquip(item, slot = null) {
      if (this.matchClass(item, this.main.character.value)) {
        if (!slot || item.slot == slot)
          return true;
      }
      return false;
    },
    supportCanEquip(item, slot) {
      if (item) {
        if (!slot || item.slot == slot)
          return true;
      }
      return false;
    },

    validateItems() {
      let mainItems = this.mainItems;
      for (let i = 0; i < mainItems.length; ++i) {
        if (!this.mainCanEquip(mainItems[i], this.mainItemSlots[i]))
          mainItems[i] = null;
      }

      var supItems = this.supportItems;
      for (let i = 0; i < supItems.length; ++i) {
        if (!this.supportCanEquip(supItems[i], this.supItemSlots[i]))
          supItems[i] = null;
      }
    },

    autoEquipImpl(ma, sa, type) {
      let result = {
        main: {
          items: [null, null, null, null],
          enchants: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          enchantPassive: [null],
        },
        support: {
          items: [null, null],
          enchants: [0, 0, 0, 0, 0],
          amuletSkills: [null, null],
        },
      };

      this.updateItemScore();
      const mapi = ma.character ? ma.character.damageType == "アタック" ? 1 : 3 : 0;
      const sapi = sa.character ? sa.character.damageType == "アタック" ? 1 : 3 : 0;
      const symbol = ma.character?.symbol;
      const tec = ma.status[5];
      let ap = Math.round(ma.status[mapi] * 1.35);
      if (sa.character) {
        ap += sa.status[sapi];
      }
      //console.log(`ap: ${ap}`);

      const getHp = item => item.status[0];
      const getDef = item => item.status[2];
      const getRes = item => item.status[4];
      const getAPMain = item => item.status[mapi];
      const getAPSup = item => item.status[sapi];
      const getDmg = item => item.dmgScore;
      const getDebuf = item => item.debufScore;

      const enAPMain = mapi == 1 ?
        c => c.name.match(/^atk/) :
        c => c.name.match(/^mag/);
      const enAPSup = sapi == 1 ?
        c => c.name.match(/^atk/) :
        c => c.name.match(/^mag/);

      const cmp = this.compare;
      const getItemBattlePower = (item, api) => this.getEstimatedItemBattlePower(item.status, api, ap, tec);
      const cmpPow = (a, b, api) => {
        const bpa = getItemBattlePower(a, api);
        const bpb = getItemBattlePower(b, api);
        if (bpa != bpb) {
          return cmp(bpa, bpb);
        }
        else {
          // 戦闘力が同じならデメリットなしを優先。
          // どちらもデメリット無しならダメージが出る方を優先。
          const na = !a.negativeEffects ? 1 : 0;
          const nb = !b.negativeEffects ? 1 : 0;
          return na != nb ? cmp(na, nb) : cmp(getDmg(a), getDmg(b));
        }
      };

      const pickItem = (items, filter, sortf) => {
        if (filter) {
          let filtered = items.filter(filter);
          if (filtered.length) {
            items = filtered;
          }
        }
        items.sort(sortf);
        return items[0];
      };

      const adjustSymbol = (item) => {
        const pattern = /^(ゼニス|オリジン|ナディア)/;
        if (item && item.name.match(pattern)) {
          let r = item.name.replace(pattern, symbol);
          return this.findItem(r);
        }
        return item;
      };

      const pickItemsMain = (filter = null, sortf = null) => {
        if (!ma.character)
          return;
        const cond = a => this.matchClass(a, ma.character);
        if (!sortf)
          sortf = (a, b) => cmpPow(a, b, mapi);
        let weapon = pickItem(this.weapons.filter(cond), filter, sortf);
        let armor = pickItem(this.armors.filter(cond), filter, sortf);
        let helmet = pickItem(this.helmets.filter(cond), filter, sortf);
        let accessory = pickItem(this.accessories.filter(cond), filter, sortf);
        armor = adjustSymbol(armor);
        helmet = adjustSymbol(helmet);
        accessory = adjustSymbol(accessory);
        result.main.items = [weapon, armor, helmet, accessory];
      };

      const pickItemsSupport = (filter = null) => {
        if (!sa.character)
          return;
        const sortf = (a, b) => cmpPow(a, b, sapi);
        let amulet1 = pickItem(this.amulets1, filter, sortf);
        let amulet2 = pickItem(this.amulets2, filter, sortf);
        result.support.items = [amulet1, amulet2];
      };

      const pickOptimalEnchants = (filterFunc = null, scoreBooster = null) => {
        if (!ma.character)
          return;
        const s = ma.status;
        let r = [0.05, 0, 2, 0, 2]; // score rate
        r[mapi] = 2 * (1.0 + tec * 0.0003);
        if (scoreBooster) {
          for (let i = 0; i < r.length; ++i)
            r[i] *= scoreBooster[i];
        }

        let dst = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        let cmdlists = [[], [], [], []];
        const cmd = (i, name, score, exec) => {
          cmdlists[i].push({
            name: name,
            score: score,
            exec: exec,
          });
        };
        const hpP = (i, v) => cmd(i, "hpP", s[0] * (v / 100) * r[0], () => dst[0] += v);
        const hpF = (i, v) => cmd(i, "hpF", v * r[0], () => dst[1] += v);
        const atkP = (i, v) => cmd(i, "atkP", s[1] * (v / 100) * r[1], () => dst[2] += v);
        const atkF = (i, v) => cmd(i, "atkF", v * r[1], () => dst[3] += v);
        const defP = (i, v) => cmd(i, "defP", s[2] * (v / 100) * r[2], () => dst[4] += v);
        const defF = (i, v) => cmd(i, "defF", v * r[2], () => dst[5] += v);
        const magP = (i, v) => cmd(i, "magP", s[3] * (v / 100) * r[3], () => dst[6] += v);
        const magF = (i, v) => cmd(i, "magF", v * r[3], () => dst[7] += v);
        const resP = (i, v) => cmd(i, "resP", s[4] * (v / 100) * r[4], () => dst[8] += v);
        const resF = (i, v) => cmd(i, "resF", v * r[4], () => dst[9] += v);

        const paramsP = [
          [10, 15, 5, 15, 5],
          [15, 5, 15, 5, 15],
          [15, 5, 15, 5, 15],
          [10, 10, 10, 10, 10],
        ];
        const paramsF = [
          [131, 31, 7, 31, 7],
          [200, 11, 19, 11, 19],
          [200, 11, 19, 11, 19],
          [131, 21, 13, 21, 13],
        ];
        for (let i = 0; i < paramsP.length; ++i) {
          hpP(i, paramsP[i][0]); hpF(i, paramsF[i][0]);
          atkP(i, paramsP[i][1]); atkF(i, paramsF[i][1]);
          defP(i, paramsP[i][2]); defF(i, paramsF[i][2]);
          magP(i, paramsP[i][3]); magF(i, paramsF[i][3]);
          resP(i, paramsP[i][4]); resF(i, paramsF[i][4]);
        }

        const len = cmdlists[0].length;
        if (filterFunc) {
          for (let i = 0; i < cmdlists.length; ++i) {
            const filtered = cmdlists[i].filter(filterFunc).slice(0, 3);
            for (let c of filtered)
              c.exec();
            cmdlists[i] = cmdlists[i].filter(a => !filtered.includes(a));
          }
        }
        for (let cl of cmdlists) {
          cl.sort((a, b) => cmp(a.score, b.score));
        }
        for (let cl of cmdlists) {
          let n = 3 - (len - cl.length);
          for (let i = 0; i < n; ++i)
            cl[i].exec();
        }
        result.main.enchants = dst;
      };

      const pickOptialAmuletSkills = (filterFunc = null, scoreBooster = null) => {
        if (!sa.character)
          return;
        const s = sa.status;
        let r = [0.05, 0, 2, 0, 2]; // score rate
        r[sapi] = 2 * (1.0 + tec * 0.0003); // リンク前提でテクニックも考慮
        if (scoreBooster) {
          for (let i = 0; i < r.length; ++i)
            r[i] *= scoreBooster[i];
        }

        let dst = [0, 0, 0, 0, 0];

        let cmdlists = [[], [], [], []];
        const cmd = (i, name, score, exec) => {
          cmdlists[i].push({ name: name, score: score, exec: exec });
        };
        const hpP = (i, v) => cmd(i, "hpP", s[0] * (v / 100) * r[0], () => dst[0] += v);
        const atkP = (i, v) => cmd(i, "atkP", s[1] * (v / 100) * r[1], () => dst[1] += v);
        const defP = (i, v) => cmd(i, "defP", s[2] * (v / 100) * r[2], () => dst[2] += v);
        const magP = (i, v) => cmd(i, "magP", s[3] * (v / 100) * r[3], () => dst[3] += v);
        const resP = (i, v) => cmd(i, "resP", s[4] * (v / 100) * r[4], () => dst[4] += v);

        const paramsP = [
          [7.5, 7.5, 7.5, 7.5, 7.5],
          [7.5, 7.5, 7.5, 7.5, 7.5],
        ];
        for (let i = 0; i < paramsP.length; ++i) {
          hpP(i, paramsP[i][0]);
          atkP(i, paramsP[i][1]);
          defP(i, paramsP[i][2]);
          magP(i, paramsP[i][3]);
          resP(i, paramsP[i][4]);
        }

        const len = cmdlists[0].length;
        if (filterFunc) {
          for (let i = 0; i < cmdlists.length; ++i) {
            const filtered = cmdlists[i].filter(filterFunc).slice(0, 3);
            for (let c of filtered)
              c.exec();
            cmdlists[i] = cmdlists[i].filter(a => !filtered.includes(a));
          }
        }
        for (let cl of cmdlists) {
          cl.sort((a, b) => cmp(a.score, b.score));
        }
        for (let cl of cmdlists) {
          let n = 1 - (len - cl.length);
          for (let i = 0; i < n; ++i)
            cl[i].exec();
        }
        result.support.enchants = dst;
      };


      let enchant = "バスター";

      const AutoEquipType = this.AutoEquipType;
      if (type == AutoEquipType.BattlePower) { // 戦闘力優先
        pickItemsMain();
        pickOptimalEnchants();
        pickItemsSupport();
        pickOptialAmuletSkills();
      }
      else if (type == AutoEquipType.Damage) { // ダメージ優先
        const sortf = (a, b) => {
          const sa = getDmg(a);
          const sb = getDmg(b);
          return sa != sb ? cmp(sa, sb) : cmpPow(a, b, mapi);
        };
        pickItemsMain(getAPMain, sortf);
        pickOptimalEnchants(enAPMain);
        pickItemsSupport(getAPSup);
        pickOptialAmuletSkills(enAPSup);
        enchant = "ストライク";

      }
      else if (type == AutoEquipType.Debuf) { // デバフ優先
        const sortf = (a, b) => {
          const sa = getDebuf(a);
          const sb = getDebuf(b);
          return sa != sb ? cmp(sa, sb) : cmpPow(a, b, mapi);
        };
        pickItemsMain(null, sortf);
        pickOptimalEnchants(enAPMain);
        pickItemsSupport(getAPSup);
        pickOptialAmuletSkills(enAPSup);
        enchant = "ストライク";
      }
      else if (type == AutoEquipType.AttackPower) { // 攻撃力優先
        pickItemsMain(getAPMain);
        pickOptimalEnchants(enAPMain);
        pickItemsSupport(getAPSup);
        pickOptialAmuletSkills(enAPSup);
      }
      else if (type == AutoEquipType.HP) { // HP 優先
        pickItemsMain(getHp);
        pickOptimalEnchants(c => c.name.match(/^hp/));
        pickItemsSupport(getHp);
        pickOptialAmuletSkills(c => c.name.match(/^hp/));
        enchant = "アイアン";
      }
      else if (type == AutoEquipType.Def) { // ディフェンス優先
        pickItemsMain(getDef);
        pickOptimalEnchants(c => c.name.match(/^def/));
        pickItemsSupport(getDef);
        pickOptialAmuletSkills(c => c.name.match(/^def/));
        enchant = "アイス";
      }
      else if (type == AutoEquipType.Res) { // レジスト優先
        pickItemsMain(getRes);
        pickOptimalEnchants(c => c.name.match(/^res/));
        pickItemsSupport(getRes);
        pickOptialAmuletSkills(c => c.name.match(/^res/));
        enchant = "アイス";
      }
      if (type != AutoEquipType.Reset && ma.character) {
        result.main.enchantPassive = [this.getEnchantPassive(enchant)];
      }

      if (ma.character && sa.character) {
        const find = (uid) => this.searchTableWithUid.get(uid);
        const mdt = ma.character.damageType;
        const sdt = sa.character.damageType;
        let list = [null, null];
        if (sdt == "アタック" && mdt == "アタック") {
          list[0] = find("x501");
        }
        else if (sdt == "アタック" && mdt == "マジック") {
          list[0] = find("x502");
        }
        else if (sdt == "マジック" && mdt == "アタック") {
          list[0] = find("x503");
        }
        else if (sdt == "マジック" && mdt == "マジック") {
          list[0] = find("x504");
        }
        list[1] = find("x602");
        result.support.amuletSkills = list;
      }

      return result;
    },

    autoEquip(type) {
      let msa = this.getStatMainArgs();
      msa.items = [];
      msa.enchantsP = [];
      msa.enchantsF = [];
      let ssa = this.getStatSupportArgs();

      const ma = {
        character: msa.character,
        status: this.calcStatMainImpl(msa, null, true),
      };
      const sa = {
        character: ssa.character,
        status: this.calcStatSupportImpl(ssa),
      };
      const r = this.autoEquipImpl(ma, sa, type);

      if (this.tabIndex == 0 || !ma.character) {
        for (const v of Object.values(this.mainEnchants)) {
          v.valueP = r.main.enchants.shift();
          v.valueF = r.main.enchants.shift();
        }
        this.mainItems = [...r.main.items];
        this.mainEnchantPassive = [...r.main.enchantPassive];
      }
      {
        for (const v of Object.values(this.supportEnchants))
          v.valueP = r.support.enchants.shift();
        this.supportItems = [...r.support.items];
        this.supportAmuletSkills = [...r.support.amuletSkills];
      }
    },

    highscoreSearch() {
      let msa = this.getStatMainArgs();
      let ssa = this.getStatSupportArgs();
      const powMain = (a) => this.getBattlePower(this.getMainChrStatus(a, msa.level, msa.star, msa.master, msa.loveBonus, msa.boosts));
      const powSup = (a) => this.getBattlePower(this.getSupportChrStatus(a, ssa.level, ssa.star, ssa.master, ssa.loveBonus, ssa.boosts));

      const maxChars = this.hssCharOnce ? 75 : 50;
      const mainChrs = [...this.mainChrs].sort((a, b) => this.compare(powMain(a), powMain(b))).slice(0, maxChars);
      const supChrs = [...this.supChrs].sort((a, b) => this.compare(powSup(a), powSup(b))).slice(0, maxChars);

      let results = [];

      const getPEnchants = (a) => {
        let r = [];
        for (let i = 0; i < a.length; ++i)
          if (i % 2 == 0)
            r.push(a[i]);
        return r;
      };
      const getFEnchants = (a) => {
        let r = [];
        for (let i = 0; i < a.length; ++i)
          if (i % 2 == 1)
            r.push(a[i]);
        return r;
      };

      for (const mchr of mainChrs) {
        for (const schr of supChrs) {
          msa.items = [];
          msa.enchantsP = [];
          msa.enchantsF = [];
          msa.skills = [];
          ssa.items = [];
          ssa.enchantsP = [];

          msa.character = mchr;
          ssa.character = schr;
          const r = this.autoEquipImpl({
            character: mchr,
            status: this.calcStatMainImpl(msa, null, true),
          }, {
            character: schr,
            status: this.calcStatSupportImpl(ssa),
          }, 0);

          msa.items = r.main.items;
          msa.enchantsP = getPEnchants(r.main.enchants);
          msa.enchantsF = getFEnchants(r.main.enchants);
          msa.enchantPassive = r.main.enchantPassive;
          r.main.skills = msa.skills = this.autoMainSkillImpl(mchr);

          ssa.items = r.support.items;
          ssa.enchantsP = r.support.enchants;
          const bp = this.calcStatMainImpl(msa, ssa)[7]

          results.push({
            bp: bp,
            main: mchr.name,
            support: schr.name,
            data: {
              main: mchr,
              support: schr,
              msa: msa,
              ssa: ssa,
              result: r,
            }
          });
        }
      }

      results = results.sort((a, b) => this.compare(a.bp, b.bp));
      if (this.hssCharOnce) {
        let filtered = [];
        let used = new Set();
        for (let e of results) {
          if (!used.has(e.data.main) && !used.has(e.data.support)) {
            filtered.push(e);
            used.add(e.data.main);
            used.add(e.data.support);
          }
        }
        results = filtered;
      }
      results = results.slice(0, 200);

      let usedChr = new Set();
      for (let i = 0; i < results.length; ++i) {
        let r = results[i];
        r.index = i + 1;
        r._cellVariants = {};
        if (!usedChr.has(r.main)) {
          usedChr.add(r.main);
          r._cellVariants.main = "primary";
        }
        if (!usedChr.has(r.support)) {
          usedChr.add(r.support);
          r._cellVariants.support = "warning";
        }
      }
      this.highscoreData = results;
    },

    highscoreReplay(rec) {
      let s = this;
      const msa = rec.data.msa;
      const ssa = rec.data.ssa;
      const r = rec.data.result;
      {
        s.main.character.value = rec.data.main;
        s.main.star.value = msa.star;
        s.main.level.value = msa.level;
        s.main.master.value = msa.master;
        s.main.loveBonus.value = msa.loveBonus;

        let boosts = [...msa.boosts];
        for (const v of Object.values(s.mainBoosts))
          v.value = boosts.shift();

        let enchants = [...r.main.enchants];
        for (const v of Object.values(s.mainEnchants)) {
          v.valueP = enchants.shift();
          v.valueF = enchants.shift();
        }

        s.mainItems = [...r.main.items];
        s.mainEnchantPassive = [...r.main.enchantPassive];
        s.mainSkills = [...r.main.skills];
      }
      {
        s.support.character.value = rec.data.support;
        s.support.star.value = ssa.star;
        s.support.level.value = ssa.level;
        s.support.master.value = ssa.master;
        s.support.loveBonus.value = ssa.loveBonus;

        let boosts = [...ssa.boosts];
        for (const v of Object.values(s.supportBoosts))
          v.value = boosts.shift();

        let enchants = [...r.support.enchants];
        for (const v of Object.values(s.supportEnchants)) {
          v.valueP = enchants.shift();
        }

        s.supportItems = [...r.support.items];
      }
    },

    getStatMainArgs() {
      const s = this;
      let r = {
        character: s.main.character.value,
        star: s.main.star.value,
        level: s.main.level.value,
        master: s.main.master.value,
        loveBonus: s.main.loveBonus.value,
        engage: s.main.engage.value,
        boosts: Object.values(s.mainBoosts).map(a => a.value),
        enchantsP: Object.values(s.mainEnchants).map(a => a.valueP),
        enchantsF: Object.values(s.mainEnchants).map(a => a.valueF),
        items: [...s.mainItems],
        enchantPassive: [...s.mainEnchantPassive],
        skills: [...s.mainSkills],
      };
      return r;
    },
    getStatSupportArgs() {
      const s = this;
      let r = {
        character: s.support.character.value,
        star: s.support.star.value,
        level: s.support.level.value,
        master: s.support.master.value,
        loveBonus: s.support.loveBonus.value,
        boosts: Object.values(s.supportBoosts).map(a => a.value),
        enchantsP: Object.values(s.supportEnchants).map(a => a.valueP),
        items: [...s.supportItems],
      };
      return r;
    },
    calcStatMainImpl(ma, sa, skipBP = false) {
      const empty = [0, 0, 0, 0, 0, 0];
      const chr = ma.character;
      if (!chr)
        return empty;

      let r = this.getMainChrStatus(chr, ma.level, ma.star, ma.master, ma.loveBonus, ma.boosts);

      let enchantP = [...ma.enchantsP];
      if (enchantP.length) {
        for (const eps of ma.enchantPassive) {
          if (!eps)
            continue;
          const ep = eps.baseStatusBoost;
          if (ep) {
            if (ep.hp) enchantP[0] += ep.hp;
            if (ep.atk) enchantP[1] += ep.atk;
            if (ep.def) enchantP[2] += ep.def;
            if (ep.mag) enchantP[3] += ep.mag;
            if (ep.res) enchantP[4] += ep.res;
            if (ep.tec) enchantP[5] += ep.tec;
          }
        }
      }

      for (let i = 0; i < enchantP.length; ++i) {
        r[i] = Math.round(r[i] * (1.0 + enchantP[i] * 0.01));
      }

      const items = ma.items.filter(a => a != null);
      for (const item of items) {
        for (let i = 0; i < r.length; ++i)
          r[i] += item.status[i];
      }
      for (let i = 0; i < ma.enchantsF.length; ++i)
        r[i] += ma.enchantsF[i];

      if (skipBP)
        return r;

      // 以下戦闘力
      let bpr = 1.0;
      bpr += 0.1 * ma.star;
      bpr += 0.1 * ma.master;
      for (let skill of ma.skills) {
        // スキルコスト & エンゲージスキルボーナス
        bpr += this.getSkillBPRate(skill);
      }
      bpr += 0.02 * (5 * items.length); // アイテムの☆合計
      if (items.length == 4)
        bpr += 0.1; // エンチャント4セット
      const bpMain = Math.round(this.getBattlePower(r) * bpr);
      const rMain = [...r, bpMain];
      if (!sa || !sa.character)
        return rMain;

      const sup = sa.character;
      bpr += 0.1 * sa.star;
      bpr += 0.1 * sa.master;
      bpr += 0.05 * 3; // スキル開放

      const sr = this.calcStatSupportImpl(sa);
      for (let i of [0, 2, 4])
        r[i] += sr[i];

      const mapi = chr.damageType == "アタック" ? 1 : 3;
      const sapi = sup.damageType == "アタック" ? 1 : 3;
      r[mapi] += sr[sapi];
      const bpTotal = Math.round(this.getBattlePower(r) * bpr);
      return [...rMain, bpTotal];
    },
    calcStatMain() {
      return this.calcStatMainImpl(this.getStatMainArgs(), this.getStatSupportArgs());
    },

    calcStatSupportImpl(sa) {
      const empty = [0, 0, 0, 0, 0, 0];
      const chr = sa.character;
      if (!chr)
        return empty;

      let r = this.getSupportChrStatus(chr, sa.level, sa.star, sa.master, sa.loveBonus, sa.boosts, sa.enchantsP);

      const items = sa.items.filter(a => a != null);
      for (const item of items) {
        for (let i = 0; i < r.length; ++i)
          r[i] += item.status[i];
      }

      // テクニック除去
      r[5] = 0;

      // 以下戦闘力
      let bpr = 1.0;
      bpr += 0.1 * sa.star;
      bpr += 0.1 * sa.master;
      bpr += 0.05 * 3; // スキル開放
      let bp = Math.round(this.getBattlePower(r) * bpr);

      return [...r, bp];
    },
    calcStatSupport() {
      return this.calcStatSupportImpl(this.getStatSupportArgs());
    },

    serialize() {
      let params = [];

      const getUid = obj => obj ? obj.uid : "none";

      for (let v of Object.values(this.main)) {
        if (v.type == "character")
          params.push(getUid(v.value));
        else
          params.push(v.value);
      }
      for (let v of Object.values(this.mainBoosts))
        params.push(v.value);
      for (let v of Object.values(this.mainEnchants)) {
        params.push(v.valueP);
        params.push(v.valueF);
      }
      for (let v of this.mainSkills)
        params.push(getUid(v));
      for (let v of this.mainItems)
        params.push(getUid(v));
      for (let v of this.mainEnchantPassive)
        params.push(getUid(v));

      for (let v of Object.values(this.support)) {
        if (v.type == "character")
          params.push(getUid(v.value));
        else
          params.push(v.value);
      }
      for (let v of Object.values(this.supportBoosts))
        params.push(v.value);
      for (let v of Object.values(this.supportEnchants))
        params.push(v.valueP);

      for (let v of this.supportItems)
        params.push(getUid(v));
      for (let v of this.supportAmuletSkills)
        params.push(getUid(v));

      return params;
    },
    deserialize(params) {
      if (!Array.isArray(params) || params.length == 0) {
        return;
      }
      //console.log(params);

      const find = uid => uid ? this.searchTableWithUid.get(uid.toString()) : null;

      for (let v of Object.values(this.main)) {
        if (v.type == "character")
          v.value = find(params.shift());
        else
          v.value = params.shift();
      }
      if (this.main.character.value?.engage) {
        this.main.character.value.engage.enabled = this.main.engage.value;
      }

      for (let v of Object.values(this.mainBoosts))
        v.value = params.shift();
      for (let v of Object.values(this.mainEnchants)) {
        v.valueP = params.shift();
        v.valueF = params.shift();
      }

      this.mainSkills = [
        find(params.shift()),
        find(params.shift()),
        find(params.shift()),
      ];
      this.mainItems = [
        find(params.shift()),
        find(params.shift()),
        find(params.shift()),
        find(params.shift()),
      ];
      this.mainEnchantPassive = [
        find(params.shift()),
      ];

      for (let v of Object.values(this.support)) {
        if (v.type == "character")
          v.value = find(params.shift());
        else
          v.value = params.shift();
      }
      for (let v of Object.values(this.supportBoosts))
        v.value = params.shift();
      for (let v of Object.values(this.supportEnchants))
        v.valueP = params.shift();

      this.supportItems = [
        find(params.shift()),
        find(params.shift()),
      ];
      this.supportAmuletSkills = [
        find(params.shift()),
        find(params.shift()),
      ];
    },

    getParamsUrl() {
      let params = this.serialize();
      let url = window.location.href.replace(/\?.+/, '').replace(/#.+/, '');
      url += "?stat=" + params.join(',') + "#status";
      //this.parseParamsUrl(url); // debug
      return url;
    },

    parseParamsUrl(url) {
      url = decodeURIComponent(url);
      let q = url.match(/\?stat=([^#]+)/);
      if (q) {
        let params = q[1].split(',').map(this.parseValue);
        this.deserialize(params);
        return true;
      }
      return false;
    },

    onChange() {
      if (this.embed) {
        if (!this.cooldown) {
          this.$emit('change', this);
          // 非常に美しくないが、連打を防ぐため少し間を置く
          this.cooldown = true;
          setTimeout(() => { this.cooldown = false }, 100);
        }
      }
      if (this.prevMainEngage != this.main.engage.value) {
        this.prevMainEngage = this.main.engage.value;
        this.autoMainSkill();
      }
    },

    onSkillDrag(idx) {
      this.draggingSkillIdx = idx;
    },
    onSkillDrop(idx) {
      if (this.draggingSkillIdx >= 0) {
        let tmp = [...this.mainSkills];
        tmp[this.draggingSkillIdx] = this.mainSkills[idx];
        tmp[idx] = this.mainSkills[this.draggingSkillIdx];
        this.mainSkills = tmp;
      }
      this.draggingSkillIdx = -1;
    },
    dummyHandler() {
    },

    onCopyUrl() {
      const url = this.getParamsUrl();
      this.copyToClipboard(url);
      this.toast(`コピーしました`);
    },
  },

  computed: {
    mainClass() {
      const chr = this.main.character.value;
      return chr ? chr.class : true;
    },
    mainSkillList() {
      return this.main.character.value?.skills ?? [];
    },

    statMainResult() {
      return this.calcStatMain();
    },
    statSupportResult() {
      return this.calcStatSupport();
    },
  },

  watch: {
    main: { handler: function () { this.onChange(); }, deep: true },
    mainBoosts: { handler: function () { this.onChange(); }, deep: true },
    mainItems: { handler: function () { this.onChange(); }, deep: true },
    mainEnchantPassive: { handler: function () { this.onChange(); }, deep: true },
    mainEnchants: { handler: function () { this.onChange(); }, deep: true },
    mainSkills: { handler: function () { this.onChange(); }, deep: true },
    support: { handler: function () { this.onChange(); }, deep: true },
    supportBoosts: { handler: function () { this.onChange(); }, deep: true },
    supportItems: { handler: function () { this.onChange(); }, deep: true },
    supportEnchants: { handler: function () { this.onChange(); }, deep: true },
    supportAmuletSkills: { handler: function () { this.onChange(); }, deep: true },
  },

};
</script>

<style>
.small-margin {
  margin: 3px;
}
</style>
