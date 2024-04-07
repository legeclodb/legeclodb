<template>
  <div class="root" @mousemove="onMouseMove">
    <div class="header" :class="{ 'hidden': !showHeader }">
      <Navigation />
    </div>

    <div class="content" style="margin-top: 70px;" :style="style">
      <div class="about">
        <p>
          2024/04 管理人引退により更新を停止しました。これまでありがとうございました。<br />
          このサイトと github のソースは資料用にそのまま公開しておきます。
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import Navigation from './Navigation.vue'
import common from "./common";

export default {
  name: 'About',
  components: {
    Navigation,
  },
  mixins: [common],

  data() {
    return {
      stat: {
      },
    };
  },

  created() {
    document.title = "れじぇくろDB: お知らせ";
  },

  mounted() {
  },

  methods: {
  },

  computed: {
  }
}
</script>

<style scoped>
div.about {
  max-width: 1200px;
  padding: 20px;
  margin: 5px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 0.3rem;
  background: rgb(245, 245, 245);
  box-shadow: 0 3px 6px rgba(140,149,159,0.5);
}

.about h2 {
  font-size: 1.75em;
}

.about p {
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
  font-size: 80%;
  color: rgb(150, 150, 150);
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
</style>
