<template>
  <div class="root" @mousemove="onMouseMove">
    <div class="header" :class="{ 'hidden': !showHeader }">
      <Navigation />
    </div>

    <div class="content" style="margin-top: 70px;" :style="style">
      <div class="about">
        <h2><a name="toc" href="#toc"></a>目次</h2>
        <p>
          <ul>
            <li><a href="#about">このサイトについて</a></li>
            <li><a href="#buff">バフ・デバフの競合・重複</a></li>
            <li><a href="#notes">その他のバフと補足事項</a></li>
            <li><a href="#damage">ダメージ計算</a></li>
            <li><a href="#status">基礎ステータスについて</a></li>
            <li><a href="#battle_power">戦闘力について</a></li>
            <li><a href="#thanks">謝辞</a></li>
          </ul>
        </p>

        <h2><a name="about" href="#about"></a>このサイトについて</h2>
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
          <ul>
            <li>例1: <b-link :ref="po">お届け物です！</b-link>＋<b-link :ref="po">総員、突撃用意</b-link>＋<b-link :ref="po">テスト勉強のお手伝い</b-link>＋<b-link :ref="po">ロサ・センティフォリア</b-link>＝戦闘時物理通常攻撃与ダメージ +100%</li>
            <li>例2: <b-link :ref="po">お届け物です！</b-link>＋<b-link :ref="po">総員、突撃用意</b-link>＋<b-link :ref="po">リトルマロース</b-link>＋<b-link :ref="po">発明官女</b-link>＝物理範囲スキル与ダメージ +100% & 魔法範囲スキル与ダメージ +110%</li>
          </ul>
          なお、<b>通常攻撃与ダメージバフは反撃には乗らない</b>ことが確認されています。(2023/04 現在。バグか仕様かは不明)<br />
          同様に、<b-link :ref="po">人馬の天帽</b-link>のマイナス効果も反撃であれば適用されません。<br />
          <br />
          一部のバフ・デバフには上限があることが確認されています。<br />
          該当するのは基礎ステータス値へのデバフ (アタック・ディフェンス・マジック・レジスト)、およびダメージ耐性バフと与ダメージデバフで、<br />
          これらは 70% 以上盛っても実際に効果を発揮するのは 70% までとなります。<br />
          <span class="note">この 70% はバフ・デバフを相殺した上での上限。なので、例えば 50% のバフを得ている敵は 120% デバフでようやく上限到達となる。</span><br />
          なお、基礎ステータス値へのバフ、与ダメージバフ、ダメージ耐性デバフに関しては上限はないものとみられます。<br />
        </p>

        <h2><a name="notes" href="#notes"></a>その他のバフと補足事項</h2>
        <p>
          タレント、スキル、アイテム以外の方法で得られるバフに関して記載します。<br />
          これらも同系統の効果とは加算になり、競合するケースはないとみられます。<br />
          <br />
          エンチャントのセット効果の多くはバフを持ちます。<br />
          これらのバフはメインのみが対象となります。
          <ul>
            <li>バスター：アタック/マジック+5%、味方ターンでの戦闘時、アタック/ダメージ耐性+15%</li>
            <li>チャージ：アタック/マジック+5%、自ユニットのHPが75%以上の時、アタック/マジック/ディフェンス/レジスト+10%</li>
            <li>フェザー：アタック/マジック+5%、与ダメージ+10%、行動終了時、確率(40%)で移動+1(1ターン)</li>
            <li>
              クイック：アタック/マジック+5%、アクティブスキルでダメージを与えた時、そのスキルのクールダウン-1(発動してから2ターン毎に発動可能)<br />
              <span class="note">この「2ターン毎」は再行動では短縮できず、純粋にターン経過を要する</span>
            </li>
            <li>ノヴァ：アタック/マジック+5%、スキル与ダメージ+10%、範囲スキル使用時、更にスキル与ダメージ+10%</li>
            <li>アイアン：最大HP+10%、ダメージ耐性+15%</li>
            <li>リフレクト：最大HP+10%、敵ターンでの戦闘時、その戦闘後、確率(40%)で自ユニットの受けたダメージの40%を反射する</li>
            <li>
              バックアップ：最大HP+10%、自身を中心とした範囲3マス以内の全ての味方メインのディフェンス/レジスト+5%<br />
              <span class="note">バックアップバフ同士は競合となる。(= バックアップ持ち2人の範囲内にいても+5%止まり)</span>
            </li>
            <li>アイス：ディフェンス/レジスト+5%、戦闘後、確率(10%)で敵ユニットにフリーズ(1ターン)を付与する</li>
            <li>ブライト：ディフェンス/レジスト+5%、治療効果+25%</li>
            <li>クリスタル：ディフェンス/レジスト+5%、自ユニットのHPが50%以下の時、戦闘後、確率(40%)でメイン、サポートそれぞれのHPが最大の20%回復</li>
            <li>ストライク：クリティカル率+7%、クリティカルダメージ倍率+30%</li>
            <li>ブレイク：クリティカル率+7%、味方ターンでの戦闘時、かつ敵ユニットのHPが50%以上の時、与ダメージ+20%</li>
          </ul>
          <br />
          クラス間の有利不利は戦闘時のバフ・デバフという形で表現されています。(以下は 2023/03 時点の仕様。改修が予告されている)<br />
          メイン・サポート両方に個別に適用されます。<br />
          なお、これらは通常の戦闘前バフとは異なり、範囲攻撃にも適用されます。<br />
          <ul>
            <li>ソルジャー：対ランサー時アタック+40%、対ライダー時アタック-30%</li>
            <li>ランサー：対ライダー時アタック+30%、対ソルジャー時アタック-20%</li>
            <li>ライダー：対ソルジャー時アタック+20%、対ランサー時アタック-30%</li>
            <li>シューター：対エアリアル時アタック+30%</li>
          </ul>
          <br />
          マスタークラス特性にはバフを得るものがあります。<br />
          以下いずれもマスタークラス 3 での効果で、「自ユニットの」の記載がないものはメインのみが対象です。<br />
          <ul>
            <li>ランサー：アタックに基礎ディフェンス値の 30% を加算、敵ターンでの戦闘時、自ユニットのディフェンス+10%</li>
            <li>
              ライダー：味方ターンでの戦闘時、自ユニットのアタックに 移動したマス×10% 加算 (最大50%)<br />
              <span class="note">再行動した場合、移動したマスは 2 回目の行動には引き継がれず、積み直しとなる。</span>
            </li>
            <li>
              エアリアル：隣接する味方ユニットが 2 体以内のとき、自ユニットの最大 HP 以外の全能力+20%<br />
              <span class="note">2 体以内 = 0 or 1 or 2 体。斜めマスは含まない。</span>
            </li>
            <li>シューター：自ユニットにディフェンス無視+30%付与</li>
            <li>
              ソーサラー：自ユニットにレジスト無視+30%付与<br />
              <span class="note">防御無視効果については下記ダメージ計算を参照。</span>
            </li>
          </ul>
          <br />
          スターフォースクエストでは、所持している全キャラの☆の合計×0.2% 分 アタックとマジックへのバフを得ます。<span class="note">= ☆500 で +100%。</span><br />
          <br />
          装備の効果は特に記載がない場合メインのみが対象である点に注意が必要です。<br />
          サポートも対象の効果は「自ユニットの」という記述があり、区別されています。<br />
          <span class="note">例: <b-link :ref="po">天蠍の天鎧</b-link> のダメージ耐性はメインのみが対象、<b-link :ref="po">乙女の天衣</b-link> のダメージ耐性はサポートも対象。</span><br />
          同様に、アミュレットの効果はサポートのみが対象となります。シールドはサポートが倒れている場合発動しません。<br />
          <br />
          アンドロメダの<b-link :ref="po">神に勝る美</b-link>やオリオンの<b-link :ref="po">俺の女に手は出させない</b-link>は、HP が 75% ちょうどの場合、以上以下両方の効果が発動します。<br />
          <span class="note"><b-link :ref="po">天秤の天帽</b-link>などの自傷効果で 25% 減らすことができるが、最大 HP が 4 で割り切れる数でないと 76% になってしまう模様。</span><br />
        </p>

        <h2><a name="damage" href="#damage"></a>ダメージ計算</h2>
        <div class="panel">
          <b-container>
            <b-row>
              <b-col style="text-align:center">
                <h5 style="margin-bottom: 10px">ダメージシミュレータ</h5>
              </b-col>
            </b-row>
          </b-container>
          <div class="flex">
            <div>
              <b-container>
                <b-form-row>
                  <b-col style="text-align:center">
                    <h6>攻撃側：メイン</h6>
                  </b-col>
                </b-form-row>
                <b-form-row v-for="(param, name, index) in dmg.main" :key="index">
                  <b-col style="text-align: right" align-self="end">
                    <label style="width: 14em" :class="getParamClass(param)" :for="`dmg-main-${name}`">{{param.label}}</label>
                  </b-col>
                  <b-col>
                    <b-form-input v-if="param.type == 'number'" style="width: 5em" :id="`dmg-main-${name}`" v-model.number="param.value"
                                  size="sm" type="number" class="input-param" :min="param.min" :max="param.max" :disabled="param.disabled()"></b-form-input>
                    <b-form-checkbox style="width: 5em" :id="`dmg-main-${name}`" v-model="param.value" size="sm"
                                     :disabled="param.disabled()" plain v-if="param.type == 'bool'"></b-form-checkbox>
                  </b-col>
                </b-form-row>
              </b-container>
            </div>
            <div>
              <b-container>
                <b-form-row>
                  <b-col style="text-align:center">
                    <h6>攻撃側：サポート <b-form-checkbox inline plain id="bp-support-enabled" v-model="dmg.supportEnabled" /></h6>
                  </b-col>
                </b-form-row>
                <b-form-row v-for="(param, name, index) in dmg.support" :key="index">
                  <b-col style="text-align: right" align-self="end">
                    <label style="width: 14em" :class="getParamClass(param)" :for="`dmg-support-${name}`">{{param.label}}</label>
                  </b-col>
                  <b-col>
                    <b-form-input v-if="param.type == 'number'" style="width: 5em" :id="`dmg-support-${name}`" v-model.number="param.value"
                                  size="sm" type="number" class="input-param" :min="param.min" :max="param.max" :disabled="param.disabled()"></b-form-input>
                    <b-form-checkbox style="width: 5em" :id="`dmg-support-${name}`" v-model="param.value" size="sm" plain
                                     :disabled="param.disabled()" v-if="param.type == 'bool'"></b-form-checkbox>
                  </b-col>
                </b-form-row>
              </b-container>
            </div>
            <div>
              <b-container>
                <b-form-row>
                  <b-col style="text-align: center">
                    <h6>受け側</h6>
                  </b-col>
                </b-form-row>
                <b-form-row v-for="(param, name, index) in dmg.attacked" :key="index">
                  <b-col style="text-align:right" align-self="end">
                    <label style="width: 11em" :class="getParamClass(param)" :for="`dmg-attacked-${name}`">{{param.label}}</label>
                  </b-col>
                  <b-col>
                    <b-form-input v-if="param.type == 'number'" style="width: 5em" :id="`dmg-attacked-${name}`" v-model.number="param.value"
                                  size="sm" type="number" class="input-param" :min="param.min" :max="param.max"></b-form-input>
                  </b-col>
                </b-form-row>
              </b-container>
            </div>
          </div>
          <div>
            <b-container>
              <h5 style="margin-bottom: 10px">ダメージ: {{dmgResult}}</h5>
              <b-button id="dmg-copy-url" @click="copyToClipboard(dmgUrl)">パラメータを URL としてコピー</b-button>
              <b-popover target="dmg-copy-url" triggers="click blur" placement="top" custom-class="url-popover">
                コピーしました：<br />{{ dmgUrl }}
              </b-popover>
            </b-container>
          </div>
        </div>
        <p>
          れじぇくろのダメージ計算式は以下のようになっています。<br />
          <code>ダメージ＝(攻撃側の攻撃力－受ける側の防御力)×(スキルのダメージ倍率)×(与ダメージバフ・デバフ)×(ダメージ耐性バフ・デバフ)×(クリティカルダメージ倍率)×乱数×10</code><br />
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
              スキルのダメージ倍率はメインにのみ適用され、攻撃力－防御力 の後の数値にかかる。<span class="note">なので、倍率の低い範囲攻撃は高防御の敵に特別弱いわけではない。</span>
            </li>
            <li>
              ダメージ耐性バフ・デバフと与ダメージバフ・デバフは掛け算の関係。
              <ul>
                <li>ダメージ耐性バフと与ダメージデバフはどちらも 70% が効果の上限。<span class="note">両方最大まで盛ると 0.3×0.3=9% まで被ダメージを抑え込める。</span></li>
              </ul>
            </li>
            <li>
              クリティカル発生時はクリティカルダメージ倍率が適用される。この倍率は 30% + バフ効果量。
              <ul>
                <li>クリティカル発生率は テクニック÷10 + クリティカル率バフ - 相手のクリティカル率耐性 とみられる。</li>
                <li>
                  ただし、サポートの攻撃はクリティカルが発生しない模様。<br />
                  <span class="note">ユニット対象バフでクリティカル率 100% にしてもサポートのダメージにはクリティカルダメージ倍率が適用されない。</span>
                </li>
              </ul>
            </li>
            <li>乱数による振れ幅はわずかで、±2% 程度。</li>
            <li>
              遠距離攻撃キャラが近接攻撃した場合、最終ダメージに 0.6 倍される。
              <ul>
                <li>メイン・サポート両方に個別に適用。</li>
                <li>
                  「遠距離攻撃キャラ」の定義は、装備やバフを含まない基礎射程が 2 であること、である模様。<br />
                  <span class="note">基礎射程 1 のキャラを<b-link :ref="po">蒼水晶の槍</b-link>や<b-link :ref="po">天導の聖火</b-link>で射程を伸ばして近接攻撃しても 0.6 倍はされない。</span>
                </li>
              </ul>
            </li>
            <li>
              2回攻撃を持つ場合、最初の一斉攻撃の後、相手が生き残っていたら再度攻撃を行う。<br />
              <span class="note">ギルクエ EX で高スコアを狙う場合、最初の一斉攻撃で倒れない相手を狙う。</span>
            </li>
            <li>
              反射を持つ場合、戦闘後、生き残っていたら受けたダメージの効果量 % 分を固定ダメージとして相手に返す。
              <ul>
                <li>戦闘後に発動するデバフなどについても同様で、戦闘後生き残っていないと発動しない。</li>
                <li><b-link :ref="po">ラストスタンド</b-link>などで復活しても撃破された扱いであるらしく、発動しない。</li>
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
                <li>ダメージを与えたときに発動する効果などは発動する。</li>
                <li>クリティカル判定はメイン・サポート個別に行われる。</li>
                <li>
                  範囲攻撃によりメインがサポートより先に倒れた場合、ユニット自体撃破された扱いになる。<br />
                  <span class="note">つまり、範囲攻撃の連打でやられるようなケースでは、サポートをいくら固くしても対策にならない。</span>
                </li>
              </ul>
            </li>
          </ul>
        </p>

        <h2><a name="status" href="#status"></a>基礎ステータスについて</h2>
        <div class="panel" style="padding: 10px 0px 0px 0px;">
          <b-container>
            <b-row>
              <b-col style="text-align:center">
                <h5 style="margin-bottom: 5px">ステータスシミュレータ</h5>
              </b-col>
            </b-row>
          </b-container>

          <b-tabs nav-class="tab-index" v-model="stat.tabIndex">
            <b-tab title="メインキャラ" style="padding: 10px 10px 0px 10px">
              <div class="flex">
                <div>
                  <b-container>
                    <div style="text-align:center">
                      <h6 style="margin: 5px 0px">基本情報</h6>
                    </div>
                    <b-form-row v-for="(param, name, index) in stat.main" :key="index">
                      <b-col style="text-align: right" align-self="end">
                        <label :for="`stat-main-${name}`">{{param.label}}</label>
                      </b-col>
                      <b-col>
                        <b-form-input v-if="param.type == 'number'" style="width: 5em" :id="`stat-main-${name}`" v-model.number="param.value" size="sm" type="number" class="input-param" :min="param.min" :max="param.max"></b-form-input>
                        <b-form-checkbox v-if="param.type == 'bool'" style="width: 5em" :id="`stat-main-${name}`" v-model="param.value" size="sm" plain></b-form-checkbox>
                        <b-dropdown v-if="param.type == 'character'" style="width: 15em" :text="param.value ? param.value.name : '(なし)'" size="sm" class="input-dropdown" id="stat-main-${name}" menu-class="long-dropdown">
                          <b-dropdown-item v-for="(c, i) in mainChrs" :key="i" @click="param.value=c; stat.validateItems();">
                            {{ c.name }}
                          </b-dropdown-item>
                        </b-dropdown>
                      </b-col>
                    </b-form-row>
                  </b-container>
                </div>
                <div>
                  <b-container>
                    <div style="text-align:center">
                      <h6 style="margin: 5px 0px">記憶の書＋強化ボード</h6>
                    </div>
                    <b-form-row v-for="(param, name, index) in stat.mainBoosts" :key="index">
                      <b-col style="text-align: right" align-self="end">
                        <label style="width: 9em" :for="`stat-main-${name}`">{{param.label}}</label>
                      </b-col>
                      <b-col>
                        <b-form-input v-if="param.type == 'number'" style="width: 4em" :id="`stat-main-${name}`" v-model.number="param.value" size="sm" type="number" class="input-param" :min="param.min" :max="param.max"></b-form-input>
                      </b-col>
                    </b-form-row>
                  </b-container>
                </div>
                <div>
                  <b-container>
                    <div style="text-align:center">
                      <h6 style="margin: 5px 0px">装備</h6>
                    </div>
                    <b-form-row v-for="(param, name, index) in stat.mainItems" :key="index">
                      <b-col cols="4" style="text-align: right">
                        <label style="width: 5em" :for="`stat-main-item-${name}`">{{param.label}}</label>
                      </b-col>
                      <b-col>
                        <b-dropdown v-if="param.type == 'weapon'" style="width: 14em" :text="param.value ? param.value.name : '(なし)'" size="sm" class="input-dropdown" id="stat-main-item-${name}" menu-class="long-dropdown">
                          <b-dropdown-item @click="param.value=null">(なし)</b-dropdown-item>
                          <b-dropdown-item v-for="(c, i) in stat.validWeapons()" :key="i" @click="param.value=c">{{ c.name }}</b-dropdown-item>
                        </b-dropdown>
                        <b-dropdown v-if="param.type == 'armor'" style="width: 14em" :text="param.value ? param.value.name : '(なし)'" size="sm" class="input-dropdown" id="stat-main-item-${name}" menu-class="long-dropdown">
                          <b-dropdown-item @click="param.value=null">(なし)</b-dropdown-item>
                          <b-dropdown-item v-for="(c, i) in stat.validArmors()" :key="i" @click="param.value=c">{{ c.name }}</b-dropdown-item>
                        </b-dropdown>
                        <b-dropdown v-if="param.type == 'helmet'" style="width: 14em" :text="param.value ? param.value.name : '(なし)'" size="sm" class="input-dropdown" id="stat-main-item-${name}" menu-class="long-dropdown">
                          <b-dropdown-item @click="param.value=null">(なし)</b-dropdown-item>
                          <b-dropdown-item v-for="(c, i) in stat.validHelmets()" :key="i" @click="param.value=c">{{ c.name }}</b-dropdown-item>
                        </b-dropdown>
                        <b-dropdown v-if="param.type == 'accessory'" style="width: 14em" :text="param.value ? param.value.name : '(なし)'" size="sm" class="input-dropdown" id="stat-main-item-${name}" menu-class="long-dropdown">
                          <b-dropdown-item @click="param.value=null">(なし)</b-dropdown-item>
                          <b-dropdown-item v-for="(c, i) in stat.validAccessories()" :key="i" @click="param.value=c">{{ c.name }}</b-dropdown-item>
                        </b-dropdown>
                      </b-col>
                    </b-form-row>

                    <div style="text-align:center">
                      <h6 style="margin: 5px 0px">エンチャント</h6>
                    </div>
                    <b-form-row v-for="(param, name, index) in stat.mainEnchants" :key="'enchant' + index">
                      <b-col style="text-align: right" align-self="end">
                        <label style="width: 10em" :for="`stat-main-enchant-${name}P`">{{param.label}} (%)</label>
                      </b-col>
                      <b-col>
                        <b-form-input style="width: 4em" :id="`stat-main-enchant-${name}P`" v-model.number="param.valueP" size="sm" type="number" class="input-param" :min="0"></b-form-input>
                      </b-col>
                      <b-col style="text-align: right" align-self="end">
                        <label style="width: 4em" :for="`stat-main-enchant-${name}F`"> (固定値)</label>
                      </b-col>
                      <b-col>
                        <b-form-input style="width: 4em" :id="`stat-main-enchant-${name}F`" v-model.number="param.valueF" size="sm" type="number" class="input-param" :min="0"></b-form-input>
                      </b-col>
                    </b-form-row>
                  </b-container>
                </div>
              </div>
              <div>
                <b-container>
                  <div class="status flex" style="margin-bottom: 10px">
                    <h5>基礎ステータス:</h5>
                    <div class="param-box"><b-img-lazy :src="getImageURL('HP')" title="HP" width="18" height="18" /><span>{{statMainResult[0]}}</span></div>
                    <div class="param-box"><b-img-lazy :src="getImageURL('アタック')" title="アタック" width="18" height="18" /><span>{{statMainResult[1]}}</span></div>
                    <div class="param-box"><b-img-lazy :src="getImageURL('ディフェンス')" title="ディフェンス" width="18" height="18" /><span>{{statMainResult[2]}}</span></div>
                    <div class="param-box"><b-img-lazy :src="getImageURL('マジック')" title="マジック" width="18" height="18" /><span>{{statMainResult[3]}}</span></div>
                    <div class="param-box"><b-img-lazy :src="getImageURL('レジスト')" title="レジスト" width="18" height="18" /><span>{{statMainResult[4]}}</span></div>
                    <div class="param-box"><b-img-lazy :src="getImageURL('テクニック')" title="テクニック" width="18" height="18" /><span>{{statMainResult[5]}}</span></div>
                    <div class="param-box"><span class="param-name">戦闘力:</span><span class="param-value">{{statMainResult[6]}}</span></div>
                    <div class="param-box" v-if="statMainResult[7]"><span class="param-name">サポート込み戦闘力:</span><span class="param-value">{{statMainResult[7]}}</span></div>
                  </div>
                </b-container>
              </div>
            </b-tab>
            <b-tab title="サポートキャラ" style="padding: 10px 10px 0px 10px ">
              <div class="flex">
                <div>
                  <b-container>
                    <div style="text-align:center">
                      <h6 style="margin: 5px 0px">基本情報</h6>
                    </div>
                    <b-form-row v-for="(param, name, index) in stat.support" :key="index">
                      <b-col style="text-align: right" align-self="end">
                        <label :for="`stat-sup-${name}`">{{param.label}}</label>
                      </b-col>
                      <b-col>
                        <b-form-input v-if="param.type == 'number'" style="width: 5em" :id="`stat-sup-${name}`" v-model.number="param.value" size="sm" type="number" class="input-param" :min="param.min" :max="param.max"></b-form-input>
                        <b-form-checkbox v-if="param.type == 'bool'" style="width: 5em" :id="`stat-sup-${name}`" v-model="param.value" size="sm" plain></b-form-checkbox>
                        <b-dropdown v-if="param.type == 'character'" style="width: 15em" :text="param.value ? param.value.name : '(なし)'" size="sm" class="input-dropdown" id="stat-sup-${name}" menu-class="long-dropdown">
                          <b-dropdown-item @click="param.value=null">(なし)</b-dropdown-item>
                          <b-dropdown-item v-for="(c, i) in supChrs" :key="i" @click="param.value=c">
                            {{ c.name }}
                          </b-dropdown-item>
                        </b-dropdown>
                      </b-col>
                    </b-form-row>
                  </b-container>
                </div>
                <div>
                  <b-container>
                    <div style="text-align:center">
                      <h6 style="margin: 5px 0px">記憶の書＋強化ボード</h6>
                    </div>
                    <b-form-row v-for="(param, name, index) in stat.supportBoosts" :key="index">
                      <b-col style="text-align: right" align-self="end">
                        <label style="width: 9em" :for="`stat-sup-${name}`">{{param.label}}</label>
                      </b-col>
                      <b-col>
                        <b-form-input v-if="param.type == 'number'" style="width: 4em" :id="`stat-sup-${name}`" v-model.number="param.value" size="sm" type="number" class="input-param" :min="param.min" :max="param.max"></b-form-input>
                      </b-col>
                    </b-form-row>
                  </b-container>
                </div>
                <div>
                  <b-container>
                    <div style="text-align:center">
                      <h6 style="margin: 5px 0px">装備</h6>
                    </div>
                    <b-form-row v-for="(param, name, index) in stat.supportItems" :key="index">
                      <b-col style="text-align: right">
                        <label style="width: 10em" :for="`stat-sup-item-${name}`">{{param.label}}</label>
                      </b-col>
                      <b-col>
                        <b-dropdown v-if="param.type == 'amulet1'" style="width: 14em" :text="param.value ? param.value.name : '(なし)'" size="sm" class="input-dropdown" id="stat-sup-item-${name}" menu-class="long-dropdown">
                          <b-dropdown-item @click="param.value=null">(なし)</b-dropdown-item>
                          <b-dropdown-item v-for="(c, i) in amulets1" :key="i" @click="param.value=c">{{ c.name }}</b-dropdown-item>
                        </b-dropdown>
                        <b-dropdown v-if="param.type == 'amulet2'" style="width: 14em" :text="param.value ? param.value.name : '(なし)'" size="sm" class="input-dropdown" id="stat-sup-item-${name}" menu-class="long-dropdown">
                          <b-dropdown-item @click="param.value=null">(なし)</b-dropdown-item>
                          <b-dropdown-item v-for="(c, i) in amulets2" :key="i" @click="param.value=c">{{ c.name }}</b-dropdown-item>
                        </b-dropdown>
                      </b-col>
                    </b-form-row>

                    <div style="text-align:center">
                      <h6 style="margin: 5px 0px">アミュレットスキル</h6>
                    </div>
                    <b-form-row v-for="(param, name, index) in stat.supportEnchants" :key="'enchant' + index">
                      <b-col style="text-align: right" align-self="end">
                        <label style="width: 10em" :for="`stat-sup-enchant-${name}P`">{{param.label}} (%)</label>
                      </b-col>
                      <b-col>
                        <b-form-input style="width: 4em" :id="`stat-sup-enchant-${name}P`" v-model.number="param.valueP" size="sm" type="number" class="input-param" :min="0"></b-form-input>
                      </b-col>
                    </b-form-row>
                  </b-container>
                </div>
              </div>
              <div>
                <b-container>
                  <div v-if="stat.support.character.value" class="status flex" style="margin-bottom: 10px">
                    <h5>基礎ステータス:</h5>
                    <div class="param-box"><b-img-lazy :src="getImageURL('HP')" title="HP" width="18" height="18" /><span>{{statSupportResult[0]}}</span></div>
                    <div class="param-box" v-if="stat.support.character.value.damageType=='アタック'"><b-img-lazy :src="getImageURL('アタック')" title="アタック" width="18" height="18" /><span>{{statSupportResult[1]}}</span></div>
                    <div class="param-box" v-if="stat.support.character.value.damageType=='マジック'"><b-img-lazy :src="getImageURL('マジック')" title="マジック" width="18" height="18" /><span>{{statSupportResult[3]}}</span></div>
                    <div class="param-box"><b-img-lazy :src="getImageURL('ディフェンス')" title="ディフェンス" width="18" height="18" /><span>{{statSupportResult[2]}}</span></div>
                    <div class="param-box"><b-img-lazy :src="getImageURL('レジスト')" title="レジスト" width="18" height="18" /><span>{{statSupportResult[4]}}</span></div>
                    <div class="param-box"><span class="param-name">戦闘力:</span><span class="param-value">{{statSupportResult[6]}}</span></div>
                  </div>
                </b-container>
              </div>
            </b-tab>
          </b-tabs>
          <div style="padding: 0px 10px 10px 10px">
            <b-container>
              <div style="margin-bottom: 10px">
                <b-dropdown text="自動装備＆エンチャント" size="sm" id="stat-auto-equip">
                  <b-dropdown-item class="d-flex flex-column" v-for="(c, i) in stat.autoEquipTypes" :key="i" @click="stat.autoEquip(i)">
                    {{ c }}
                  </b-dropdown-item>
                </b-dropdown>
                <b-button id="stat-highscore" @click="stat.highscoreSearch()" style="margin-left: 5px">このレベルで戦闘力が高い組み合わせを探す</b-button>
                <b-table v-if="stat.highscoreData.length" small outlined sticky-header :items="stat.highscoreData" :fields="stat.highscoreFields">
                  <template #cell(actions)="row">
                    <b-button size="sm" @click="stat.highscoreReplay(row.item)" style="padding: 1px 10px">
                      再現
                    </b-button>
                  </template>
                </b-table>
              </div>
              <div>
                <b-button id="stat-copy-url" @click="copyToClipboard(statUrl)">パラメータを URL としてコピー</b-button>
                <b-popover target="stat-copy-url" triggers="click blur" placement="top" custom-class="url-popover">
                  コピーしました：<br />{{ statUrl }}
                </b-popover>
              </div>
            </b-container>
          </div>
        </div>
        <p class="desc">
          基礎ステータスとは、戦闘前に決定するステータス値で、キャラ画面の情報で表示されるものがそれになります。<br />
          割合バフや「能力値の n %を加算」系の効果は基礎ステータスに対してかかります。戦闘力も基礎ステータスから算出されます。<br />
          基礎ステータスは以下のように算出されます。<br />
          <br />
          <code>基礎ステータス＝(初期値＋レベル上昇値＋☆上昇値＋好感度ボーナス＋マスターボーナス)×(記憶の書＋強化ボード)×(割合エンチャントorアミュレットスキル)＋装備＋固定値エンチャント</code><br />
          <br />
          <ul>
            <li>初期値、レベル上昇値、☆による上昇値 はキャラ固有</li>
            <li>好感度ボーナスは全開放時 <span style="background: white">[100, 25, 15, 25, 15, 0]</span> ([HP, アタック, ディフェンス, マジック, レジスト, テクニック] の順、以後共通)</li>
            <li>
              マスターボーナスはクラスレベルに応じて得られる上昇値で、メインとサポートで内容が異なる
              <b-table small outlined :items="stat.masterBonus"></b-table>
            </li>
            <li>
              記憶の書と強化ボードの合計はカンスト時以下になる
              <b-table small outlined :items="stat.bookBonus"></b-table>
            </li>
            <li>
              エンチャントの上限は割合と固定値でそれぞれ以下になる (SSR の場合。テクニックには影響しないので除外)
              <b-table small outlined :items="stat.enchantBonus"></b-table>
              <ul>
                <li>アクセサリの場合他にクリティカル率があり、こちらは 15% が上限。テクニックとは別物で基礎ステータスには影響しない</li>
              </ul>
            </li>
            <li>
              アミュレットスキルは割合上昇のみで、上限は以下になる (こちらも SSR の場合。テクニックには影響しないので除外)
              <b-table small outlined :items="stat.amuletBonus"></b-table>
              <ul>
                <li>スキル1は戦闘時に効果を発揮するタイプで、基礎ステータスには影響しない</li>
              </ul>
            </li>
          </ul>
        </p>
        <h2><a name="battle_power" href="#battle_power"></a>戦闘力について</h2>
        <div class="panel">
          <b-container>
            <b-row>
              <b-col style="text-align:center">
                <h5 style="margin-bottom: 10px">戦闘力シミュレータ</h5>
              </b-col>
            </b-row>
          </b-container>
          <div class="flex">
            <div>
              <b-container>
                <b-form-row>
                  <b-col style="text-align:center">
                    <h6>メインキャラ <b-form-checkbox inline plain id="bp-support-enabled" v-model="bp.mainEnabled" /></h6>
                  </b-col>
                </b-form-row>
                <b-form-row v-for="(param, name, index) in bp.main" :key="index">
                  <b-col style="text-align: right" align-self="end">
                    <label style="width: 10em" :class="getParamClass(param)" :for="`bp-main-${name}`">{{param.label}}</label>
                  </b-col>
                  <b-col>
                    <b-form-input v-if="param.type == 'number'" style="width: 5em" :id="`bp-main-${name}`" v-model.number="param.value"
                                  size="sm" type="number" class="input-param" :min="param.min" :max="param.max" :disabled="param.disabled()"></b-form-input>
                    <b-form-checkbox style="width: 5em" :id="`bp-main-${name}`" v-model="param.value" size="sm" plain
                                     :disabled="param.disabled()" v-if="param.type == 'bool'"></b-form-checkbox>
                  </b-col>
                </b-form-row>
              </b-container>
            </div>
            <div>
              <b-container>
                <b-form-row>
                  <b-col style="text-align: center">
                    <h6>サポートキャラ <b-form-checkbox inline plain id="bp-support-enabled" v-model="bp.supportEnabled" /></h6>
                  </b-col>
                </b-form-row>
                <b-form-row v-for="(param, name, index) in bp.support" :key="index">
                  <b-col style="text-align:right" align-self="end">
                    <label style="width: 10em" :class="getParamClass(param)" :for="`bp-support-${name}`">{{param.label}}</label>
                  </b-col>
                  <b-col>
                    <b-form-input v-if="param.type == 'number'" style="width: 5em" :id="`bp-support-${name}`" v-model.number="param.value"
                                  size="sm" type="number" class="input-param" :min="param.min" :max="param.max" :disabled="param.disabled()"></b-form-input>
                  </b-col>
                </b-form-row>
              </b-container>
            </div>
          </div>
          <div>
            <b-container>
              <h5 style="margin-bottom: 10px">戦闘力: {{bpResult}}</h5>
              <b-button id="bp-copy-url" @click="copyToClipboard(bpUrl)">パラメータを URL としてコピー</b-button>
              <b-popover target="bp-copy-url" triggers="click blur" placement="top" custom-class="url-popover">
                コピーしました：<br />{{ bpUrl }}
              </b-popover>
            </b-container>
          </div>
        </div>
        <p>
          戦闘力は以下のように算出されます。<br />
          <br />
          <code>戦闘力＝A(ステータス値に基づく基礎値) × B(☆やマスターレベルなどによる倍率)</code><br />
          A の内訳：<br />
          <code>HP×0.05＋攻撃力×2×(1.0＋テクニック×0.0003)＋ディフェンス×2＋レジスト×2</code><br />
          B の内訳：<br />
          <code>1.0＋☆の数×0.1＋マスターレベル×0.1＋メインの使用スキルコスト×0.03＋メインの装備の☆合計×0.02＋エンチャントが4セット揃っている場合0.1＋サポートのスキルの数×0.05</code><br />
          <br />
          <ul>
            <li>
              攻撃力はそのキャラの攻撃タイプがアタックであればアタック、マジックであればマジック
              <ul>
                <li>アタックキャラのマジック、マジックキャラのアタックは戦闘力に計上されない</li>
              </ul>
            </li>
            <li>
              テクニックはクリティカルを模していると見られ、1000 で攻撃力 1.3 倍相当の効果となる
              <ul>
                <li>1000 が計上される上限となっているかもしれないが、現状そこまで伸ばす方法がなく検証不能</li>
              </ul>
            </li>
            <li>
              ステータス値はメインとサポートの合計
              <ul>
                <li>サポートの攻撃力にもメインのテクニックによる割合が乗る</li>
                <li>メインがアタック、サポートがマジック (またはその逆) の場合でも攻撃力として合算され、それにテクニックによる割合が乗る</li>
              </ul>
            </li>
            <li>
              ☆の数やマスターレベルもメインとサポートの合計
              <ul>
                <li>倍率の加算になるため、サポートとリンクすると戦闘力は単純に合計するよりもずっと大きくなる</li>
              </ul>
            </li>
            <li>エンチャントは 4 セット揃えたとき倍率に 0.1 が加算される</li>
            <li>
              装備の効果は基礎ステータス値が上がるもののみ戦闘力に計上される
              <ul>
                <li>サポートのアミュレットも同様で、戦闘開始後に効果を発揮するもの (割合バフやステータス値の n% を加算系など) は計上されない</li>
                <li>アクセサリのエンチャントのクリティカル率も計上されない</li>
              </ul>
            </li>
          </ul>
        </p>

        <h2><a name="thanks" href="#thanks"></a>謝辞</h2>
        <p>
          <a href="https://discord.gg/7KnBSnRNRx" target="_blank">ニルフガード帝国</a>の皆さん (データ提供、フィードバックなど)
        </p>
      </div>
    </div>

    <template v-for="(e, i) in popoverElements">
      <b-popover :target="e.element" :key="i" triggers="hover focus" custom-class="item_po" :title="e.name" placement="top">
        <div class="flex">
          <div><b-img-lazy :src="getImageURL(e.name)" width="50" height="50" /></div>
          <div v-html="descToHtml(e.item)"></div>
        </div>
        <div v-if="e.item.owners" class="owners">
          所持者:<br />
          <b-img-lazy v-for="(owner, oi) in e.item.owners" :key="oi" :src="getImageURL(owner.name)" :title="owner.name" width="50" height="50" />
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

      dmg: {
        mainEnabled: true,
        supportEnabled: true,
        main: {
          atk: {
            label: "アタック / マジック",
            type: "number",
            min: 0,
            value: 1000,
            disabled: () => !this.dmg.mainEnabled,
          },
          skillDamageRate: {
            label: "スキルダメージ倍率",
            type: "number",
            value: 1.0,
            disabled: () => !this.dmg.mainEnabled,
          },
          damageBuff: {
            label: "与ダメージバフ (%)",
            type: "number",
            min: -70,
            value: 0,
            disabled: () => !this.dmg.mainEnabled,
          },
          critical: {
            label: "クリティカル",
            type: "bool",
            value: true,
            disabled: () => !this.dmg.mainEnabled,
          },
          criticalDamageRate: {
            label: "クリティカルダメージ倍率 (%)",
            type: "number",
            value: 30,
            disabled: () => !this.dmg.mainEnabled || !this.dmg.main.critical.value,
          },
          doubleAttack: {
            label: "2回攻撃",
            type: "bool",
            value: false,
            disabled: () => !this.dmg.mainEnabled,
          },
          rangedPenalty: {
            label: "遠距離キャラの近接ペナルティ",
            type: "bool",
            value: false,
            disabled: () => !this.dmg.mainEnabled,
          },
        },
        support: {
          atk: {
            label: "アタック / マジック",
            type: "number",
            min: 0,
            value: 1000,
            disabled: () => !this.dmg.supportEnabled,
          },
          damageBuff: {
            label: "与ダメージバフ (%)",
            type: "number",
            min: -70,
            value: 0,
            disabled: () => !this.dmg.supportEnabled,
          },
          rangedPenalty: {
            label: "遠距離キャラの近接ペナルティ",
            type: "bool",
            value: false,
            disabled: () => !this.dmg.supportEnabled,
          },
        },
        attacked: {
          def: {
            label: "ディフェンス / レジスト",
            type: "number",
            value: 100,
            disabled: () => false,
          },
          damageRate: {
            label: "ダメージ耐性 (%)",
            type: "number",
            max: 70,
            value: 0,
            disabled: () => false,
          },
          shield: {
            label: "シールド",
            type: "number",
            value: 0,
            disabled: () => false,
          },
        }
      },

      stat: {
        main: {
          character: {
            label: "キャラ",
            type: "character",
            value: 0,
          },
          star: {
            label: "⭐",
            type: "number",
            min: 1,
            max: 6,
            value: 6,
          },
          level: {
            label: "レベル",
            type: "number",
            min: 1,
            value: 110,
          },
          master: {
            label: "マスターレベル",
            type: "number",
            min: 0,
            max: 3,
            value: 3,
          },
          loveBonus: {
            label: "好感度ボーナス",
            type: "bool",
            value: true,
          },
        },
        mainBoosts: {
          hp: {
            label: "HP (%)",
            type: "number",
            min: 0,
            value: 150,
          },
          atk: {
            label: "アタック (%)",
            type: "number",
            min: 0,
            value: 140,
          },
          def: {
            label: "ディフェンス (%)",
            type: "number",
            min: 0,
            value: 130,
          },
          mag: {
            label: "マジック (%)",
            type: "number",
            min: 0,
            value: 140,
          },
          res: {
            label: "レジスト (%)",
            type: "number",
            min: 0,
            value: 130,
          },
          tec: {
            label: "テクニック (%)",
            type: "number",
            min: 0,
            value: 50,
          },
        },
        mainItems: {
          weapon: {
            label: "武器",
            type: "weapon",
            value: null,
          },
          armor: {
            label: "鎧",
            type: "armor",
            value: null,
          },
          helmet: {
            label: "兜",
            type: "helmet",
            value: null,
          },
          accessory: {
            label: "アクセサリ",
            type: "accessory",
            value: null,
          },
        },
        mainEnchants: {
          hp: {
            label: "HP",
            valueP: 0,
            valueF: 0,
          },
          atk: {
            label: "アタック",
            valueP: 0,
            valueF: 0,
          },
          def: {
            label: "ディフェンス",
            valueP: 0,
            valueF: 0,
          },
          mag: {
            label: "マジック",
            valueP: 0,
            valueF: 0,
          },
          res: {
            label: "レジスト",
            valueP: 0,
            valueF: 0,
          },
        },

        support: {
          character: {
            label: "キャラ",
            type: "character",
            value: 0,
          },
          star: {
            label: "⭐",
            type: "number",
            min: 1,
            max: 6,
            value: 6,
          },
          level: {
            label: "レベル",
            type: "number",
            min: 1,
            value: 110,
          },
          master: {
            label: "マスターレベル",
            type: "number",
            min: 0,
            max: 3,
            value: 3,
          },
          loveBonus: {
            label: "好感度ボーナス",
            type: "bool",
            value: true,
          },
        },
        supportBoosts: {
          hp: {
            label: "HP (%)",
            type: "number",
            min: 0,
            value: 110,
          },
          atk: {
            label: "アタック (%)",
            type: "number",
            min: 0,
            value: 120,
          },
          def: {
            label: "ディフェンス (%)",
            type: "number",
            min: 0,
            value: 110,
          },
          mag: {
            label: "マジック (%)",
            type: "number",
            min: 0,
            value: 120,
          },
          res: {
            label: "レジスト (%)",
            type: "number",
            min: 0,
            value: 110,
          },
        },
        supportItems: {
          amulet1: {
            label: "月のアミュレット",
            type: "amulet1",
            value: null,
          },
          amulet2: {
            label: "太陽のアミュレット",
            type: "amulet2",
            value: null,
          },
        },
        supportEnchants: {
          hp: {
            label: "HP",
            valueP: 0,
            valueF: 0,
          },
          atk: {
            label: "アタック",
            valueP: 0,
            valueF: 0,
          },
          def: {
            label: "ディフェンス",
            valueP: 0,
            valueF: 0,
          },
          mag: {
            label: "マジック",
            valueP: 0,
            valueF: 0,
          },
          res: {
            label: "レジスト",
            valueP: 0,
            valueF: 0,
          },
        },

        masterBonus: [
          { "種類": "メイン", "レベル1": [200, 0, 0, 0, 0, 0], "レベル2": [400, 0, 0, 0, 0, 0], "レベル3": [800, 0, 0, 0, 0, 0] },
          { "種類": "サポート", "レベル1": [300, 15, 8, 15, 8, 0], "レベル2": [600, 30, 16, 30, 16, 0], "レベル3": [1200, 55, 28, 55, 28, 0] },
        ],
        bookBonus: [
          { "種類": "メイン", "上昇率 (%)": [150, 140, 130, 140, 130, 50] },
          { "種類": "サポート", "上昇率 (%)": [110, 120, 110, 120, 110, 0] },
        ],
        enchantBonus: [
          { "種類": "武器", "割合 (%)": [10, 15, 5, 15, 5], "固定値": [131, 31, 7, 31, 7] },
          { "種類": "鎧", "割合 (%)": [15, 5, 15, 5, 15], "固定値": [200, 11, 19, 11, 19] },
          { "種類": "兜", "割合 (%)": [15, 5, 15, 5, 15], "固定値": [200, 11, 19, 11, 19] },
          { "種類": "アクセサリ", "割合 (%)": [10, 10, 10, 10, 10], "固定値": [131, 21, 13, 21, 13] },
          { "種類": "合計", "割合 (%)": [50, 35, 45, 35, 45], "固定値": [662, 74, 58, 74, 58] },
        ],
        amuletBonus: [
          { "種類": "月アミュレットスキル2", "割合 (%)": [7.5, 7.5, 7.5, 7.5, 7.5] },
          { "種類": "太陽アミュレットスキル2", "割合 (%)": [7.5, 7.5, 7.5, 7.5, 7.5] },
          { "種類": "合計", "割合 (%)": [15, 15, 15, 15, 15] },
        ],

        autoEquipTypes: [
          "戦闘力優先",
          "HP 優先",
          "アタック優先",
          "ディフェンス優先",
          "マジック優先",
          "レジスト優先",
          "テクニック優先",
          "リセット",
        ],

        tabIndex: 0,
        highscoreData: [],
        highscoreFields: [
          {
            key: "index",
            label: "順位",
          },
          {
            key: "bp",
            label: "戦闘力",
          },
          {
            key: "main",
            label: "メイン",
          },
          {
            key: "support",
            label: "サポート",
          },
          {
            key: "actions",
            label: "アクション",
          }
        ],
      },

      bp: {
        mainEnabled: true,
        supportEnabled: true,
        main: {
          stars: {
            label: "⭐",
            type: "number",
            min: 1,
            max: 6,
            value: 6,
            disabled: () => !this.bp.mainEnabled,
          },
          master: {
            label: "マスターレベル",
            type: "number",
            min: 0,
            max: 3,
            value: 3,
            disabled: () => !this.bp.mainEnabled,
          },
          hp: {
            label: "HP",
            type: "number",
            min: 0,
            value: 15000,
            disabled: () => !this.bp.mainEnabled,
          },
          atk: {
            label: "アタック / マジック",
            type: "number",
            min: 0,
            value: 1500,
            disabled: () => !this.bp.mainEnabled,
          },
          def: {
            label: "ディフェンス",
            type: "number",
            min: 0,
            value: 500,
            disabled: () => !this.bp.mainEnabled,
          },
          res: {
            label: "レジスト",
            type: "number",
            min: 0,
            value: 500,
            disabled: () => !this.bp.mainEnabled,
          },
          tec: {
            label: "テクニック",
            type: "number",
            min: 0,
            value: 100,
            disabled: () => !this.bp.mainEnabled,
          },
          skillCost: {
            label: "スキルコスト",
            type: "number",
            value: 6,
            min: 0,
            max: 6,
            disabled: () => !this.bp.mainEnabled,
          },
          eqStars: {
            label: "装備の⭐合計",
            type: "number",
            min: 0,
            max: 20,
            value: 20,
            disabled: () => !this.bp.mainEnabled,
          },
          enchant: {
            label: "エンチャント4セット",
            type: "bool",
            value: true,
            disabled: () => !this.bp.mainEnabled,
          },
        },
        support: {
          stars: {
            label: "⭐",
            type: "number",
            min: 1,
            max: 6,
            value: 6,
            disabled: () => !this.bp.supportEnabled,
          },
          master: {
            label: "マスターレベル",
            type: "number",
            min: 0,
            max: 3,
            value: 3,
            disabled: () => !this.bp.supportEnabled,
          },
          hp: {
            label: "HP",
            type: "number",
            min: 0,
            value: 15000,
            disabled: () => !this.bp.supportEnabled,
          },
          atk: {
            label: "アタック / マジック",
            type: "number",
            min: 0,
            value: 1500,
            disabled: () => !this.bp.supportEnabled,
          },
          def: {
            label: "ディフェンス",
            type: "number",
            min: 0,
            value: 500,
            disabled: () => !this.bp.supportEnabled,
          },
          res: {
            label: "レジスト",
            type: "number",
            min: 0,
            value: 500,
            disabled: () => !this.bp.supportEnabled,
          },
          skills: {
            label: "解放済みスキル",
            type: "number",
            min: 1,
            max: 3,
            value: 3,
            disabled: () => !this.bp.supportEnabled,
          },
        }
      }
    };
  },

  created() {
    this.mainSkills = structuredClone(jsonMainSkills);
    this.supSkills = structuredClone(jsonSupportSkills);
    this.mainChrs = structuredClone(jsonMainChrs).filter(a => !a.hidden);
    this.supChrs = structuredClone(jsonSupportChrs).filter(a => !a.hidden);
    this.items = structuredClone(jsonItems).filter(a => !a.hidden || a.slot == "アミュレット");

    for (let i = 0; i < this.mainChrs.length; ++i) {
      let chr = this.mainChrs[i];
      chr.index = i + 1;
    }

    for (let i = 0; i < this.supChrs.length; ++i) {
      let chr = this.supChrs[i];
      chr.index = i + 1;
    }

    for (let i = 0; i < this.items.length; ++i) {
      let item = this.items[i];
      item.index = i + 1;
    }

    this.mainChrs.sort((a, b) => b.date.localeCompare(a.date));
    this.supChrs.sort((a, b) => b.date.localeCompare(a.date));
    this.items.sort((a, b) => b.date.localeCompare(a.date));

    this.weapons = this.items.filter(a => a.slot == "武器");
    this.armors = this.items.filter(a => a.slot == "鎧");
    this.helmets = this.items.filter(a => a.slot == "兜");
    this.accessories = this.items.filter(a => a.slot == "アクセサリ");
    this.amulets1 = this.items.filter(a => a.slot == "アミュレット" && a.amuletType == "月");
    this.amulets2 = this.items.filter(a => a.slot == "アミュレット" && a.amuletType == "太陽");

    this.stat.main.character.value = this.mainChrs[0];
    //this.stat.support.character.value = this.supChrs[0];

    const matchClass = function (item, chr) {
      if (item) {
        if (!item.classes || item.classes.includes(chr.class))
          return true;
      }
      return false;
    };
    const mainCanEquip = function (item, slot = null) {
      if (matchClass(item, this.stat.main.character.value)) {
        if (!slot || item.slot == slot)
          return true;
      }
      return false;
    }.bind(this);
    const supportCanEquip = function (item, slot, aux) {
      if (item) {
        if (!slot || item.slot == slot) {
          if (slot == "アミュレット")
            return !aux || item.amuletType == aux;
          else
            return true;
        }
      }
      return false;
    }.bind(this);

    this.stat.validWeapons = (() => this.weapons.filter(a => mainCanEquip(a))).bind(this);
    this.stat.validArmors = (() => this.armors.filter(a => mainCanEquip(a))).bind(this);
    this.stat.validHelmets = (() => this.helmets.filter(a => mainCanEquip(a))).bind(this);
    this.stat.validAccessories = (() => this.accessories.filter(a => mainCanEquip(a))).bind(this);

    this.stat.validateItems = function () {
      var mainItems = this.stat.mainItems;
      var supItems = this.stat.supportItems;
      if (!mainCanEquip(mainItems.weapon.value, '武器'))
        mainItems.weapon.value = null;
      if (!mainCanEquip(mainItems.armor.value, '鎧'))
        mainItems.armor.value = null;
      if (!mainCanEquip(mainItems.helmet.value, '兜'))
        mainItems.helmet.value = null;
      if (!mainCanEquip(mainItems.accessory.value, 'アクセサリ'))
        mainItems.accessory.value = null;

      if (!supportCanEquip(supItems.amulet1.value, 'アミュレット', '月'))
        supItems.amulet1.value = null;
      if (!supportCanEquip(supItems.amulet2.value, 'アミュレット', '太陽'))
        supItems.amulet2.value = null;
    }.bind(this);

    //
    this.stat.autoEquipImpl = function (ma, sa, type) {
      let result = {
        main: {
          items: [null, null, null, null],
          enchants: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        },
        support: {
          items: [null, null],
          enchants: [0, 0, 0, 0, 0],
        },
      };

      const mapi = ma.character ? ma.character.damageType == "アタック" ? 1 : 3 : 0;
      const sapi = sa.character ? sa.character.damageType == "アタック" ? 1 : 3 : 0;
      const symbol = ma.character.symbol;
      const tec = ma.status[5];
      let ap = Math.round(ma.status[mapi] * 1.35);
      if (sa.character)
        ap += sa.status[sapi];
      //console.log(`ap: ${ap}`);

      const cmp = this.compare;
      const getItemBattlePower = (item, api) => this.getEstimatedItemBattlePower(item, api, ap, tec);
      const cmpPow = function (a, b, api) {
        const bpa = getItemBattlePower(a, api);
        const bpb = getItemBattlePower(b, api);
        if (bpa != bpb) {
          return cmp(bpa, bpb);
        }
        else {
          // 戦闘力が同じなら デメリットなしを優先
          const re1 = /^デメリット:/;
          const ac1 = !this.matchTags(a.tags, re1) ? 1 : 0;
          const bc1 = !this.matchTags(b.tags, re1) ? 1 : 0;
          return cmp(ac1, bc1);
        }
      }.bind(this);

      const pickItem = function (items, idx, api, tag) {
        if (idx >= 0) {
          let filtered = items.filter(a => a.status[idx]);
          if (filtered.length)
            items = filtered;
        }
        items.sort((a, b) => cmpPow(a, b, api));

        if (tag) {
          const found = items.find((a) => this.matchTags(a.tags, tag));
          if (found)
            return found;
        }
        return items[0];
      }.bind(this);

      const adjustSymbol = function (item) {
        const pattern = /^(ゼニス|オリジン|ナディア)/;
        if (item && item.name.match(pattern)) {
          let r = item.name.replace(pattern, symbol);
          return this.findItem(r);
        }
        return item;
      }.bind(this);

      const pickItemsMain = function (idx = -1, tag = null) {
        const cond = a => matchClass(a, ma.character);
        let weapon = pickItem(this.weapons.filter(cond), idx, mapi, tag);
        let armor = pickItem(this.armors.filter(cond), idx, mapi, tag);
        let helmet = pickItem(this.helmets.filter(cond), idx, mapi, tag);
        let accessory = pickItem(this.accessories.filter(cond), idx, mapi, tag);
        armor = adjustSymbol(armor);
        helmet = adjustSymbol(helmet);
        accessory = adjustSymbol(accessory);
        result.main.items = [weapon, armor, helmet, accessory];
      }.bind(this);

      const pickItemsSupport = function (idx = -1, tag = null) {
        let amulet1 = pickItem(this.amulets1, idx, sapi, tag);
        let amulet2 = pickItem(this.amulets2, idx, sapi, tag);
        result.support.items = [amulet1, amulet2];
      }.bind(this);

      const pickOptimalEnchants = function (filterFunc = null, scoreBooster = null) {
        const s = ma.status;
        let r = [0.05, 0, 2, 0, 2]; // score rate
        r[mapi] = 2 * (1.0 + tec * 0.0003);
        if (scoreBooster) {
          for (let i = 0; i < r.length; ++i)
            r[i] *= scoreBooster[i];
        }

        let dst = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        let cmdlists = [[], [], [], []];
        const cmd = function (i, name, score, exec) {
          cmdlists[i].push({ name: name, score: score, exec: exec });
        };
        const hpP  = (i, v) => cmd(i,  "hpP", s[0] * (v / 100) * r[0], () => dst[0] += v);
        const hpF  = (i, v) => cmd(i,  "hpF",                v * r[0], () => dst[1] += v);
        const atkP = (i, v) => cmd(i, "atkP", s[1] * (v / 100) * r[1], () => dst[2] += v);
        const atkF = (i, v) => cmd(i, "atkF",                v * r[1], () => dst[3] += v);
        const defP = (i, v) => cmd(i, "defP", s[2] * (v / 100) * r[2], () => dst[4] += v);
        const defF = (i, v) => cmd(i, "defF",                v * r[2], () => dst[5] += v);
        const magP = (i, v) => cmd(i, "magP", s[3] * (v / 100) * r[3], () => dst[6] += v);
        const magF = (i, v) => cmd(i, "magF",                v * r[3], () => dst[7] += v);
        const resP = (i, v) => cmd(i, "resP", s[4] * (v / 100) * r[4], () => dst[8] += v);
        const resF = (i, v) => cmd(i, "resF",                v * r[4], () => dst[9] += v);

        const paramsP = [
          [10, 15,  5, 15,  5],
          [15,  5, 15,  5, 15],
          [15,  5, 15,  5, 15],
          [10, 10, 10, 10, 10],
        ];
        const paramsF = [
          [131, 31,  7, 31,  7],
          [200, 11, 19, 11, 19],
          [200, 11, 19, 11, 19],
          [131, 21, 13, 21, 13],
        ];
        for (let i = 0; i < paramsP.length; ++i) {
           hpP(i, paramsP[i][0]);  hpF(i, paramsF[i][0]);
          atkP(i, paramsP[i][1]); atkF(i, paramsF[i][1]);
          defP(i, paramsP[i][2]); defF(i, paramsF[i][2]);
          magP(i, paramsP[i][3]); magF(i, paramsF[i][3]);
          resP(i, paramsP[i][4]); resF(i, paramsF[i][4]);
        }

        const len = cmdlists[0].length;
        if (filterFunc) {
          for (let i = 0; i < cmdlists.length; ++i) {
            const filtered = cmdlists[i].filter(filterFunc).slice(0, 3);
            for (let c of filtered)
              c.exec();
            cmdlists[i] = cmdlists[i].filter(a => !filtered.includes(a));
          }
        }
        for (let cl of cmdlists) {
          cl.sort((a, b) => cmp(a.score, b.score));
        }
        for (let cl of cmdlists) {
          let n = 3 - (len - cl.length);
          for (let i = 0; i < n; ++i)
            cl[i].exec();
        }
        result.main.enchants = dst;
      }.bind(this);

      const pickOptialAmuletSkills = function (filterFunc = null, scoreBooster = null) {
        const s = sa.status;
        let r = [0.05, 0, 2, 0, 2]; // score rate
        r[sapi] = 2 * (1.0 + tec * 0.0003); // リンク前提でテクニックも考慮
        if (scoreBooster) {
          for (let i = 0; i < r.length; ++i)
            r[i] *= scoreBooster[i];
        }

        let dst = [0, 0, 0, 0, 0];

        let cmdlists = [[], [], [], []];
        const cmd = function (i, name, score, exec) {
          cmdlists[i].push({ name: name, score: score, exec: exec });
        };
        const  hpP = (i, v) => cmd(i,  "hpP", s[0] * (v / 100) * r[0], () => dst[0] += v);
        const atkP = (i, v) => cmd(i, "atkP", s[1] * (v / 100) * r[1], () => dst[1] += v);
        const defP = (i, v) => cmd(i, "defP", s[2] * (v / 100) * r[2], () => dst[2] += v);
        const magP = (i, v) => cmd(i, "magP", s[3] * (v / 100) * r[3], () => dst[3] += v);
        const resP = (i, v) => cmd(i, "resP", s[4] * (v / 100) * r[4], () => dst[4] += v);

        const paramsP = [
          [7.5, 7.5, 7.5, 7.5, 7.5],
          [7.5, 7.5, 7.5, 7.5, 7.5],
        ];
        for (let i = 0; i < paramsP.length; ++i) {
           hpP(i, paramsP[i][0]);
          atkP(i, paramsP[i][1]);
          defP(i, paramsP[i][2]);
          magP(i, paramsP[i][3]);
          resP(i, paramsP[i][4]);
        }

        const len = cmdlists[0].length;
        if (filterFunc) {
          for (let i = 0; i < cmdlists.length; ++i) {
            const filtered = cmdlists[i].filter(filterFunc).slice(0, 3);
            for (let c of filtered)
              c.exec();
            cmdlists[i] = cmdlists[i].filter(a => !filtered.includes(a));
          }
        }
        for (let cl of cmdlists) {
          cl.sort((a, b) => cmp(a.score, b.score));
        }
        for (let cl of cmdlists) {
          let n = 1 - (len - cl.length);
          for (let i = 0; i < n; ++i)
            cl[i].exec();
        }
        result.support.enchants = dst;
      }.bind(this);

      if (type == 0) { // 戦闘力優先
        pickItemsMain();
        pickOptimalEnchants();
        pickItemsSupport();
        pickOptialAmuletSkills();
      }
      else if (type == 1) { // HP 優先
        pickItemsMain(0);
        pickOptimalEnchants(c => c.name.match(/^hp/));
        pickItemsSupport(0);
        pickOptialAmuletSkills(c => c.name.match(/^hp/));
      }
      else if (type == 2) { // アタック優先
        pickItemsMain(1, /^バフ:アタック/);
        pickOptimalEnchants(c => c.name.match(/^atk/));
        pickItemsSupport(1, /^バフ:アタック/);
        pickOptialAmuletSkills(c => c.name.match(/^atk/));
      }
      else if (type == 3) { // ディフェンス優先
        pickItemsMain(2, /^バフ:ディフェンス/);
        pickOptimalEnchants(c => c.name.match(/^def/));
        pickItemsSupport(2, /^バフ:ディフェンス/);
        pickOptialAmuletSkills(c => c.name.match(/^def/));
      }
      else if (type == 4) { // マジック優先
        pickItemsMain(3, /^バフ:マジック/);
        pickOptimalEnchants(c => c.name.match(/^mag/));
        pickItemsSupport(3, /^バフ:マジック/);
        pickOptialAmuletSkills(c => c.name.match(/^mag/));
      }
      else if (type == 5) { // レジスト優先
        pickItemsMain(4, /^バフ:レジスト/);
        pickOptimalEnchants(c => c.name.match(/^res/));
        pickItemsSupport(4, /^バフ:レジスト/);
        pickOptialAmuletSkills(c => c.name.match(/^res/));
      }
      else if (type == 6) { // テクニック優先
        pickItemsMain(5, /^バフ:テクニック/);
        pickOptimalEnchants();
        pickItemsSupport(5, /^バフ:テクニック/);
        pickOptialAmuletSkills();
      }
      return result;
    }.bind(this);

    this.stat.autoEquip = function (type) {
      let msa = this.getStatMainArgs();
      msa.items = [];
      msa.enchantsP = [];
      msa.enchantsF = [];
      let ssa = this.getStatSupportArgs();

      const ma = {
        character: msa.character,
        status: this.calcStatMainImpl(msa, null, true),
      };
      const sa = {
        character: ssa.character,
        status: this.calcStatSupportImpl(ssa),
      };
      const r = this.stat.autoEquipImpl(ma, sa, type);

      if (this.stat.tabIndex == 0) {
        for (const v of Object.values(this.stat.mainItems))
          v.value = r.main.items.shift();
        for (const v of Object.values(this.stat.mainEnchants)) {
          v.valueP = r.main.enchants.shift();
          v.valueF = r.main.enchants.shift();
        }
      }
      if (this.stat.tabIndex == 1 && sa.character) {
        for (const v of Object.values(this.stat.supportItems))
          v.value = r.support.items.shift();
        for (const v of Object.values(this.stat.supportEnchants))
          v.valueP = r.support.enchants.shift();
      }
    }.bind(this);

    this.stat.highscoreSearch = function () {
      let msa = this.getStatMainArgs();
      let ssa = this.getStatSupportArgs();
      const powMain = (a) => this.getBattlePower(this.getMainChrStatus(a, msa.level, msa.star, msa.master, msa.loveBonus, msa.boosts));
      const powSup = (a) => this.getBattlePower(this.getSupportChrStatus(a, ssa.level, ssa.star, ssa.master, ssa.loveBonus, ssa.boosts));

      const mainChrs = [...this.mainChrs].sort((a, b) => this.compare(powMain(a), powMain(b))).slice(0, 50);
      const supChrs = [...this.supChrs].sort((a, b) => this.compare(powSup(a), powSup(b))).slice(0, 50);

      let results = [];

      const getPEnchants = function (a) {
        let r = [];
        for (let i = 0; i < a.length; ++i)
          if (i % 2 == 0)
            r.push(a[i]);
        return r;
      };
      const getFEnchants = function (a) {
        let r = [];
        for (let i = 0; i < a.length; ++i)
          if (i % 2 == 1)
            r.push(a[i]);
        return r;
      };

      for (const mchr of mainChrs) {
        for (const schr of supChrs) {
          msa.items = [];
          msa.enchantsP = [];
          msa.enchantsF = [];
          ssa.items = [];
          ssa.enchantsP = [];

          msa.character = mchr;
          ssa.character = schr;
          const r = this.stat.autoEquipImpl({
            character: mchr,
            status: this.calcStatMainImpl(msa, null, true),
          }, {
            character: schr,
            status: this.calcStatSupportImpl(ssa),
          }, 0);

          msa.items = r.main.items;
          msa.enchantsP = getPEnchants(r.main.enchants);
          msa.enchantsF = getFEnchants(r.main.enchants);
          ssa.items = r.support.items;
          ssa.enchantsP = r.support.enchants;
          const bp = this.calcStatMainImpl(msa, ssa)[7]

          results.push({
            bp: bp,
            main: mchr.name,
            support: schr.name,
            data: {
              main: mchr,
              support: schr,
              msa: msa,
              ssa: ssa,
              result: r,
            }
          });
        }
      }

      results = results.sort((a, b) => this.compare(a.bp, b.bp)).slice(0, 200);
      let mains = [];
      let supports = [];
      for (let i = 0; i < results.length; ++i) {
        let r = results[i];
        r.index = i + 1;
        r._cellVariants = {};
        if (!mains.includes(r.main)) {
          mains.push(r.main);
          r._cellVariants.main = "primary";
        }
        if (!supports.includes(r.support)) {
          supports.push(r.support);
          r._cellVariants.support = "warning";
        }
      }
      this.stat.highscoreData = results;
    }.bind(this);

    this.stat.highscoreReplay = function (rec) {
      let s = this.stat;
      const msa = rec.data.msa;
      const ssa = rec.data.ssa;
      const r = rec.data.result;
      {
        s.main.character.value = rec.data.main;
        s.main.star.value = msa.star;
        s.main.level.value = msa.level;
        s.main.master.value = msa.master;
        s.main.loveBonus.value = msa.loveBonus;

        let boosts = [...msa.boosts];
        for (const v of Object.values(s.mainBoosts))
          v.value = boosts.shift();

        let items = [...r.main.items];
        for (const v of Object.values(s.mainItems))
          v.value = items.shift();

        let enchants = [...r.main.enchants];
        for (const v of Object.values(s.mainEnchants)) {
          v.valueP = enchants.shift();
          v.valueF = enchants.shift();
        }
      }
      {
        s.support.character.value = rec.data.support;
        s.support.star.value = ssa.star;
        s.support.level.value = ssa.level;
        s.support.master.value = ssa.master;
        s.support.loveBonus.value = ssa.loveBonus;

        let boosts = [...ssa.boosts];
        for (const v of Object.values(s.supportBoosts))
          v.value = boosts.shift();

        let items = [...r.support.items];
        for (const v of Object.values(s.supportItems))
          v.value = items.shift();

        let enchants = [...r.support.enchants];
        for (const v of Object.values(s.supportEnchants)) {
          v.valueP = enchants.shift();
        }
      }
    }.bind(this);

    const setupSkills = function (skills, chrs) {
      let skillMap = new Map();
      for (let skill of skills) {
        skillMap.set(skill.name, skill);
      }
      for (let chr of chrs) {
        for (let i = 0; i < chr.skills.length; ++i) {
          let skill = skillMap.get(chr.skills[i]);
          if (!skill) {
            console.log("!" + chr.skills[i]);
            continue;
          }

          if (!skill.owners)
            skill.owners = [];
          if (skill.descs)
            skill.desc = skill.descs["Lv 6"];
          skill.owners.push(chr);
          chr.skills[i] = skill;
        }
      }
    };
    setupSkills(this.mainSkills, this.mainChrs);
    setupSkills(this.supSkills, this.supChrs);

    this.mainTalents = [];
    for (let chr of this.mainChrs) {
      let talent = chr.talent;
      if (talent.descs)
        talent.desc = chr.talent.descs["Lv 6"];
      talent.owners = [chr];
      this.mainTalents.push(talent);
    }

    this.parseDmgUrl(window.location.href);
    this.parseBPUrl(window.location.href);
    this.parseStatUrl(window.location.href);
  },

  mounted() {
    window.onpopstate = function () {
      this.parseBPUrl(window.location.href);
    }.bind(this);
  },

  methods: {
    findItem(name) {
      return this.mainSkills.find(a => a.name == name) ||
        this.mainTalents.find(a => a.name == name) ||
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

    getParamClass(param) {
      return param.disabled() ? "disabled" : "";
    },

    calcDamage() {
      const attacked = this.dmg.attacked;
      const main = this.dmg.main;
      const support = this.dmg.support;

      const def = attacked.def.value;
      const damageResist = 1.0 - this.toNumber(attacked.damageRate.value) * 0.01;
      const shield = attacked.shield.value;

      let result = 0;
      if (this.dmg.mainEnabled) {
        const atk = main.atk.value;
        const skillDamageRate = this.toNumber(main.skillDamageRate.value);
        const damageBuff = 1.0 + this.toNumber(main.damageBuff.value) * 0.01;
        const criticalDamageRate = 1.0 + this.toNumber(main.criticalDamageRate.value) * 0.01;

        let damage = (atk - def) * skillDamageRate * damageBuff * damageResist;
        if (main.critical.value)
          damage *= criticalDamageRate;
        if (main.rangedPenalty.value)
          damage *= 0.6;

        result += Math.max(Math.round(damage), 1) * (main.doubleAttack.value ? 20 : 10);
      }
      if (this.dmg.supportEnabled) {
        const atk = support.atk.value;
        const damageBuff = 1.0 + this.toNumber(support.damageBuff.value) * 0.01;

        let damage = (atk - def) * damageBuff * damageResist;
        if (support.rangedPenalty.value)
          damage *= 0.6;

        result += Math.max(Math.round(damage), 1) * 10;
      }

      return Math.max(result - shield, 0);
    },

    calcBattlePower() {
      let hp = 0;
      let atk = 0;
      let def = 0;
      let res = 0;
      let tec = 0;
      let rate = 1.0;
      if (this.bp.mainEnabled) {
        const params = this.bp.main;
        hp  += params.hp.value;
        atk += params.atk.value;
        def += params.def.value;
        res += params.res.value;
        tec += params.tec.value;
        rate += params.stars.value * 0.1;
        rate += params.master.value * 0.1;
        rate += params.skillCost.value * 0.03;
        rate += params.eqStars.value * 0.02;
        if (params.enchant.value)
          rate += 0.1;
      }
      if (this.bp.supportEnabled) {
        const params = this.bp.support;
        hp += params.hp.value;
        atk += params.atk.value;
        def += params.def.value;
        res += params.res.value;
        rate += params.stars.value * 0.1;
        rate += params.master.value * 0.1;
        rate += params.skills.value * 0.05;
      }
      return Math.round(((hp * 0.05) + (atk * 2 * (1.0 + tec * 0.0003)) + (def * 2) + (res * 2)) * rate);
    },

    getStatMainArgs() {
      const s = this.stat;
      let r = {
        character: s.main.character.value,
        star: s.main.star.value,
        level: s.main.level.value,
        master: s.main.master.value,
        loveBonus: s.main.loveBonus.value,
        boosts: Object.values(s.mainBoosts).map(a => a.value),
        items: Object.values(s.mainItems).map(a => a.value),
        enchantsP: Object.values(s.mainEnchants).map(a => a.valueP),
        enchantsF: Object.values(s.mainEnchants).map(a => a.valueF),
      };
      return r;
    },
    getStatSupportArgs() {
      const s = this.stat;
      let r = {
        character: s.support.character.value,
        star: s.support.star.value,
        level: s.support.level.value,
        master: s.support.master.value,
        loveBonus: s.support.loveBonus.value,
        boosts: Object.values(s.supportBoosts).map(a => a.value),
        items: Object.values(s.supportItems).map(a => a.value),
        enchantsP: Object.values(s.supportEnchants).map(a => a.valueP),
      };
      return r;
    },
    calcStatMainImpl(ma, sa, skipBP = false) {
      const empty = [0, 0, 0, 0, 0, 0];
      const chr = ma.character;
      if (!chr)
        return empty;

      let r = this.getMainChrStatus(chr, ma.level, ma.star, ma.master, ma.loveBonus, ma.boosts);
      for (let i = 0; i < ma.enchantsP.length; ++i)
        r[i] = Math.round(r[i] * (1.0 + ma.enchantsP[i] * 0.01));

      const items = ma.items.filter(a => a != null);
      for (const item of items) {
        for (let i = 0; i < r.length; ++i)
          r[i] += item.status[i];
      }
      for (let i = 0; i < ma.enchantsF.length; ++i)
        r[i] += ma.enchantsF[i];

      if (skipBP)
        return r;

      // 以下戦闘力
      let bpr = 1.0;
      bpr += 0.1 * ma.star;
      bpr += 0.1 * ma.master;
      bpr += 0.03 * 6; // スキルコスト
      bpr += 0.02 * (5 * items.length); // アイテムの☆合計
      if (items.length == 4)
        bpr += 0.1; // エンチャント4セット
      const bpMain = Math.round(this.getBattlePower(r) * bpr);
      const rMain = [...r, bpMain];
      if (!sa || !sa.character)
        return rMain;

      const sup = sa.character;
      bpr += 0.1 * sa.star;
      bpr += 0.1 * sa.master;
      bpr += 0.05 * 3; // スキル開放

      const sr = this.calcStatSupportImpl(sa);
      for (let i of [0, 2, 4])
        r[i] += sr[i];

      const mapi = chr.damageType == "アタック" ? 1 : 3;
      const sapi = sup.damageType == "アタック" ? 1 : 3;
      r[mapi] += sr[sapi];
      const bpTotal = Math.round(this.getBattlePower(r) * bpr);
      return [...rMain, bpTotal];
    },
    calcStatMain()
    {
      return this.calcStatMainImpl(this.getStatMainArgs(), this.getStatSupportArgs());
    },

    calcStatSupportImpl(sa) {
      const empty = [0, 0, 0, 0, 0, 0];
      const chr = sa.character;
      if (!chr)
        return empty;

      let r = this.getSupportChrStatus(chr, sa.level, sa.star, sa.master, sa.loveBonus, sa.boosts);
      for (let i = 0; i < sa.enchantsP.length; ++i)
        r[i] = Math.round(r[i] * (1.0 + sa.enchantsP[i] * 0.01));

      const items = sa.items.filter(a => a != null);
      for (const item of items) {
        for (let i = 0; i < r.length; ++i)
          r[i] += item.status[i];
      }

      // テクニック除去
      r[5] = 0;

      // 以下戦闘力
      let bpr = 1.0;
      bpr += 0.1 * sa.star;
      bpr += 0.1 * sa.master;
      bpr += 0.05 * 3; // スキル開放
      let bp = Math.round(this.getBattlePower(r) * bpr);

      return [...r, bp];
    },
    calcStatSupport() {
      return this.calcStatSupportImpl(this.getStatSupportArgs());
    },

    getStatUrl() {
      let params = [];

      for (const v of Object.values(this.stat.main)) {
        if (v.type == "character")
          params.push(v.value ? v.value.index : 0);
        else
          params.push(v.value);
      }
      for (const v of Object.values(this.stat.mainBoosts))
        params.push(v.value);
      for (const v of Object.values(this.stat.mainItems))
        params.push(v.value ? v.value.index : 0);
      for (const v of Object.values(this.stat.mainEnchants)) {
        params.push(v.valueP);
        params.push(v.valueF);
      }

      for (const v of Object.values(this.stat.support)) {
        if (v.type == "character")
          params.push(v.value ? v.value.index : 0);
        else
          params.push(v.value);
      }
      for (const v of Object.values(this.stat.supportBoosts))
        params.push(v.value);
      for (const v of Object.values(this.stat.supportItems))
        params.push(v.value ? v.value.index : 0);
      for (const v of Object.values(this.stat.supportEnchants))
        params.push(v.valueP);

      let url = window.location.href.replace(/\?.+/, '').replace(/#.+/, '');
      url += "?stat=" + params.join(',') + "#status";
      this.parseStatUrl(url); // debug
      return url;
    },
    parseStatUrl(url) {
      url = decodeURIComponent(url);
      let q = url.match(/\?stat=(.+)$/);
      if (q) {
        let params = q[1].split(',').map(this.parseValue);

        for (const v of Object.values(this.stat.main)) {
          if (v.type == "character") {
            const idx = params.shift();
            v.value = this.mainChrs.find(a => a.index == idx);
          }
          else {
            v.value = params.shift();
          }
        }
        for (const v of Object.values(this.stat.mainBoosts))
          v.value = params.shift();
        for (const v of Object.values(this.stat.mainItems)) {
          const idx = params.shift();
          v.value = this.items.find(a => a.index == idx);
        }
        for (const v of Object.values(this.stat.mainEnchants)) {
          v.valueP = params.shift();
          v.valueF = params.shift();
        }

        for (const v of Object.values(this.stat.support)) {
          if (v.type == "character") {
            const idx = params.shift();
            v.value = this.supChrs.find(a => a.index == idx);
          }
          else {
            v.value = params.shift();
          }
        }
        for (const v of Object.values(this.stat.supportBoosts))
          v.value = params.shift();
        for (const v of Object.values(this.stat.supportItems)) {
          const idx = params.shift();
          v.value = this.items.find(a => a.index == idx);
        }
        for (const v of Object.values(this.stat.supportEnchants))
          v.valueP = params.shift();

        return true;
      }
      return false;
    },

    getDmgUrl() {
      let params = [];

      for (const v of Object.values(this.dmg.main))
        params.push(v.value);

      params.push(this.dmg.supportEnabled);
      for (const v of Object.values(this.dmg.support))
        params.push(v.value);

      for (const v of Object.values(this.dmg.attacked))
        params.push(v.value);

      let url = window.location.href.replace(/\?.+/, '').replace(/#.+/, '');
      url += "?dmg=" + params.join(',') + "#damage";
      return url;
    },
    parseDmgUrl(url) {
      url = decodeURIComponent(url);
      let q = url.match(/\?dmg=(.+)$/);
      if (q) {
        let params = q[1].split(',').map(this.parseValue);

        for (const v of Object.values(this.dmg.main))
          v.value = params.shift();

        this.dmg.supportEnabled = params.shift();
        for (const v of Object.values(this.dmg.support))
          v.value = params.shift();

        for (const v of Object.values(this.dmg.attacked))
          v.value = params.shift();

        return true;
      }
      return false;
    },

    getBPUrl() {
      let params = [];

      params.push(this.bp.mainEnabled);
      for (const v of Object.values(this.bp.main))
        params.push(v.value);

      params.push(this.bp.supportEnabled);
      for (const v of Object.values(this.bp.support))
        params.push(v.value);

      let url = window.location.href.replace(/\?.+/, '').replace(/#.+/, '');
      url += "?bp=" + params.join(',') + "#battle_power";
      return url;
    },
    parseBPUrl(url) {
      url = decodeURIComponent(url);
      let q = url.match(/\?bp=(.+)$/);
      if (q) {
        let params = q[1].split(',').map(this.parseValue);

        this.bp.mainEnabled = params.shift();
        for (const v of Object.values(this.bp.main))
          v.value = params.shift();

        this.bp.supportEnabled = params.shift();
        for (const v of Object.values(this.bp.support))
          v.value = params.shift();

        return true;
      }
      return false;
    },
  },

  computed: {
    dmgResult() {
      return this.calcDamage();
    },
    dmgUrl() {
      return this.getDmgUrl();
    },
    bpResult() {
      return this.calcBattlePower();
    },
    bpUrl() {
      return this.getBPUrl();
    },
    statMainResult() {
      return this.calcStatMain();
    },
    statSupportResult() {
      return this.calcStatSupport();
    },
    statUrl() {
      return this.getStatUrl();
    }
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

.about h2 {
  font-size: 1.75em;
}

.about p {
  margin-bottom: 20px;
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
.url-popover {
  max-width: 65em !important;
}

.item_po {
  max-width: 430px !important;
}

.note {
  font-size: 75%;
  color: rgb(150, 150, 150);
}

label.disabled {
  color: rgb(180, 180, 180);
}

.input-param {
  height: 1.75em;
  padding: 0.25em;
  width: 5.5em;
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
<style>
.desc .table {
  width: auto;
  margin: 3px;
}
.input-dropdown button {
  padding: 0.1em;
}
</style>
