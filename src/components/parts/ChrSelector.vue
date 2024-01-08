<template>
  <b-popover :target="target" triggers="click blur" :delay="{show:0, hide:250}" no-fade placement="bottom">
    <div style="margin: 4px 0px">
      <b-button-group v-if="classfilter" size="sm" style="margin-right: 10px">
        <b-button v-for="(c, i) in filter.class" :key="i" :pressed.sync="c.state" variant="outline-secondary">
          <b-img-lazy :src="getImageURL(classes[i])" width="20px" />
        </b-button>
      </b-button-group>
      <b-button-group v-if="symbolfilter" size="sm">
        <b-button v-for="(c, i) in filter.symbol" :key="i" :pressed.sync="c.state" variant="outline-secondary">
          <b-img-lazy :src="getImageURL(symbols[i])" width="20px" />
        </b-button>
      </b-button-group>
    </div>
    <div class="chr-area">
      <b-link v-if="nullable" @mouseover="$emit('mouseover', null)" @mouseleave="$emit('mouseleave', null)" @click="onClick(null)">
        <b-img-lazy :src="getImageURL('null')" title="(なし)" width="50" />
      </b-link>
      <b-link v-for="(v, i) in filteredChrs" :key="i" @mouseover="$emit('mouseover', v)" @mouseleave="$emit('mouseleave', v)" @click="onClick(v)">
        <b-img-lazy :src="getImageURL(v.icon)" :title="v.name" width="50" />
      </b-link>
    </div>
  </b-popover>
</template>

<script>
import jsonConstants from '../../assets/constants.json'
import common from "../common";

export default {
  name: 'ChrSelector',
  mixins: [common],
  props: {
    target: {
      type: String,
      required: true,
    },
    chrs: {
      type: Array,
      required: true,
    },

    nullable: {
      type: Boolean,
      default: false,
    },
    classfilter: {
      type: Boolean,
      default: false,
    },
    symbolfilter: {
      type: Boolean,
      default: false,
    },
    rarityfilter: {
      type: Boolean,
      default: false,
    },

    closeonclick: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      classes: jsonConstants.classes,
      symbols: jsonConstants.symbols,
      damageTypes: jsonConstants.damageTypes,
      rarities: jsonConstants.rarities,

      filter: {
        class: [],
        symbol: [],
        rarity: [],
      },
    }
  },

  computed: {
    filteredChrs() {
      return this.chrs.filter(a => this.filterChr(a));
    },
  },

  created() {
    this.fillFilter(this.filter.class, this.classes);
    this.fillFilter(this.filter.symbol, this.symbols);
    this.fillFilter(this.filter.rarity, this.rarities);
  },

  methods: {
    filterChr(chr) {
      return (!this.classfilter || this.filterMatch(this.filter.class, chr.classId)) &&
        (!this.symbolfilter || this.filterMatch(this.filter.symbol, chr.symbolId)) &&
        (!this.rarityfilter || this.filterMatch(this.filter.rarity, chr.rarityId));
    },

    onClick(item) {
      this.$emit('click', item);
      if (this.closeonclick) {
        this.$root.$emit('bv::hide::popover', this.target)
      }
    },
  }
}
</script>

<style>
.chr-area {
  flex-wrap: wrap;
  align-items: flex-start;
  align-content: flex-start;
  width: 425px;
  min-height: 150px;
  max-height: 250px;
  overflow-y: auto;
  overflow-x: hidden;
}

/*
.btn-outline-secondary {
  padding: 3px !important;
}
*/
</style>
