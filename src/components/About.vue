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
            <li><a href="#class-advantage">クラス相性</a></li>
            <li><a href="#notes">その他のバフと補足事項</a></li>
            <li><a href="#damage">ダメージ計算</a></li>
            <li><a href="#status">基本ステータスについて</a></li>
            <li><a href="#battle_power">戦闘力について</a></li>
            <li><a href="#comments">コメント</a></li>
          </ul>
        </p>

        <h2><a name="about" href="#about"></a>このサイトについて</h2>
        <p>
          <b-link href="https://www.legend-clover.net/" target="_blank">れじぇくろ！</b-link>の攻略データベースです。主にバフ・デバフを検索するのを目的としています。<br />
          間違いの指摘や要望などありましたら<a href="#comments">コメント欄</a>にコメントいただけると幸いです。<br />
        </p>

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
          一部特殊なアクティブスキルがあり、これらのバフは無条件で他のアクティブと加算になります。<br />
          これらは「一時的にパッシブスキルを付与する」という扱いになっているようです。<br />
          シンボルスキルに付随する加護 (アタック～レジスト以外のバフ) はこちらに分類されます。<br />
          それ以外の該当スキルを全て以下に列挙します。いずれも条件付きバフのみが特殊枠で、他は通常のアクティブ枠です。<br />
          単体or自己バフスキル：
          <span v-for="(skill, si) of specialBuffSkillsSingle" :key="`sbss${si}`" style="margin: 4px">
            <b-link :ref="po">{{skill.name}}</b-link>
          </span><br />
          範囲or全体バフスキル：
          <span v-for="(skill, si) of specialBuffSkillsMulti" :key="`sbsm${si}`" style="margin: 4px">
            <b-link :ref="po">{{skill.name}}</b-link>
          </span><br />

          <br />
          加えて、与ダメージとダメージ耐性にはまた別のルールがあります。<br />
          これらには物理与ダメージ、魔法与ダメージ、スキル与ダメージといったバリエーションがありますが、<br />
          異なるバリエーションであればアクティブ同士でも効果が加算になります。<br />
          与ダメージのバリエーションは 無印、物理、魔法、スキル、範囲スキル、通常攻撃 の 6 種、<br />
          ダメージ耐性のバリエーションは 無印、物理、魔法、範囲スキル (敵専用) の 4 種になります。<br />
          <ul>
            <li>例1: <b-link :ref="po">お届け物です！</b-link>＋<b-link :ref="po">総員、突撃用意</b-link>＋<b-link :ref="po">テスト勉強のお手伝い</b-link>＋<b-link :ref="po">道教式チアリーディング</b-link>＝物理通常攻撃与ダメージ +95%</li>
            <li>例2: <b-link :ref="po">お届け物です！</b-link>＋<b-link :ref="po">総員、突撃用意</b-link>＋<b-link :ref="po">リトルマロース</b-link>＋<b-link :ref="po">発明官女</b-link>＝物理範囲スキル与ダメージ +100% & 魔法範囲スキル与ダメージ +110%</li>
          </ul>
          <s>なお、通常攻撃与ダメージバフは反撃には乗らないことが確認されています。(2023/04 現在。バグか仕様かは不明)</s><br />
          2023//05 のアップデートにて通常攻撃与ダメージバフは反撃にも乗るように変更されました。<br />
          <br />
          一部のバフ・デバフには上限があることが確認されています。<br />
          該当するのは基本ステータス値へのデバフ (アタック・ディフェンス・マジック・レジスト)、およびダメージ耐性バフと与ダメージデバフで、<br />
          これらは 70% 以上盛っても実際に効果を発揮するのは 70% までとなります。<br />
          <span class="note">この 70% はバフ・デバフを相殺した上での上限。なので、例えば 50% のバフを得ている敵は 120% デバフでようやく上限到達となる。</span><br />
          なお、基本ステータス値へのバフ、与ダメージバフ、ダメージ耐性デバフに関しては上限はないものとみられます。<br />
        </p>

        <h2><a name="class-advantage" href="#class-advantage"></a>クラス相性</h2>
        <p>
          クラス間の有利不利は戦闘時のアタック / マジックへのバフ・デバフという形で表現されています。<br />
          <b>通常のアタックバフやマジックバフとは加算の関係</b>になり、メイン・サポート両方に個別に適用されます。<br />
          また、これらは通常の戦闘前バフとは異なり、範囲攻撃にも適用されます。<br />
          <b-table outlined bordered :items="stat.classBonusBase">
            <template #head(攻撃側)="r">
              攻撃側＼防御側{{r.null}}
            </template>
            <template #cell()="r">
              <span v-html="n2percent(r.value)" />
            </template>
          </b-table>
          <br />

          クラス相性の書により効果が強化され、全開放時は以下になります。<br />
          また、クラス相性の書の「耐性」の効果により、不利相性で攻撃される際に敵にかかるバフが減ります。<br />
          例: プレイヤー側のソルジャーがライダーから攻撃される際、敵にかかるバフが本来の 45% から 35% に減じる (全開放時)<br />
          なお、<b>同じクラス相性の書でも「与ダメージ」の効果は与ダメージバフと同列の扱い (加算の関係)</b> になります。
          <b-table outlined bordered :items="stat.classBonusMax">
            <template #head(攻撃側)="r">
              攻撃側＼防御側{{r.null}}
            </template>
            <template #cell()="r">
              <span v-html="n2percent(r.value)" />
            </template>
          </b-table>
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
          <b>装備の効果は特に記載がない場合メインのみが対象</b>である点に注意が必要です。<br />
          サポートも対象の効果は「自ユニットの」という記述があり、区別されています。<br />
          <span class="note">例: <b-link :ref="po">天蝎の天鎧</b-link> のダメージ耐性はメインのみが対象、<b-link :ref="po">乙女の天衣</b-link> のダメージ耐性はサポートも対象。</span><br />
          同様に、アミュレットの効果はサポートのみが対象となります。シールドはサポートが倒れている場合発動しません。<br />
          <br />
          アンドロメダの<b-link :ref="po">神に勝る美</b-link>やオリオンの<b-link :ref="po">オレの女に手は出させない</b-link>は、HP が 75% ちょうどの場合、以上以下両方の効果が発動します。<br />
          <span class="note"><b-link :ref="po">天秤の天帽</b-link>などの自傷効果で 25% 減らすことができるが、最大 HP が 4 で割り切れる数でないと 76% になってしまう模様。</span><br />
        </p>

        <h2><a name="damage" href="#damage"></a>ダメージ計算</h2>
        <DamageSimulator />
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
              スキルのダメージ倍率は 攻撃力－防御力 の後の数値にかかる。<span class="note">なので、倍率の低い範囲攻撃は高防御の敵に特別弱いわけではない。</span>
              <ul>
                <li>特定の兵種に対して特攻があるスキルは、その兵種に対する専用の倍率が設定されている。</li>
              </ul>
            </li>
            <li>
              与ダメージバフは無印、物理攻撃、スキル、通常攻撃など様々な種類があるが、全て加算の関係。
              <ul>
                <li>クラス相性の書の与ダメージアップも扱いとしては与ダメージバフらしく、加算の関係になる。</li>
              </ul>
            </li>
            <li>
              ダメージ耐性デバフも同様で、無印、物理攻撃などいくつかの種類があるが、全て加算の関係。
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
            <li>
              単体攻撃でありながら範囲攻撃のようにメインとサポート両方同時攻撃のスキルも存在する。
              <ul>
                <li>扱いとしては範囲攻撃 (非戦闘攻撃) とみられ、戦闘の前後に発動するバフ・デバフが発動せず、シールドやガードも無視する。</li>
                <li>スターフォースクエストの敵の単体攻撃スキルはこのタイプ。2 回攻撃のようなものなので、知らないと予想外のダメージに驚くことになる。</li>
              </ul>
            </li>
          </ul>
        </p>

        <h2><a name="status" href="#status"></a>基本ステータスについて</h2>
        <StatusSimulator />
        <p class="desc">
          基本ステータスとは、戦闘前に決定するステータス値で、キャラ画面の情報で表示されるものがそれになります。<br />
          割合バフや「能力値の n %を加算」系の効果は基本ステータスに対する割合として機能します。戦闘力も基本ステータスから算出されます。<br />
          基本ステータスは以下のように算出されます。<br />
          <br />
          メインの場合：<br />
          <code>基本ステータス＝(初期値＋レベル上昇値＋☆上昇値＋好感度ボーナス＋マスターボーナス)×(記憶の書＋強化ボード)×(割合エンチャント)＋装備＋固定値エンチャント</code><br />
          <br />
          サポートの場合：<br />
          <code>基本ステータス＝(初期値＋レベル上昇値＋☆上昇値＋好感度ボーナス＋マスターボーナス)×(記憶の書＋強化ボード＋基本ステータス系アミュレットスキル)＋装備</code><br />
          <br />
          <ul>
            <li>
              初期値、レベル上昇値、☆による上昇値 はキャラ固有
              <ul>
                <li>レベルと☆による上昇は 1レベル / 1☆ あたりの上昇量が決まっており、リニアに増えていく方式</li>
                <li>1☆ あたりの上昇量は大体 4 レベル分くらいになっている模様</li>
              </ul>
            </li>
            <li>
              <b>エンゲージは基本ステータスには影響しない</b>
              <ul>
                <li>戦闘力にのみ若干影響がある（<a href="#battle_power">戦闘力</a>を参照）</li>
              </ul>
            </li>
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
                <li>アクセサリの場合他にクリティカル率があり、こちらは 15% が上限。テクニックとは別物で基本ステータスには影響しない</li>
                <li>
                  エンチャントの2セット特典 (バスターの アタック/マジック+5% など) も基本ステータスへの割合強化として扱われる<br />
                  <span class="note">ストライクの2セット特典の クリティカル率+7% は基本ステータスには影響しないため、戦闘力的には不利を被る</span>
                </li>
              </ul>
            </li>
            <li>
              アミュレットスキルは割合上昇のみで、上限は以下になる (こちらも SSR の場合。テクニックには影響しないので除外)
              <b-table small outlined :items="stat.amuletBonus"></b-table>
              <ul>
                <li>スキル1は戦闘時に効果を発揮するタイプで、基本ステータスには影響しない</li>
              </ul>
            </li>
          </ul>
        </p>

        <h2><a name="battle_power" href="#battle_power"></a>戦闘力について</h2>
        <BattlePointSimulator />
        <p>
          戦闘力は以下のように算出されます。<br />
          <br />
          <code>戦闘力＝A(ステータスに基づく基礎値) × B(☆やマスターレベルなどによる倍率)</code><br />
          A の内訳：<br />
          <code>HP×0.05＋攻撃力×2×(1.0＋テクニック×0.0003)＋ディフェンス×2＋レジスト×2</code><br />
          B の内訳：<br />
          <code>
            1.0＋☆の数×0.1＋マスターレベル×0.1<br />
            ＋メインの使用スキルコスト×0.03＋エンゲージ後スキルの数×0.05＋メインの装備の☆合計×0.02＋エンチャントが4セット揃っている場合0.1<br />
            ＋サポートのスキルの数×0.05
          </code><br />
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
              装備の効果は基本ステータス値が上がるもののみ戦闘力に計上される
              <ul>
                <li>サポートのアミュレットも同様で、戦闘開始後に効果を発揮するもの (割合バフやステータス値の n% を加算系など) は計上されない</li>
                <li>アクセサリのエンチャントのクリティカル率も計上されない</li>
              </ul>
            </li>
          </ul>
        </p>

        <h2><a name="comments" href="#comments"></a>コメント</h2>
        <MessageBoard thread="0123456789abcdef" @change="addPo($event.anchors);" @discard="removePo($event.anchors);" />
      </div>
    </div>

    <ItemPopovers />
  </div>
</template>

<script>
import Navigation from './Navigation.vue'
import DamageSimulator from './simulator/DamageSimulator.vue'
import BattlePointSimulator from './simulator/BattlePointSimulator.vue'
import StatusSimulator from './simulator/StatusSimulator.vue'
import MessageBoard from './parts/MessageBoard.vue'

import jsonMainActive from '../assets/main_active.json'
import jsonMainPassive from '../assets/main_passive.json'
import jsonMainTalents from '../assets/main_talents.json'
import jsonMainChrs from '../assets/main_characters.json'
import jsonSupportActive from '../assets/support_active.json'
import jsonSupportPassive from '../assets/support_passive.json'
import jsonSupportChrs from '../assets/support_characters.json'
import jsonItems from '../assets/items.json'
import common from "./common";

import ItemPopovers from './parts/ItemPopovers.vue'
import ItemPopoversJs from "./parts/ItemPopovers.js";

export default {
  name: 'About',
  components: {
    Navigation,
    DamageSimulator,
    BattlePointSimulator,
    StatusSimulator,
    MessageBoard,
    ItemPopovers,
  },
  mixins: [common, ItemPopoversJs],

  data() {
    return {
      stat: {
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

        classBonusBase: [
          { "攻撃側": "ソルジャー", "ソルジャー":  0, "ランサー": 45, "ライダー":-35, "エアリアル":  0, "アサシン":  0, "シューター":  0, "ソーサラー": 0, "セイント": 0 },
          { "攻撃側": "ランサー",   "ソルジャー":-35, "ランサー":  0, "ライダー": 45, "エアリアル":  0, "アサシン":  0, "シューター":  0, "ソーサラー": 0, "セイント": 0 },
          { "攻撃側": "ライダー",   "ソルジャー": 45, "ランサー":-35, "ライダー":  0, "エアリアル":  0, "アサシン":  0, "シューター":  0, "ソーサラー": 0, "セイント": 0 },
          { "攻撃側": "エアリアル", "ソルジャー":  0, "ランサー":  0, "ライダー":  0, "エアリアル":  0, "アサシン": 45, "シューター":-35, "ソーサラー": 0, "セイント": 0 },
          { "攻撃側": "アサシン",   "ソルジャー":  0, "ランサー":  0, "ライダー":  0, "エアリアル":-35, "アサシン":  0, "シューター": 45, "ソーサラー": 0, "セイント": 0 },
          { "攻撃側": "シューター", "ソルジャー":  0, "ランサー":  0, "ライダー":  0, "エアリアル": 45, "アサシン":-35, "シューター":  0, "ソーサラー": 0, "セイント": 0 },
          { "攻撃側": "ソーサラー", "ソルジャー": 20, "ランサー": 20, "ライダー": 20, "エアリアル":-15, "アサシン":-15, "シューター":-15, "ソーサラー": 0, "セイント": 0 },
          { "攻撃側": "セイント",   "ソルジャー":-15, "ランサー":-15, "ライダー":-15, "エアリアル": 20, "アサシン": 20, "シューター": 20, "ソーサラー": 0, "セイント": 0 },
        ],
        classBonusMax: [
          { "攻撃側": "ソルジャー", "ソルジャー":  0, "ランサー": 75, "ライダー":-35, "エアリアル":  0, "アサシン":  0, "シューター":  0, "ソーサラー": 0, "セイント": 0 },
          { "攻撃側": "ランサー",   "ソルジャー":-35, "ランサー":  0, "ライダー": 75, "エアリアル":  0, "アサシン":  0, "シューター":  0, "ソーサラー": 0, "セイント": 0 },
          { "攻撃側": "ライダー",   "ソルジャー": 75, "ランサー":-35, "ライダー":  0, "エアリアル":  0, "アサシン":  0, "シューター":  0, "ソーサラー": 0, "セイント": 0 },
          { "攻撃側": "エアリアル", "ソルジャー":  0, "ランサー":  0, "ライダー":  0, "エアリアル":  0, "アサシン": 75, "シューター":-35, "ソーサラー": 0, "セイント": 0 },
          { "攻撃側": "アサシン",   "ソルジャー":  0, "ランサー":  0, "ライダー":  0, "エアリアル":-35, "アサシン":  0, "シューター": 75, "ソーサラー": 0, "セイント": 0 },
          { "攻撃側": "シューター", "ソルジャー":  0, "ランサー":  0, "ライダー":  0, "エアリアル": 75, "アサシン":-35, "シューター":  0, "ソーサラー": 0, "セイント": 0 },
          { "攻撃側": "ソーサラー", "ソルジャー": 35, "ランサー": 35, "ライダー": 35, "エアリアル":-15, "アサシン":-15, "シューター":-15, "ソーサラー": 0, "セイント": 0 },
          { "攻撃側": "セイント",   "ソルジャー":-15, "ランサー":-15, "ライダー":-15, "エアリアル": 35, "アサシン": 35, "シューター": 35, "ソーサラー": 0, "セイント": 0 },
        ],
      },
    };
  },

  created() {
    document.title = "れじぇくろDB: 解説";

    this.mainActive = structuredClone(jsonMainActive);
    this.mainPassive = structuredClone(jsonMainPassive);
    this.mainTalents = structuredClone(jsonMainTalents);
    this.mainChrs = structuredClone(jsonMainChrs);
    this.supActive = structuredClone(jsonSupportActive);
    this.supPassive = structuredClone(jsonSupportPassive);
    this.supChrs = structuredClone(jsonSupportChrs);
    this.items = structuredClone(jsonItems);

    this.setupCharacters(this.mainChrs, this.mainActive, this.mainPassive, this.mainTalents);
    this.setupCharacters(this.supChrs, this.supActive, this.supPassive);
    this.setupItems(this.items);

    this.searchTable = new Map();
    for (let s of [...this.mainActive, ...this.mainPassive, ...this.mainTalents, ...this.supActive, ...this.supPassive, ...this.items])
      this.searchTable.set(s.name, s);

    this.specialBuffSkillsSingle = [];
    this.specialBuffSkillsMulti = [];
    for (const skill of this.mainActive) {
      if (!skill.isSymbolSkill) {
        for (const effect of skill.buff ?? []) {
          if (effect.hasSpecialSlot) {
            if (effect.target == "自身" || effect.target == "単体")
              this.specialBuffSkillsSingle.push(skill);
            else
              this.specialBuffSkillsMulti.push(skill);
            break;
          }
        }
      }
    }
  },

  mounted() {
  },

  methods: {
    findItem(name) {
      const r = this.searchTable.get(name);
      //if (!r) {
      //  console.log(`${name} not found`);
      //}
      return r;
    },

    n2percent(n) {
      if (typeof (n) === 'number')
        return n == 0 ? "-" : n > 0 ? `+${n}%` : `${n}%`;
      else
        return `<b>${n}</b>`;
    },
  },

  computed: {
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
