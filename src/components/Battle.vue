<template>
  <div class="root" @mousemove="onMouseMove">
    <div class="header" :class="{ 'hidden': !showHeader }">
      <Navigation />
    </div>
    <div class="about" style="margin-top: 55px;">

      <div class="menu-content" style="flex-wrap: nowrap">
        <div class="menu-panel" id="cb-settings">
        </div>
      </div>
    </div>

    <div class="content">
      <div class="grid-container panel">
        <div v-for="(cell, i) in cells" :key="i" class="grid-cell" :id="cell.id">
          {{cell.id}}
          <div v-if="cell.enemy">
            <b-img-lazy :src="getImageURL(cell.enemy.class)" :id="cell.enemy.id" @click="selectEnemy(cell.enemy)" width="50" height="50" />
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>import Navigation from './Navigation.vue'
import jsonMainActive from '../assets/main_active.json'
import jsonMainPassive from '../assets/main_passive.json'
import jsonMainTalents from '../assets/main_talents.json'
import jsonMainChrs from '../assets/enemy_main_characters.json'
import jsonSupportActive from '../assets/support_active.json'
import jsonSupportPassive from '../assets/support_passive.json'
import jsonSupportChrs from '../assets/enemy_support_characters.json'
import jsonConstants from '../assets/constants.json'
import jsonBattle from '../assets/battle.json'
import common from "./common";

export default {
  name: 'Battle',
  components: {
    Navigation,
  },
  mixins: [common],

  data() {
    return {
      classes: jsonConstants.classes,
      symbols: jsonConstants.symbols,
      damageTypes: jsonConstants.damageTypes,
      rarities: jsonConstants.rarities,
      battleList: jsonBattle,

      phaseNames: {
        "0": "開始時",
        "1E": "1T裏",
        "2E": "2T裏",
        "3E": "3T裏",
        "4E": "4T裏",
      },

      battleId: null,
      battleData: null,
      cells: [],
      phase: "0",

      enemies: [],
      allies: [],
    };
  },

  created() {
    this.mainActive = structuredClone(jsonMainActive);
    this.mainPassive = structuredClone(jsonMainPassive);
    this.mainTalents = structuredClone(jsonMainTalents);
    this.mainChrs = structuredClone(jsonMainChrs).filter(a => !a.hidden);

    this.supActive = structuredClone(jsonSupportActive);
    this.supPassive = structuredClone(jsonSupportPassive);
    this.supChrs = structuredClone(jsonSupportChrs).filter(a => !a.hidden);

    this.setupCharacters(this.mainChrs, this.mainActive, this.mainPassive, this.mainTalents);
    this.setupCharacters(this.supChrs, this.supActive, this.supPassive);
  },

  mounted() {
    const zeroPad = (num, pad = 2) => String(num).padStart(pad, '0');

    const div_x = 15;
    const div_y = 15;
    let cells = new Array(div_x * div_y);
    for (let y = 0; y < div_y; ++y) {
      for (let x = 0; x < div_x; ++x) {
        let i = y * div_x + x;
        cells[i] = {
          id: `c${zeroPad(x)}${zeroPad(y)}`,
          x: x,
          y: y,
          enemy: null,
        };
      }
    }
    this.cells = cells;

    this.selectBattle(this.battleList.slice(-1)[0].uid);
  },

  destroyed() {
  },

  methods: {
    selectBattle(bid) {
      const battle = this.battleList.find(a => a.uid == bid);
      if (battle) {
        this.battleId = bid;
        this.battleData = battle;
        console.log(`selected battle "${bid}"`);
      }
    },

    selectPhase(phase) {

    },
  },

  computed: {
  },

  updated: function () {
  },

}
</script>

<style scoped>
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

  label {
    margin: 0.2rem 0 !important;
  }

  .grid-container {
    display: grid;
    grid-template-columns: 50px 50px 50px 50px 50px 50px 50px 50px 50px 50px 50px 50px 50px 50px 50px;
    grid-template-rows: 50px 50px 50px 50px 50px 50px 50px 50px 50px 50px 50px 50px 50px 50px 50px;
  }
  .grid-cell {
    border: 1px solid rgba(140,149,159,0.5);
    width: 50px;
    height: 50px;
  }

  .enemy {
    background: rgb(255, 128, 128);
  }
  .ally {
    background: rgb(128, 128, 255);
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

  .popover {
    max-width: 450px;
  }

</style>
