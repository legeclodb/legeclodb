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
          ミス報告や要望などがあれば Twitter で https://legeclodb.github.io/ を含めて発言していただけると拾えると思われます。<br />
          開発者の方は <b-link href="https://github.com/legeclodb/legeclodb" target="_blank">github のリポジトリ</b-link> から自力でソースに手を加えることも可能です。
        </p>

        <h2>バフ・デバフの競合・重複</h2>
        <p>
          れじぇくろのバフ・デバフの関係はだいたい以下のようになっています。<br />
          ・同系統のバフが同時にかかった場合、アクティブスキル同士は競合し、一番効果が高いもののみ適用。<br />
          ・ただし、メインキャラのアクティブ、サポートキャラのアクティブは別枠で効果は加算。<br />
          ・タレント、パッシブスキル、装備の効果は全て加算。ただし、同スキル・同アイテム同士に限っては競合。<br />
          ・デバフも同じルールだが上限があり、いくらデバフを重ねても対象の能力は 30% 未満にはならない。<br />
          ・バフとデバフが同時にかかった場合、% の足し引きにより相殺。<br />
        </p>
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
  
div.about {
  padding: 10px;
  margin: 5px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 0.3rem;
  background: rgb(245, 245, 245);
  box-shadow: 0 3px 6px rgba(140,149,159,0.5);
  font-size: medium;
}

.about p {
  margin-bottom: 20px;
}

</style>
