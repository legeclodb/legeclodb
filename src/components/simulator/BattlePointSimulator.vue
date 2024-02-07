<template>
  <div class="panel">
    <b-container>
      <b-row>
        <b-col style="text-align:center">
          <h5 style="margin-bottom: 10px">戦闘力シミュレータ</h5>
        </b-col>
      </b-row>
    </b-container>
    <div class="flex">
      <div>
        <b-container>
          <b-form-row>
            <b-col style="text-align:center">
              <h6>メインキャラ <b-form-checkbox inline plain id="bp-main-enabled" v-model="mainEnabled" /></h6>
            </b-col>
          </b-form-row>
          <b-form-row v-for="(param, name, index) in main" :key="index">
            <b-col style="text-align: right" align-self="end">
              <label style="width: 11em" :class="getParamClass(param)" :for="`bp-main-${name}`">{{param.label}}</label>
            </b-col>
            <b-col>
              <b-form-input v-if="param.type == 'number'" style="width: 5em" :id="`bp-main-${name}`" v-model.number="param.value"
                            size="sm" type="number" class="input-param" :min="param.min" :max="param.max" :disabled="param.disabled()"></b-form-input>
              <b-form-checkbox style="width: 5em" :id="`bp-main-${name}`" v-model="param.value" size="sm" plain
                               :disabled="param.disabled()" v-if="param.type == 'bool'"></b-form-checkbox>
            </b-col>
          </b-form-row>
        </b-container>
      </div>
      <div>
        <b-container>
          <b-form-row>
            <b-col style="text-align: center">
              <h6>サポートキャラ <b-form-checkbox inline plain id="bp-support-enabled" v-model="supportEnabled" /></h6>
            </b-col>
          </b-form-row>
          <b-form-row v-for="(param, name, index) in support" :key="index">
            <b-col style="text-align:right" align-self="end">
              <label style="width: 10em" :class="getParamClass(param)" :for="`bp-support-${name}`">{{param.label}}</label>
            </b-col>
            <b-col>
              <b-form-input v-if="param.type == 'number'" style="width: 5em" :id="`bp-support-${name}`" v-model.number="param.value"
                            size="sm" type="number" class="input-param" :min="param.min" :max="param.max" :disabled="param.disabled()"></b-form-input>
            </b-col>
          </b-form-row>
        </b-container>
      </div>
    </div>
    <div>
      <b-container>
        <h5 style="margin-bottom: 10px">戦闘力: {{bpResult}}</h5>
        <b-button id="bp-copy-url" @click="copyToClipboard(bpUrl)">パラメータを URL としてコピー</b-button>
        <b-popover target="bp-copy-url" triggers="click blur" placement="top" custom-class="url-popover">
          コピーしました：<br />{{ bpUrl }}
        </b-popover>
      </b-container>
    </div>
  </div>
</template>

<script>
import common from "../common";

export default {
  name: 'BattlePointSimulator',
  props: {
  },
  mixins: [common],

  data() {
    return {
      mainEnabled: true,
      supportEnabled: true,
      main: {
        stars: {
          label: "⭐",
          type: "number",
          min: 1,
          max: 6,
          value: 6,
          disabled: () => !this.mainEnabled,
        },
        master: {
          label: "マスターレベル",
          type: "number",
          min: 0,
          max: 3,
          value: 3,
          disabled: () => !this.mainEnabled,
        },
        hp: {
          label: "HP",
          type: "number",
          min: 0,
          value: 15000,
          disabled: () => !this.mainEnabled,
        },
        atk: {
          label: "アタック / マジック",
          type: "number",
          min: 0,
          value: 1500,
          disabled: () => !this.mainEnabled,
        },
        def: {
          label: "ディフェンス",
          type: "number",
          min: 0,
          value: 500,
          disabled: () => !this.mainEnabled,
        },
        res: {
          label: "レジスト",
          type: "number",
          min: 0,
          value: 500,
          disabled: () => !this.mainEnabled,
        },
        tec: {
          label: "テクニック",
          type: "number",
          min: 0,
          value: 100,
          disabled: () => !this.mainEnabled,
        },
        skillCost: {
          label: "スキルコスト",
          type: "number",
          value: 6,
          min: 0,
          max: 6,
          disabled: () => !this.mainEnabled,
        },
        eqStars: {
          label: "装備の⭐合計",
          type: "number",
          min: 0,
          max: 20,
          value: 20,
          disabled: () => !this.mainEnabled,
        },
        enchant: {
          label: "エンチャント4セット",
          type: "bool",
          value: true,
          disabled: () => !this.mainEnabled,
        },
        engageSkillCount: {
          label: "エンゲージ後スキルの数",
          type: "number",
          value: 0,
          disabled: () => !this.mainEnabled,
        },
      },
      support: {
        stars: {
          label: "⭐",
          type: "number",
          min: 1,
          max: 6,
          value: 6,
          disabled: () => !this.supportEnabled,
        },
        master: {
          label: "マスターレベル",
          type: "number",
          min: 0,
          max: 3,
          value: 3,
          disabled: () => !this.supportEnabled,
        },
        hp: {
          label: "HP",
          type: "number",
          min: 0,
          value: 15000,
          disabled: () => !this.supportEnabled,
        },
        atk: {
          label: "アタック / マジック",
          type: "number",
          min: 0,
          value: 1500,
          disabled: () => !this.supportEnabled,
        },
        def: {
          label: "ディフェンス",
          type: "number",
          min: 0,
          value: 500,
          disabled: () => !this.supportEnabled,
        },
        res: {
          label: "レジスト",
          type: "number",
          min: 0,
          value: 500,
          disabled: () => !this.supportEnabled,
        },
        skills: {
          label: "解放済みスキル",
          type: "number",
          min: 1,
          max: 3,
          value: 3,
          disabled: () => !this.supportEnabled,
        },
      }
    };
  },

  created() {
    this.parseParamsUrl(window.location.href);
  },

  methods: {
    getParamClass(param) {
      return param.disabled() ? "disabled" : "";
    },

    calcBattlePower() {
      let hp = 0;
      let atk = 0;
      let def = 0;
      let res = 0;
      let tec = 0;
      let rate = 1.0;
      if (this.mainEnabled) {
        const params = this.main;
        hp += params.hp.value;
        atk += params.atk.value;
        def += params.def.value;
        res += params.res.value;
        tec += params.tec.value;
        rate += params.stars.value * 0.1;
        rate += params.master.value * 0.1;
        rate += params.skillCost.value * 0.03;
        rate += params.eqStars.value * 0.02;
        rate += params.engageSkillCount.value * 0.05;
        if (params.enchant.value)
          rate += 0.1;
      }
      if (this.supportEnabled) {
        const params = this.support;
        hp += params.hp.value;
        atk += params.atk.value;
        def += params.def.value;
        res += params.res.value;
        rate += params.stars.value * 0.1;
        rate += params.master.value * 0.1;
        rate += params.skills.value * 0.05;
      }
      return Math.round(((hp * 0.05) + (atk * 2 * (1.0 + tec * 0.0003)) + (def * 2) + (res * 2)) * rate);
    },

    getParamsUrl() {
      let params = [];

      params.push(this.mainEnabled);
      for (const v of Object.values(this.main))
        params.push(v.value);

      params.push(this.supportEnabled);
      for (const v of Object.values(this.support))
        params.push(v.value);

      let url = window.location.href.replace(/\?.+/, '').replace(/#.+/, '');
      url += "?bp=" + params.join(',') + "#battle_power";
      return url;
    },

    parseParamsUrl(url) {
      url = decodeURIComponent(url);
      let q = url.match(/\?bp=([^#]+)/);
      if (q) {
        let params = q[1].split(',').map(this.parseValue);

        this.mainEnabled = params.shift();
        for (const v of Object.values(this.main))
          v.value = params.shift();

        this.supportEnabled = params.shift();
        for (const v of Object.values(this.support))
          v.value = params.shift();

        return true;
      }
      return false;
    },
  },

  computed: {
    bpResult() {
      return this.calcBattlePower();
    },
    bpUrl() {
      return this.getParamsUrl();
    },
  }
};
</script>

<style scoped>
</style>
