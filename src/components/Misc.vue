<template>
  <div class="root" @mousemove="onMouseMove">
    <div class="header" :class="{ 'hidden': !showHeader }">
      <Navigation />
    </div>

    <div class="content" style="margin-top: 70px;" :style="style">
      <div class="about">

        <h2><a name="master-rank-bug" href="#master-rank-bug"></a>マスターランク切り替えボタンについて</h2>
        <p>
          2023/11 現在、マスターランクを切り替えるボタンが表示されなくなるバグが確認されています。<br />
          この状況に陥るとマスターランクを 11 以上に上げられなくなってしまいます。<br />
          以下はこの状態に陥った際、切り替えボタンを復活させる方法です。<br />
          <br />
          前提として、ブラウザ版で、かつブラウザは Chrome か Edge である必要があります。<br />
          実行後は各種設定がリセットされるため、普段使っているのとは違う方で実行するといいでしょう。<br />
          (実行するブラウザでのみ設定がリセットされボタンが復活します)<br />
          なお、開発者ツールを使います。開発者ツールを扱うことに抵抗がある人はやめておいたほうがいいでしょう。<br />
          <br />
          <ul>
            <li>ゲームのページを開き、Ctrl + Shift + I を押す (開発者ツールが出てくる)</li>
            <li>開発者ツールの「アプリケーション」に移動</li>
            <li>下記スクリーンショットの下の方にあるフレームを選ぶところで "index.html" を選択 (デフォルトは "top" になってるはず)</li>
            <li>index.html が選択された状態で下記スクリプトをコンソールにコピペし、実行</li>
            <li>ゲーム再起動 (ページリロード) すると、各種設定が初期化された上でボタンが復活しているはず</li>
          </ul>
          <pre class="code">
window.indexedDB.open("/idbfs").onsuccess = (event) => {
  let db = event.target.result;
  let tx = db.transaction("FILE_DATA", "readwrite");
  let store = tx.objectStore("FILE_DATA");
  store.getAllKeys().onsuccess = (event) => {
    for(const key of event.target.result) {
      if(key.endsWith("/PlayerPrefs")) {
        store.get(key).onsuccess = (event) => {
          let data = event.target.result;
          const masterRankOn = new Uint8Array([0x55, 0x6E, 0x69, 0x74, 0x79, 0x50, 0x72, 0x66, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x10, 0x00, 0x10, 0x4D, 0x61, 0x73, 0x74, 0x65, 0x72, 0x52, 0x61, 0x6E, 0x6B, 0x43, 0x68, 0x61, 0x6E, 0x67, 0x65, 0x02, 0x7B, 0x7D]);
          data.contents = masterRankOn;
          store.put(data, key).onsuccess = (event) => {
            console.log(event.target.result);
          };
        };
      }
    }
  };
};
</pre>
          <b-link href="img/misc/masterrank1.jpg" target="_blank"><b-img src="img/misc/masterrank1.jpg" height="300px" /></b-link>
          <b-link href="img/misc/masterrank2.jpg" target="_blank"><b-img src="img/misc/masterrank2.jpg" height="300px" /></b-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script>import Navigation from './Navigation.vue'
import common from "./common";

export default {
  name: 'Misc',
  components: {
    Navigation,
  },
  mixins: [common],

  data() {
    return {
    };
  },

  created() {
    document.title = "れじぇくろDB: その他";
  },

  mounted() {
  },

  methods: {
  },

  computed: {
  }
}</script>

<style scoped>
  div.about {
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
    margin-bottom: 30px;
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
    max-width: 430px !important;
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

  .code {
    padding: 20px;
    margin: 5px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 0.3rem;
    background: rgb(230, 230, 235);
    box-shadow: 0 3px 6px rgba(140,149,159,0.5);
  }

</style>

<style>
  .desc .table {
    width: auto;
    margin: 3px;
  }

  .input-dropdown button {
    padding: 0.1em;
  }

  label.disabled {
    color: rgb(180, 180, 180);
  }
</style>
