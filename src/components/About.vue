<template>
  <div class="root">
    <div class="header" :class="{ 'hidden': !showHeader }">
      <Navigation />
    </div>

    <div class="content" style="margin-top: 70px;" :style="style">
      <div class="about">
        <h2>このサイトについて</h2>
        <p>
          <b-link href="https://www.legend-clover.net/" target="_blank">れじぇくろ！</b-link>の攻略データベースです。主にバフ・デバフを検索するのを目的としています。<br />
          間違いの指摘や要望などありましたら以下の公開 Google Docs にコメントいただけると幸いです。<br />
          <b-button variant="secondary" id="btn-docs">Google Docs</b-button><br />
          あるいは、Twitter で https://legeclodb.github.io/ を含めて発言していただいても拾えると思われます。
        </p>
        <b-popover target="btn-docs" placement="bottom">
          <iframe width="1100" height="500" src="https://docs.google.com/document/d/1vldiHELiy0GFKhXO20SOsMdw4mczivU4SuxXO9Wv26I/edit?embedded=true"></iframe>
        </b-popover>

        <h2>バフ・デバフの競合・重複</h2>
        <p>
          れじぇくろのバフ・デバフの関係は以下のようになっています。<br />
          ・同系統のバフが同時にかかった場合、アクティブスキル同士は競合し、一番効果が高いもののみ適用。<br />
          ・ただし、メインキャラのアクティブとサポートキャラのアクティブは別枠で効果が加算になる。<br />
          ・タレント、パッシブスキル、装備の効果は全て加算。ただし、同スキル・同アイテム同士に限っては競合。<br />
          ・デバフも同じルールだが上限があり、いくらデバフを重ねても対象の能力は 30% 未満にはならない。<br />
          ・バフとデバフが同時にかかった場合、% を足し合わせて相殺となる。<br />
          <br />
          つまり、だいたい<br />
          <span style="font-weight: bold;">
            一番効果の高いメインのアクティブ＋一番効果の高いサポートのアクティブ＋全タレント・パッシブ・装備効果<br />
          </span>
          と覚えておいてよいと思われます。<br />
          これを念頭に置いてバフ・デバフの組み合わせを模索するとよいでしょう。
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
    };
  }
}
</script>

<style scoped>
div.about {
  padding: 20px;
  margin: 5px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 0.3rem;
  background: rgb(245, 245, 245);
  box-shadow: 0 3px 6px rgba(140,149,159,0.5);
}

.about p {
  margin-bottom: 25px;
}

.popover {
  max-width: 90% !important;
}
</style>
