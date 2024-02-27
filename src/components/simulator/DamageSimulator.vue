<template>
  <div class="panel">
    <b-container>
      <b-row>
        <b-col style="text-align:center">
          <h5 style="margin-bottom: 10px">ダメージシミュレータ</h5>
        </b-col>
      </b-row>
    </b-container>
    <div class="flex">
      <div>
        <b-container>
          <b-form-row>
            <b-col style="text-align:center">
              <h6>攻撃側：メイン</h6>
            </b-col>
          </b-form-row>
          <b-form-row v-for="(param, name, index) in main" :key="index">
            <b-col style="text-align: right" align-self="end">
              <label style="width: 14em" :class="getParamClass(param)" :for="`dmg-main-${name}`">{{param.label}}</label>
            </b-col>
            <b-col>
              <b-form-input v-if="param.type == 'number'" style="width: 5em" :id="`dmg-main-${name}`" v-model.number="param.value"
                            size="sm" type="number" class="input-param" :min="param.min" :max="param.max" :disabled="param.disabled()"></b-form-input>
              <b-form-checkbox style="width: 5em" :id="`dmg-main-${name}`" v-model="param.value" size="sm"
                               :disabled="param.disabled()" plain v-if="param.type == 'bool'"></b-form-checkbox>
            </b-col>
          </b-form-row>
        </b-container>
      </div>
      <div>
        <b-container>
          <b-form-row>
            <b-col style="text-align:center">
              <h6>攻撃側：サポート <b-form-checkbox inline plain v-model="supportEnabled" /></h6>
            </b-col>
          </b-form-row>
          <b-form-row v-for="(param, name, index) in support" :key="index">
            <b-col style="text-align: right" align-self="end">
              <label style="width: 14em" :class="getParamClass(param)" :for="`dmg-support-${name}`">{{param.label}}</label>
            </b-col>
            <b-col>
              <b-form-input v-if="param.type == 'number'" style="width: 5em" :id="`dmg-support-${name}`" v-model.number="param.value"
                            size="sm" type="number" class="input-param" :min="param.min" :max="param.max" :disabled="param.disabled()"></b-form-input>
              <b-form-checkbox style="width: 5em" :id="`dmg-support-${name}`" v-model="param.value" size="sm" plain
                               :disabled="param.disabled()" v-if="param.type == 'bool'"></b-form-checkbox>
            </b-col>
          </b-form-row>
        </b-container>
      </div>
      <div>
        <b-container>
          <b-form-row>
            <b-col style="text-align: center">
              <h6>受け側</h6>
            </b-col>
          </b-form-row>
          <b-form-row v-for="(param, name, index) in attacked" :key="index">
            <b-col style="text-align:right" align-self="end">
              <label style="width: 11em" :class="getParamClass(param)" :for="`dmg-attacked-${name}`">{{param.label}}</label>
            </b-col>
            <b-col>
              <b-form-input v-if="param.type == 'number'" style="width: 5em" :id="`dmg-attacked-${name}`" v-model.number="param.value"
                            size="sm" type="number" class="input-param" :min="param.min" :max="param.max"></b-form-input>
            </b-col>
          </b-form-row>
        </b-container>
      </div>
    </div>
    <div>
      <b-container>
        <h5 style="margin-bottom: 10px">ダメージ: {{dmgResult}}</h5>
        <b-button @click="onCopyUrl()">パラメータを URL としてコピー</b-button>
      </b-container>
    </div>
  </div>
</template>

<script>
import common from "../common";

export default {
  name: 'DamageSimulator',
  props: {
  },
  mixins: [common],

  data() {
    return {
      mainEnabled: true,
      supportEnabled: true,
      main: {
        atk: {
          label: "攻撃力",
          type: "number",
          min: 0,
          value: 1000,
          disabled: () => !this.mainEnabled,
        },
        atkBuf: {
          label: "攻撃力バフ (%)",
          type: "number",
          min: -70,
          value: 0,
          disabled: () => !this.mainEnabled,
        },
        skillDamageRate: {
          label: "スキルダメージ倍率",
          type: "number",
          value: 1.0,
          disabled: () => !this.mainEnabled,
        },
        damageBuf: {
          label: "与ダメージバフ (%)",
          type: "number",
          min: -70,
          value: 0,
          disabled: () => !this.mainEnabled,
        },
        critical: {
          label: "クリティカル",
          type: "bool",
          value: true,
          disabled: () => !this.mainEnabled,
        },
        criticalDamageRate: {
          label: "クリティカルダメージ倍率 (%)",
          type: "number",
          value: 30,
          disabled: () => !this.mainEnabled || !this.main.critical.value,
        },
        doubleAttack: {
          label: "2回攻撃",
          type: "bool",
          value: false,
          disabled: () => !this.mainEnabled,
        },
        rangedPenalty: {
          label: "遠距離キャラの近接ペナルティ",
          type: "bool",
          value: false,
          disabled: () => !this.mainEnabled,
        },
      },
      support: {
        atk: {
          label: "攻撃力",
          type: "number",
          min: 0,
          value: 1000,
          disabled: () => !this.supportEnabled,
        },
        atkBuf: {
          label: "攻撃力バフ (%)",
          type: "number",
          min: -70,
          value: 0,
          disabled: () => !this.supportEnabled,
        },
        damageBuf: {
          label: "与ダメージバフ (%)",
          type: "number",
          min: -70,
          value: 0,
          disabled: () => !this.supportEnabled,
        },
        rangedPenalty: {
          label: "遠距離キャラの近接ペナルティ",
          type: "bool",
          value: false,
          disabled: () => !this.supportEnabled,
        },
      },
      attacked: {
        def: {
          label: "防御力",
          type: "number",
          value: 100,
          disabled: () => false,
        },
        defBuf: {
          label: "防御力バフ (%)",
          type: "number",
          min: -70,
          value: 0,
          disabled: () => false,
        },
        damageRate: {
          label: "ダメージ耐性 (%)",
          type: "number",
          max: 70,
          value: 0,
          disabled: () => false,
        },
        shield: {
          label: "シールド",
          type: "number",
          value: 0,
          disabled: () => false,
        },
      }
    };
  },

  created() {
    this.parseParamsUrl(window.location.href);
  },
  
  mounted() {
  },

  methods: {
    getParamClass(param) {
      return param.disabled() ? "disabled" : "";
    },

    calcDamage() {
      const attacked = this.attacked;
      const main = this.main;
      const support = this.support;

      const def = attacked.def.value * (1.0 + attacked.defBuf.value * 0.01);
      const damageResist = 1.0 - this.toNumber(attacked.damageRate.value) * 0.01;
      const shield = attacked.shield.value;

      let result = 0;
      if (this.mainEnabled) {
        const atk = main.atk.value * (1.0 + main.atkBuf.value * 0.01);
        const skillDamageRate = this.toNumber(main.skillDamageRate.value);
        const damageBuf = 1.0 + this.toNumber(main.damageBuf.value) * 0.01;
        const criticalDamageRate = 1.0 + this.toNumber(main.criticalDamageRate.value) * 0.01;

        let damage = (atk - def) * skillDamageRate * damageBuf * damageResist;
        if (main.critical.value)
          damage *= criticalDamageRate;
        if (main.rangedPenalty.value)
          damage *= 0.6;

        result += Math.max(Math.round(damage), 1) * (main.doubleAttack.value ? 20 : 10);
      }
      if (this.supportEnabled) {
        const atk = support.atk.value * (1.0 + support.atkBuf.value * 0.01);
        const damageBuf = 1.0 + this.toNumber(support.damageBuf.value) * 0.01;

        let damage = (atk - def) * damageBuf * damageResist;
        if (support.rangedPenalty.value)
          damage *= 0.6;

        result += Math.max(Math.round(damage), 1) * 10;
      }

      return Math.max(result - shield, 0);
    },

    getParamsUrl() {
      let params = [];

      for (const v of Object.values(this.main))
        params.push(v.value);

      params.push(this.supportEnabled);
      for (const v of Object.values(this.support))
        params.push(v.value);

      for (const v of Object.values(this.attacked))
        params.push(v.value);

      let url = window.location.href.replace(/\?.+/, '').replace(/#.+/, '');
      url += "?dmg=" + params.join(',') + "#damage";
      return url;
    },

    parseParamsUrl(url) {
      url = decodeURIComponent(url);
      let q = url.match(/\?dmg=([^#]+)/);
      if (q) {
        let params = q[1].split(',').map(this.parseValue);

        for (const v of Object.values(this.main))
          v.value = params.shift();

        this.supportEnabled = params.shift();
        for (const v of Object.values(this.support))
          v.value = params.shift();

        for (const v of Object.values(this.attacked))
          v.value = params.shift();

        return true;
      }
      return false;
    },

    onCopyUrl() {
      const url = this.getParamsUrl();
      this.copyToClipboard(url);
      this.toast(`コピーしました`);
    },
  },

  computed: {
    dmgResult() {
      return this.calcDamage();
    },
  }
};
</script>

<style scoped>
</style>
