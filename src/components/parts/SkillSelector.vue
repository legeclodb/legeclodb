<template>
  <b-popover :target="target" triggers="click blur" :delay="{show:0, hide:250}" no-fade placement="bottom">
    <div class="chr-area">
      <b-link v-if="nullable"  @mouseover="$emit('mouseover', null)" @mouseleave="$emit('mouseleave', null)" @click="onClick(null)">
        <b-img-lazy :src="getImageURL('null')" title="(なし)" width="50" />
      </b-link>
      <b-link v-for="(v, i) in filteredItems" :key="i" @mouseover="$emit('mouseover', v)" @mouseleave="$emit('mouseleave', v)" @click="onClick(v)">
        <b-img-lazy :src="getImageURL(v.icon)" :title="`${v.name}\n${v.desc}`" width="50" />
      </b-link>
    </div>
  </b-popover>
</template>

<script>
import common from "../common";

export default {
  name: 'SkillSelector',
  mixins: [common],
  props: {
    target: {
      type: String,
      required: true,
    },
    skills: {
      type: Array,
      required: true,
    },
    excludes: {
      type: Array,
      default: () => [],
      required: false,
    },

    nullable: {
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
    }
  },

  computed: {
    filteredItems() {
      return this.skills.filter(a => !this.excludes.includes(a));
    },
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
