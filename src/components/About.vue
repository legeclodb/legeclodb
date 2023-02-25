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
        </p>
        <b-popover target="btn-docs" placement="bottom" custom-class="gdocs">
          <iframe width="1100" height="500" src="https://docs.google.com/document/d/1vldiHELiy0GFKhXO20SOsMdw4mczivU4SuxXO9Wv26I/edit?embedded=true"></iframe>
        </b-popover>

        <h2>バフ・デバフの競合・重複</h2>
        <p>
          れじぇくろのバフ・デバフの関係は以下のようになっています。<br />
          <ul>
            <li>同系統のバフ・デバフが同時にかかった場合、アクティブスキル同士は競合し、一番効果が高いもののみ適用。</li>
            <li>ただし、メインキャラのアクティブとサポートキャラのアクティブは別枠で効果が加算になる。</li>
            <li>タレント、パッシブスキル、装備の効果は全て加算。ただし、同スキル・同アイテム同士に限っては競合。</li>
            <li>バフとデバフが同時にかかった場合、% を足し合わせて相殺となる。</li>
          </ul>
          <br />
          つまり、だいたい<br />
          <b>一番効果の高いメインのアクティブ＋一番効果の高いサポートのアクティブ＋全タレント・パッシブ・装備効果</b><br />
          と覚えておいてよいと思われます。これを念頭にバフ・デバフの組み合わせを模索するとよいでしょう。<br />
          <br />
          ただし、与ダメージとダメージ耐性のバフ・デバフはもうちょっと事情が複雑です。<br />
          これらは無印、物理、魔法、スキルなどのバリエーションがありますが、<br />
          異なるバリエーションであればアクティブ同士でも効果が加算になることが確認されています。<br />
          さらに、一部のスキルは独自のバリエーションになっており、一見競合しそうでも加算になります。<span class="note">マリー・アントワネットの<b-link :ref="po">ロサ・センティフォリア</b-link>など。</span><br />
          従って、<b-link :ref="po">総員、突撃用意</b-link>＋<b-link :ref="po">お届け物です！</b-link>＋<b-link :ref="po">リトルマロース</b-link>＋<b-link :ref="po">ロサ・センティフォリア</b-link> で物理スキル与ダメージ +100% といった事が可能です。<br />
          <br />
          また、一部のバフ・デバフには上限があることが確認されています。<br />
          該当するのは基礎ステータス値へのデバフ (アタック・ディフェンス・マジック・レジスト)、およびダメージ耐性バフと与ダメージデバフで、<br />
          これらは 70% 以上盛っても実際に効果を発揮するのは 70% までとなります。<br />
          なお、基礎ステータス値へのバフ、与ダメージバフ、ダメージ耐性デバフに関しては上限は確認されていません。<br />
          <br />
          装備の効果は特に記載がない場合メインのみが対象である点に注意が必要です。<br />
          サポートも対象の効果は「自ユニットの～」という記載があり、区別されています。<br />
          例えば、<b-link :ref="po">天蠍の天鎧</b-link>のダメージ耐性はメインのみが対象、<b-link :ref="po">羅刹のかんざし</b-link>の物理ダメージ耐性はサポートも対象となります。<br />
        </p>

        <h2>ダメージ計算</h2>
        <p>
          ダメージ計算式は以下のようになっています。<br />
          <b>(攻撃側の攻撃力－受ける側の防御力)×(スキルのダメージ倍率)×(与ダメージバフ・デバフ)×(ダメージ耐性バフ・デバフ)×(クリティカルダメージ倍率)×乱数×10</b><br />
          <br />
          <ul>
            <li>メイン・サポート個別にこの計算が行われる。</li>
            <li>攻撃力と防御力は、物理攻撃の場合アタック&ディフェンス、魔法攻撃の場合マジック&レジスト。</li>
            <li>×10 は 1 戦闘に 10 回攻撃が行われるということで、戦闘アニメーションONだと 1 攻撃あたりのダメージが表示される。</li>
            <li>
              ダメージ耐性バフ・デバフと与ダメージバフ・デバフは掛け算の関係。
              <ul>
                <li>ダメージ耐性バフと与ダメージデバフは 70% が上限。<span class="note">両方最大まで盛ると 0.3×0.3=9% まで被ダメージを抑え込める。</span></li>
                <li>
                  敵のタレントのダメージ耐性は通常のダメージ耐性とは別枠になっているものがある。<br />
                  この場合、ダメージ耐性デバフとの関係は % を足し合わせて相殺ではなく、掛け算になる。
                </li>
              </ul>
            </li>
            <li>クリティカルダメージ倍率は 30% + バフ効果量で、クリティカル発生時 10 回の攻撃全てに適用。</li>
            <li>乱数による振れ幅はわずかで、±2% 程度とみられる。</li>
            <li>遠距離攻撃キャラが近接攻撃した場合、最終ダメージに 0.6 倍される。</li>
            <li>
              2回攻撃を持つ場合、最初の一斉攻撃の後、相手が生き残っていたら再度攻撃を行う。
              <ul>
                <li class="note">ギルクエ EX で高スコアを狙う場合、最初の一斉攻撃で倒れない相手を狙う。</li>
              </ul>
            </li>
            <li>範囲攻撃の場合、計算式は同じだが、戦闘の前後に発動するバフ・デバフが発動しないことや、サポートが攻撃に参加しないことが異なる。</li>
          </ul>
        </p>
      </div>
    </div>

    <template v-for="e in popoverElements">
      <b-popover :target="e.element" triggers="hover focus" custom-class="item_po" :title="e.name" placement="top">
        <div class="flex">
          <div><b-img-lazy :src="getImageURL(e.name)" width="50" height="50" /></div>
          <div v-html="descToHtml(e.item)"></div>
        </div>
      </b-popover>
    </template>

  </div>
</template>

<script>
import Navigation from './Navigation.vue'
import jsonMainSkills from '../assets/main_skills.json'
import jsonItems from '../assets/items.json'
import common from "./common";

export default {
  name: 'About',
  components: {
    Navigation,
  },
  mixins: [common],

  data() {
    return {
      popoverElements: [],
    };
  },

  mounted() {
  },

  methods: {
    findItem(name) {
      return jsonMainSkills.find(a => a.name == name) || jsonItems.find(a => a.name == name);
    },

    po(e) {
      if (e) {
        let el = e.$el;
        if (!this.popoverElements.find(e => e === el)) {
          this.popoverElements.push({
            name: el.innerText,
            item: this.findItem(el.innerText),
            element: el,
          });
        }
      }
    },
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

.about ul {
  list-style-type: disc;
  margin: 0;
}

.about li {
  display: list-item;
  margin: 0 15px;
}

.gdocs {
  max-width: 1125px !important;
  width: 1125px !important;
}

.item_po {
  max-width: 400px !important;
}

.note {
  font-size: 75%;
  color: rgb(150, 150, 150);
}
</style>
