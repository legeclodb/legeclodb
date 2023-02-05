<template>
  <div class="root">
    <div class="header" :class="{ 'hidden': !showHeader }">
      <Navigation />
    </div>

    <div class="content" style="margin-top: 70px;" :style="style">
      <div class="about">
        <div>
          <h2>このサイトについて</h2>

        </div>
      </div>
    </div>

  </div>
</template>

<script>
import Navigation from './Navigation.vue'

export default {
  name: 'About',
  components: {
    Navigation,
  },
  data() {
    return {
      showDetail: 2,
      showHeader: true,
      preventShowHideHeaderOnScroll: 0,
      lastScrollPosition: 0,
    };
  }
}
</script>

<style scoped>
</style>
