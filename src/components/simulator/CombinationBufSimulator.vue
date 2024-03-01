<template>
  <div class="root">
    <div class="menu-content" style="flex-wrap: nowrap">
      <div class="menu-panel" id="cb-settings">
        <b-container>
          <div>
            <h3 style="margin: 5px 0px">設定</h3>
          </div>
          <b-table small borderless hover :items="Object.values(options)" :fields="optionFields">
            <template #cell(value)="r">
              <div class="flex">
                <div style="margin-left: auto">
                  <b-form-checkbox v-if="r.item.type == 'boolean'" v-model="r.item.value"></b-form-checkbox>
                  <b-form-input v-if="r.item.type == 'number'" style="width: 3em" v-model.number="r.item.value" :min="r.item.min" :max="r.item.max" size="sm" type="number" class="input-param" lazy></b-form-input>
                </div>
              </div>
            </template>
            <template #cell(label)="r">
              <div :id="`cb-p-${r.item.name}`">{{r.item.label}}</div>
            </template>
          </b-table>

        </b-container>

        <b-container>
          <div>
            <h3 style="margin: 5px 0px">フィルタ</h3>
          </div>
          <div class="menu-widgets flex">
            <div class="widget">
              <b-button-group size="sm" id="cb-class-selector">
                <b-button v-for="(c, i) in filter.class" :key="i" :pressed.sync="c.state" variant="outline-secondary">
                  <b-img-lazy :src="getImageURL(classes[i])" width="20px" />
                </b-button>
              </b-button-group>
            </div>
          </div>
          <div class="menu-widgets flex">
            <div class="widget filter">
              <b-button-group size="sm" id="cb-symbol-selector">
                <b-button v-for="(c, i) in filter.symbol" :key="i" :pressed.sync="c.state" variant="outline-secondary">
                  <b-img-lazy :src="getImageURL(symbols[i])" width="20px" />
                </b-button>
              </b-button-group>
            </div>
            <div class="widget filter">
              <b-button-group size="sm" id="cb-damage-type-selector">
                <b-button v-for="(c, i) in filter.damageType" :key="i" :pressed.sync="c.state" variant="outline-secondary">
                  <b-img-lazy :src="getImageURL(damageTypes[i])" width="20px" />
                </b-button>
              </b-button-group>
            </div>
            <div class="widget rareiry-filter">
              <b-button-group size="sm" id="cb-rareiry-selector">
                <b-button v-for="(c, i) in filter.rarity" :key="i" :pressed.sync="c.state" variant="outline-secondary">
                  <b-img-lazy :src="getImageURL(rarities[i])" width="30px" />
                </b-button>
              </b-button-group>
            </div>
          </div>
        </b-container>

        <b-container>
          <div class="button-box">
            <div class="left-align">
              <b-button size="sm" @click="presetPAtk()" style="margin-right: 3px">物攻系</b-button>
              <b-button size="sm" @click="presetMAtk()" style="margin-right: 3px">魔攻系</b-button>
              <b-button size="sm" @click="presetPDef()" style="margin-right: 3px">物防系</b-button>
              <b-button size="sm" @click="presetMDef()" style="margin-right: 3px">魔防系</b-button>
            </div>
          </div>
          <div class="button-box">
            <div class="left-align">
              <b-button size="sm" @click="onCopyUrl()">パラメータを URL としてコピー</b-button>
            </div>
          </div>
        </b-container>

      </div>

      <div class="menu-panel" id="cb-buff-list">
        <b-container>
          <div class="flex">
            <h3 style="margin: 5px 0px">バフ</h3>
            <div class="right-align">
              <b-button size="sm" @click="buffs.forEach(a => a.reset())">リセット</b-button>
            </div>
          </div>
          <b-table small borderless hover :items="buffs" :fields="buffFields">
            <template #cell(enabled)="r">
              <b-form-checkbox v-model="r.item.enabled"></b-form-checkbox>
            </template>
            <template #cell(label)="r">
              {{r.item.label}}
            </template>
            <template #cell(limit)="r">
              <b-form-input v-if="!r.item.parent" style="width: 4.5em" v-model.number="r.item.limit" size="sm" type="number" class="input-param" step="10" lazy placeholder="無制限"></b-form-input>
              <div v-if="r.item.parent" style="text-align:center; color: lightgray">〃</div>
            </template>
            <template #cell(weight)="r">
              <b-form-input style="width: 3.5em" v-model.number="r.item.weight" size="sm" type="number" class="input-param" lazy></b-form-input>
            </template>
          </b-table>
        </b-container>
      </div>

      <div class="menu-panel" id="cb-debuff-list">
        <b-container>
          <div class="flex">
            <h3 style="margin: 5px 0px">デバフ</h3>
            <div class="right-align">
              <b-button size="sm" @click="debuffs.forEach(a => a.reset())">リセット</b-button>
            </div>
          </div>

          <b-table small borderless hover :items="debuffs" :fields="buffFields">
            <template #cell(enabled)="r">
              <b-form-checkbox v-model="r.item.enabled"></b-form-checkbox>
            </template>
            <template #cell(label)="r">
              {{r.item.label}}
            </template>
            <template #cell(limit)="r">
              <b-form-input v-if="!r.item.parent" style="width: 4.5em" v-model.number="r.item.limit" size="sm" type="number" class="input-param" step="10" lazy placeholder="無制限"></b-form-input>
              <div v-if="r.item.parent" style="text-align:center; color: lightgray">〃</div>
            </template>
            <template #cell(weight)="r">
              <b-form-input style="width: 3.5em" v-model.number="r.item.weight" size="sm" type="number" class="input-param" lazy></b-form-input>
            </template>
          </b-table>
        </b-container>
      </div>

      <div class="menu-panel" id="cb-exclude-list">
        <b-container>
          <div>
            <div class="flex">
              <h3 style="margin: 5px 0px">優先リスト</h3>
              <div class="right-align">
                <b-button size="sm" id="cb-add-prioritized">追加</b-button>
                <b-button size="sm" @click="prioritized=[]" style="margin-left: 5px">クリア</b-button>
                <ChrSelector target="cb-add-prioritized" :chrs="mainChrs" @click="addPrioritized" classfilter symbolfilter />
              </div>
            </div>
            <div class="flex exclude-box">
              <b-link v-for="(v, i) in prioritized" :key="i" @click="prioritized.splice(prioritized.indexOf(v), 1)">
                <div v-if="!v.owner" :title="v.name">
                  <b-img-lazy :src="getImageURL(v.icon)" :title="v.name" width="50" />
                </div>
                <div v-if="v.owner" style="width: 50px; height: 50px;" :title="v.owner.name + ' & ' + v.item.name">
                  <b-img-lazy :src="getImageURL(v.owner.icon)" :title="v.name" width="35" style="position: relative; left: 0px; top: 0px; " />
                  <b-img-lazy :src="getImageURL(v.item.icon)" :title="v.name" width="35" style="position: relative; left: -20px; top: 15px; " />
                </div>
              </b-link>
            </div>
          </div>
          <div>
            <div class="flex">
              <h3 style="margin: 5px 0px">除外リスト</h3>
              <div class="right-align">
                <b-button size="sm" id="cb-add-excluded">追加</b-button>
                <b-button size="sm" @click="excluded=[]" style="margin-left: 5px">クリア</b-button>
                <ChrSelector target="cb-add-excluded" :chrs="mainChrs" @click="addExcluded" classfilter symbolfilter />
              </div>
            </div>
            <div class="flex exclude-box">
              <b-link v-for="(v, i) in excluded" :key="i" @click="excluded.splice(excluded.indexOf(v), 1)">
                <div v-if="!v.owner" :title="v.name">
                  <b-img-lazy :src="getImageURL(v.icon)" :title="v.name" width="50" />
                </div>
                <div v-if="v.owner" style="width: 50px; height: 50px; " :title="v.owner.name + ' & ' + v.item.name">
                  <b-img-lazy :src="getImageURL(v.owner.icon)" :title="v.name" width="35" style="position: relative; left: 0px; top: 0px; " />
                  <b-img-lazy :src="getImageURL(v.item.icon)" :title="v.name" width="35" style="position: relative; left: -20px; top: 15px; " />
                </div>
              </b-link>
            </div>
          </div>
        </b-container>
      </div>
    </div>

    <div class="content">
      <div v-if="!progress.completed" class="menu-panel" style="padding: 10px; position: absolute;">
        <b-spinner small label="Spinning"></b-spinner>
      </div>
      <div v-if="progress.result.length != 0" class="total-params">
        <div class="flex info">
          <div><h6>全ユニット合計:</h6></div>
          <template v-for="(e, ei) in allEffectsToHtml(progress.result)">
            <div :key="ei" v-html="e" />
          </template>
        </div>
      </div>
    </div>

    <div class="content" :style="style">

      <div v-if="progress.result.length == 0" class="menu-panel" style="padding: 10px">
        <div class="about">
          <h5 style="margin-bottom: 5px">組み合わせ検索</h5>
          指定のバフ・デバフの最適な組み合わせを探すツールです。<br />
          メインキャラ(スキル×装備)×サポート の組み合わせから、競合を考慮しつつ、総効果量の高いものを探索します。<br />
          例えば「与ダメージバフ＋クリティカルダメージ倍率バフ＋ダメージ耐性デバフ」のいい感じの組み合わせを探したい、というようなケースで役立ちます。<br />
          <br />
          味方全体の強化の最適化が目的であるため、自己バフは考慮しません。単体のバフも「<b-link @mouseenter="highlight('cb-p-allowSingleUnitBuff', true)" @mouseleave="highlight('cb-p-allowSingleUnitBuff', false)">単体バフを含める</b-link>」にチェックしていない限り考慮しません。<br />
          マスターキャラのクラス対象バフや、ゼニス/オリジン/ナディア のシンボル対象バフ、特定のクラスへの追加効果 (<b-link :ref="po">みんな！丸太は持った！？</b-link> のスキル与ダメージなど) は除外しています。<br />
          シンボルスキルに関しては「<b-link @mouseenter="highlight('cb-p-allowSymbolSkill', true)" @mouseleave="highlight('cb-p-allowSymbolSkill', false)">シンボルスキルを含める</b-link>」をチェックすると含めるようになります。<br />
          特定のキャラやスキルを除外or優先採用したい場合、アイコンをマウスオーバーすると出てくるポップアップから可能です。<br />
          特定の効果を優先したい場合は優先度を高めると優先的に選択されます。<br />
          <br />
          なお、必ずしも本当に最適な結果になるとは限らないことに注意が必要です。<br />
          完璧に解くには時間がかかりすぎるため、若干正確性を犠牲にしつつ高速に解く方法を用いています。<br />
          (アルゴリズムは随時改良中: 2024/02/20)<br />
        </div>
      </div>

      <template v-for="(r, ri) in progress.result">
        <div class="character" :key="ri">
          <div class="flex info">
            <div><h6>ユニット内合計:</h6></div>
            <template v-for="(e, ei) in chrEffectsToHtml(r)">
              <div :key="ei" v-html="e" />
            </template>
          </div>
          <div class="flex">
            <div v-if="r.main" class="portrait">
              <b-img-lazy :src="getImageURL(r.main.character.icon)" :title="r.main.character.name" :id="'portrait_m_'+ri" width="100" rounded />
              <b-popover v-if="displayType>=1" :target="'portrait_m_'+ri" :title="r.main.character.name" triggers="hover click blur" :delay="{show:0, hide:250}" no-fade placement="top">
                <div class="status flex">
                  <b-img-lazy :src="getImageURL(r.main.character.class)" :title="'クラス:'+r.main.character.class" height="25" />
                  <b-img-lazy :src="getImageURL(r.main.character.symbol)" :title="'シンボル:'+r.main.character.symbol" height="25" />
                  <b-img-lazy :src="getImageURL(r.main.character.rarity)" :title="'レアリティ:'+r.main.character.rarity" height="20" />
                  <div class="param-box"><b-img-lazy :src="getImageURL(r.main.character.damageType)" :title="'攻撃タイプ:'+r.main.character.damageType" width="20" height="20" /></div>
                  <div class="param-box"><b-img-lazy :src="getImageURL('射程')" title="射程" width="18" height="18" /><span>{{r.main.character.range}}</span></div>
                  <div class="param-box"><b-img-lazy :src="getImageURL('移動')" title="移動" width="18" height="18" /><span>{{r.main.character.move}}</span></div>
                  <div class="param-box"><span class="param-name">実装日:</span><span class="param-value">{{r.main.character.date}}</span></div>
                </div>
                <div class="status flex">
                  <b-link v-for="(skill, si) in r.main.character.skills" :key="si" @click="addPrioritized(skill)">
                    <b-img-lazy :src="getImageURL(skill.icon)" :title="skill.name" width="50" />
                  </b-link>
                </div>
                <div class="flex exclude-menu">
                  <b-button @click="addPrioritized(r.main.character)">このキャラを優先</b-button>
                </div>
                <div class="flex exclude-menu">
                  <b-button @click="addExcluded(r.main.character)">このキャラを除外</b-button>
                </div>
              </b-popover>
            </div>
            <div v-if="r.main" class="detail" v-show="displayType >= 1">
              <div class="skills">
                <div class="skill" v-for="(skill, si) in r.main.skills" :class="getSkillClass(skill)" :key="si">
                  <div class="flex">
                    <div class="icon">
                      <b-img-lazy :src="getImageURL(skill.icon)" :title="skill.name" width="50" :id="'skill_m_'+ri+'_'+si" />
                      <b-popover :target="'skill_m_'+ri+'_'+si" :title="skill.name" triggers="hover click blur" :delay="{show:0, hide:250}" no-fade placement="top">
                        <div v-if="skill.owners" class="owners">
                          所持者:<br />
                          <b-link v-for="(owner, oi) in skill.owners" :key="oi" @click="addPrioritized(owner)">
                            <b-img-lazy :src="getImageURL(owner.icon)" :title="owner.name" width="50" />
                          </b-link>
                        </div>
                        <div v-if="!skill.isTalent">
                          <div class="flex exclude-menu">
                            <b-button size="sm" @click="addPrioritized(skill)">このスキルを優先</b-button>
                            <b-button size="sm" @click="addPrioritized(skill, r.main.character)">このキャラとスキルの組み合わせを優先</b-button>
                          </div>
                          <div class="flex exclude-menu">
                            <b-button size="sm" @click="addExcluded(skill)">このスキルを除外</b-button>
                            <b-button size="sm" @click="addExcluded(skill, r.main.character)">このキャラとスキルの組み合わせを除外</b-button>
                          </div>
                        </div>
                      </b-popover>
                    </div>
                    <div class="desc" v-show="displayType >= 2">
                      <div class="flex">
                        <h6>{{ skill.name }}</h6>
                        <div class="param-group" v-html="skillParamsToHtml(skill)"></div>
                      </div>
                      <p>
                        <span v-html="descToHtml(skill, true)" />
                        <span v-if="skill.note" class="note" v-html="noteToHtml(skill)" />
                        <span class="note" v-html="effectsToHtml(skill, r.main)" />
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="skills">
                <div class="skill" v-for="(item, si) in r.main.equipments" :key="si">
                  <div class="flex">
                    <div class="icon">
                      <b-img-lazy :src="getImageURL(item.icon)" :title="item.name" width="50" :id="'item_'+ri+'_'+si" />
                      <b-popover v-if="displayType>=1" :target="'item_'+ri+'_'+si" :title="item.name" triggers="hover click blur" :delay="{show:0, hide:250}" no-fade placement="top">
                        <div class="flex exclude-menu">
                          <b-button size="sm" @click="addPrioritized(item)">このアイテムを優先</b-button>
                          <b-button size="sm" @click="addPrioritized(item, r.main.character)">このキャラとアイテムの組み合わせを優先</b-button>
                        </div>
                        <div class="flex exclude-menu">
                          <b-button size="sm" @click="addExcluded(item)">このアイテムを除外</b-button>
                          <b-button size="sm" @click="addExcluded(item, r.main.character)">このキャラとアイテムの組み合わせを除外</b-button>
                        </div>
                      </b-popover>
                    </div>
                    <div class="desc" v-show="displayType >= 2">
                      <div class="flex">
                        <h6><b-img-lazy :src="getImageURL(item.slot)" :title="item.name" width="18" />{{ item.name }}</h6>
                        <div class="param-group" v-html="skillParamsToHtml(item)"></div>
                      </div>
                      <p>
                        <span v-html="descToHtml(item, true)" />
                        <span v-if="item.note" class="note" v-html="noteToHtml(item)" />
                        <span class="note" v-html="effectsToHtml(item, r.main)" />
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex">
            <div v-if="r.summon" class="portrait">
              <b-img-lazy :src="getImageURL(r.summon.character.icon)" :title="`${r.summon.character.name} (召喚ユニット)`" :id="'portrait_x_'+ri" width="100" rounded />
            </div>
            <div v-if="r.summon" class="detail" v-show="displayType >= 1">
              <div class="skills">
                <div class="skill" v-for="(skill, si) in r.summon.skills" :class="getSkillClass(skill)" :key="si">
                  <div class="flex">
                    <div class="icon">
                      <b-img-lazy :src="getImageURL(skill.icon)" :title="skill.name" width="50" :id="'skill_x_'+ri+'_'+si" />
                      <b-popover :target="'skill_x_'+ri+'_'+si" :title="skill.name" triggers="hover click blur" :delay="{show:0, hide:250}" no-fade placement="top">
                        <div v-if="skill.owners" class="owners">
                          所持者:<br />
                          <b-link v-for="(owner, oi) in skill.owners" :key="oi" @click="addPrioritized(owner)">
                            <b-img-lazy :src="getImageURL(owner.icon)" :title="owner.name" width="50" height="50" />
                          </b-link>
                        </div>
                        <div v-if="!skill.isTalent">
                          <div class="flex exclude-menu">
                            <b-button size="sm" @click="addPrioritized(skill)">このスキルを優先</b-button>
                            <b-button size="sm" @click="addPrioritized(skill, r.main.character)">このキャラとスキルの組み合わせを優先</b-button>
                          </div>
                          <div class="flex exclude-menu">
                            <b-button size="sm" @click="addExcluded(skill)">このスキルを除外</b-button>
                            <b-button size="sm" @click="addExcluded(skill, r.main.character)">このキャラとスキルの組み合わせを除外</b-button>
                          </div>
                        </div>
                      </b-popover>
                    </div>
                    <div class="desc" v-show="displayType >= 2">
                      <div class="flex">
                        <h6>{{ skill.name }}</h6>
                        <div class="param-group" v-html="skillParamsToHtml(skill)"></div>
                      </div>
                      <p>
                        <span v-html="descToHtml(skill, true)" />
                        <span v-if="skill.note" class="note" v-html="noteToHtml(skill)" />
                        <span class="note" v-html="effectsToHtml(skill, r.main)" />
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex">
            <div v-if="r.support" class="portrait">
              <b-img-lazy :src="getImageURL(r.support.character.icon)" :title="r.support.character.name" :id="'portrait_s_'+ri" width="100" height="100" rounded />
              <b-popover v-if="displayType>=1" :target="'portrait_s_'+ri" :title="r.support.character.name" triggers="hover click blur" :delay="{show:0, hide:250}" no-fade placement="top">
                <div class="status flex">
                  <b-img-lazy :src="getImageURL(r.support.character.class)" :title="'クラス:'+r.support.character.class" height="25" />
                  <b-img-lazy :src="getImageURL(r.support.character.supportType)" :title="'サポートタイプ:'+r.support.character.supportType" height="25" />
                  <b-img-lazy :src="getImageURL(r.support.character.rarity)" :title="'レアリティ:'+r.support.character.rarity" height="20" />
                  <div class="param-box"><b-img-lazy :src="getImageURL(r.support.character.damageType)" :title="'攻撃タイプ:'+r.support.character.damageType" width="20" height="20" /></div>
                  <div class="param-box"><b-img-lazy :src="getImageURL('射程')" title="射程" width="18" height="18" /><span>{{r.support.character.range}}</span></div>
                  <div class="param-box"><span class="param-name">実装日:</span><span class="param-value">{{r.support.character.date}}</span></div>
                </div>
                <div class="status flex">
                  <b-link v-for="(skill, si) in r.support.character.skills" :key="si">
                    <b-img-lazy :src="getImageURL(skill.icon)" :title="skill.name" width="50" />
                  </b-link>
                </div>
                <div class="flex exclude-menu">
                  <b-button @click="addPrioritized(r.support.character)">このキャラを優先</b-button>
                </div>
                <div class="flex exclude-menu">
                  <b-button @click="addExcluded(r.support.character)">このキャラを除外</b-button>
                </div>
              </b-popover>
            </div>
            <div v-if="r.support" class="detail" v-show="displayType >= 1">
              <div class="skills">
                <div class="skill" v-for="(skill, si) in enumerate(r.support.skills)" :class="getSkillClass(skill)" :key="si">
                  <div class="flex">
                    <div class="icon">
                      <b-img-lazy :src="getImageURL(skill.icon)" :title="skill.name" with="50" height="50" :id="'skill_s_'+ri+'_'+si" />
                    </div>
                    <div class="desc" v-show="displayType >= 2">
                      <div class="flex">
                        <h6>{{ skill.name }}</h6>
                        <div class="param-group" v-html="skillParamsToHtml(skill)"></div>
                      </div>
                      <p>
                        <span v-html="descToHtml(skill, true)" />
                        <span v-if="skill.note" class="note" v-html="noteToHtml(skill)" />
                        <span class="note" v-html="effectsToHtml(skill, r.support)" />
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </template>
    </div>

    <ItemPopovers />
  </div>
</template>

<script>
import ChrSelector from '../parts/ChrSelector.vue'
import commonjs from "../common.js";
import lookupjs from "./lookup.js";

import ItemPopovers from '../parts/ItemPopovers.vue'
import ItemPopoversJs from "../parts/ItemPopovers.js";

export default {
  name: 'Lookup',
  components: {
    ChrSelector,
    ItemPopovers,
  },
  mixins: [commonjs, lookupjs, ItemPopoversJs],

  data() {
    return {
      initialState: {},
      history: [],
      historyIndex: 0,

      buffFields: [
        {
          key: "enabled",
          label: "",
        },
        {
          key: "label",
          label: "種類",
        },
        {
          key: "limit",
          label: "上限",
        },
        {
          key: "weight",
          label: "優先度",
        },
      ],
      optionFields: [
        {
          key: "value",
          label: "",
        },
        {
          key: "label",
          label: "項目",
        },
      ],
    };
  },

  created() {
    this.setupDB();
    this.setupFilter();

    const excludeEffect = function (effect) {
      const cond = effect.condition;
      if (!this.isPublicTarget(effect.target) ||
        (cond && (cond.onClass || cond.onSymbol)) ||
        (effect.isDebuff && effect.ephemeral && !effect.duration)
      ) {
        return true;
      }
      return false;
    }.bind(this);
    for (let skill of this.enumerate(this.mainActive, this.mainPassive, this.mainTalents, this.supActive, this.supPassive, this.items)) {
      if (skill.buff)
        skill.buff = skill.buff.filter(s => !excludeEffect(s));
      if (skill.debuff)
        skill.debuff = skill.debuff.filter(s => !excludeEffect(s));
    }

    const makeOptions = function (params) {
      let r = {};
      for(const p of params) {
        const v = p.value;
        p.type = typeof v;
        p.reset = function () { this.value = v; };
        r[p.name] = p;
      }
      return r;
    };
    this.options = makeOptions([
      { name: "maxPickup", label: "人を選出", value: 5, min: 1, max: 10 },
      { name: "maxActiveCount", label: "アクティブ数制限 (再行動ありを除く)", value: 2, min: 0, max: 3 },
      { name: "allowTalent", label: "タレントを含める", value: true },
      { name: "allowPassive", label: "パッシブスキルを含める", value: true },
      { name: "allowActive", label: "アクティブスキルを含める", value: true },
      { name: "allowItem", label: "装備の効果を含める", value: true },
      { name: "allowEngageSkills", label: "エンゲージスキルを含める", value: true },
      { name: "allowSupportActive", label: "サポートのアクティブを含める", value: true },
      { name: "allowSupportPassive", label: "サポートのパッシブを含める", value: true },
      { name: "allowOnBattle", label: "戦闘時発動効果を含める", value: true },
      { name: "allowProbability", label: "確率発動効果を含める", value: true },
      { name: "allowSingleUnitBuff", label: "単体バフを含める", value: false },
      { name: "allowSymbolSkill", label: "シンボルスキルを含める", value: false },
    ]);

    const effectTypeTable = this.effectTypeTable;
    const makeParams = function (prefix, types) {
      const make = function (t) {
        const l = t.limit ? t.limit : null;
        const w = t.weight ? t.weight : 10;
        const effectType = `${t.label}${prefix}`;
        return {
          label: t.label,
          enabled: false,
          limit_: l,
          weight: w,
          effectType: effectType,
          effectTypeIndex: effectTypeTable.get(effectType),

          get limit() {
            return this.parent ? this.parent.limit_ : this.limit_;
          },
          set limit(v) {
            if (!this.parent)
              this.limit_ = v;
          },
          reset() {
            this.enabled = false;
            this.limit = l;
            this.weight = w;
          }
        };
      }
      return types.map(a => make(a));
    };

    this.buffs = makeParams("+", [
      {label: "アタック"},
      {label: "ディフェンス"},
      {label: "マジック"},
      {label: "レジスト"},
      {label: "クリティカル率"},
      {label: "クリティカルダメージ倍率"},
      {label: "与ダメージ"},
      {label: "与ダメージ(物理)"},
      {label: "与ダメージ(魔法)"},
      {label: "与ダメージ(スキル)"},
      {label: "与ダメージ(範囲スキル)"},
      {label: "与ダメージ(通常攻撃)"},
      {label: "ダメージ耐性", limit:70},
      {label: "ダメージ耐性(物理)"},
      {label: "ダメージ耐性(魔法)"},
    ]);
    this.debuffs = makeParams("-", [
      {label: "アタック", limit:70},
      {label: "ディフェンス", limit:70},
      {label: "マジック", limit:70},
      {label: "レジスト", limit:70},
      {label: "与ダメージ", limit:70},
      {label: "ダメージ耐性"},
      {label: "ダメージ耐性(物理)"},
      {label: "ダメージ耐性(魔法)"},
    ]);

    const setParent = function (list, childLabel, parentLabel) {
      let c = list.find(a => a.label == childLabel);
      let p = list.find(a => a.label == parentLabel);
      c.parent = p;
      delete c.limit_;
    };
    setParent(this.buffs, "与ダメージ(物理)", "与ダメージ");
    setParent(this.buffs, "与ダメージ(魔法)", "与ダメージ");
    setParent(this.buffs, "与ダメージ(スキル)", "与ダメージ");
    setParent(this.buffs, "与ダメージ(範囲スキル)", "与ダメージ");
    setParent(this.buffs, "ダメージ耐性(物理)", "ダメージ耐性");
    setParent(this.buffs, "ダメージ耐性(魔法)", "ダメージ耐性");
    setParent(this.debuffs, "ダメージ耐性(物理)", "ダメージ耐性");
    setParent(this.debuffs, "ダメージ耐性(魔法)", "ダメージ耐性");
  },

  mounted() {
  },

  methods: {
    createUsedFlags(parent = null) {
      if (parent) {
        return new this.BitFlags(parent);
      }
      else {
        return new this.BitFlags(this.itemCount);
      }
    },

    compare(a, b) {
      return a == b ? 0 : a < b ? 1 : -1;
    },

    pickMax(iter, evaluator) {
      let r = null;
      let highest = 0;
      for (let v of iter) {
        let score = evaluator(v);
        if (score > highest) {
          r = v;
          highest = score;
        }
      }
      return [r, highest];
    },

    doSearch(num) {
      // reactive getter 回避のためコピーを用意
      const opt = this.optionValues;
      let targets = new Array(this.effectTypeIndex);
      for (let v of this.enabledEffects) {
        targets[v.effectTypeIndex] = {
          limit: v.limit,
          weight: v.weight,
          effectTypeIndex: v.effectTypeIndex,
        };
      }
      const excluded = [...this.excluded];
      const prioritized = [...this.prioritized];
      const isExcluded = this.isExcluded;
      const isPrioritized = this.isPrioritized;

      const compareScore = function (a, b) {
        if (a.score == b.score && a.scoreMain)
          return this.compare(a.scoreMain, b.scoreMain);
        else
          return this.compare(a.score, b.score);
      }.bind(this);

      const effectCondition = function (effect) {
        if (effect.ephemeral && !effect.duration)
          return false;

        const cond = effect.condition;
        const probability = cond?.probability;
        if (effect.isDebuff) {
          return (opt.allowOnBattle || !effect.ephemeral) &&
            (opt.allowProbability || !probability);
        }
        else {
          return (opt.allowSingleUnitBuff || !effect.isSingleTarget) &&
            (opt.allowOnBattle || !effect.ephemeral) &&
            (opt.allowProbability || !probability);
        }
      };
      const skillCondition = function (skill) {
        if ((!opt.allowTalent && skill.isTalent) ||
          (!opt.allowPassive && skill.isPassive && skill.isMainSkill) ||
          (!opt.allowActive && skill.isActive && skill.isMainSkill) ||
          (!opt.allowItem && skill.isItem) ||
          (!opt.allowSymbolSkill && skill.isSymbolSkill) ||
          (!opt.allowSupportActive && skill.isActive && skill.isSupportSkill) ||
          (!opt.allowSupportPassive && skill.isPassive && skill.isSupportSkill)
        ) {
          return false;
        }
        return true;
      };

      const findPrioritizedChr = function (scoreList) {
        for (const p of this.prioritized) {
          const r = scoreList.find(a => (a.scoreMain != undefined ? a.scoreMain > 0 : a.score > 0) && a.character == p);
          if (r)
            return r;
        }
        return null;
      }.bind(this);

      // 高速化のため事前フィルタ
      const isRelevant = function (item) {
        if (isExcluded(item))
          return false;
        if (item.isSupport) {
          for (const skill of item.skills) {
            for (const v of this.enumerateEffects(skill)) {
              let p = targets[v.effectTypeIndex];
              if (p && effectCondition(v))
                return true;
            }
          }
        }
        else {
          for (const v of this.enumerateEffects(item)) {
            let p = targets[v.effectTypeIndex];
            if (p && effectCondition(v))
              return true;
          }
        }
        return false;
      }.bind(this);

      let mainChrs = this.mainChrs.filter(a => this.filterMatchMainChr(a));
      let supChrs = this.supChrs.filter(a => isRelevant(a) && this.filterMatchSupChr(a));
      let weapons = this.weapons.filter(a => isRelevant(a));
      let armors = this.armors.filter(a => isRelevant(a));
      let helmets = this.helmets.filter(a => isRelevant(a));
      let accessories = this.accessories.filter(a => isRelevant(a));

      for (let chr of mainChrs) {
        if (chr.engage) {
          chr.engage.enabled = opt.allowEngageSkills;
        }
      }

      let vue = this;
      const createContext = function (parent = null) {
        let ctx = {
          totalAmount: new Int32Array(parent ? parent.totalAmount : vue.effectTypeIndex),
          usedSlots: parent ? [...parent.usedSlots] : new Array(vue.slotIndex),
          usedSkills: this.createUsedFlags(parent ? parent.usedSkills : null),

          isPrioritized: isPrioritized,
          isAvailable: function (item, owner = null) {
            return !this.usedSkills.get(item.index) && !isExcluded(item, owner);
          },
          markAsUsed: function (item) {
            if (item.index) {
              this.usedSkills.set(item.index, true);
            }
          },

          getEffectValue(effect) {
            let p = targets[effect.effectTypeIndex];
            if (p && effectCondition(effect)) {
              if (effect.slotIndex && this.usedSlots[effect.slotIndex]) {
                return [0, p, true];
              }

              const current = this.totalAmount[p.effectTypeIndex];
              let v = vue.getEffectValue(effect);
              let hitLimit = false;
              if (p.limit > 0 && current + v >= p.limit) {
                hitLimit = true;
                v = p.limit - current;
              }
              return [v, p, hitLimit];
            }
            return null;
          },
          acceptEffects(effectList) {
            for (const effect of effectList) {
              this.totalAmount[effect.effectTypeIndex] += vue.getEffectValue(effect);
              if (effect.slotIndex) {
                this.usedSlots[effect.slotIndex] = effect;
              }
            }
          },

          prepassSkill(skill, owner = null) {
            if (!skill || !this.isAvailable(skill, owner) || !skillCondition(skill)) {
              return 0;
            }
            let score = 0;
            for (const v of vue.enumerateEffects(skill)) {
              let p = this.getEffectValue(v);
              if (p) {
                score += p[0] * (p[1].weight * 0.1);
              }
            }
            if (skill.summon) {
              let sch = skill.summon[0];
              for (const s of [sch.talent, ...sch.skills]) {
                score += this.prepassSkill(s);
              }
            }
            // 無価値なら以降 isAvailable() で速やかに弾く
            if (score == 0) {
              this.markAsUsed(skill);
            }
            return score;
          },
          prepassChr(chr) {
            let score = 0;
            score += this.prepassSkill(chr.talent, chr);
            for (const skill of chr.skills)
              score += this.prepassSkill(skill, chr);

            if (chr.isMain) {
              const enumerateItems = function* (items, chr) {
                for (let item of items) {
                  if (!this.usedSkills.get(item.index) && item.classFlags & (1 << chr.classId)) {
                    yield item;
                  }
                }
              }.bind(this);
              const pickBest = function (equipments) {
                return vue.pickMax(enumerateItems(equipments, chr), a => this.prepassSkill(a))[1];
              }.bind(this);

              // 補正なしだと装備の影響が強すぎるので、適当に減衰係数を用意…
              const itemRate = 0.5;
              score += pickBest(weapons) * itemRate;
              score += pickBest(armors) * itemRate;
              score += pickBest(helmets) * itemRate;
              score += pickBest(accessories) * itemRate;
            }

            // 無価値なら以降 isAvailable() で速やかに弾く
            if (score == 0)
              this.markAsUsed(chr);
            return score;
          },

          pickCandidates(chrs, num) {
            chrs = chrs.filter(a => this.isAvailable(a));
            let tmp = chrs.map(a => [this.prepassChr(a), a]).filter(a => a[0] > 0).sort((a, b) => vue.compare(a[0], b[0])).slice(0, num);
            let r = tmp.map(a => a[1]);
            for (let p of vue.prioritized) {
              if (this.isAvailable(p) && chrs.includes(p) && !r.includes(p)) {
                r.splice(0, 0, p);
                break;
              }
            }
            return r;
          },

        };
        return ctx;
      }.bind(this);

      const getChrScore = function (parentCtx, chr) {
        if (!parentCtx.isAvailable(chr))
          return null;

        let cctx = createContext(parentCtx);
        let usedEffects = [];
        let conflictedEffects = [];

        const getSkillScore = function (ctx, skill) {
          let r = {
            skill: skill,
            score: 0,
            usedEffects: [],
            conflictedEffects: [],
          };
          if (!ctx.isAvailable(skill, chr) || !skillCondition(skill)) {
            return r;
          }

          let scoreBoost = 1;
          for (const effect of this.enumerateEffects(skill)) {
            const ev = ctx.getEffectValue(effect);
            if (!ev)
              continue;
            const [val, p, hitLimit] = ev;

            let score = val * (p.weight * 0.1) * scoreBoost;
            if (score > 0) {
              if (!hitLimit && skill.isActive)
                score *= Math.pow(Math.min(val / 20, 1), 2); // 中途半端な効果量のアクティブは選ばれにくいようにスコア補正
              r.score += score;
              r.usedEffects.push(effect);
            }
            else {
              r.conflictedEffects.push(effect);
            }
          }

          if (skill.summon) {
            let sctx = createContext(ctx);
            let sch = skill.summon[0];
            r.summon = {
              character: sch,
              skills: [],
            };
            for (const s of [sch.talent, ...sch.skills]) {
              const sr = getSkillScore(sctx, s);
              if (sr.score > 0) {
                r.score += sr.score;
                r.usedEffects = r.usedEffects.concat(sr.usedEffects);
                r.conflictedEffects = r.conflictedEffects.concat(sr.conflictedEffects);
                r.summon.skills.push(s);
                sctx.acceptEffects(sr.usedEffects);
              }
            }
          }
          return r;
        }.bind(this);

        const pickEquip = function (ctx, equipments) {
          const scoreList = equipments.filter(a => this.matchClass(a, chr)).map(a => getSkillScore(ctx, a));
          for (const s of scoreList)
            if (s.score > 0 && ctx.isPrioritized(s.skill, chr))
              return s;

          scoreList.sort(compareScore);
          if (scoreList.length > 0 && scoreList[0].score > 0)
            return scoreList[0];
          return null;
        }.bind(this);

        const pickSkill = function (ctx, skills) {
          let scoreList = [];
          for (const skill of skills) {
            const r = getSkillScore(ctx, skill);
            if (r.score > 0) {
              if (ctx.isPrioritized(skill, chr))
                return r;
              scoreList.push(r);
            }
          }
          if (scoreList.length == 0)
            return null;

          let r = scoreList.sort(compareScore)[0];
          return r;
        }.bind(this);


        let result = { character: chr };
        let score = 0;
        let skillsScore = [];
        let equipmentsScore = null;
        let summonScore = null;
        let supportScore = null;

        const updateState = function (s) {
          score += s.score;
          usedEffects = usedEffects.concat(s.usedEffects);
          conflictedEffects = conflictedEffects.concat(s.conflictedEffects);
          cctx.acceptEffects(s.usedEffects);
        };

        if (chr.isMain) {
          equipmentsScore = [];
          for (let equips of [weapons, armors, helmets, accessories]) {
            let r = pickEquip(cctx, equips);
            if (r) {
              equipmentsScore.push(r);
              updateState(r);
            }
          }
          result.scoreMainItem = score;
        }

        if (chr.talent) {
          let r = getSkillScore(cctx, chr.talent);
          if (r.score > 0) {
            skillsScore.push(r);
            updateState(r);
          }
        }
        if (chr.skills) {
          let tmpSkills = [...chr.skills];
          let activeCount = 0;
          for (let i = 0; i < 3; ++i) {
            if (activeCount >= opt.maxActiveCount) {
              break;
            }
            let r = pickSkill(cctx, tmpSkills);
            if (!r) {
              break;
            }

            tmpSkills.splice(tmpSkills.indexOf(r.skill), 1);
            skillsScore.push(r);
            updateState(r);
            if (r.summon) {
              summonScore = r.summon;
            }
            if (chr.isMain && r.skill.isActive && !r.skill.multiAction) {
              ++activeCount;
            }
          }
        }

        if (chr.isMain) {
          result.scoreMainSkill = score - result.scoreMainItem;
          result.scoreMain = score;
        }

        result.score = score;
        result.skills = skillsScore.map(a => a.skill);
        if (equipmentsScore)
          result.equipments = equipmentsScore.map(a => a.skill);
        if (summonScore)
          result.summon = summonScore;
        if (supportScore)
          result.support = supportScore;
        result.usedEffects = usedEffects;
        result.conflictedEffects = conflictedEffects;
        return result;
      }.bind(this);


      let bestScore = 0;
      let bestSkillCount = 0;
      let bestResult = [];
      let searchCount = 0;
      const updateBest = function (r, depth, resultGetter) {
        ++searchCount;

        let update = r.score > bestScore;
        if (r.score == bestScore) {
          if (depth < bestResult.length) {
            update = true;
          }
          else if (depth == bestResult.length) {
            if (r.skillCount < bestSkillCount) {
              update = true;
            }
          }
        }

        if (update) {
          bestScore = r.score;
          bestSkillCount = r.skillCount;
          bestResult = resultGetter();
          //console.log(r.score, r.skillCount, bestResult);
        }
      };

      const searchRecursive = function (pctx, results, stack = [], depth = 0) {
        const mainPickCounts = [5, 4, 3, 3, 2, 2, 2, 2, 2, 2];
        const supPickCounts = [2, 2, 1, 1, 1, 1, 1, 1, 1, 1];
        if (depth > mainPickCounts.length)
          return;
        let mainPickCount = mainPickCounts[depth];
        let supPickCount = supPickCounts[depth];

        // サポートを先に処理
        let sups = pctx.pickCandidates(supChrs, supPickCount);
        let supScores = sups.map(a => getChrScore(pctx, a)).filter(a => a && a.score > 0).sort(compareScore);
        let prioSup = findPrioritizedChr(supScores);
        if (prioSup) {
          supScores = [prioSup];
        }
        else if (supScores.length == 0) {
          supScores = [null];
        }

        for (let ss of supScores) {
          let sctx = createContext(pctx);
          let supportScore = 0;
          if (ss) {
            sctx.acceptEffects(ss.usedEffects);
            supportScore = ss.score;
          }

          let mains = sctx.pickCandidates(mainChrs, mainPickCount);
          let mainScores = mains.map(a => getChrScore(sctx, a)).filter(a => a).sort(compareScore);
          if (mainScores.length == 0 || supportScore + mainScores[0].score == 0)
            return;
          let prioMain = findPrioritizedChr(mainScores);
          if (prioMain) {
            mainScores = [prioMain];
          }

          for (let ms of mainScores) {
            let mctx = createContext(sctx);
            let pr = stack.length ? stack[stack.length - 1] : null;
            let r = {
              score: pr ? pr.score : 0,
              skillCount: pr ? pr.skillCount : 0,
              usedEffects: [],
              conflictedEffects: [],
              children: [],
            };
            results.push(r);

            const updateState = function (s) {
              r.score += s.score;
              r.skillCount += s.skills.length;
              if (s.equipments)
                r.skillCount += s.equipments.length;
              if (s.usedEffects.length)
                r.usedEffects.splice(r.usedEffects.length, 0, ...s.usedEffects);
              if (s.conflictedEffects.length)
                r.conflictedEffects.splice(r.conflictedEffects.length, 0, ...s.conflictedEffects);
            };
            if (ss) {
              updateState(ss);
              r.support = ss;
            }
            {
              updateState(ms);
              mctx.acceptEffects(ms.usedEffects);
              r.main = ms;
              if (ms.summon)
                r.summon = ms.summon;
            }
            for (let v of [r.main, r.summon, r.support]) {
              if (v) {
                mctx.markAsUsed(v.character);
                for (const s of this.enumerate(v.skills, v.equipments)) {
                  mctx.markAsUsed(s);
                }
              }
            }

            if (depth + 1 < num) {
              let cstack = [...stack, r];
              searchRecursive(mctx, r.children, cstack, depth + 1);

              if (r.children.length == 0)
                updateBest(r, depth + 1, () => cstack);
            }
            else {
              updateBest(r, depth + 1, () => [...stack, r]);
            }
          }
        }

      }.bind(this);

      let ctx = createContext();
      let results = [];
      searchRecursive(ctx, results);

      return bestResult;
    },

    beginSearch() {
      this.progress.completed = false;

      const body = function () {
        this.progress.result = this.doSearch(this.options.maxPickup.value);
        this.progress.completed = true;
      }.bind(this);
      //requestIdleCallback(body);
      setTimeout(body, 500);
    },

    updateQuery() {
      this.beginSearch();
    },

    onCopyUrl() {
      const url = this.getParamsUrl();
      this.copyToClipboard(url);
      this.toast(`コピーしました`);
    },

    enableBuf(label) {
      for (let e of this.buffs) {
        if (e.label == label) {
          e.enabled = true;
          break;
        }
      }
    },
    enableDebuf(label) {
      for (let e of this.debuffs) {
        if (e.label == label) {
          e.enabled = true;
          break;
        }
      }
    },

    presetAll() {
      for (let e of this.buffs) {
        e.enabled = true;
      }
      for (let e of this.debuffs) {
        e.enabled = true;
      }
    },
    presetPAtk() {
      for (const l of ["アタック", "クリティカルダメージ倍率", "与ダメージ", "与ダメージ(物理)", "与ダメージ(スキル)", "与ダメージ(範囲スキル)", "与ダメージ(通常攻撃)"]) {
        this.enableBuf(l);
      }
      for (const l of ["ダメージ耐性", "ダメージ耐性(物理)"]) {
        this.enableDebuf(l);
      }
    },
    presetMAtk() {
      for (const l of ["マジック", "クリティカルダメージ倍率", "与ダメージ", "与ダメージ(魔法)", "与ダメージ(スキル)", "与ダメージ(範囲スキル)"]) {
        this.enableBuf(l);
      }
      for (const l of ["ダメージ耐性", "ダメージ耐性(魔法)"]) {
        this.enableDebuf(l);
      }
    },
    presetPDef() {
      for (const l of ["ディフェンス", "ダメージ耐性", "ダメージ耐性(物理)"]) {
        this.enableBuf(l);
      }
      for (const l of ["アタック", "与ダメージ"]) {
        this.enableDebuf(l);
      }
    },
    presetMDef() {
      for (const l of ["レジスト", "ダメージ耐性", "ダメージ耐性(魔法)"]) {
        this.enableBuf(l);
      }
      for (const l of ["マジック", "与ダメージ"]) {
        this.enableDebuf(l);
      }
    },
  },

  computed: {
    optionValues() {
      const opt = this.options;
      let r = {};
      for (const k in opt)
        r[k] = opt[k].value;
      return r;
    },
    enabledEffects() {
      return [...this.buffs.filter(a => a.enabled), ...this.debuffs.filter(a => a.enabled)];
    },
  },
}
</script>

<style scoped src="./lookup.css">
</style>
