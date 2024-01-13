<template>
  <div class="root" @mousemove="onMouseMove">
    <div class="header" :class="{ 'hidden': !showHeader }">
      <Navigation />
    </div>
    <div class="root" style="margin-top: 55px;">
      <b-tabs nav-class="tab-index" v-model="tabIndex">
        <b-tab>
          <template #title>
            <h2 style="margin: 0em 1em; font-size: 1.25em;">組み合わせ検索</h2>
          </template>
          <CombinationBufSimulator />
        </b-tab>
        <b-tab>
          <template #title>
            <h2 style="margin: 0em 1em; font-size: 1.25em;">自己バフ検索</h2>
          </template>
          <SelfBufSimulator />
        </b-tab>
      </b-tabs>
    </div>

  </div>
</template>

<script>
import Navigation from './Navigation.vue'
import CombinationBufSimulator from './simulator/CombinationBufSimulator.vue'
import SelfBufSimulator from './simulator/SelfBufSimulator.vue'
import commonjs from "./common.js";

export default {
  name: 'Lookup',
  components: {
    Navigation,
    CombinationBufSimulator,
    SelfBufSimulator,
  },
  mixins: [commonjs],

  data() {
    return {
      tabIndex: 0,
    };
  },

  created() {
    document.title = "れじぇくろDB: 逆引き";
  },

  mounted() {
    //this.parseParamsUrl(window.location.href);
  },

  methods: {
  },
}
</script>

<style scoped>
  .tab-index {
    font-size: 4.75em;
    margin-left: 1em;
  }

  div.about {
  }

  .about h2 {
    font-size: 1.75em;
    margin-left: 1em;
  }
  .about h3 {
    font-size: 1.5em;
    margin-left: 1em;
  }

  .about p {
    margin-bottom: 30px;
  }

  .about ul {
    list-style-type: disc;
    margin: 0;
  }

  .about li {
    display: list-item;
    margin: 0 15px;
  }

  .note {
    color: rgb(150, 150, 150);
  }

  label.disabled {
    color: rgb(180, 180, 180);
  }

  .panel {
    padding: 10px;
    margin-top: 10px;
    margin-bottom: 10px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 0.3rem;
    display: inline-block;
    background: white;
  }

  .panel h6 {
    margin-bottom: 5px;
  }

  div.total-params {
    padding: 3px;
    margin: 5px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 0.3rem;
    background: rgb(245, 245, 245);
    flex-grow: initial;
    box-shadow: 0 3px 6px rgba(140,149,159,0.5);
  }
  div.character {
    padding: 3px;
    margin: 5px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 0.3rem;
    background: rgb(245, 245, 245);
    flex-grow: initial;
    box-shadow: 0 3px 6px rgba(140,149,159,0.5);
  }

  label {
    margin: 0.2rem 0 !important;
  }

</style>
<style>
  .table {
    margin-bottom: 1px;
  }

  .desc .table {
    width: auto;
    margin: 3px;
  }

  .input-dropdown button {
    padding: 0.1em;
  }

  .table-sm td {
    padding: 1px;
    vertical-align: middle;
  }

  input::placeholder {
    color: rgb(190, 190, 190) !important;
    font-size: small !important;
  }

  .param-highlighted {
    background-color: rgb(255, 190, 190) !important;
  }

  .effect-group {
    display: flex;
    flex-wrap: wrap;
    margin-top: 5px;
  }

  .effect-box {
    margin: 1px 2px;
    padding: 0px 2px;
    min-height: 21px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 0.3rem;
    background: white;
    display: flex;
    align-items: center;
    white-space: nowrap;
    font-size: 75%;
  }

  .exclude-menu {
    margin-top: 5px;
  }
  .exclude-menu .btn {
    margin-right: 4px;
  }
  .exclude-box {
    flex-wrap: wrap;
    align-items: flex-start;
    align-content: flex-start;
    width: 275px;
    min-height: 150px;
    max-height: 200px;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .button-box {
    display: flex;
  }
  .left-align {
    margin: 2px auto 2px 0px;
  }
  .right-align {
    margin: 2px 0px 2px auto;
  }

  .popover {
    max-width: 450px;
  }

</style>
