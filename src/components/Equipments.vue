<template>
  <div class="root">
    <div class="header" :class="{ 'hidden': !showHeader }">
      <Navigation />
    </div>
  </div>
</template>

<script>
import Navigation from './Navigation.vue'

export default {
  name: 'Equipments',
  components: {
    Navigation,
  },
  data() {
    return {
    };
  }
}
</script>

<style scoped>
</style>
