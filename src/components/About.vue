<template>
  <div class="root">
    <div class="header" :class="{ 'hidden': !showHeader }">
      <Navigation />
    </div>

    <div class="content" style="margin-top: 70px;" :style="style">
      <div class="about">
        <h2>このサイトについて<a name="about" href="#about">.</a></h2>
        <p>
          <b-link href="https://www.legend-clover.net/" target="_blank">れじぇくろ！</b-link>の攻略データベースです。主にバフ・デバフを検索するのを目的としています。<br />
          間違いの指摘や要望などありましたら以下の公開 Google Docs にコメントいただけると幸いです。<br />
          <b-button variant="secondary" id="btn-docs">Google Docs</b-button><br />
        </p>
        <b-popover target="btn-docs" placement="bottom" custom-class="gdocs">
          <iframe width="1100" height="500" src="https://docs.google.com/document/d/1vldiHELiy0GFKhXO20SOsMdw4mczivU4SuxXO9Wv26I/edit?embedded=true"></iframe>
        </b-popover>

        <h2>バフ・デバフの競合・重複<a name="buff" href="#buff">.</a></h2>
        <p>
          れじぇくろのバフ・デバフの関係は以下のようになっています。<br />
          <ul>
            <li>同系統のバフが同時にかかった場合、アクティブスキル同士は競合し、一番効果が高いもののみ適用。</li>
            <li>ただし、メインキャラのアクティブとサポートキャラのアクティブは別枠で効果が加算になる。</li>
            <li>タレント、パッシブスキル、装備の効果は全て加算。ただし、同スキル・同アイテム同士に限っては競合。</li>
            <li>デバフも同じルール。バフとデバフが同時にかかった場合、% を足し合わせて相殺となる。</li>
          </ul>
          <br />
          つまり、大雑把には<br />
          <b>一番効果の高いメインのアクティブ＋一番効果の高いサポートのアクティブ＋全タレント・パッシブ・装備効果</b><br />
          と覚えておいてよいでしょう。<br />
          <br />
          しかし、アクティブ同士の関係は厳密にはもっと複雑です。<br />
          バフ・デバフには効果ターン中常時発動しているものと、戦闘時のみ発動するものがありますが、<br />
          この 2 種は別枠であるらしく、アクティブ同士でも加算になることが確認されています。<br />
          <span class="note">例: ダメージ耐性デバフの <b-link :ref="po">綺麗な花には毒がある</b-link> と <b-link :ref="po">精一杯の誘惑</b-link> は加算。<b-link :ref="po">精一杯の誘惑</b-link> と <b-link :ref="po">聖なる夜の啓示</b-link> は戦闘前デバフ同士で競合。<br /></span>
          また、一部のスキルは固有枠であるらしく、無条件で他のアクティブと加算になるとみられます。<br />
          <span class="note">シンボルスキルに付随する加護、<b-link :ref="po">ロサ・センティフォリア</b-link>、<b-link :ref="po">オーヴァーリザーブ</b-link>のダメージ耐性などが該当。</span><br />
          <br />
          加えて、与ダメージとダメージ耐性にはまた別のルールがあります。<br />
          これらには物理与ダメージ、魔法与ダメージ、スキル与ダメージといったバリエーションがありますが、<br />
          異なるバリエーションであればアクティブ同士でも効果が加算になることが確認されています。<br />
          <span class="note">従って、<b-link :ref="po">お届け物です！</b-link>＋<b-link :ref="po">総員、突撃用意</b-link>＋<b-link :ref="po">リトルマロース</b-link>＋<b-link :ref="po">ロサ・センティフォリア</b-link> で戦闘時物理スキル与ダメージ +100% といった事が可能。</span><br />
          <br />
          一部のバフ・デバフには上限があることが確認されています。<br />
          該当するのは基礎ステータス値へのデバフ (アタック・ディフェンス・マジック・レジスト)、およびダメージ耐性バフと与ダメージデバフで、<br />
          これらは 70% 以上盛っても実際に効果を発揮するのは 70% までとなります。<br />
          <span class="note">この 70% はバフ・デバフを相殺した上での上限。なので、例えば 50% のバフを得ている敵は 120% デバフでようやく上限到達となる。</span><br />
          なお、基礎ステータス値へのバフ、与ダメージバフ、ダメージ耐性デバフに関しては上限はないものとみられます。<br />
          <br />
          装備の効果は特に記載がない場合メインのみが対象である点に注意が必要です。<br />
          サポートも対象の効果は「自ユニットの～」という記述があり、区別されています。<br />
          <span class="note">例: <b-link :ref="po">天蠍の天鎧</b-link> のダメージ耐性はメインのみが対象、<b-link :ref="po">乙女の天衣</b-link> のダメージ耐性はサポートも対象。</span><br />
          同様に、アミュレットの効果はサポートのみが対象となります。シールドはサポートが倒れている場合発動しません。<br />
        </p>

        <h2>ダメージ計算<a name="damage" href="#damage">.</a></h2>
        <p>
          れじぇくろのダメージ計算式は以下のようになっています。<br />
          <b>(攻撃側の攻撃力－受ける側の防御力)×(スキルのダメージ倍率)×(与ダメージバフ・デバフ)×(ダメージ耐性バフ・デバフ)×(クリティカルダメージ倍率)×乱数×10</b><br />
          <br />
          <ul>
            <li>メイン・サポート個別にこの計算が行われる。</li>
            <li>最後の ×10 は 1 戦闘に 10 回攻撃が行われるということで、戦闘アニメーションONだと 1 攻撃あたりのダメージが表示される。</li>
            <li>
              攻撃力と防御力は、物理攻撃の場合アタック&ディフェンス、魔法攻撃の場合マジック&レジスト。
              <ul>
                <li>
                  「敵ユニットのディフェンス/レジストのn%分を無視して攻撃できる」の能力を持つ場合、効果量分相手の防御力を差し引く。<br />
                  ただし、この効果はディフェンス/レジストデバフへ加算する形で処理されるようで、他のデバフと合わせて 70% が効果の上限となる。
                </li>
              </ul>
            </li>
            <li>
              ダメージ耐性バフ・デバフと与ダメージバフ・デバフは掛け算の関係。
              <ul>
                <li>ダメージ耐性バフと与ダメージデバフはどちらも 70% が効果の上限。<span class="note">両方最大まで盛ると 0.3×0.3=9% まで被ダメージを抑え込める。</span></li>
              </ul>
            </li>
            <li>
              クリティカルダメージ倍率は 30% + バフ効果量で、クリティカル発生時 10 回の攻撃全てに適用。
              <ul>
                <li>クリティカル発生率は テクニック÷10 + クリティカル率バフ - 相手のクリティカル率耐性 とみられる。</li>
              </ul>
            </li>
            <li>乱数による振れ幅はわずかで、±2% 程度。</li>
            <li>
              遠距離攻撃キャラが近接攻撃した場合、最終ダメージに 0.6 倍される。
              <ul>
                <li>メイン・サポート両方に個別に適用。</li>
              </ul>
            </li>
            <li>
              2回攻撃を持つ場合、最初の一斉攻撃の後、相手が生き残っていたら再度攻撃を行う。
              <ul>
                <li class="note">ギルクエ EX で高スコアを狙う場合、最初の一斉攻撃で倒れない相手を狙う。</li>
              </ul>
            </li>
            <li>
              反射を持つ場合、戦闘後、生き残っていたら受けたダメージの効果量 % 分を固定ダメージとして相手に返す。
              <ul>
                <li><b-link :ref="po">ラストスタンド</b-link>などで復活しても撃破された扱いであるらしく、発動しない。</li>
                <li>戦闘後に発動するデバフなどについても同様で、戦闘後生き残っていないと発動しない。</li>
              </ul>
            </li>
            <li>戦闘の前後に発生する固定ダメージは、防御力やシールドの影響を受けず、バフ・デバフも乗らない、文字通り固定値のダメージを与える。</li>
            <li>
              サポートは常に先に攻撃の対象になり、生きている限りダメージを受けるのはサポートになる。(後述の範囲攻撃を除く)
              <ul>
                <li>サポートが倒れた時、超過分のダメージがメインに流れることはない。<span class="note">= HP1 でも 1 発は攻撃を反らせる。</span></li>
                <li>サポートは倒れると攻撃にも参加しなくなる。アミュレットのシールドも発動しなくなる。</li>
              </ul>
            </li>
            <li>
              範囲攻撃の場合、計算式は同じだが、戦闘の前後に発動するバフ・デバフなどが発動しないこと、メインとサポート両方に攻撃が行くこと、<br />サポートが攻撃に参加しないことなどが異なる。
              <ul>
                <li>
                  範囲攻撃によりメインがサポートより先に倒れた場合、ユニット自体撃破された扱いになる。<br />
                  <span class="note">つまり、範囲攻撃の連打でやられるようなケースでは、サポートをいくら固くしても意味を成さない。</span>
                </li>
              </ul>
            </li>
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
        <div v-if="e.item.owners" style="margin-top: 5px">
          所持者: {{ e.item.owners.map(chr => chr.name).join("、") }}
        </div>
      </b-popover>
    </template>

  </div>
</template>

<script>
import Navigation from './Navigation.vue'
import jsonMainSkills from '../assets/main_skills.json'
import jsonMainChrs from '../assets/main_characters.json'
import jsonSupportSkills from '../assets/support_skills.json'
import jsonSupportChrs from '../assets/support_characters.json'
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

  created() {
    this.mainSkills = structuredClone(jsonMainSkills);
    this.mainChrs = structuredClone(jsonMainChrs);
    this.supSkills = structuredClone(jsonSupportSkills);
    this.supChrs = structuredClone(jsonSupportChrs);
    this.items = structuredClone(jsonItems);

    const setupSkills = function (skills, chrs) {
      let skillMap = new Map();
      for (let skill of skills) {
        skillMap.set(skill.name, skill);
      }
      for (let chr of chrs) {
        for (let i = 0; i < chr.skills.length; ++i) {
          let skill = skillMap.get(chr.skills[i]);
          if (!skill.owners)
            skill.owners = [];
          skill.owners.push(chr);
          chr.skills[i] = skill;
        }
      }
    };
    setupSkills(this.mainSkills, this.mainChrs);
    setupSkills(this.supSkills, this.supChrs);
  },

  methods: {
    findItem(name) {
      return this.mainSkills.find(a => a.name == name) ||
        this.supSkills.find(a => a.name == name) ||
        this.items.find(a => a.name == name);
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
