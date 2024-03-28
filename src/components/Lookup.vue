<template>
  <div class="root" @mousemove="onMouseMove">
    <div class="header" :class="{ 'hidden': !showHeader }">
      <Navigation />
    </div>
    <div style="padding-top: 60px; background: #d0d0d4; ">
    </div>
    <div class="root" style="">
      <b-tabs nav-class="tab-index" active-nav-item-class="tab-title-active" v-model="tabIndex">
        <b-tab title-link-class="tab-title">
          <template #title>
            <h2 style="margin: 0em 1em; font-size: 1.25em;">組み合わせ検索</h2>
          </template>
          <CombinationBufSimulator ref="cbSim" />
        </b-tab>
        <b-tab title-link-class="tab-title">
          <template #title>
            <h2 style="margin: 0em 1em; font-size: 1.25em;">自己バフ検索</h2>
          </template>
          <SelfBufSimulator ref="sbSim" />
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
import lookupjs from "./simulator/lookup.js";

export default {
  name: 'Lookup',
  components: {
    Navigation,
    CombinationBufSimulator,
    SelfBufSimulator,
  },
  mixins: [commonjs, lookupjs],

  data() {
    return {
      tabIndex: 0,
    };
  },

  created() {
    document.title = "れじぇくろDB: 組み合わせ検索";
  },

  mounted() {
    const handleURLUpdate = () => {
      this.$nextTick(() => {
        this.enableUpdateURL = false;
        this.decodeURL();
        this.$nextTick(() => {
          this.enableUpdateURL = true;
        });
      });
    };

    handleURLUpdate();
    window.onpopstate = handleURLUpdate;
  },

  methods: {
    decodeURL() {
      const params = this.parseParamsUrl(window.location.href);
      //console.log(params);
      if (Object.hasOwn(params, "t")) {
        this.tabIndex = params.t;
      }
      else {
        this.tabIndex = 0;
      }

      if (Object.hasOwn(params, "p")) {
        let target = [this.$refs.cbSim, this.$refs.sbSim][this.tabIndex];
        target.deserializeParams(params.p);
      }
    },
    updateURL() {
      if (!this.enableUpdateURL)
        return false;

      let url = `?t=${this.tabIndex}`;
      if (url != this.prevURL) {
        window.history.pushState(null, null, url);
        this.prevURL = url;
        return true;
      }
      return false;
    },
  },

  watch: {
    tabIndex: function () {
      this.updateURL();
    },
  },
}
</script>

<style scoped>
</style>

<style>
  .tab-index {
    border-color: #c0c0c0 !important;
    background: #d0d0d4;
  }

  .tab-title {
  }

  .tab-title:focus, .tab-title:hover {
    border-color: #c0c0c0 #c0c0c0 rgb(234, 234, 237) !important;
  }

  .tab-title-active {
    background: rgb(234, 234, 237) !important;
    border-color: #c0c0c0 #c0c0c0 rgb(234, 234, 237) !important;
  }

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

  input::placeholder {
    color: rgb(190, 190, 190) !important;
    font-size: small !important;
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


  .filter .btn-outline-secondary {
  }

  .rareiry-filter .btn-outline-secondary {
    padding: 4px 0px !important;
  }

</style>
