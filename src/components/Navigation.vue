<template>
  <div class="navi">
    <h1 class="title">れじぇくろDB</h1>
    <div class="links">
      <a class="navi-link" href="./main">メインキャラ</a>
      <a class="navi-link" href="./support">サポートキャラ</a>
      <a class="navi-link" href="./equipment">装備</a>
      <a class="navi-link" href="./about">説明</a>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Navigation',
  props: {
  }
};
</script>

<style scoped>
div.navi {
  color: whitesmoke;
  display: flex;
  background: rgb(64,64,64);
  width: 100vw;
  transform: translate3d(0, 0, 0);
  transition: 0.1s all ease;
  font-size: 1.2em;
  color: whitesmoke;
  line-height: 50px;
}

.title {
  font-size: 1.5em;
  margin-right: 50px;
  margin-left: 20px;
  margin-right: 20px;
  padding: 12px;
}

.navi-link {
  color: whitesmoke;
  font-size: 1.0em;
  padding: 12px 15px 12px 15px;
}
.navi-link:hover, .navi-link:focus {
  color: #16181b;
  text-decoration: none;
  background-color: #e9ecef;
}
</style>
