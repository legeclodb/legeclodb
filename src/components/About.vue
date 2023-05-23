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

        <h2><a name="battle_power" href="#battle_power"></a>戦闘力について</h2>
        <p>
          戦闘力は以下の計算式で算出されるとみられます。<br />
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

        <div>
          <b-container>
            <h5 style="margin-bottom: 10px">戦闘力シミュレーター</h5>
          </b-container>
        </div>
        <div class="flex">
          <div style="width: 280px">
            <b-container>
              <b-form-row>
                <b-col style="text-align:center">
                  <h6>メインキャラ <b-form-checkbox inline plain class="checkbox" id="bp-main-enabled" v-model="bpMainEnabled"></b-form-checkbox></h6>
                </b-col>
              </b-form-row>
              <b-form-row v-for="(param, name, index) in bpParamsMain" :key="index">
                <b-col style="text-align:right" align-self="end" cols="7">
                  <label :for="`bp-main-${name}`">{{param.label}}</label>
                </b-col>
                <b-col>
                  <b-form-input :id="`bp-main-${name}`" v-model="param.value" size="sm" type="number" :min="param.min" :max="param.max" :disabled="!bpMainEnabled" v-if="param.type == 'int'"></b-form-input>
                  <b-form-checkbox :id="`bp-main-${name}`" v-model="param.value" size="sm" plain :disabled="!bpMainEnabled" v-if="param.type == 'bool'"></b-form-checkbox>
                </b-col>
              </b-form-row>
            </b-container>
          </div>
          <div style="width: 250px">
            <b-container>
              <b-form-row>
                <b-col style="text-align: center">
                  <h6>サポートキャラ <b-form-checkbox inline plain class="checkbox" id="bp-support-enabled" v-model="bpSupportEnabled"></b-form-checkbox></h6>
                </b-col>
              </b-form-row>
              <b-form-row v-for="(param, name, index) in bpParamsSupport" :key="index">
                <b-col style="text-align:right" align-self="end" cols="7">
                  <label :for="`bp-support-${name}`">{{param.label}}</label>
                </b-col>
                <b-col>
                  <b-form-input :id="`bp-support-${name}`" v-model="param.value" size="sm" type="number" :min="param.min" :max="param.max" :disabled="!bpSupportEnabled" v-if="param.type == 'int'"></b-form-input>
                </b-col>
              </b-form-row>
            </b-container>
          </div>
        </div>
        <div>
          <b-container>
            <h5 style="margin-bottom: 10px">戦闘力: {{bpResult}}</h5>
            <b-button @click="copyBPUrl()">パラメータを URL に保存</b-button>
          </b-container>
        </div>
        <p>
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

      bpMainEnabled: true,
      bpSupportEnabled: true,
      bpParamsMain: {
        stars: {
          label: "⭐",
          type: "int",
          min: 1,
          max: 6,
          value: 6,
        },
        masterLv: {
          label: "マスターレベル",
          type: "int",
          min: 0,
          max: 3,
          value: 3,
        },
        hp: {
          label: "HP",
          type: "int",
          min: 0,
          value: 15000,
        },
        atk: {
          label: "アタック / マジック",
          type: "int",
          min: 0,
          value: 1500,
        },
        def: {
          label: "ディフェンス",
          type: "int",
          min: 0,
          value: 500,
        },
        res: {
          label: "レジスト",
          type: "int",
          min: 0,
          value: 500,
        },
        tec: {
          label: "テクニック",
          type: "int",
          min: 0,
          value: 100,
        },
        skillCost: {
          label: "スキルコスト",
          value: 6,
          min: 0,
          max: 6,
          type: "int",
        },
        eqStars: {
          label: "装備の⭐合計",
          type: "int",
          min: 0,
          max: 20,
          value: 20,
        },
        enchant: {
          label: "エンチャント4セット",
          type: "bool",
          value: true
        },
      },
      bpParamsSupport: {
        stars: {
          label: "⭐",
          type: "int",
          min: 1,
          max: 6,
          value: 6,
        },
        masterLv: {
          label: "マスターレベル",
          type: "int",
          min: 0,
          max: 3,
          value: 3,
        },
        hp: {
          label: "HP",
          type: "int",
          min: 0,
          value: 15000,
        },
        atk: {
          label: "アタック / マジック",
          type: "int",
          min: 0,
          value: 1500,
        },
        def: {
          label: "ディフェンス",
          type: "int",
          min: 0,
          value: 500,
        },
        res: {
          label: "レジスト",
          type: "int",
          min: 0,
          value: 500,
        },
        skills: {
          label: "解放済みスキル",
          type: "int",
          min: 1,
          max: 3,
          value: 3,
        },
      },
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

    this.parseBPUrl(window.location.href);
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

    calcBP() {
      let hp = 0;
      let atk = 0;
      let def = 0;
      let res = 0;
      let tec = 0;
      let rate = 1.0;
      if (this.bpMainEnabled) {
        hp += parseInt(this.bpParamsMain.hp.value);
        atk += parseInt(this.bpParamsMain.atk.value);
        def += parseInt(this.bpParamsMain.def.value);
        res += parseInt(this.bpParamsMain.res.value);
        tec += parseInt(this.bpParamsMain.tec.value);
        rate += parseInt(this.bpParamsMain.stars.value) * 0.1;
        rate += parseInt(this.bpParamsMain.masterLv.value) * 0.1;
        rate += parseInt(this.bpParamsMain.skillCost.value) * 0.03;
        rate += parseInt(this.bpParamsMain.eqStars.value) * 0.02;
        if (this.bpParamsMain.enchant.value)
          rate += 0.1;
      }
      if (this.bpSupportEnabled) {
        hp += parseInt(this.bpParamsSupport.hp.value);
        atk += parseInt(this.bpParamsSupport.atk.value);
        def += parseInt(this.bpParamsSupport.def.value);
        res += parseInt(this.bpParamsSupport.res.value);
        rate += parseInt(this.bpParamsSupport.stars.value) * 0.1;
        rate += parseInt(this.bpParamsSupport.masterLv.value) * 0.1;
        rate += parseInt(this.bpParamsSupport.skills.value) * 0.05;
      }
      return Math.round(((hp * 0.05) + (atk * 2 * (1.0 + tec * 0.0003)) + (def * 2) + (res * 2)) * rate);
    },

    copyBPUrl() {
      let params = [];

      params.push(this.bpMainEnabled);
      if (this.bpMainEnabled) {
        for (const v of Object.values(this.bpParamsMain))
          params.push(v.value);
      }
      params.push(this.bpSupportEnabled);
      if (this.bpSupportEnabled) {
        for (const v of Object.values(this.bpParamsSupport))
          params.push(v.value);
      }

      let url = window.location.href.replace(/#.+/, '').replace(/\?.+/, '');
      url += "?bp=" + params.join(',') + "#battle_power";
      window.history.pushState(null, null, url);
    },

    parseBPUrl(url) {
      url = decodeURIComponent(url);
      let q = url.match(/\?bp=(.+)$/);
      if (q) {
        let params = q[1].split(',').map(function (s) {
          if (s == 'true')
            return true;
          else if (s == 'false')
            return false;
          else
            return parseInt(s);
        });

        this.bpMainEnabled = params.shift();
        for (const v of Object.values(this.bpParamsMain))
          v.value = params.shift();
        this.bpSupportEnabled = params.shift();
        for (const v of Object.values(this.bpParamsSupport))
          v.value = params.shift();
      }
    },

    decodeURL() {

    }
  },

  computed: {
    bpResult() {
      return this.calcBP();
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
  max-width: 430px !important;
}

.note {
  font-size: 75%;
  color: rgb(150, 150, 150);
}

.checkbox .btn {
  margin: 0px 0px;
  padding: 0px 5px;
}

</style>
