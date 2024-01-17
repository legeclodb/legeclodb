<template>
  <b-popover :target="target" triggers="click blur" :delay="{show:0, hide:250}" no-fade placement="bottom">
    <div style="margin: 4px 0px">
      <b-button-group v-if="classfilter == true" size="sm" style="margin-right: 10px">
        <b-button v-for="(c, i) in filter.class" :key="i" :pressed.sync="c.state" variant="outline-secondary">
          <b-img-lazy :src="getImageURL(classes[i])" width="20px" />
        </b-button>
      </b-button-group>
      <b-button-group v-if="slotfilter == true" size="sm">
        <b-button v-for="(c, i) in filter.slot" :key="i" :pressed.sync="c.state" variant="outline-secondary">
          <b-img-lazy :src="getImageURL(slots[i])" width="20px" />
        </b-button>
      </b-button-group>
    </div>
    <div class="chr-area">
      <b-link v-if="nullable" @mouseover="$emit('mouseover', null)" @mouseleave="$emit('mouseleave', null)" @click="onClick(null)">
        <b-img-lazy :src="getImageURL('null')" title="(なし)" width="50" height="50" class="rounded-bordered" />
      </b-link>
      <b-link v-for="(v, i) in filteredItems" :key="i" @mouseover="$emit('mouseover', v)" @mouseleave="$emit('mouseleave', v)" @click="onClick(v)">
        <b-img-lazy :src="getImageURL(v.icon)" :title="descToTitle(v)" width="50" />
      </b-link>
    </div>
  </b-popover>
</template>

<script>
import jsonConstants from '../../assets/constants.json'
import common from "../common";

export default {
  name: 'ItemSelector',
  mixins: [common],
  props: {
    target: {
      type: String,
      required: true,
    },
    items: {
      type: Array,
      required: true,
    },

    nullable: {
      type: Boolean,
      default: false,
    },
    classfilter: {
      type: [Boolean, String],
      default: false,
    },
    slotfilter: {
      type: [Boolean, String],
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
      slots: jsonConstants.itemTypes,
      rarities: jsonConstants.rarities,

      filter: {
        class: [],
        slot: [],
        rarity: [],
      },
    }
  },

  computed: {
    filteredItems() {
      return this.items.filter(a => this.filterItem(a));
    },
  },

  created() {
    this.fillFilter(this.filter.class, this.classes);
    this.fillFilter(this.filter.slot, this.slots);
    this.fillFilter(this.filter.rarity, this.rarities);
  },

  methods: {
    filterItem(item) {
      let ok = true;
      if (typeof (this.classfilter) === 'boolean')
        ok = !this.classfilter || this.filterMatch(this.filter.class, item.classIds);
      else
        ok = !item.classes || item.classes.includes(this.classfilter);

      if (ok) {
        if (typeof (this.slotfilter) === 'boolean')
          ok = !this.slotfilter || this.filterMatch(this.filter.slot, item.slotId);
        else
          ok = item.slot == this.slotfilter;
      }

      return ok &&
        (!this.rarityfilter || this.filterMatch(this.filter.rarity, item.rarityId));
    },

    onClick(item) {
      this.$emit('click', item);
      if (this.closeonclick) {
        this.$root.$emit('bv::hide::popover', this.target)
      }
    }
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
