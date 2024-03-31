<template>
  <div class="root" id="root" ref="root" @mousemove="onMouseMove">
    <div class="header" :class="{ 'hidden': !showHeader }">
      <Navigation />
    </div>
    <div class="about" style="margin-top: 60px;">
    </div>

    <div v-show="!simulation" class="content" style="margin-bottom: 20px;">
      <div class="main-panel" style="padding: 10px;">
        <h2 style="margin-bottom: 5px">バトルシミュレータ</h2>
        <div>
          ユニットを自由に編成・配置し、ダメージなどの戦闘結果を計算するシミュレータです。<br />
          主にギルドクエストEXの攻略とキャラ評価に使うことを目的としており、これまでのEXでそれなりに信頼できる結果が得られることが実証されています。<br />
          <br />
        </div>
        <div>
          使い方は、クエスト欄でマップを選択、ユニット欄の「編集」でユニットを編成し、「シミュレーション開始」で戦闘を開始。あとはだいたい実際のゲームと同じように動作します。<br />
          戦闘結果は<b-link @click="toggleReplayList(true)">リプレイ</b-link>として保存することができます。リプレイの途中からの再開も可能です。まずはリプレイを見てみると機能を把握しやすいでしょう：<b-link @click="importReplayFromUrl('64ebe357f471ab7fc66aadab9e1c1be7', (r) => playbackReplay(r, { immediate: true }))">リプレイを再生</b-link><br />
          <div>
            <br />
            <b-link @click="detailedDescription=!detailedDescription">シミュレーション時の動作の詳細</b-link> (長いのでクリックで展開)<br />
            <div v-show="detailedDescription">
              できるだけ実際のゲームの動作に合わせていますが、再現できていない仕様や検証しやすいように意図的に変えている部分もあります。以下目立った違いやTips：
              <ul>
                <li>ランダム要素を完全に排しており、ダメージのばらつきがありません</li>
                <li>クリティカルヒットする可能性がある攻撃 (=メインの攻撃) は100%クリティカル扱いになります</li>
                <li>本来確率で発動する効果も100%発動します (ただし、自傷効果はこれでは支障が出るため、オプションで切れるようになっています)</li>
                <li>バフ解除やランダムバフも一定の規則に則った動作になります (シミュレーション開始後の「自動ランダムバフ」などのオプションを参照)</li>
                <li>HP割合に応じて増減する効果 (<b-link :ref="po">道教式チアリーディング</b-link>の与ダメージバフなど) は現状常に最大効果を適用します (正確な動作が分かっていないため暫定処置)</li>
                <li>編成で☆の増減ができますが、タレント/サポートアクティブは現状☆を考慮せず最大レベル時の効果を適用します (対応が大変なため暫定処置)</li>
                <li>状態異常と無効化系は大部分が未実装です (現状 強化不可 はガーディアンをなにもせず待機させて模倣する必要があります)</li>
                <li>ユニットを選択するとその時点で影響下にあるバフ・デバフが表示されます。攻撃対象を選んでいる状態であれば戦闘時発動効果も考慮されます</li>
                <li>デベロッパーツールを出しておくとコンソールに詳細なログが出ます (Chrome や Edge なら Ctrl + Shift + I)</li>
              </ul>
            </div>
          </div>
          <br />
        </div>
        <div>
          アイテムやスキルのデータは入力漏れやミスが残っている可能性があります。
          ミス報告、バグ報告、要望などあれば<b-link href="#comments">コメント欄</b-link>へご一報いただけると幸いです。
        </div>
      </div>
    </div>

    <div class="content" :style="style" style="margin-bottom: 20px;">
      <div class="main-panel">
        <div v-if="!simulation" class="menu-widgets flex" style="margin: 0px 10px 15px 10px;">
          <div class="widget">
            <span>クエスト：</span>
            <b-dropdown :text="battleData ? battleData.name : ''" id="battle_selector" style="min-width: 20em;">
              <b-dropdown-item v-for="(battle, i) in battleList" class="d-flex flex-column" :key="i" @click="selectBattle(battle.uid, true); updateURL();">
                {{ battle.name }}
              </b-dropdown-item>
            </b-dropdown>
          </div>
        </div>

        <b-tabs v-if="!simulation" v-model="phaseTabIndex">
          <b-tab v-for="phase in phaseList" :title="phase.desc" @click="selectPhase(phase.id, true); updateURL();" :key="phase.id"></b-tab>
        </b-tabs>

        <div style="padding: 10px; background-color: white; display: flex;">
          <div ref="cells" class="grid-container"
               @mousedown.middle.prevent.stop=""
               @click.middle.prevent.stop="onCellRClick()"
               @click.right.prevent.stop="onCellRClick()">
            <div v-for="(cell, i) in cells" :key="`c${i}`" :class="getCellClass(cell)" :style="cell.style" :id="cell.id"
                 @click.stop="onClickCell(cell)"
                 @mouseover="onEnterCell(cell)" @mouseleave="onLeaveCell(cell)"
                 :draggable="isCellDraggable(cell)" @dragstart="onDragCell(cell)" @drop="onDropCell(cell)" @dragover.prevent="">
            </div>
            <template v-for="unit in allActiveUnits">
              <template v-if="unit.isNxN">
                <div v-for="pos in unit.occupiedCells" :key="`${unit.fid}[${pos[0]}][${pos[1]}]`" :style="`transform: translate(${pos[0] * 50}px, ${pos[1] * 50}px)`" class="unit-cell">
                  <b-img :src="getImageURL(unit.main.class)" class="center" :class="getUnitIconClass(unit)" width="40" height="40" />
                </div>
              </template>
              <template v-else>
                <div :key="unit.fid" :id="`unit-${unit.fid}`" class="unit-cell">
                  <template v-if="unit.isEnemy && unit.hasSupport">
                    <b-img :src="getImageURL(unit.main.class)" class="center" :class="getUnitIconClass(unit)"
                           width="30" height="30" style="left: 17px; top: 17px; z-index: 1;" />
                    <b-img :src="getImageURL(unit.support.class)" class="center" :class="getUnitIconClass(unit)"
                           width="30" height="30" style="left: 33px; top: 33px; z-index: 0;" />
                  </template>
                  <template v-else-if="unit.isEnemy">
                    <b-img :src="getImageURL(unit.main.class)" class="center" :class="getUnitIconClass(unit)" width="40" height="40" />
                  </template>
                  <template v-else-if="unit.isPlayer">
                    <div>
                      <b-img :src="getImageURL(unit.main.icon)" class="center" :class="getUnitIconClass(unit)" width="50" height="50" />
                    </div>
                  </template>
                </div>
              </template>
            </template>
            <div v-if="loading" class="menu-panel" style="padding: 10px; position: absolute;">
              <b-spinner small label="Spinning"></b-spinner>
            </div>
          </div>

          <div ref="enemyList" class="enemy-list">
            <div v-if="simulation" class="character">
              <div class="info">
                <h5 style="font-size: 18pt;">スコア</h5>
                <div class="grid" style="grid-template-columns: auto auto 1fr;">
                  <template v-for="unit in allPlayerUnits">
                    <div :key="`portrait-${unit.fid}`" style="grid-column: 1;">
                      <b-img-lazy :src="getImageURL(unit.main.icon)" :title="unit.main.name" :class="`${!unit.isAlive ? 'grayscale' : ''}`" width="50" height="50" rounded />
                    </div>
                    <div :key="`score-${unit.fid}`" style="grid-column: 2; margin-left: 10px; text-align: right;" v-html="scoreToHtml(unit.sim.score)" />
                    <div :key="`pad-${unit.fid}`" style="grid-column: 3;" />
                  </template>

                  <div style="grid-column: 1; font-size: 18pt;">合計</div>
                  <div style="grid-column: 2; margin-left: 10px; text-align: right;" v-html="scoreToHtml(simulation.score)" />
                  <div style="grid-column: 3;" />
                </div>
              </div>
            </div>

            <template v-for="unit in activeEnemyUnits">
              <div class="character" :class="{ 'highlighted': isUnitHighlighted(unit) }" :id="'unit_'+unit.fid" :key="unit.fid">
                <div class="flex">
                  <div class="portrait">
                    <b-img-lazy :src="getImageURL(unit.main.icon)" :title="unit.main.name" width="80" height="80" rounded />
                  </div>
                  <div class="detail" v-show="displayType >= 1">
                    <div class="info">
                      <h5 v-html="chrNameToHtml(unit.main.name + (unit.isSummon ? ' (召喚ユニット)' : ' (メイン)'))"></h5>
                      <div class="status">
                        <b-img-lazy :src="getImageURL(unit.main.class)" :title="'クラス:'+unit.main.class" height="25" />
                        <div class="param-box"><b-img-lazy :src="getImageURL(unit.main.damageType)" :title="'攻撃タイプ:'+unit.main.damageType" width="20" height="20" /></div>
                        <div class="param-box"><b-img-lazy :src="getImageURL('射程')" title="射程" width="18" height="18" /><span>{{unit.main.range}}</span></div>
                        <div class="param-box"><b-img-lazy :src="getImageURL('移動')" title="移動" width="18" height="18" /><span>{{unit.main.move}}</span></div>
                        <div class="param-box"><span class="param-name">レベル:</span><span class="param-value">{{unit.main.level}}</span></div>
                      </div>
                      <div v-if="unit.main.status" class="status2" v-html="statusToHtml(unit.main.status)" />
                    </div>
                    <div class="skills">
                      <template v-for="skill in unit.main.skills">
                        <div v-if="!skill.isNormalAttack" class="skill" :class="getSkillClass(skill)" :key="skill.uid">
                          <div class="flex">
                            <div class="icon">
                              <b-img-lazy :src="getImageURL(skill.icon)" with="50" height="50" />
                            </div>
                            <div class="desc" v-show="displayType >= 2">
                              <div class="flex">
                                <h6>{{ skill.name }}</h6>
                                <div class="param-group" v-html="skillParamsToHtml(skill)"></div>
                              </div>
                              <p><span v-html="descToHtml(skill)"></span><span v-if="skill.note" class="note" v-html="noteToHtml(skill)"></span></p>
                            </div>
                          </div>
                        </div>
                      </template>
                    </div>
                  </div>
                </div>

                <div v-if="unit.hasSupport && displayType >= 2" class="flex">
                  <div class="portrait">
                    <b-img-lazy :src="getImageURL(unit.support.icon)" :title="unit.support.name" width="80" height="80" rounded />
                  </div>
                  <div class="detail" v-show="displayType >= 1">
                    <div class="info">
                      <h5 v-html="chrNameToHtml(unit.support.name+' (サポート)')"></h5>
                      <div class="status">
                        <b-img-lazy :src="getImageURL(unit.support.class)" :title="'クラス:'+unit.support.class" height="25" />
                        <div class="param-box"><b-img-lazy :src="getImageURL(unit.support.damageType)" :title="'攻撃タイプ:'+unit.support.damageType" width="20" height="20" /></div>
                        <div class="param-box"><b-img-lazy :src="getImageURL('射程')" title="射程" width="18" height="18" /><span>{{unit.support.range}}</span></div>
                        <div class="param-box"><span class="param-name">レベル:</span><span class="param-value">{{unit.support.level}}</span></div>
                      </div>
                      <div v-if="unit.support.status" class="status2" v-html="statusToHtml(unit.support.status)" />
                    </div>
                  </div>
                </div>
              </div>
            </template>

          </div>

        </div>
      </div>
    </div>

    <div v-if="simulation" :class="`content sim-commands ${simulation.isPlayerTurn ? 'player-turn' : 'enemy-turn'}` " @click.stop="">
      <div class="unit-panel">
        <div v-if="selectedUnit && actionsToSelect.length" style="margin-bottom: 20px; display: flex; flex-wrap: wrap;">
          <div v-if="selectedUnit.sim.isOnMultiMove" style="font-size: 16pt; color: gray; width: 100%;">再移動中</div>
          <div v-if="selectedUnit.sim.isOnMultiAction" style="font-size: 16pt; color: gray; width: 100%;">再行動中</div>
          <b-button size="sm" style="width: 45px; height: 45px; margin-right: 5px;" @click="onClickWait();">
            待機
          </b-button>
          <div v-for="skill of actionsToSelect" :key="skill.uid" :class="getActionClass(skill, selectedUnit)" :title="descToTitle(skill)" @click="onClickAction(skill)">
            <b-img :src="getImageURL(skill.icon)" style="width: 100%; height: 100%;" />
            <div v-if="!skill.available" class="text-overlay">CT{{isFinite(skill.coolTime) ? skill.coolTime : "∞"}}</div>
          </div>
        </div>
        <div>
          <h5>
            ターン{{ simulation.turn }} : {{ simulation.isPlayerTurn ? 'プレイヤー': 'エネミー' }}フェイズ
          </h5>
          <b-button v-if="!simulation.onPlayback" size="sm" @click="endTurn()" style="width: 10em; margin-right: 1em;"
                    :disabled="simulation.turn == simulation.maxTurn && simulation.isEnemyTurn">
            ターン終了
          </b-button>
          <b-button v-if="simulation.onPlayback && !simulation.isPlaying" size="sm" @click="beginPlayback()" style="width: 10em; margin-right: 1em;">
            再生開始
          </b-button>
        </div>
        <div style="margin-top: 20px">
          <b-button v-if="selectedUnit" size="sm" style="margin-right: 0.25em;" @click="eraseSelectedUnit()">
            このユニットを撃破
          </b-button>
          <b-button size="sm" @click="endSimulation()" style="width: 14em;">
            シミュレーション終了
          </b-button>
        </div>
      </div>

      <div class="unit-panel">
        <div v-if="showConfirm">
          <b-button size="sm" @click="confirmAction()" style="width: 14em;">
            行動を確定
          </b-button>
        </div>
        <div v-else-if="selectedUnit">
          <b-table small borderless hover :items="simOptions" :fields="simOptionFields" :tbody-tr-attr="(r)=>{ return {id: `simopt-${r.name}`}; }">
            <template #cell(value)="r">
              <div class="flex">
                <div style="margin-left: auto">
                  <b-form-checkbox v-model="r.item.value"></b-form-checkbox>
                </div>
              </div>
            </template>
            <template #cell(label)="r">
              <div>{{r.item.label}}</div>
              <b-popover :target="`simopt-${r.item.name}`" triggers="hover focus">
                <div v-html="r.item.desc" />
              </b-popover>
            </template>
          </b-table>
        </div>
        <div v-else>
          シミュレーションモードでは実際のゲームのようにユニットを操作できます。<br />
          しかし、検証のため、あるいは再現が難しいため、動作が異なる点もあります。以下大雑把な説明。<br />
          <ul>
            <li><b>右クリックでキャンセル</b>の動作になります。</li>
            <li><b>敵フェイズでは敵ユニットを手動で操作する必要があります</b>。正確な再現が困難なため、自動では行動しません。</li>
            <li>移動可能範囲は表示されますが、それを無視して無限に移動できます。また、無限に再行動できます。</li>
            <li>CT 中のアクティブスキルも使用可能です。</li>
            <li>やり直したい場合、<b><b-link @mouseenter="highlight('history', true)" @mouseleave="highlight('history', false)">履歴</b-link>から過去に遡ることができます</b>。</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="grid" style="position: fixed; right: 5px; bottom: 5px; grid-template-columns: auto auto;">
      <div v-show="showReplayList" class="unit-panel" style="min-width: 1200px; max-width: 1600px; max-height: 500px; margin-right: 5px; grid-column: 1; ">
        <div class="flex" style="margin-bottom: 5px;">
          <h5>公開されているリプレイ</h5>
          <div style="margin-left: auto;">
            <b-button size="sm" @click="showReplayList=false;" style="margin-left: 1em; padding: 0px 5px;">✖</b-button>
          </div>
        </div>
        <template v-if="fetching">
          <div style="padding: 10px;">
            <b-spinner small label="Spinning"></b-spinner>
          </div>
        </template>
        <template v-else>
          <b-table small outlined sticky-header :items="replayList" :fields="replayFields" style="min-width: 90%; margin-bottom: 5px;">
            <template #cell(battle)="row">
              <span style="white-space: nowrap;">{{getItemName(row.item.battle)}}</span>
            </template>
            <template #cell(score)="row">
              <span style="white-space: nowrap;">{{row.item.score}}</span>
            </template>
            <template #cell(units)="row">
              <span style="white-space: nowrap;">
                <b-img v-for="(uid, i) of row.item.units ?? []" :key="i" :src="getImageURL(uid)" width="35px" height="35px" />
              </span>
            </template>
            <template #cell(actions)="row">
              <div class="flex" style="white-space: nowrap;">
                <b-button size="sm" @click="downloadReplay(row.item); showReplayList=false;">
                  ロード
                </b-button>
                <b-button size="sm" :id="`replay-${row.item.hash}`" @click="copyReplayUrl(row.item)" style="margin-left: 0.25em">
                  URLコピー
                </b-button>
                <b-button v-if="row.item.delkey" size="sm" @click="deleteReplay(row.item)" style="margin-left: 0.25em">
                  削除
                </b-button>
              </div>
            </template>
          </b-table>
        </template>
        <div v-if="simulation ?? replay" style="margin-bottom: 0.75em;">
          <div class="flex" style="margin-bottom: 0.25em;">
            <b-button size="sm" @click="uploadReplay()">
              現在のリプレイを公開
            </b-button>
            <b-form-input size="sm" v-model="userName" placeholder="投稿者名" style="width: 8em; margin-left: 0.5em;"></b-form-input>
            <b-form-input size="sm" v-model="commentReplay" placeholder="コメント" style="flex: 1; margin-left: 0.5em;"></b-form-input>
          </div>
          <div class="flex">
            <span style="margin-left: 0.5em; color: rgb(160,160,160);">(投稿者本人は投稿したデータを削除可能)</span>
          </div>
        </div>
        <div class="flex">
          <b-button v-if="simulation ?? replay" size="sm" @click="exportReplayAsFile()" style="min-width: 12em;">
            ファイルにエクスポート
          </b-button>
          <b-button size="sm" @click="importReplayFromFile()" style="min-width: 12em; margin-left: 0.5em;">
            ファイルからインポート
          </b-button>
        </div>
      </div>

      <div id="history" class="unit-panel" style="grid-column: 2; width: 200px; margin-top: auto;" @click.stop="" tabindex="0" @keydown.up.stop="onKeyReplay($event)" @keydown.down.stop="onKeyReplay($event)">
        <div style="max-height: 350px; overflow-y: auto; overscroll-behavior: none;">
          <template v-if="simulation ?? replay">
            <template v-for="(r, i) of (simulation ?? replay).states.toReversed()">
              <div class="flex" :style="`margin: 2px 0px; ${ simulation?.statePos==-i-1 ? 'background: rgb(200,200,210)': '' }`" :key="i" :id="`sim-state-${-i-1}`">
                <b-button size="sm" style="padding: 0px; width: 30px; height: 30px; margin-right: 0.25em;" @click="setReplayState(-i-1);">▶</b-button>
                <template v-if="r.desc.isAction">
                  <b-img :src="getImageURL(r.desc.unitIcon)" width="35px" height="35px" />
                  <b-img :src="getImageURL(r.desc.skillIcon)" width="35px" height="35px" />
                  <b-img :src="getImageURL(r.desc.targetIcon)" width="35px" height="35px" />
                </template>
                <template v-else>
                  <span>{{`T${r.turn} ${r.phase==0?'(プレイヤー)':'(エネミー)'}`}} 開始</span>
                </template>
              </div>
            </template>
          </template>
        </div>
        <b-button size="sm" style="min-width: 13em; margin-top: 0.5em;" @click="toggleReplayList()">
          リプレイ
        </b-button>
      </div>
    </div>

    <div class="content" :style="style">
      <div class="main-panel" style="margin-top: 10px; margin-bottom: 10px;">
        <div class="flex" v-if="!simulation" style="margin: 0px 10px 20px 10px;">
          <a name="loadout" href="#loadout"></a>
          <b-dropdown text="編成をセーブ" style="min-width: 10em;">
            <b-dropdown-item v-for="(name, i) in slotNames" :key=i @click="saveLoadout(i)">スロット{{i}}: {{name}}</b-dropdown-item>
          </b-dropdown>
          <b-dropdown text="編成をロード" style="min-width: 10em; margin-left: 1em; ">
            <b-dropdown-item v-for="(name, i) in slotNames" :key=i @click="loadLoadout(i)">スロット{{i}}: {{name}}</b-dropdown-item>
            <b-dropdown-item @click="loadLoadout(99)">バックアップ</b-dropdown-item>
          </b-dropdown>

          <b-button @click="clearLoadout()" style="min-width: 10em; margin-left: 1em; ">
            編成をクリア
          </b-button>

          <b-button style="width: 14em; margin-left: 4em;" @click="beginSimulation()">
            シミュレーション開始
          </b-button>
          <b-button v-if="replay" id="btn-follow-replay" @click="playbackReplay(replay)" style="margin-left: 1em;">
            現在の構成でリプレイをなぞる
            <b-popover :target="`btn-follow-replay`" triggers="hover focus">
              行動パターンはそのまま装備だけ変えてダメージの変化を調べるための機能です。<br />
              射程、スキル構成、ユニットの生死が変わるような変化があるとなぞれなくなって中断される可能性があります。<br />
            </b-popover>
          </b-button>
        </div>

        <div v-if="!simulation" class="flex" style="margin: 0px 10px 10px 10px;">
          <b-form-input v-model="slotName" placeholder="編成名" style="width: 16em"></b-form-input>
          <b-form-input v-model="slotDesc" placeholder="コメント" style="flex: 1; margin-left: 0.5em; "></b-form-input>
        </div>

        <b-tabs v-if="!simulation" v-model="unitTabIndex">
          <b-tab v-for="(unit, ui) in playerUnits" :key="ui" style="background-color: white;">
            <template #title>
              <h2 style="font-size: 1em;" draggable @dragstart="onDragUnit(unit)" @drop="onDropUnit(unit)" @dragover.prevent="">
                ユニット{{ui+1}}
                <b-img-lazy :src="getImageURL(unit.main?.icon)" width="30" />
                <b-img-lazy :src="getImageURL(unit.support?.icon)" width="30" />
              </h2>
            </template>

            <div @dragover.prevent @drop.prevent="onDropLoadout($event)" style="min-width: 1520px; min-height: 500px;">
              <div v-if="!simulation" style="padding: 10px; display: flex">
                <b-button :id="`btn-edit-unit${ui}`" @click="unit.showEditor=!unit.showEditor" style="width: 12em;">編集</b-button>
                <b-popover :target="`btn-edit-unit${ui}`" custom-class="status-simulator-popover" :show.sync="unit.showEditor" :delay="{show:0, hide:250}" no-fade>
                  <StatusSimulator embed :data="unit.editorData" @change="unit.edit($event)" />
                  <div class="flex" style="margin: 0 0 10px 10px;">
                    <b-button size="sm" @click="unit.showEditor=false">閉じる</b-button>
                  </div>
                </b-popover>
                <div style="margin-left: 1em; color: rgb(160,160,160);">マップ上のユニットはドラッグで位置を交換できます</div>
              </div>

              <div class="flex" style="align-items: flex-start;">
                <div v-if="unit.main.cid" class="character">
                  <div class="flex">
                    <div class="portrait">
                      <b-img-lazy :src="getImageURL(unit.main.icon)" :title="unit.main.name" width="100" height="100" rounded />
                    </div>
                    <div class="detail" v-show="displayType >= 1">
                      <div class="info">
                        <h5 v-html="chrNameToHtml(unit.main.name)"></h5>
                        <div class="status">
                          <b-img-lazy :src="getImageURL(unit.main.class)" :title="'クラス:'+unit.main.class" height="25" />
                          <b-img-lazy :src="getImageURL(unit.main.symbol)" :title="'シンボル:'+unit.main.symbol" height="25" />
                          <b-img-lazy :src="getImageURL(unit.main.rarity)" :title="'レアリティ:'+unit.main.rarity" height="20" />
                          <div class="param-box"><b-img-lazy :src="getImageURL(unit.main.damageType)" :title="'攻撃タイプ:'+unit.main.damageType" width="20" height="20" /></div>
                          <div class="param-box"><b-img-lazy :src="getImageURL('射程')" title="射程" width="18" height="18" /><span>{{unit.main.range}}</span></div>
                          <div class="param-box"><b-img-lazy :src="getImageURL('移動')" title="移動" width="18" height="18" /><span>{{unit.main.move}}</span></div>
                        </div>
                        <div class="status2" v-html="statusToHtml(unit.main.status)" />
                      </div>
                      <div class="skills">
                        <template v-for="(skill, si) in unit.main.skills">
                          <div class="skill" v-if="!skill.isNormalAttack" :class="getSkillClass(skill)" :key="`skill${si}`">
                            <div class="flex">
                              <div class="icon">
                                <b-img-lazy :src="getImageURL(skill.icon)" with="50" height="50" />
                              </div>
                              <div class="desc">
                                <div class="flex">
                                  <h6>{{ skill.name }}</h6>
                                  <div class="param-group" v-html="skillParamsToHtml(skill)"></div>
                                </div>
                                <p><span v-html="descToHtml(skill)"></span><span v-if="skill.note" class="note" v-html="noteToHtml(skill)"></span></p>
                              </div>
                            </div>
                          </div>
                        </template>
                      </div>
                      <div class="skills">
                        <div class="skill" v-for="(skill, si) in unit.main.items" :class="getSkillClass(skill)" :key="`item${si}`">
                          <div class="flex">
                            <div class="icon">
                              <b-img-lazy :src="getImageURL(skill.icon)" with="50" height="50" />
                            </div>
                            <div class="desc">
                              <div class="flex">
                                <h6>
                                  <b-img-lazy v-if="skill.slot" :src="getImageURL(skill.slot)" :title="'部位:'+skill.slot" height="20" />
                                  {{ skill.name }}
                                </h6>
                              </div>
                              <p><span v-html="descToHtml(skill)"></span><span v-if="skill.note" class="note" v-html="noteToHtml(skill)"></span></p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="unit.support.cid" class="character">
                  <div class="flex">
                    <div class="portrait">
                      <b-img-lazy :src="getImageURL(unit.support.icon)" :title="unit.support.name" width="100" height="100" rounded />
                    </div>
                    <div class="detail" v-show="displayType >= 1">
                      <div class="info">
                        <h5 v-html="chrNameToHtml(unit.support.name)"></h5>
                        <div class="status">
                          <b-img-lazy :src="getImageURL(unit.support.class)" :title="'クラス:'+unit.support.class" height="25" />
                          <b-img-lazy :src="getImageURL(unit.support.supportType)" :title="'サポートタイプ:'+unit.support.supportType" height="25" />
                          <b-img-lazy :src="getImageURL(unit.support.rarity)" :title="'レアリティ:'+unit.support.rarity" height="20" />
                          <div class="param-box"><b-img-lazy :src="getImageURL(unit.support.damageType)" :title="'攻撃タイプ:'+unit.support.damageType" width="20" height="20" /></div>
                          <div class="param-box"><b-img-lazy :src="getImageURL('射程')" title="射程" width="18" height="18" /><span>{{unit.support.range}}</span></div>
                        </div>
                        <div class="status2" v-html="statusToHtml(unit.support.status, '', unit.support.damageType)" />
                      </div>
                      <div class="skills">
                        <div class="skill" v-for="(skill, si) in unit.support.skills" :class="getSkillClass(skill)" :key="`skill${si}`">
                          <div class="flex">
                            <div class="icon">
                              <b-img-lazy :src="getImageURL(skill.icon)" with="50" height="50" />
                            </div>
                            <div class="desc" v-show="displayType >= 2">
                              <div class="flex">
                                <h6>{{ skill.name }}</h6>
                                <div class="param-group" v-html="skillParamsToHtml(skill)"></div>
                              </div>
                              <p><span v-html="descToHtml(skill)"></span><span v-if="skill.note" class="note" v-html="noteToHtml(skill)"></span></p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="skills">
                        <div class="skill" v-for="(skill, si) in unit.support.items" :class="getSkillClass(skill)" :key="`item${si}`">
                          <div class="flex">
                            <div class="icon">
                              <b-img-lazy :src="getImageURL(skill.icon)" with="50" height="50" />
                            </div>
                            <div class="desc" v-show="displayType >= 2">
                              <div class="flex">
                                <h6>
                                  <b-img-lazy v-if="skill.slot" :src="getImageURL(skill.slot)" :title="'部位:'+skill.slot" height="20" />
                                  {{ skill.name }}
                                </h6>
                              </div>
                              <p><span v-html="descToHtml(skill)"></span><span v-if="skill.note" class="note" v-html="noteToHtml(skill)"></span></p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </b-tab>
        </b-tabs>


        <div v-if="simulation && selectedUnit" class="flex" style="align-items: flex-start;" :set="unit=selectedUnit">
          <div v-if="unit.main.cid" class="character">
            <div class="flex">
              <div class="portrait">
                <b-img-lazy :src="getImageURL(unit.main.icon)" :title="unit.main.name" width="100" height="100" rounded />
              </div>
              <div class="detail" v-show="displayType >= 1">
                <div class="info">
                  <h5 v-html="chrNameToHtml(unit.main.name)"></h5>
                  <div class="status">
                    <b-img-lazy :src="getImageURL(unit.main.class)" :title="'クラス:'+unit.main.class" height="25" />
                    <b-img-lazy v-if="unit.main?.symbol" :src="getImageURL(unit.main.symbol)" :title="'シンボル:'+unit.main.symbol" height="25" />
                    <b-img-lazy v-if="unit.main?.rarity" :src="getImageURL(unit.main.rarity)" :title="'レアリティ:'+unit.main.rarity" height="20" />
                    <div class="param-box"><b-img-lazy :src="getImageURL(unit.main.damageType)" :title="'攻撃タイプ:'+unit.main.damageType" width="20" height="20" /></div>
                    <div class="param-box"><b-img-lazy :src="getImageURL('射程')" title="射程" width="18" height="18" /><span>{{unit.main.range}}</span></div>
                    <div class="param-box"><b-img-lazy :src="getImageURL('移動')" title="移動" width="18" height="18" /><span>{{unit.main.move}}</span></div>
                  </div>
                  <div class="status2" v-html="statusToHtml(unit.main.status)" />
                </div>
              </div>
            </div>
          </div>

          <div v-if="unit.support.cid" class="character">
            <div class="flex">
              <div class="portrait">
                <b-img-lazy :src="getImageURL(unit.support.icon)" :title="unit.support.name" width="100" height="100" rounded />
              </div>
              <div class="detail" v-show="displayType >= 1">
                <div class="info">
                  <h5 v-html="chrNameToHtml(unit.support.name)"></h5>
                  <div class="status">
                    <b-img-lazy :src="getImageURL(unit.support.class)" :title="'クラス:'+unit.support.class" height="25" />
                    <b-img-lazy v-if="unit.support?.supportType" :src="getImageURL(unit.support.supportType)" :title="'サポートタイプ:'+unit.support.supportType" height="25" />
                    <b-img-lazy v-if="unit.support?.rarity" :src="getImageURL(unit.support.rarity)" :title="'レアリティ:'+unit.support.rarity" height="20" />
                    <div class="param-box"><b-img-lazy :src="getImageURL(unit.support.damageType)" :title="'攻撃タイプ:'+unit.support.damageType" width="20" height="20" /></div>
                    <div class="param-box"><b-img-lazy :src="getImageURL('射程')" title="射程" width="18" height="18" /><span>{{unit.support.range}}</span></div>
                  </div>
                  <div class="status2" v-html="statusToHtml(unit.support.status, '', unit.support.damageType)" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="simulation && selectedUnit" class="character" style="align-items: flex-start; width: 1510px; max-width: 1510px;">
          <template :set="unit=selectedUnit.sim">
            <h5 style="margin: 5px;">影響下にあるスキル</h5>
            <div class="flex info">
              <div><h6>メイン合計: </h6></div>
              <template v-for="(l, li) in effectValuesToHtml(unit.main.buf, unit.main.bufCv)">
                <div :key="li" v-html="l" />
              </template>
            </div>
            <div v-if="unit.support.isAlive" class="flex info">
              <div><h6>サポート合計: </h6></div>
              <template v-for="(l, li) in effectValuesToHtml(unit.support.buf, unit.support.bufCv)">
                <div :key="li" v-html="l" />
              </template>
            </div>

            <div class="skills" style=" display: flex; margin-top: 5px;">
              <template v-for="(skill, si) in selectedUnit.sim.affectedSkills">
                <div class="skill" style="width: 745px; max-width: 745px;" v-if="!skill.isNormalAttack" :class="getSkillClass(skill)" :key="`skill${si}`">
                  <div class="flex">
                    <div class="icon">
                      <b-img-lazy :src="getImageURL(skill.icon)" with="50" height="50" />
                    </div>
                    <div class="desc">
                      <div class="flex">
                        <h6>{{ skill.name }}</h6>
                        <div class="param-group" v-html="skillParamsToHtml(skill)"></div>
                      </div>
                      <p><span v-html="descToHtml(skill)"></span><span v-if="skill.note" class="note" v-html="noteToHtml(skill)"></span></p>
                      <span class="note">
                        <div class="effect-group">
                          <template v-for="e in [...skill.effects, ...skill.randomEffects]">
                            <template v-for="(d, di) in (selectedUnit.sim.affectedEffects[e.uid] ?? [])">
                              <div class="effect-box" :key="`${e.uid}${di}`">
                                <span :class="`effect ${d.effect.enabled ? 'caution' : ''}`">
                                  {{d.desc}}
                                  <b-badge v-if="d.isTimed" class="tag" variant="secondary" pill @click="d.remove()">×</b-badge>
                                </span>
                              </div>
                            </template>
                          </template>
                        </div>
                      </span>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </template>
        </div>
        <div v-if="simulation" style="height: 300px;"></div>
      </div>
    </div>

    <div v-if="!simulation" class="content" style="margin-top: 20px; margin-bottom: 20px;">
      <div class="main-panel" style="min-width: 1000px; max-width: 1500px; padding: 10px;">
        <h2><a name="comments" href="#comments">&nbsp;</a>コメント</h2>
        <MessageBoard thread="battlesim" @change="addPo($event.anchors);" @discard="removePo($event.anchors);" />
      </div>
    </div>

    <ItemPopovers />
  </div>
</template>

<script>
import Navigation from './Navigation.vue'
import jsonBattle from '../assets/battle.json'
import commonjs from "./common.js";
import lookupjs from "./simulator/lookup.js";
import StatusSimulator from './simulator/StatusSimulator.vue'
import MessageBoard from './parts/MessageBoard.vue'
import * as lbt from "./simulator/battle.js";
import * as lut from "./utils.js";

import ItemPopovers from './parts/ItemPopovers.vue'
import ItemPopoversJs from "./parts/ItemPopovers.js";


export default {
  name: 'Battle',
  components: {
    Navigation,
    StatusSimulator,
    MessageBoard,
    ItemPopovers,
  },
  mixins: [commonjs, lookupjs, ItemPopoversJs],

  data() {
    return {
      displayTypes: [
        "アイコン",
        "シンプル",
        "詳細",
      ],
      phaseList: [
        { index: 0, id: "0", desc: "初期配置" },
        { index: 1, id: "1E", desc: "1T敵フェイズ" },
        { index: 2, id: "2E", desc: "2T敵フェイズ" },
        { index: 3, id: "3E", desc: "3T敵フェイズ" },
        { index: 4, id: "4E", desc: "4T敵フェイズ" },
      ],

      detailedDescription: false,
      loading: false,
      divX: 15,
      divY: 15,

      battleList: [],
      battleId: "",
      battleData: null,
      cells: [],
      phase: "",
      path: null,
      skillRange: null,
      skillArea: null,
      skillDirection: null,

      selectedUnit: null,   // unit
      actionsToSelect: [],  // skill
      selectedSkill: null,  // skill
      targetUnit: null, // unit
      targetCell: null, // cell
      targetDirection: lbt.Direction.None,
      showConfirm: false,

      tools: {},
      toolStack: [],

      phaseTabIndex: 0,
      prevURL: "",

      slotNames: ["", "", "", "", "", "", "", "", "", ""],
      slotName: "",
      slotDesc: "",
      commentReplay: "",
      userName: "",

      enemyUnits: [],
      playerUnits: [
        new lbt.BaseUnit(),
        new lbt.BaseUnit(),
        new lbt.BaseUnit(),
        new lbt.BaseUnit(),
        new lbt.BaseUnit(),
      ],
      unitTabIndex: 0,

      simulation: null,

      loadoutList: [],
      loadoutFields: [
        {
          key: "name",
          label: "名前",
        },
        {
          key: "author",
          label: "投稿者",
        },
        {
          key: "actions",
          label: "操作",
        }
      ],
      loadoutHash: "",

      replay: null,
      replayList: [],
      replayFields: [
        {
          key: "battle",
          label: "クエスト",
        },
        {
          key: "score",
          label: "スコア",
        },
        {
          key: "units",
          label: "ユニット",
        },
        {
          key: "comment",
          label: "コメント",
        },
        {
          key: "author",
          label: "投稿者",
        },
        {
          key: "actions",
          label: "操作",
        }
      ],
      showReplayList: false,
      fetching: false,

      simOptionFields: [
        {
          key: "value",
          label: "",
        },
        {
          key: "label",
          label: "",
        },
      ],
    };
  },

  beforeCreate() {
    document.title = "れじぇくろDB: バトルシミュレータ";
    window.$vue = this;
  },

  created() {
    this.setupDB();

    // 全クエストの全敵をここでセットアップ (大して重くもないのでとりあえず…)
    this.battleList = structuredClone(jsonBattle);
    for (let battle of this.battleList) {
      battle.summon = [];
      if (!battle.terrain) {
        battle.terrain = Array(battle.mapSize[1]);
        for (let y = 0; y < battle.mapSize[1]; ++y) {
          battle.terrain[y] = Array(battle.mapSize[0]).fill(0);
        }
      }

      for (let enemy of battle.enemies) {
        let unit = new lbt.BaseUnit(false);
        unit.fid = enemy.fid;
        unit.phase = enemy.phase;
        unit.coord = enemy.coord;
        {
          let chr = Object.create(this.npcMainChrs.find(c => c.uid == enemy.main.cid));
          Object.assign(chr, enemy.main);
          chr.skills = [
            this.searchTableWithUid.get(chr.talent),
            ...chr.skills.map(id => this.searchTableWithUid.get(id)),
          ];
          chr.status = this.getNPCChrStatus(chr, chr.level, chr.statusRate);
          if (enemy.invulnerable) {
            chr.status[0] = Infinity;
          }
          unit.base.main = chr;
        }
        if (enemy.support) {
          let chr = Object.create(this.npcSupChrs.find(c => c.uid == enemy.support.cid));
          Object.assign(chr, enemy.support);
          chr.status = this.getNPCChrStatus(chr, chr.level, chr.statusRate);
          unit.base.support = chr;
        }
        unit.setup();
        enemy.unit = unit;
        //console.log(unit);

        if (unit.base?.summon) {
          battle.summon = battle.summon.concat(unit.base.summon);
        }
      }
    }

    for (let i = 0; i <= 9; ++i) {
      let data = lut.fromJson(localStorage.getItem(`battle.slot${i}`));
      if (data?.name) {
        this.setArrayElement(this.slotNames, i, data.name);
      }
    }
  },

  mounted() {
    this.userName = localStorage.getItem(`userName`) ?? "";

    // とりあえず碁盤目を出す
    this.selectBattle(null);
    this.selectPhase("0");
    this.setupTools();

    window.onpopstate = () => {
      this.decodeURL(true);
    };
    const initialize = () => {
      this.loading = false;
      if (!this.battleData) {
        this.selectBattle(this.battleList.at(-1)?.uid);
      }
    };

    this.loading = true;
    let url = this.decodeURL();
    if (url) {
      if (url.replay) {
        this.importReplayFromUrl(url.replay, (r) => {
          if (url.playback) {
            this.playbackReplay(r, { interval: url.interval, immediate: true });
          }
          initialize();
        }, () => initialize());
      }
      else {
        initialize();
      }
    }
    else {
      // URL による指定がないなら過去の状態を復元
      lut.idbInitialize("ldb", ["loadout", "replay"], 2);
      lut.idbRead("ldb", "loadout", "last", (data) => {
        if (data) {
          this.deserializeLoadout(data);
        }
      });
      lut.idbRead("ldb", "replay", "last", (data) => {
        if (data) {
          this.selectBattle(data.battle);
          this.replay = data;
        }
        initialize();
      }, () => initialize());
    }
  },

  destroyed() {
    // 編成とリプレイを記録
    lut.idbWrite("ldb", "loadout", "last", this.serializeLoadout());
    let replay = this.serializeReplay() ?? this.replay;
    if (replay) {
      lut.idbWrite("ldb", "replay", "last", replay);
    }
  },

  computed: {
    activePlayerUnits() {
      if (this.simulation) {
        return this.simulation.units.filter(a => a.isPlayer && !a.isSummon && a.isActive).map(a => a.base);
      }
      else {
        return this.playerUnits;
      }
    },
    allPlayerUnits() {
      if (this.simulation) {
        return Object.values(this.simulation.unitTable).filter(a => a.isPlayer && !a.isSummon).map(a => a.base);
      }
      else {
        return this.playerUnits;
      }
    },
    activeEnemyUnits() {
      if (this.simulation) {
        return this.simulation.units.filter(a => a.isEnemy && a.isActive).map(a => a.base);
      }
      else {
        return [
          ...this.enemyUnits.filter(a => a.phase == this.phase || a.fid == "E01"),
          ...(this.battleData?.summon ?? []),
        ];
      }
    },
    allActiveUnits() {
      // 死亡、未出現含まない現在場にいるユニット
      if (this.simulation) {
        return this.simulation.units.filter(a => a.isActive).map(a => a.base);
      }
      else {
        return [...this.playerUnits, ...this.enemyUnits].filter(a => a.phase == this.phase || a.fid == "E01");
      }
    },
    allUnits() {
      // 死亡、未出現含む全ユニット
      if (this.simulation) {
        return Object.values(this.simulation.unitTable).map(a => a.base);
      }
      else {
        return [...this.playerUnits, ...this.enemyUnits];
      }
    },

    currentTool() {
      return this.toolStack.at(-1);
    },
    prevTool() {
      return this.toolStack.at(-2);
    },

    simOptions() {
      if (this.simulation) {
        const desc = {
          autoBuffCancel: {
            label: "自動バフ・デバフ解除",
            desc: `バフ解除・デバフ解除効果を自動で適用します。<br />
選ぶ効果はランダムではなく、バフ解除はダメージ耐性系を優先で解除、デバフ解除は与ダメージ系を優先で解除します。`,
          },
          autoRandomBuff: {
            label: "自動ランダムバフ・デバフ",
            desc: `ワイズエンハンスや天来弓などのランダムバフ・デバフを自動で適用します。<br />
選ぶ効果はランダムではなく、ランダムバフは与ダメージ系を選択、ランダムデバフはダメージ耐性系を選択となります。`,
          },
          autoRandomSelection: {
            label: "自動ランダム対象選択",
            desc: `追跡の頭帯のような「範囲内のランダムな1ユニットにバフ」といった効果を自動で適用します。<br />
選ぶ対象はランダムではなく、距離が最も近く、かつまだ効果がかかってない対象を選びます。(距離0の自身は最優先、同距離の場合0時方向から時計回り順に選択)<br />`,
          },
          selfDamage: {
            label: "自傷効果",
            desc: `人馬の天衣などの自傷効果の有効・無効です。<br />有効な場合、確率は考慮せず100%発動します。`,
          },
        };
        let sim = this.simulation;
        return Object.keys(sim.config).map(k => {
          return {
            name: k,
            label: desc[k]?.label ?? k,
            desc: desc[k]?.desc ?? "",
            get value() { return sim.config[k]; },
            set value(v) {
              sim.config[k] = v;
              if (sim.onPlayback) {
                sim.config.override = true;
              }
            },
          };
        });
      }
      return [];
    },
  },

  watch: {
    userName: function (v) {
      localStorage.setItem(`userName`, v);
    },
  },

  methods: {

    //#region ユニット操作
    setupTools() {
      // tool 変遷：
      // nonSimulation (非シミュレーション時)
      // selectUnit -> unitAction -> selectTarget -> (fireSkill)
      //                                          -> previewArea -> (fireSkill)
      //                          -> previewArea -> (fireSkill)
      //                                         -> previewDirection -> (fireSkill)

      let self = this;
      const confirm = () => {
        self.pushTool(self.tools.confirm);
      };
      const colorDelay = 15;

      this.tools = {
        // 非シミュレーション時
        // ユニット選択処理
        nonSimulation: {
          onClickCell(cell) {
            const unit = self.findUnitByCoord(cell.coord);
            self.selectUnit(unit);
            if (unit) {
              self.pushTool(self.tools.showMoveRange);
            }
          },
          onRenderCell(cell, classes, styles) {
            self.tools.moveUnit.onRenderCell(cell, classes, styles);
          },
        },
        // 移動範囲表示
        showMoveRange: {
          onEnable() {
            self.tools.moveUnit.buildPath(self.selectedUnit);
          },
          onDisable() {
            self.selectUnit(null);
            self.path = null;
          },
          onClickCell(cell) {
            const unit = self.findUnitByCoord(cell.coord);
            if (!unit || self.selectedUnit === unit) {
              // 空セル、もしくは自身が選択されたらキャンセル
              self.cancelTools(self.tools.nonSimulation);
            }
            else if (unit) {
              // 別のユニットが選択されたらそちらに切り替え
              self.cancelTools(self.tools.nonSimulation);
              self.selectUnit(unit);
              self.pushTool(self.tools.showMoveRange);
            }
          },
          onRenderCell(cell, classes, styles) {
            self.tools.moveUnit.onRenderCell(cell, classes, styles);
          },
        },

        // 以下は全てシミュレーション時
        // ユニット選択処理
        selectUnit: {
          onClickCell(cell) {
            const unit = self.findUnitByCoord(cell.coord);
            self.selectUnit(unit);
            if (unit) {
              self.pushTool(self.tools.moveUnit);
            }
          },
          onRenderCell(cell, classes, styles) {
            self.tools.moveUnit.onRenderCell(cell, classes, styles);
          },
        },

        // ユニット移動＆スキル選択処理
        moveUnit: {
          buildPath(unit) {
            let pf = new lbt.PathFinder(self.divX, self.divY, self.battleData.terrain);
            pf.setObstacles(self.allActiveUnits.filter(u => u.isPlayer != unit.isPlayer));
            pf.setOccupied(self.allActiveUnits.filter(u => u.isPlayer == unit.isPlayer));
            pf.setStartUnit(unit);
            let sim = unit.sim ?? unit;
            pf.buildPath(unit.move, sim?.isOnMultiMove ? null : {size: unit.range});
            self.path = pf;
            //console.log(self.path.toString());
          },

          onEnable() {
            self.selectedUnit.prevCoord = self.selectedUnit.coord;
            this.buildPath(self.selectedUnit);
            if (self.simulation.isOwnTurn(self.selectedUnit)) {
              self.actionsToSelect = self.selectedUnit.actions;
            }
          },
          onDisable() {
            self.selectUnit(null);
            self.path = null;
            self.actionsToSelect = [];
          },
          onClickCell(cell) {
            const unit = self.findUnitByCoord(cell.coord);
            let sim = self.simulation;
            if (unit) {
              if (self.selectedUnit === unit) {
                // 再度そのユニットがクリックされたら待機
                self.onClickWait();
              }
              else {
                // 別のユニットが選択されたらそちらに切り替え
                self.cancelTools(self.tools.selectUnit);
                self.selectUnit(unit);
                self.pushTool(self.tools.moveUnit);
              }
            }
            else if (self.path.isPassable(cell.coord)) {
              // ユニット移動処理
              // プレイヤーターンならプレイヤー側、敵ターンなら敵側のユニットだけ移動を許可
              // 移動力以上の距離の移動を許容するが、移動力 0 の敵ユニットはおかしなことになるので禁止
              let u = self.selectedUnit;
              if (sim.isOwnTurn(u) && !(u.isEnemy && u.move == 0)) {
                u.coord = cell.coord;
                let d = self.path.getMoveDistance(cell.coord);
                u.moveDistance = d < 0 ? u.move : d;
                sim.updateAreaEffects();
                self.setUnitPath(u, self.path.getPath(cell.coord, u.prevCoord));
              }
            }
          },
          onClickAction(skill) {
            self.cancelTools(self.tools.moveUnit);
            self.selectAction(skill);

            if (skill) {
              if (skill.isSelfTarget) {
                // 自己バフスキル
                self.targetUnit = self.selectedUnit;
                self.targetCell = self.findCellByCoord(self.selectedUnit.coord);
                self.pushTools([self.tools.selectTarget, self.tools.confirm], this);
              }
              else if (skill.isRadialAreaTarget || skill.isSpecialAreaTarget) {
                // 範囲スキル (自分中心 or 特殊範囲)
                self.targetCell = self.findCellByCoord(self.selectedUnit.coord);
                self.pushTools([self.tools.previewArea, self.tools.confirm], this);
              }
              else if (skill.isDirectionalAreaTarget) {
                // 範囲スキル (直線)
                self.targetCell = self.findCellByCoord(self.selectedUnit.coord);
                self.pushTool(self.tools.previewArea);
              }
              else {
                // 対象指定スキル
                self.pushTool(self.tools.selectTarget);
              }
            }
            else {
              // 待機
              self.pushTool(self.tools.confirm);
            }
          },
          onCancel() {
            let u = self.selectedUnit;
            u.coord = u.prevCoord;
            u.moveDistance = 0;
            u.path = null;
            self.resetUnitPosition(u);
            self.simulation.updateAreaEffects();
          },
          onRenderCell(cell, classes, styles) {
            let sim = self.simulation;
            let unit = self.findUnitByCoord(cell.coord);
            let selected = self.selectedUnit;
            if (unit) {
              if (unit.isEnemy)
                classes.push("enemy-cell");
              if (unit.isPlayer)
                classes.push("player-cell");
              if (unit === selected)
                classes.push("selected");
            }
            if (self.path) {
              if (self.path.isInMoveRange(cell.coord)) {
                if (!unit) {
                  classes.push("move-range");
                  if (sim?.isOwnTurn(selected)) {
                    classes.push("click-to-move");
                  }
                  if (sim?.isOwnTurn(selected)) {
                    classes.push("hovered");
                  }
                }
              }
              else if (self.path.isInFireRange(cell.coord)) {
                classes.push("attack-range");
              }

              const d = self.path.getDistance(cell.coord);
              styles.push(`transition-delay: ${colorDelay * d}ms`);
            }
          },
        },

        // スキル射程表示＆ターゲット選択処理
        selectTarget: {
          isInFireRange(unit) {
            return self.skillRange.isInFireRange(unit?.coord);
          },

          onEnable() {
            let skill = self.selectedSkill;
            let pf = self.simulation.makePathFinder(self.selectedUnit);
            pf.buildPath(0, skill.makeRangeParams());
            self.skillRange = pf;
          },
          onDisable() {
            self.selectedSkill = null;
            self.skillRange = null;
            self.targetUnit = null;
            self.targetCell = null;
          },
          onClickCell(cell) {
            let unit = self.findUnitByCoord(cell.coord);
            if (self.skillRange.isInFireRange(cell.coord)) {
              let skill = self.selectedSkill;

              if (self.isValidTarget(self.selectedUnit, skill, unit)) {
                if (skill.isAreaTarget) {
                  // 範囲スキルの場合範囲確認モードに遷移
                  self.targetCell = cell;
                  self.pushTools([self.tools.previewArea, self.tools.confirm], this);
                }
                else {
                  // 単体スキルならスキル発動
                  // 召喚スキルはユニットのいないセルが対象になる
                  if (skill.isTargetCell) {
                    self.targetCell = cell;
                  }
                  else {
                    self.targetUnit = unit;
                    self.targetCell = cell;
                  }
                  confirm();
                }
              }
            }
          },
          onClickAction(skill) {
            self.tools.moveUnit.onClickAction(skill);
          },
          onRenderCell(cell, classes, styles) {
            let unit = self.findUnitByCoord(cell.coord);
            let selected = self.selectedUnit;
            if (self.skillRange.isInFireRange(cell.coord)) {
              classes.push("area-range");
              if (!self.showConfirm) {
                if (self.isValidTarget(selected, self.selectedSkill, unit)) {
                  classes.push("click-to-fire");
                }
              }
              else {
                if (self.targetCell === cell) {
                  classes.push("target-cell");
                }
              }
              const d = self.skillRange.getDistance(cell.coord);
              styles.push(`transition-delay: ${colorDelay * d}ms`);
            }
          },
        },

        // 範囲スキルの範囲表示＆使用確認
        previewArea: {
          onEnable() {
            let skill = self.selectedSkill;
            let pf = self.simulation.makePathFinder();
            if (skill.shapeData) {
              pf.setShootRangeShape(skill.shapeData, self.selectedUnit?.coord);
            }
            else {
              if (skill.isSelfTarget || skill.isRadialAreaTarget) {
                pf.setStartUnit(self.selectedUnit);
              }
              else {
                pf.setStart(self.targetCell.coord);
              }
              pf.buildPath(0, skill.makeAreaParams());
            }
            self.skillArea = pf;
            this.pf = pf;
          },
          onDisable() {
            if (self.prevTool !== self.tools.selectTarget) {
              self.selectedSkill = null;
              self.targetCell = null;
            }
            if (self.skillArea == this.pf) {
              self.skillArea = null;
            }
            this.pf = null;
          },
          onClickCell(cell) {
            let unit = self.findUnitByCoord(cell.coord);
            if (self.skillArea.isInFireRange(cell.coord)) {
              let skill = self.selectedSkill;

              if (self.isValidTarget(self.selectedUnit, skill, unit)) {
                // 方向指定スキルの場合ここに来る
                self.targetDirection = lbt.calcDirection(self.targetCell.coord, cell.coord);
                self.pushTools([self.tools.previewDirection, self.tools.confirm], this);
              }
            }
          },
          onClickAction(skill) {
            self.tools.moveUnit.onClickAction(skill);
          },
          onRenderCell(cell, classes, styles) {
            const unit = self.findUnitByCoord(cell.coord);
            const selected = self.selectedUnit;
            if (self.skillArea.isInFireRange(cell.coord)) {
              classes.push("attack-range");
              if (self.isValidTarget(selected, self.selectedSkill, unit)) {
                if (!self.showConfirm) {
                  classes.push("click-to-fire");
                }
                else {
                  classes.push("target-cell");
                }
              }
              const d = self.skillArea.getDistance(cell.coord);
              styles.push(`transition-delay: ${colorDelay * d}ms`);
            }
          },
        },

        previewDirection: {
          onEnable() {
            let skill = self.selectedSkill;
            let pf = self.simulation.makePathFinder();
            pf.setStart(self.targetCell.coord);
            pf.buildPath(0, {direction: self.targetDirection, ...skill.makeAreaParams()});
            self.skillArea = pf;
            this.pf = pf;
          },
          onDisable() {
            if (self.skillArea == this.pf) {
              self.skillArea = self.tools.previewArea.pf;
            }
            this.pf = null;
            self.targetDirection = lbt.Direction.None;
          },
          onClickCell(cell) {
            let unit = self.findUnitByCoord(cell.coord);
            if (self.skillArea.isInFireRange(cell.coord)) {
              let skill = self.selectedSkill;

              if (self.isValidTarget(self.selectedUnit, skill, unit)) {
                confirm();
              }
            }
          },
          onClickAction(skill) {
            self.tools.moveUnit.onClickAction(skill);
          },
          onRenderCell(cell, classes, styles) {
            const unit = self.findUnitByCoord(cell.coord);
            const selected = self.selectedUnit;
            if (self.skillArea.isInFireRange(cell.coord)) {
              classes.push("attack-range");
              if (self.isValidTarget(selected, self.selectedSkill, unit, false)) {
                classes.push("target-cell");
              }
              const d = self.skillArea.getDistance(cell.coord);
              styles.push(`transition-delay: ${colorDelay * d}ms`);
            }
          },
        },

        confirm: {
          onEnable() {
            self.showConfirm = true;

            let unit = self.selectedUnit?.sim;
            if (unit) {
              let ctx = lbt.makeActionContext(self.selectedUnit.sim, self.targetUnit?.sim, self.selectedSkill);
              if (self.targetCell) {
                ctx.range = lbt.calcDistace(unit.coord, self.targetCell.coord);
              }
              unit.evaluateBuffs(ctx);
            }
          },
          onDisable() {
            self.showConfirm = false;

            let unit = self.selectedUnit?.sim;
            if (unit) {
              unit.evaluateBuffs();
            }
          },
          onClickCell(cell) {
            if (cell === self.targetCell) {
              self.confirmAction();
            }
          },
          onClickAction(skill) {
            self.tools.moveUnit.onClickAction(skill);
          },
          onRenderCell(cell, classes, styles) {
            self.prevTool.onRenderCell(cell, classes, styles);
          },
        },
      };

      this.resetTools(this.tools.nonSimulation);
    },

    isValidTarget(unit, skill, target, allowEmptyCell = true) {
      if (!unit || !skill) {
        return false;
      }

      const isTargetSide = () => {
        return target && ((skill.isTargetEnemy && unit.isPlayer != target.isPlayer) || (skill.isTargetAlly && unit.isPlayer == target.isPlayer));
      };

      if (skill.isSelfTarget) {
        // 自身が対象のスキル
        return unit === target;
      }
      else if (skill.isTargetCell) {
        // 空のセルが対象のスキル (召喚など)
        return !target;
      }
      else if (skill.isDirectionalAreaTarget) {
        // 方向指定スキル
        // ユニットでも空のセルでも対象に取れる、ただし使用者自身はダメ
        if (allowEmptyCell) {
          return unit !== target;
        }
        else {
          return isTargetSide();
        }
      }
      else if (skill.isRadialAreaTarget) {
        // 自分中心の範囲スキル
        return isTargetSide();
      }
      else {
        // その他ユニットが対象のスキル
        return isTargetSide();
      }
    },

    resetTools(tool = null) {
      if (tool) {
        while (this.popTool()) { }
        this.pushTool(tool);
      }
      else {
        while (this.toolStack.length > 1) {
          this.popTool();
        }
      }
    },
    cancelTools(cancelPoint = null) {
      let pos = this.toolStack.findIndex(a => a === cancelPoint);
      while (this.toolStack.length > 1) {
        if (this.toolStack.length - 1 == pos) {
          break;
        }
        let t = this.currentTool;
        let tpos = this.toolStack.findIndex(a => a === t.cancelPoint);
        if (tpos >= 1 && tpos < pos) {
          pos = tpos;
        }
        this.popTool(true);
      }
    },
    pushTool(tool) {
      if (tool.onEnable) {
        tool.onEnable();
      }
      this.pushArray(this.toolStack, tool);
    },
    pushTools(tools, cancelPoint = null) {
      if (cancelPoint) {
        tools.at(-1).cancelPoint = cancelPoint;
      }
      for (let t of tools) {
        this.pushTool(t);
      }
    },
    popTool(callCancel = false) {
      if (this.toolStack.length > 0) {
        let tool = this.currentTool;
        if (callCancel && tool.onCancel) {
          tool.onCancel();
        }
        if (tool.onDisable) {
          tool.onDisable();
        }
        this.popArray(this.toolStack);
        return true;
      }
      return false;
    },
    getPrevTool(tool) {
      const i = this.toolStack.findIndex(a => a === tool);
      console.log(i);
      return this.toolStack.at(i - 1);
    },
    //#endregion ユニット操作


    //#region シミュレーション
    zeroPad(num, pad = 2) {
      return String(num).padStart(pad, '0');
    },

    selectBattle(bid, clear = false) {
      const battle = this.battleList.find(a => a.uid == bid);
      this.resetTools();
      this.battleId = bid;
      this.battleData = battle;

      // battle == null の場合でもとりあえず 15x15 の碁盤目が出るようにしておく
      const divX = this.divX = battle?.mapSize[0] ?? 15;
      const divY = this.divY = battle?.mapSize[1] ?? 15;
      const terrain = battle?.terrain;
      let cells = new Array(divX * divY);
      for (let y = 0; y < divY; ++y) {
        for (let x = 0; x < divX; ++x) {
          let i = y * divX + x;
          cells[i] = {
            id: `c${this.zeroPad(x)}${this.zeroPad(y)}`,
            coord: [x, y],
            obstacle: terrain ? terrain[y][x] != 0 : false,
          };
        }
      }
      this.cells = cells;

      let cellStyle = this.$refs.cells.style;
      cellStyle.gridTemplateColumns = `repeat(${divX}, 50px)`;
      cellStyle.gridTemplateRows = `repeat(${divY}, 50px)`;

      // enemyList の高さをグリッドに合わせる
      this.$refs.enemyList.style.maxHeight = "0px";
      this.$nextTick(() => {
        this.$refs.enemyList.style.maxHeight = `${this.$refs.cells.clientHeight}px`;
      });

      this.enemyUnits = battle?.enemies?.map(a => a.unit) ?? [];
      for (let e of this.enemyUnits) {
        if (e.main.shape) {
          const shape = e.main.shape;
          for (let c of cells) {
            if (shape[c.coord[1]][c.coord[0]]) {
              c.boss = e;
            }
          }
        }
      }

      if (battle?.allies) {
        for (let i = 0; i < battle.allies.length; ++i) {
          let ally = battle.allies[i];
          ally.unit = this.playerUnits[i];
          ally.unit.fid = ally.fid;
          ally.unit.phase = ally.phase;
          ally.unit.coord = ally.coord;
        }
      }

      this.resetUnitPositionAll(true);
      if (clear) {
        this.selectPhase("0", clear);
      }
    },

    selectPhase(pid, clear = false) {
      let phase = this.phaseList.find(p => p.id == pid);
      if (!phase)
        return;

      this.phaseTabIndex = phase.index;
      this.phase = pid;

      this.resetUnitPositionAll(true);
      if (clear) {
        this.selectUnit(null);
      }
    },

    findCellByCoord(coord) {
      if (coord[0] < this.divX && coord[1] < this.divY) {
        return this.cells[coord[1] * this.divX + coord[0]];
      }
      return null;
    },
    findUnitByCoord(coord) {
      let c = this.findCellByCoord(coord); {
        if (c?.boss) {
          return c.boss;
        }
      }
      for (const u of this.allActiveUnits) {
        if (u.coord[0] == coord[0] && u.coord[1] == coord[1]) {
          return (!this.simulation || u.isActive) ? u : null;
        }
      }
      return null;
    },

    selectUnit(unit) {
      this.selectedUnit = unit;
      if (unit && !this.simulation) {
        if (unit.isEnemy) {
          this.scrollTo(`unit_${unit.fid}`);
        }
        if (unit.isPlayer) {
          const idx = this.playerUnits.findIndex(a => a.fid == unit.fid);
          this.unitTabIndex = idx;
        }
      }
    },

    selectAction(skill) {
      this.selectedSkill = skill;
    },

    getTargetUnits() {
      let pf = this.skillDirection ?? this.skillArea;
      if (pf) {
        let targets = [];
        // NxN ボスがいる都合上、ユニット毎ではなくセル毎に探索する必要がある
        for (let c of this.cells) {
          if (pf.isInFireRange(c.coord)) {
            let u = this.findUnitByCoord(c.coord);
            if (this.isValidTarget(this.selectedUnit, this.selectedSkill, u, false)) {
              targets.push(u);
            }
          }
        }
        return targets;
      }
      else {
        return this.targetUnit;
      }
    },

    confirmAction() {
      let unit = this.selectedUnit;
      let skill = this.selectedSkill;
      let skillArgs = null;
      if (skill) {
        // スキルパラメータ設定
        skillArgs = {};
        if (skill.isSelfTarget || skill.isRadialAreaTarget || skill.isSpecialAreaTarget) {
          // これらは追加パラメータ不要
        }
        else if (skill.isDirectionalAreaTarget) {
          // 方向指定スキルは方向情報が必要
          skillArgs.direction = this.targetDirection;
        }
        else {
          // 他は対象セルを指定
          // (NxN ボスがあるため、ユニット指定スキルでも位置情報が必要になる)
          skillArgs.coord = this.targetCell.coord;
        }
      }
      this.simulation.fireSkill(this.selectedUnit, this.selectedSkill, skillArgs);
      this.resetTools();
      if (unit.isAlive && !unit?.sim.isEnded) {
        this.currentTool.onClickCell(this.findCellByCoord(unit.coord));
      }
    },

    cancelAction() {
      let tool = this.currentTool;
      if (tool?.onCancel) {
        tool.onCancel();
      }
      if (this.toolStack.length > 1) {
        this.cancelTools(this.prevTool);
      }
    },

    getSkillClass(skill) {
      return {
        active: skill.isActive,
        passive: skill.isPassive,
      }
    },

    isUnitHighlighted(unit) {
      return unit && (unit === this.selectedUnit);
    },

    getCellClass(cell) {
      let classes = ["grid-cell"];
      let styles = [];
      if (cell.obstacle && !cell.boss) {
        classes.push("obstacle");
      }

      let tool = this.currentTool;
      if (tool?.onRenderCell) {
        tool.onRenderCell(cell, classes, styles);
      }
      cell.classes = classes;
      cell.style = styles.join(";");
      return classes;
    },
    getActionClass(skill, unit) {
      let r = ["action-button"];
      if (skill === this.selectedSkill) {
        r.push("selected");
      }
      if (!skill.available || unit?.sim.isOnMultiMove) {
        r.push("grayscale");
      }
      return r;
    },
    resetUnitPosition(u, delay = false) {
      const body = () => {
        if (u.isNxN) {
          // ここでは処置不要
        }
        else {
          let el = document.getElementById(`unit-${u.fid}`);
          if (el) {
            const pos = u.coord;
            el.style.transition = el.style.offsetPath ? '100ms ease' : 'none';
            el.style.offsetPath = `path('M${pos[0] * 50},${pos[1] * 50}')`;
            el.style.offsetDistance = `0%`;
          }
        }
      };
      if (delay) {
        this.$nextTick(body);
      }
      else {
        body();
      }
    },
    resetUnitPositionAll(delay = false) {
      const body = () => {
        for (let u of this.allUnits) {
          this.resetUnitPosition(u);
        }
      };
      if (delay) {
        this.$nextTick(body);
      }
      else {
        body();
      }
    },
    // opt: {
    //   interval: Number,
    //   onfinish: Function,
    //}
    setUnitPath(unit, path, opt) {
      const makeSVGPath = (path) => {
        // thanks: https://www.webdesignleaves.com/pr/html/svg_basic.html#path
        const cellSize = 50;
        let commands = path.map((c, i) => {
          return `${i === 0 ? 'M' : 'L'}${c[0] * cellSize},${c[1] * cellSize}`;
        });
        return `path('${commands.join(' ')}')`;
      }
      let el = document.getElementById(`unit-${unit.fid}`);
      let anim = null;
      if (el) {
        if (path) {
          el.style.transition = 'none';
          el.style.offsetPath = makeSVGPath(path);
          anim = el.animate(
            { offsetDistance: ['0%', '100%'] },
            {
              duration: unit.moveDistance * (opt?.interval ?? 30),
              easing: 'linear',
              fill: 'forwards',
            }
          );
        }
        else {
          this.resetUnitPosition(unit);
        }
      }
      if (opt?.onfinish) {
        if (anim) {
          anim.onfinish = opt.onfinish;
        }
        else {
          opt.onfinish();
        }
      }
    },
    getUnitIconClass(unit) {
      let r = [];
      let sim = unit.sim;
      if (sim && sim.isEnded) {
        r.push("grayscale");
      }
      return r;
    },
    blinkCell(pos) {
      let el = document.createElement('div');
      el.style.position = "absolute";
      el.style.left = `${pos[0] * 50 }px`;
      el.style.top = `${pos[1] * 50}px`;
      el.style.width = `50px`;
      el.style.height = `50px`;
      el.style.borderRadius = "0.3rem";
      el.style.zIndex = 10;
      this.$refs.cells.appendChild(el);
      el.animate(
        { backgroundColor: ['rgba(255, 0, 0, 0.9)', 'rgba(255, 0, 0, 0)'] },
        {
          duration: 500,
          easing: 'ease-out',
          fill: 'forwards',
        }
      ).onfinish = () => {
        el.remove();
      };
    },

    onEnterCell(cell) {
      this.hoveredCell = cell;
      const unit = this.findUnitByCoord(cell.coord);
      if (unit?.isEnemy) {
        //this.scrollTo(`enemy_${unit.fid}`);
      }
    },
    onLeaveCell(cell) {
      if (this.hoveredCell === cell) {
        this.hoveredCell = null;
      }
    },
    onClickCell(cell) {
      let tool = this.currentTool;
      if (tool && tool.onClickCell) {
        tool.onClickCell(cell);
      }
    },
    onCellRClick() {
      this.cancelAction();
    },
    onClickWait() {
      let tool = this.currentTool;
      if (tool && tool.onClickAction) {
        tool.onClickAction(null);
        this.confirmAction();
      }
    },
    onClickAction(skill) {
      let tool = this.currentTool;
      if (tool && tool.onClickAction) {
        tool.onClickAction(skill);
      }
    },


    beginSimulation(replay = false) {
      this.resetTools();
      if (!this.simulation) {
        this.simulation = new lbt.SimContext(this.battleData, [...this.playerUnits, ...this.enemyUnits]);
        this.simulation.start(replay);
        this.resetTools(this.tools.selectUnit);
      }
    },
    endSimulation() {
      this.resetTools();
      if (this.simulation) {
        let rep = this.serializeReplay();
        this.replay = rep.states.length > 1 ? rep : null;
        this.simulation.finish();
        this.simulation = null;
        this.resetTools(this.tools.nonSimulation);
        this.resetUnitPositionAll(true);
      }
    },

    eraseWeakEnemies() {
      this.simulation?.eraseWeakEnemies();
      this.resetTools();
      this.$forceUpdate();
    },
    eraseSelectedUnit() {
      this.simulation?.eraseUnit(this.selectedUnit);
      this.resetTools();
      this.$forceUpdate();
    },

    endTurn() {
      this.resetTools();
      this.simulation?.passTurn();
    },

    onDragUnit(unit) {
      this.draggingUnit = unit;
    },
    onDropUnit(unit) {
      if (this.draggingUnit && !this.simulation) {
        if (this.draggingUnit && unit) {
          this.draggingUnit.swap(unit);
        }
      }
      this.draggingUnit = null;
      this.resetTools();
    },
    onDragCell(cell) {
      this.onDragUnit(this.findUnitByCoord(cell.coord));
    },
    onDropCell(cell) {
      this.onDropUnit(this.findUnitByCoord(cell.coord));
    },
    isCellDraggable(cell) {
      if (!this.simulation) {
        const u = this.findUnitByCoord(cell.coord);
        return u?.isPlayer;
      }
      return false;
    },

    effectValuesToHtml(rate, fixed) {
      let list = [];
      for (const [name, value] of Object.entries(rate)) {
        let unit = '';
        if (!["移動", "射程(通常攻撃)", "射程(スキル)", "範囲"].includes(name)) {
          unit = "%";
        }
        list.push(`${name}${value >= 0 ? '+' : ''}${value}${unit}`);
      }
      for (const [name, value] of Object.entries(fixed)) {
        list.push(`${name}${value >= 0 ? '+' : ''}${value}`);
      }
      return list.map(a => `
<div class="effect-box">
<span class="effect caution">${a}</span>
</div>
`);
    },
    //#endregion シミュレーション


    //#region 編成
    serializeLoadout() {
      let r = {
        name: this.slotName,
        desc: this.slotDesc,
        units: this.playerUnits.map(a => a.serialize()),
      };
      return r;
    },
    deserializeLoadout(obj) {
      this.loadoutHash = null;
      this.slotName = obj.name ?? "";
      this.slotDesc = obj.desc ?? "";
      for (let i = 0; i < this.playerUnits.length; ++i) {
        this.playerUnits[i].deserialize(obj.units[i]);
      }
    },
    saveLoadout(slot = 0) {
      let old = lut.fromJson(localStorage.getItem(`battle.slot${slot}`));
      if (old?.units?.find(a => a.main.cid)) {
        localStorage.setItem(`battle.slot99`, lut.toJson(old));
        this.toast("上書き前の編成をバックアップスロットに保存しました。");
      }

      this.setArrayElement(this.slotNames, slot, this.slotName);
      let data = this.serializeLoadout();
      localStorage.setItem(`battle.slot${slot}`, lut.toJson(data));
    },
    loadLoadout(slot = 0) {
      let data = lut.fromJson(localStorage.getItem(`battle.slot${slot}`));
      if (data) {
        this.deserializeLoadout(data);
      }
      else {
        for (let unit of this.playerUnits) {
          unit.initialize();
        }
      }
      this.resetTools();
    },
    exportLoadoutAsFile() {
      const data = this.serializeLoadout();
      const name = data.name ? data.name : "編成名";
      lut.download(`${name}.loadout`, data);
    },
    importLoadoutFromFile() {
      lut.openFileDialog(".loadout", (file) => {
        file.text().then((text) => {
          this.deserializeLoadout(lut.fromJson(text));
        });
      });
    },
    onDropLoadout(event) {
      if (event?.dataTransfer?.files?.length) {
        let file = event.dataTransfer.files[0];
        file.text().then((text) => {
          this.deserializeLoadout(lut.fromJson(text));
        });
      }
    },
    clearLoadout() {
      if (this.playerUnits.find(a => a.main.cid)) {
        let old = this.serializeLoadout();
        localStorage.setItem(`battle.slot99`, lut.toJson(old));
        this.toast("クリア前の編成をバックアップスロットに保存しました。");
      }

      this.slotName = "";
      this.slotDesc = "";
      this.loadoutHash = null;
      for (let unit of this.playerUnits) {
        unit.initialize();
      }
    },

    onMessageChange(mb) {
      this.addPo(mb.anchors);
      this.dispatchScrollEvent();
    },
    onMessageDiscard(mb) {
      this.removePo(mb.anchors);
    },
    //#endregion 編成


    //#region リプレイ
    serializeReplay() {
      if (!this.simulation) {
        return null;
      }
      let r = {};
      r.version = lbt.replayVersion;
      r.battle = this.battleId;
      r.score = Math.round(this.simulation.score);
      r.loadout = this.serializeLoadout();
      r.states = this.simulation.serialize();
      r.name = `${this.battleData.name} ${r.states.at(-1).desc.score}`;
      return r;
    },
    deserializeReplay(data) {
      const body = (r) => {
        this.endSimulation(false);
        this.selectBattle(r.battle);
        this.deserializeLoadout(r.loadout);
        this.beginSimulation(true);
        this.simulation.deserialize(r.states);
        this.$forceUpdate();
        return r;
      };

      if (typeof (data) === 'string') {
        return body(lut.fromJson(data));
      }
      else if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
        return body(lut.fromJson(lut.bytesToString(data)));
      }
      else if (typeof (data) === 'object') {
        return body(lut.sanitizeJsonObject(data));
      }
    },
    // opt: {
    //   loadLoadout: Boolean,
    //   interval: Number, // millisec
    // }
    playbackReplay(r, opt = {}) {
      this.scrollTo("root", true);
      this.endSimulation(false);
      this.selectBattle(r.battle);
      if (opt?.loadLoadout) {
        // loadLoadout が無効な場合構成を変えてリプレイをなぞる挙動になる
        this.deserializeLoadout(r.loadout);
      }
      this.beginSimulation();

      this.simulation.onPlayback = true;
      let interval = Math.max(opt?.interval ?? 30, 1);
      this.playbackBody = () => {
        this.resetTools();
        this.simulation.isPlaying = true;

        let si = 0;
        const next = () => {
          this.$nextTick(() => {
            if (this.simulation && si < r.states.length) {
              try {
                this.simulation.playback(r.states[si++], {
                  interval: interval,
                  next: next,
                });
              }
              catch (e) { }
            }
            else if (this.simulation) {
              // 再生完了
              this.simulation.onPlayback = this.simulation.isPlaying = false;
              this.$forceUpdate();
            }
          });
        };
        next();
      };
      if (opt?.immediate) {
        this.beginPlayback();
      }
    },
    beginPlayback() {
      if (this.playbackBody) {
        this.playbackBody();
        this.playbackBody = null;
      }
    },

    exportReplayAsFile() {
      if (this.simulation) {
        this.replay = this.serializeReplay();
      }
      if (this.replay) {
        let r = this.replay;
        lut.gzCompress(lut.toJson(r)).then(data => {
          lut.download(`${r.loadout.name}${r.states.at(-1).desc.score}.replay`, data);
        });
      }
    },
    importReplayFromFile() {
      lut.openFileDialog(".replay", (file) => {
        file.arrayBuffer().then(bin => {
          if (lut.gzIsCompressedData(bin)) {
            lut.gzDecompress(bin).then(data => {
              this.deserializeReplay(data);
            })
          }
          else {
            this.deserializeReplay(bin);
          }
        });
      });
    },
    importReplayFromUrl(url, onsuccess = null, onerror = null) {
      if (url.match(/^https?:\/\//)) {
      }
      else {
        // http で始まらない場合は hash とみなす
        url = `${lut.ReplayServer}?mode=get&hash=${url}`;
      }

      this.loading = true;
      const handleError = (e) => {
        this.toast(e.toString());
        lut.call(onerror, e);
      };
      fetch(url)
        .then(res => {
          if (!res.ok) {
            throw new Error(res.statusText);
          }
          return res.json();
        })
        .then(json => {
          if (json.succeeded === false) {
            throw new Error(json.message);
          }
          else {
            let r = this.deserializeReplay(json);
            lut.call(onsuccess, r);
          }
        })
        .catch(handleError)
        .finally(() => { this.loading = false; });
    },
    onDropReplay(event) {
      if (event?.dataTransfer?.files?.length) {
        let file = event.dataTransfer.files[0];
        file.text().then(text => {
          this.deserializeReplay(lut.fromJson(text));
        });
      }
    },
    onKeyReplay(evt) {
      evt.preventDefault();
      if (evt.key == 'ArrowDown') {
        if (this.simulation.statePos > -this.simulation.states.length) {
          this.simulation.statePos--;
        }
      }
      else if (evt.key == 'ArrowUp') {
        if (this.simulation.statePos < -1) {
          this.simulation.statePos++;
        }
      }
      this.scrollTo(`sim-state-${this.simulation.statePos}`);
    },
    setReplayState(idx) {
      this.resetTools();
      if (!this.simulation && this.replay) {
        this.deserializeReplay(this.replay);
      }
      this.simulation.statePos = idx;
    },

    fetchReplayList() {
      this.fetching = true;
      fetch(lut.ReplayServer)
        .then(res => res.json())
        .then(obj => {
          this.fetching = false;
          this.replayList = obj.sort((a, b) => b.date.localeCompare(a.date)).map(a => {
            return {
              hash: a.hash,
              version: a.summary?.version ?? "",
              battle: a.summary?.battle ?? "",
              score: a.summary?.score ?? "",
              units: a.summary?.units ?? "",
              author: a.summary?.author ?? "",
              comment: a.summary?.comment ?? "",
            };
          });
          for (let e of this.replayList) {
            const delkey = localStorage.getItem(`delkey.${e.hash}`);
            if (delkey) {
              e.delkey = delkey;
            }
          }
        });
    },
    async uploadReplay() {
      const replay = this.simulation ? this.serializeReplay() : this.replay;
      const data = await lut.gzCompress(lut.toJson(replay));
      var form = new FormData()
      form.append('mode', 'put');
      form.append('data', new Blob([data]));
      form.append('author', this.userName.trim());
      form.append('comment', this.commentReplay.trim());
      fetch(lut.ReplayServer, { method: "POST", body: form })
        .then(res => res.json())
        .then(obj => {
          if (obj.succeeded === false) {
            this.toast(obj.message);
          }
          else {
            localStorage.setItem(`delkey.${obj.hash}`, obj.delkey);
            localStorage.setItem(`subscribe.${obj.hash}`, 'true');
            this.commentReplay = "";
            this.fetchReplayList();
          }
        });
    },
    downloadReplay(rec) {
      this.importReplayFromUrl(`${lut.ReplayServer}?mode=get&hash=${rec.hash}`, () => {
        this.replayHash = rec.hash;
      });
    },
    deleteReplay(rec) {
      if (window.confirm(`"${this.getItemName(rec.battle)} (スコア ${rec.score})" をサーバーから削除します。よろしいですか？`)) {
        fetch(`${lut.ReplayServer}?mode=del&hash=${rec.hash}&delkey=${rec.delkey}`)
          .then(res => res.json())
          .then(obj => {
            if (obj.succeeded === false) {
              this.toast(obj.message);
            }
            else {
              localStorage.removeItem(`delkey.${rec.hash}`);
              if (rec.hash == this.replayHash) {
                this.replayHash = null;
              }
              this.fetchReplayList();
            }
          });
      }
    },
    copyReplayUrl(rec) {
      let url = window.location.href.replace(/\?.+/, '').replace(/#.+/, '');
      url += `?replay=${rec.hash}`;
      this.copyToClipboard(url);
      this.toast(`コピーしました：${url}`);
    },
    toggleReplayList(v) {
      if (v === undefined) {
        v = !this.showReplayList;
      }
      this.showReplayList = v;
      if (v) {
        this.fetchReplayList();
      }
    },
    //#endregion リプレイ


    //#region Balloon
    addBaloon(unit, content, z = -1) {
      let el = document.createElement('div');
      el.innerHTML = content;
      el.classList.add('balloon');
      el.style.left = `${unit.coord[0] * 50 + 25}px`;
      el.style.top = `${unit.coord[1] * 50}px`;
      if (z != -1) {
        el.style.zIndex = `${z}`;
      }
      this.$refs.cells.appendChild(el);

      // 位置
      el.animate(
        { transform: ['translate(-50%, -110%)', 'translate(-50%, -160%)'] },
        {
          duration: 600,
          easing: 'ease-out',
          fill: 'forwards',
        }
      );
      // 透明度
      el.animate(
        { opacity: ['1', '0'] },
        {
          duration: 500,
          delay: 500,
          easing: 'ease-out',
          fill: 'forwards',
        }
      ).onfinish = () => {
        el.remove();
      };
    },
    addDamageBalloon(unit, damage) {
      let str = `${Math.round(damage)}`;
      let minor = `<span style='color: rgb(200,200,200); font-size: 21pt;'>${str.slice(-4)}</span>`;
      let major = `<span style='color: rgb(0,0,0); font-size: 24pt;'>${str.slice(0, -4)}</span>`;
      let content = `<h1>${major}${minor}</h1>`;
      this.addBaloon(unit, content, 99);
    },
    addHealBalloon(unit, heal) {
      let str = `${Math.round(heal)}`;
      let minor = `<span style='color: rgb(120,240,120); font-size: 21pt;'>${str.slice(-4)}</span>`;
      let major = `<span style='color: rgb(0,160,0); font-size: 24pt;'>${str.slice(0, -4)}</span>`;
      let content = `<h1>${major}${minor}</h1>`;
      this.addBaloon(unit, content, 98);
    },
    addBalloons(ctx) {
      if (ctx) {
        for (let [fid, damage] of Object.entries(ctx.damageTaken)) {
          if (damage.total) {
            let u = this.simulation.findUnit(fid);
            this.addDamageBalloon(u, damage.total);
          }
        }
        for (let [fid, heal] of Object.entries(ctx.healTaken)) {
          if (heal.total) {
            let u = this.simulation.findUnit(fid);
            this.addHealBalloon(u, heal.total);
          }
        }
      }
    },
    scoreToHtml(num) {
      let str = `${Math.round(num)}`;
      let r = [];
      r.push(`<span style='color: rgb(200,200,200); font-size: 15pt;'>${str.slice(-4)}</span>`);
      if (str.length > 4) {
        r.push(`<span style='color: rgb(100,100,100); font-size: 18pt;'>${str.slice(-8, -4)}</span>`);
      }
      if (str.length > 8) {
        r.push(`<span style='color: rgb(0,0,0); font-size: 21pt;'>${str.slice(-12, -8)}</span>`);
      }
      return r.toReversed().join("");
    },
    //#endregion Balloon


    //#region Misc
    getItemName(uid) {
      return (this.battleList.find(a => a.uid == uid)?.name ?? "").replace(/\(.+\)/, "");
    },

    // in-place array copy
    copyArray(dst, src) {
      dst.length = src.length;
      for (let i = 0; i < src.length; ++i)
        dst[i] = src[i];
    },
    appendArray(dst, src) {
      let pos = dst.length;
      dst.length = dst.length + src.length;
      for (let i = 0; i < src.length; ++i)
        dst[pos++] = src[i];
    },

    scrollTo(id, opt) {
      this.$nextTick(() => {
        let e = document.getElementById(id);
        if (e) {
          e.scrollIntoView(opt ?? { block: "nearest" });
        }
      });
    },

    updateURL() {
      let seri = new lut.URLSerializer();
      seri.b = this.battleId;
      if (this.phase != "0")
        seri.p = this.phase;
      if (this.selectedUnit)
        seri.u = this.selectedUnit.fid;

      let url = seri.serialize();
      if (url != this.prevURL) {
        window.history.pushState(null, null, url);
        this.prevURL = url;
        return true;
      }
      return false;
    },
    decodeURL(initState = false) {
      let data = new lut.URLSerializer();
      if (data.deserialize(window.location.href) || initState) {
        if (data.b)
          this.selectBattle(data.b);
        if (data.p)
          this.selectPhase(data.p);
        else if (data.b)
          this.selectPhase("0");
        if (data.u)
          this.selectUnit(data.u);

        if (data.loadout) {
          this.importLoadoutFromUrl(data.loadout);
        }
        if (data.replay) {
          // 呼び出し側に委ねる
        }
        return data;
      }
      return null;
    },
    dbgTest() {
    },
    //#endregion Misc
  },
}
</script>

<style scoped>
  .main-panel {
    padding-top: 10px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 0.3rem;
    display: inline-block;
    background: rgb(245, 245, 245);
    box-shadow: 0 3px 6px rgba(140,149,159,0.5);
  }

  .grid {
    display: grid !important;
  }
  .grid-container {
    user-select: none;
    display: grid;
    margin-right: 20px;
    position: relative;
  }
  .grid-cell {
    justify-content: center;
    background: white;
    outline: 1px solid rgb(180,185,195);
    transition-property: background;
    transition: 10ms ease;
  }
  .unit-cell {
    position: absolute;
    width: 50px;
    height: 50px;
    pointer-events: none;
    transition-property: offset-distance;
    transition: 100ms linear;
    offset-anchor: left top;
    offset-rotate: 0deg;
  }
  .grid-cell.obstacle {
    background: rgb(180,185,195);
  }

  .enemy-cell {
    background: rgb(255, 160, 160);
    cursor: pointer;
  }
  .enemy-cell.selected {
    background: rgb(255, 80, 80);
  }

  .player-cell {
    background: rgb(140, 160, 255);
    cursor: pointer;
  }
  .player-cell.selected {
    background: rgb(80, 80, 255);
  }

  .target-cell {
    background: rgb(255, 90, 80) !important;
    cursor: pointer;
  }

  .move-range {
    background: rgb(200, 220, 255);
  }
  .attack-range {
    background: rgb(255, 200, 190);
  }
  .area-range {
    background: rgb(255, 235, 190);
  }
  .click-to-move:hover {
    background: rgb(140, 160, 255);
    cursor: move;
  }
  .click-to-fire:hover {
    background: rgb(255, 90, 80);
    cursor: pointer;
  }

  .enemy-list {
    overflow-y: scroll;
    overscroll-behavior: none;
  }
  .enemy-panel {
  }

  .center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .unit-panel {
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 0.3rem;
    display: inline-block;
    background: rgb(245, 245, 245);
    box-shadow: 0 3px 6px rgba(140,149,159,0.5);
    padding: 10px;
    margin: 5px;
  }

  .content ul {
    list-style-type: disc;
    margin: 0;
  }
  .content li {
    display: list-item;
    margin: 0 15px;
  }

  .action-button {
    display: inline-block;
    width: 55px;
    height: 55px;
    cursor: pointer;

    border: 1px solid rgba(255, 255, 255, 0);
    border-radius: 0.3rem;
    background-color: rgba(255, 255, 255, 0);
  }
  .action-button.selected {
    border: 1px solid rgba(255, 0, 0, 255);
    background-color: rgba(255, 0, 0, 255);
  }
  .grayscale {
    filter: grayscale(100%) brightness(90%);
  }
  .text-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-weight: bold;
    text-align: center;
    background-color: rgba(0, 0, 0, 0.5);
  }

  .sim-commands {
    position: fixed;
    bottom: 10px;
    border-radius: 0.3rem;
    padding: 5px;
    transition: all 250ms ease;
  }
  .sim-commands.player-turn {
    background: rgba(128, 128, 250, 0.7);
  }
  .sim-commands.enemy-turn {
    background: rgba(250, 128, 128, 0.7);
  }

  .sim-replay {
    position: fixed;
    bottom: 5px;
    right: 10px;
    border-radius: 0.3rem;
    padding: 5px;
    transition: all 250ms ease;
  }
  .sim-replay:focus {
    outline: none;
  }
</style>
<style>
  .table {
    margin-bottom: 1px;
  }

  .desc .table {
    width: auto;
    margin: 3px;
  }

  .input-dropdown button {
    padding: 0.1em;
  }

  .table-sm td {
    padding-top: 1px;
    padding-bottom: 1px;
    vertical-align: middle;
  }

  input::placeholder {
    color: rgb(190, 190, 190) !important;
    font-size: small !important;
  }

  .status-simulator-popover {
    max-width: 1000px !important;
  }
  .status-simulator-popover .popover-body {
    padding: 0px !important;
  }
  .loadout-popover {
    max-width: 1000px !important;
    min-width: 800px !important;
  }
  .replay-popover {
    max-width: 1100px !important;
    min-width: 1100px !important;
  }
  .comment-popover {
    max-width: 800px !important;
    min-width: 600px !important;
  }

  .balloon {
    position: absolute;
    display: inline-block;
    padding: 5px;
    z-index: 99;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 0.3rem;
    background: white;
    box-shadow: 0 3px 6px rgba(140,149,159,0.5);
  }

  @keyframes move {
    0% {
      offset-distance: 0%;
    }
    100% {
      offset-distance: 100%;
    }
  }
</style>
