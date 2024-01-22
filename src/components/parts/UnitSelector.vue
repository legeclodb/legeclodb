<template>
  <b-popover :target="target" triggers="click blur" :delay="{show:0, hide:250}" no-fade placement="bottom">
    <div class="chr-area">
      <b-link v-for="(v, i) in filteredItems" :key="i" @mouseover="$emit('mouseover', v)" @mouseleave="$emit('mouseleave', v)" @click="onClick(v)">
        <b-img-lazy v-if="v.main" :src="getImageURL(v.main.icon)" :title="`${v.main.name}${v.support ? '& ' + v.support.name : ''}`" width="50" />
      </b-link>
    </div>
  </b-popover>
</template>

<script>
import common from "../common";

export default {
  name: 'UnitSelector',
  mixins: [common],
  props: {
    target: {
      type: String,
      required: true,
    },
    units: {
      type: Array,
      required: true,
    },

    closeonclick: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      currentChr: null,
    }
  },

  created() {
  },

  methods: {
    onClick(item) {
      this.$emit('click', item);
      if (this.closeonclick) {
        this.$root.$emit('bv::hide::popover', this.target)
      }
    }
  },

  computed: {
    filteredItems() {
      return this.units;
    },
  },
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
