<template>
  <div id="app">
    <MainCharacters />
  </div>
</template>

<script>
import MainCharacters from './components/MainCharacters.vue'

export default {
  name: 'App',
  components: {
    MainCharacters
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin: 0;
}
</style>
