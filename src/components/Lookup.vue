<template>
  <div class="root" @mousemove="onMouseMove">
    <div class="header" :class="{ 'hidden': !showHeader }">
      <Navigation />
    </div>
    <div class="about" style="margin-top: 55px;">

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
                <b-button-group size="sm" id="class_selector">
                  <b-button v-for="(c, i) in filter.class" :key="i" :pressed.sync="c.state" variant="outline-secondary">
                    <b-img-lazy :src="getImageURL(classes[i])" width="20px" />
                  </b-button>
                </b-button-group>
              </div>
            </div>
            <div class="menu-widgets flex">
              <div class="widget">
                <b-button-group size="sm" id="symbol_selector">
                  <b-button v-for="(c, i) in filter.symbol" :key="i" :pressed.sync="c.state" variant="outline-secondary">
                    <b-img-lazy :src="getImageURL(symbols[i])" width="20px" />
                  </b-button>
                </b-button-group>
              </div>
              <div class="widget">
                <b-button-group size="sm" id="rareiry_selector">
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
                <b-button size="sm" id="copy-url" @click="copyToClipboard(getParamsUrl())">パラメータを URL としてコピー</b-button>
                <b-popover target="copy-url" triggers="click blur" placement="top" custom-class="url-popover">
                  コピーしました：<br />{{ getParamsUrl() }}
                </b-popover>
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
                <b-form-input v-if="!r.item.parent" style="width: 4.5em" v-model.number="r.item.limit_" size="sm" type="number" class="input-param" step="10" lazy placeholder="無制限"></b-form-input>
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
                <b-form-input v-if="!r.item.parent" style="width: 4.5em" v-model.number="r.item.limit_" size="sm" type="number" class="input-param" step="10" lazy placeholder="無制限"></b-form-input>
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
                  <b-button size="sm" id="add-prioritized">追加</b-button>
                  <b-button size="sm" @click="prioritized=[]" style="margin-left: 5px">クリア</b-button>
                  <ChrSelector target="add-prioritized" :chrs="mainChrs" @click="addPrioritized" classfilter symbolfilter />
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
                  <b-button size="sm" id="add-excluded">追加</b-button>
                  <b-button size="sm" @click="excluded=[]" style="margin-left: 5px">クリア</b-button>
                  <ChrSelector target="add-excluded" :chrs="mainChrs" @click="addExcluded" classfilter symbolfilter />
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
    </div>


    <div v-if="progress.result.length != 0" class="content">
      <div class="total-params">
        <div class="flex info">
          <div v-if="!progress.completed" style="margin-right: 5px">
            <b-spinner small label="Spinning"></b-spinner>
          </div>
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
          <h5 style="margin-bottom: 5px">バフ・デバフ組み合わせ検索</h5>
          指定のバフ・デバフの最適な組み合わせを探すツールです。<br />
          メインキャラ(スキル×装備)×サポート の組み合わせから、競合を考慮しつつ、総効果量の高いものを探索します。<br />
          例えば「与ダメージバフ＋クリティカルダメージ倍率バフ＋ダメージ耐性デバフ」のいい感じの組み合わせを探したい、というようなケースで役立ちます。<br />
          <br />
          味方全体の強化の最適化が目的であるため、自己バフは考慮しません。単体のバフも「<b-link @mouseenter="highlight('cb-p-allowSingleUnitBuff', true)" @mouseleave="highlight('cb-p-allowSingleUnitBuff', false)">単体バフを含める</b-link>」にチェックしていない限り考慮しません。<br />
          特定のキャラやスキルを除外or優先採用したい場合、アイコンをマウスオーバーすると出てくるポップアップから可能です。<br />
          特定の効果を優先したい場合は優先度を高めると優先的に選択されます。<br />
          <br />
          なお、必ずしも本当に最適な結果になるとは限らないことに注意が必要です。<br />
          完璧に解くには時間がかかりすぎるため、若干正確性を犠牲にしつつ高速に解く方法を用いています。<br />
          (アルゴリズムは随時改良中: 2023/12/06)<br />
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
                        <div v-if="skill.skillType!='タレント'">
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
              <b-img-lazy :src="getImageURL(r.summon.character.icon)" :title="`${r.summon.character.name} (召喚ユニット)`" :id="'portrait_m_'+ri" width="100" rounded />
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
                        <div v-if="skill.skillType!='タレント'">
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

  </div>
</template>

<script>
import Navigation from './Navigation.vue'
import ChrSelector from './parts/ChrSelector.vue'
import jsonMainActive from '../assets/main_active.json'
import jsonMainPassive from '../assets/main_passive.json'
import jsonMainTalents from '../assets/main_talents.json'
import jsonMainChrs from '../assets/main_characters.json'
import jsonSupportActive from '../assets/support_active.json'
import jsonSupportPassive from '../assets/support_passive.json'
import jsonSupportChrs from '../assets/support_characters.json'
import jsonItems from '../assets/items.json'
import jsonConstants from '../assets/constants.json'
import common from "./common";

export default {
  name: 'Lookup',
  components: {
    Navigation,
    ChrSelector,
  },
  mixins: [common],

  data() {
    return {
      classes: jsonConstants.classes,
      symbols: jsonConstants.symbols,
      damageTypes: jsonConstants.damageTypes,
      rarities: jsonConstants.rarities,

      filter: {
        class: [],
        symbol: [],
        rarity: [],
      },
      pickFilter: {
        class: [],
        symbol: [],
      },


      options: [],
      buffs: [],
      debuffs: [],
      excluded: [],
      prioritized: [],

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

      progress: {
        completed: true,
        pending: false,
        result: [],
      },
    };
  },

  created() {
    this.mainActive = structuredClone(jsonMainActive);
    this.mainPassive = structuredClone(jsonMainPassive);
    this.mainTalents = structuredClone(jsonMainTalents);
    this.mainChrs = structuredClone(jsonMainChrs).filter(a => !a.hidden);

    this.supActive = structuredClone(jsonSupportActive);
    this.supPassive = structuredClone(jsonSupportPassive);
    this.supChrs = structuredClone(jsonSupportChrs).filter(a => !a.hidden);

    this.items = structuredClone(jsonItems).filter(a => !a.hidden || a.slot == "アミュレット");
    this.weapons = this.items.filter(a => a.slot == "武器");
    this.armors = this.items.filter(a => a.slot == "鎧");
    this.helmets = this.items.filter(a => a.slot == "兜");
    this.accessories = this.items.filter(a => a.slot == "アクセサリ");

    this.setupCharacters(this.mainChrs, this.mainActive, this.mainPassive, this.mainTalents);
    this.setupCharacters(this.supChrs, this.supActive, this.supPassive);
    this.setupItems(this.items);

    for (let s of this.mainActive) {
      if (this.matchTags(s.tags, /^再行動$/))
        s.hasReaction = true;
      if (this.matchTags(s.tags, /^シンボルスキル$/))
        s.isSymbolSkill = true;
    }

    let idx = 0;
    const setId = function (list, prefix) {
      for (let i = 0; i < list.length; ++i) {
        let obj = list[i];
        obj.index = i + 1;
        obj.id = `${prefix}${i + 1}`;
        obj.index = ++idx;
      }
    };
    setId(this.mainChrs, "m");
    setId(this.mainActive, "ma");
    setId(this.mainPassive, "mp");
    setId(this.mainTalents, "mt");
    setId(this.supChrs, "s");
    setId(this.supActive, "sa");
    setId(this.supPassive, "sp");
    setId(this.items, "i");
    this.itemCount = idx;

    this.searchTable = new Map();
    for (let s of this.enumerate(this.mainChrs, this.mainActive, this.mainPassive, this.mainTalents, this.supChrs, this.supActive, this.supPassive, this.items))
      this.searchTable.set(s.id, s);

    const setupPropIndex = function (obj, typeName) {
      if (typeName == "メイン")
        obj.isMain = true;
      else if (typeName == "サポート")
        obj.isSupport = true;
      else if (typeName == "アイテム")
        obj.isItem = true;
    }.bind(this);
    for (let chr of this.mainChrs) {
      setupPropIndex(chr, "メイン");
    }
    for (let chr of this.supChrs) {
      setupPropIndex(chr, "サポート");
    }
    for (let item of this.items) {
      setupPropIndex(item, "アイテム");
      item.status = this.getItemStatus(item);
    }

    let valueTypeIndex = 0;
    let valueTypeTable = new Map();
    let slotIndex = 0;
    let slotTable = new Map();
    const setupSkill = function(skill) {
      for (let v of this.enumerateEffects(skill)) {
        let valueType = v.type;
        if (v.isBuff)
          valueType += "+";
        else if (v.isDebuff)
          valueType += "-";
        v.valueType = valueType;

        if (v.target == "自身")
          v.isSelfTarget = true;
        if (v.target == "単体")
          v.isSingleTarget = true;

        v.valueTypeIndex = valueTypeTable.get(valueType);
        if (!v.valueTypeIndex) {
          valueTypeTable.set(valueType, valueTypeIndex);
          v.valueTypeIndex = valueTypeIndex++;
        }

        if (skill.isActive) {
          let slot = v.slot;
          if (!slot) {
            slot = v.type;
            if (v.isBuff)
              slot += "+";
            else if (v.isDebuff)
              slot += "-";
            if (skill.isMainSkill)
              slot += "(メイン)";
            else if (skill.isSupportSkill)
              slot += "(サポート)";
            if (v.onBattle)
              slot += "(戦闘時)";
            v.slot = slot;
          }
          v.slotIndex = slotTable.get(slot);
          if (!v.slotIndex) {
            slotTable.set(slot, slotIndex);
            v.slotIndex = slotIndex++;
          }
        }
      }
    }.bind(this);
    for (let v of this.enumerate(this.mainActive, this.mainPassive, this.mainTalents, this.supActive, this.supPassive, this.items)) {
      setupSkill(v);
    }
    this.valueTypeIndex = valueTypeIndex;
    this.valueTypeTable = valueTypeTable;
    this.slotIndex = slotIndex;
    this.slotTable = slotTable;


    this.mainChrs.sort((a, b) => b.date.localeCompare(a.date));
    this.supChrs.sort((a, b) => b.date.localeCompare(a.date));
    this.items.sort((a, b) => b.date.localeCompare(a.date));

    this.fillFilter(this.filter.class, this.classes);
    this.fillFilter(this.filter.symbol, this.symbols);
    this.fillFilter(this.filter.rarity, this.rarities);
    this.fillFilter(this.pickFilter.class, this.classes);
    this.fillFilter(this.pickFilter.symbol, this.symbols);

    for (let item of this.items) {
      let flags = 0;
      if (item.classes) {
        for (const c of item.classes)
          flags |= 1 << this.classes.findIndex(v => v == c);
      }
      else {
        flags = 0xffff;
      }
      item.classFlags = flags;
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
      { name: "allowEngageSkills", label: "エンゲージスキルを含める", value: true },
      { name: "allowOnBattle", label: "戦闘時発動効果を含める", value: true },
      { name: "allowProbability", label: "確率発動効果を含める", value: true },
      { name: "allowSingleUnitBuff", label: "単体バフを含める", value: false },
      { name: "allowSymbolSkill", label: "シンボルスキルを含める", value: false },
      { name: "allowSupportActive", label: "サポートのアクティブを含める", value: true },
    ]);

    const makeParams = function (effectType, types) {
      const make = function (t) {
        const l = t.limit ? t.limit : null;
        const w = t.weight ? t.weight : 10;
        const valueType = `${t.label}${effectType}`;
        return {
          label: t.label,
          enabled: false,
          limit_: l,
          weight: w,
          valueType: valueType,
          valueTypeIndex: valueTypeTable.get(valueType),

          get limit() {
            return this.parent ? this.parent.limit_ : this.limit_;
          },
          set limit(v) {
            if (this.parent)
              this.parent.limit_ = v;
            else
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
      //{label: "与ダメージ(単体スキル)"},
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

    const setParent = function (list, child, parent) {
      list.find(a => a.label == child).parent = list.find(a => a.label == parent);
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
    this.pushHistory();
    this.initialState = this.history[0];

    window.addEventListener('keydown', this.onKeyDown);
    this.parseParamsUrl(window.location.href);
  },
  destroyed() {
    window.removeEventListener('keydown', this.onKeyDown);
  },

  methods: {
    findItemById(id) {
      const r = this.searchTable.get(id);
      if (!r)
        console.log(`${id} not found`);
      return r;
    },

    getParamClass(param) {
      return param.disabled() ? "disabled" : "";
    },
    getSkillClass(skill) {
      return {
        active: skill.isActive,
        passive: skill.isPassive,
      }
    },
    effectsToHtml(skill, ctx) {
      let lines = [];
      for (const v of this.enumerate(skill.buff, skill.debuff)) {
        if (["ランダム", "クラス", "シンボル"].includes(v.type) ||
          ["自身"].includes(v.target)) {
          continue
        }

        let additionalClass = "";
        let prefix = v.isDebuff ? "-" : "+";
        let onBattle = v.onBattle ? "(戦闘時)" : "";
        let unit = "";
        let title = "";
        if (ctx.usedEffects.includes(v)) {
          additionalClass += " caution";
        }
        if (ctx.conflictedEffects.includes(v)) {
          additionalClass += " blue";
          title = "アクティブ同士で競合、または既に上限に達している";
        }
        if (!["移動", "射程", "範囲"].includes(v.type)) {
          unit = "%";
        }
        lines.push(`<div class="effect-box"><span class="effect ${additionalClass}" title="${title}">${v.type}${onBattle}${prefix}${this.getEffectValue(v)}${unit}</span></div>`);
      }
      return lines.length ? `<div class="effect-group">${lines.join("")}</div>` : "";
    },
    highlight(id, enabled) {
      var element = document.getElementById(id);
      if(enabled)
        element.classList.add("param-highlighted");
      else
        element.classList.remove("param-highlighted");
    },

    addPriorityItem(list, item, owner) {
      const cb = owner ?
        a => a.owner == owner && a.item == item :
        a => a == item;
      let i = list.findIndex(cb);
      if (i >= 0)
        list.splice(i, 1);

      list.splice(0, 0, owner ? { item: item, owner: owner } : item);
    },
    isInPrioritizeList(list, item, owner = null) {
      if (list.includes(item))
        return true;
      else if (owner)
        return list.find(a => a.owner == owner && a.item == item) != null;
      return false;
    },
    addExcluded(item, owner = null) {
      this.addPriorityItem(this.excluded, item, owner);
    },
    removeExcluded(item) {
      this.excluded.splice(this.excluded.indexOf(item), 1);
    },
    addPrioritized(item, owner = null) {
      this.addPriorityItem(this.prioritized, item, owner);
    },
    removePrioritized(item) {
      this.prioritized.splice(this.prioritized.indexOf(item), 1);
    },

    createUsedFlags(parent = null) {
      if (parent) {
        return new Uint32Array(parent);
      }
      else {
        const n = (this.itemCount >> 5) + (this.itemCount & 31 ? 1 : 0);
        return new Uint32Array(n);
      }
    },
    setFlag(list, n, value) {
      const byte = n >> 5;
      const bit = n & 31;
      if (value)
        list[byte] |= 1 << bit;
      else
        list[byte] &= ~(1 << bit);
    },
    getFlag(list, n) {
      const byte = n >> 5;
      const bit = n & 31;
      return (list[byte] & (1 << bit)) != 0;
    },

    filterMatchMainChr(chr, filter = this.filter) {
      return (!filter.class || this.filterMatch(filter.class, chr.classId)) &&
        (!filter.symbol || this.filterMatch(filter.symbol, chr.symbolId)) &&
        (!filter.rarity || this.filterMatch(filter.rarity, chr.rarityId));
    },
    filterMatchSupChr(chr, filter = this.filter) {
      // チャレンジクエストはサポートのクラスは無制限なので、クラスフィルタは考慮しない
      return (!filter.rarity || this.filterMatch(filter.rarity, chr.rarityId));
    },

    matchClass(item, chr) {
      return (item.classFlags & (1 << chr.classId)) != 0;
    },
    compare(a, b) {
      return a == b ? 0 : a < b ? 1 : -1;
    },

    getEffectValue(effect) {
      let r = effect.value;
      if (effect.maxStack)
        r *= effect.maxStack;
      return r;
    },

    getEffectValues(effectList, dst = null) {
      if (!dst) {
        dst = new Array(this.valueTypeIndex);
        dst.fill(0);
      }
      for (const e of effectList)
        dst[e.valueTypeIndex] += this.getEffectValue(e);
      return dst;
    },
    effectParamsToHtml(data) {
      let lines = [];
      for (let e of this.enumerate(this.buffs, this.debuffs)) {
        let i = e.valueTypeIndex;
        let v = data[i];
        if (v) {
          if (e.limit)
            v = Math.min(v, e.limit);
          lines.push(`<div class="effect-box"><span class="effect caution">${e.valueType}${v}%</span></div>`);
        }
      }
      return lines;
    },
    chrEffectsToHtml(rec) {
      const data = this.getEffectValues(rec.usedEffects);
      return this.effectParamsToHtml(data);
    },
    allEffectsToHtml(recs) {
      let data = null;
      for (let r of recs)
        data = this.getEffectValues(r.usedEffects, data);
      return this.effectParamsToHtml(data);
    },

    *enumerate(...arrays) {
      for (let array of arrays) {
        if (array)
          yield* array;
      }
    },

    *enumerateEffects(skill) {
      yield* this.enumerate(skill.buff, skill.debuff);
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
      let targets = new Array(this.valueTypeIndex);
      for (let v of this.enabledEffects) {
        targets[v.valueTypeIndex] = {
          limit: v.limit,
          weight: v.weight,
          valueTypeIndex: v.valueTypeIndex,
        };
      }
      const excluded = [...this.excluded];
      const prioritized = [...this.prioritized];
      const isExcluded = function (item, owner = null) {
        return this.isInPrioritizeList(excluded, item, owner);
      }.bind(this);
      const isPrioritized = function (item, owner = null) {
        return this.isInPrioritizeList(prioritized, item, owner);
      }.bind(this);

      const compareScore = function (a, b) {
        if (a.score == b.score && a.scoreMain)
          return this.compare(a.scoreMain, b.scoreMain);
        else
          return this.compare(a.score, b.score);
      }.bind(this);

      const effectCondition = function (effect) {
        if (effect.onBattle && !effect.duration)
          return false;

        const cond = effect.condition;
        const onBattle = (cond ? cond.onBattle : effect.onBattle) && !effect.duration;
        const probability = cond ? cond.probability : effect.probability;
        if (effect.isDebuff) {
          return (opt.allowOnBattle || !onBattle) &&
            (opt.allowProbability || !probability);
        }
        else {
          return (!effect.isSelfTarget) &&
            (opt.allowSingleUnitBuff || !effect.isSingleTarget) &&
            (opt.allowOnBattle || !onBattle) &&
            (opt.allowProbability || !probability);
        }
      };
      const skillCondition = function (skill) {
        if (!opt.allowSymbolSkill && skill.isSymbolSkill)
          return false;
        if (!opt.allowSupportActive && skill.isActive && skill.isSupportSkill)
          return false;
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
              let p = targets[v.valueTypeIndex];
              if (p && effectCondition(v))
                return true;
            }
          }
        }
        else {
          for (const v of this.enumerateEffects(item)) {
            let p = targets[v.valueTypeIndex];
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
          chr.skills = opt.allowEngageSkills ? chr.engage.skills : chr.skillsBase;
        }
      }

      const createContext = function (parent = null) {
        let vue = this;
        let ctx = {
          totalAmount: new Int32Array(parent ? parent.totalAmount : vue.valueTypeIndex),
          usedSlots: parent ? [...parent.usedSlots] : new Array(vue.slotIndex),
          usedSkills: this.createUsedFlags(parent ? parent.usedSkills : null),

          isPrioritized: isPrioritized,
          isAvailable: function (item, owner = null) {
            return !vue.getFlag(this.usedSkills, item.index) && !isExcluded(item, owner);
          },
          markAsUsed: function (item) {
            if (item.index)
              vue.setFlag(this.usedSkills, item.index, true);
          },

          getEffectValue(effect) {
            let p = targets[effect.valueTypeIndex];
            if (p && effectCondition(effect)) {
              if (effect.slotIndex && this.usedSlots[effect.slotIndex])
                return [0, p, true];

              const current = this.totalAmount[p.valueTypeIndex];
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
              this.totalAmount[effect.valueTypeIndex] += vue.getEffectValue(effect);
              if (effect.slotIndex)
                this.usedSlots[effect.slotIndex] = effect;
            }
          },

          prepassSkill(skill, owner = null) {
            if (!skill || !this.isAvailable(skill, owner) || !skillCondition(skill))
              return 0;
            let score = 0;
            for (const v of vue.enumerateEffects(skill)) {
              let p = this.getEffectValue(v);
              if (p)
                score += p[0] * (p[1].weight * 0.1);
            }
            if (skill.summon) {
              let sch = skill.summon[0];
              for (const s of [sch.talent, ...sch.skills])
                score += this.prepassSkill(s);
            }
            // 無価値なら以降 isAvailable() で速やかに弾く
            if (score == 0)
              this.markAsUsed(skill);
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
                  if (!vue.getFlag(this.usedSkills, item.index) && item.classFlags & (1 << chr.classId)) {
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
          if (!ctx.isAvailable(skill, chr) || !skillCondition(skill))
            return 0;

          let r = {
            skill: skill,
            score: 0,
            usedEffects: [],
            conflictedEffects: [],
          };

          let scoreBoost = 1;
          if (skill.hasReaction) {
              // 再行動つきアクティブは優先的に選ぶ
              scoreBoost += 0.25;
          }
 
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

        const pickSkill = function (ctx, skills, ignoreActive) {
          let scoreList = [];
          for (const skill of skills) {
            if (ignoreActive && skill.isActive && !skill.hasReaction)
              continue;

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
          let activeCount = false;
          for (let i = 0; i < 3; ++i) {
            let r = pickSkill(cctx, tmpSkills, activeCount >= opt.maxActiveCount);
            if (!r)
              break;

            tmpSkills.splice(tmpSkills.indexOf(r.skill), 1);
            skillsScore.push(r);
            updateState(r);
            if (r.summon)
              summonScore = r.summon;
            if (r.skill.isActive && !r.skill.hasReaction)
              ++activeCount;
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
                for (const s of this.enumerate(v.skills, v.equipments))
                  mctx.markAsUsed(s);
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
      //console.log(results);

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


    serializeParams() {
      const handleOptions = function (obj) {
        return Object.values(obj).map(a => a.value);
      };
      const handleFilter = function (obj) {
        return Object.values(obj).map(a => this.serializeFilter(a));
      }.bind(this);
      const handleBuffs = function (list) {
        let r = [];
        for (let v of list) {
          if (v.parent)
            r.push([v.enabled ? 1 : 0, v.weight]);
          else
            r.push([v.enabled ? 1 : 0, v.limit ? v.limit : 0, v.weight]);
        }
        return r;
      };
      const handleExcludes = function (list) {
        let r = [];
        for (let v of list) {
          if (v.owner != undefined)
            r.push([v.item.id, v.owner.id]);
          else
            r.push(v.id);
        }
        return r;
      };

      let r = {};
      r.options = handleOptions(this.options);
      r.filter = handleFilter(this.filter);
      r.buffs = handleBuffs(this.buffs);
      r.debuffs = handleBuffs(this.debuffs);
      r.excluded = handleExcludes(this.excluded);
      r.prioritized = handleExcludes(this.prioritized);
      return r;
    },
    deserializeParams(obj) {
      const handleOptions = function (dst, src) {
        dst = Object.values(dst);
        if (src && dst.length == src.length) {
          for (let i = 0; i < dst.length; ++i) {
            if (typeof dst[i].value == typeof src[i])
              dst[i].value = src[i];
          }
        }
      };
      const handleFilter = function (dst, src) {
        dst = Object.values(dst);
        if (src && dst.length == src.length) {
          for (let i = 0; i < dst.length; ++i) {
            this.deserializeFilter(dst[i], src[i]);
          }
        }
      }.bind(this);
      const handleBuffs = function (dst, src) {
        if (src && dst.length == src.length) {
          for (let i = 0; i < dst.length; ++i) {
            let d = dst[i];
            let s = src[i];
            if (d.parent && s.length == 2) {
              d.enabled = s[0] != 0;
              d.weight = s[1];
            }
            else if (s.length == 3) {
              d.enabled = s[0] != 0;
              d.limit = s[1] != 0 ? s[1] : null;
              d.weight = s[2];
            }
          }
        }
      };
      const handleExcludes = function (dst, src) {
        if (src) {
          dst.splice(0, dst.length);
          for (let v of src) {
            if (Array.isArray(v)) {
              let t = {
                item: this.findItemById(v[0]),
                owner: this.findItemById(v[1]),
              }
              if (t.item && t.owner)
                dst.push(t);
            }
            else {
              let t = this.findItemById(v);
              if (t)
                dst.push(t);
            }
          }
        }
        return dst;
      }.bind(this);

      handleOptions(this.options, obj.options);
      handleFilter(this.filter, obj.filter);
      handleBuffs(this.buffs, obj.buffs);
      handleBuffs(this.debuffs, obj.debuffs);
      handleExcludes(this.excluded, obj.excluded);
      handleExcludes(this.prioritized, obj.prioritized);
    },

    pushHistory() {
      let ret = false;
      const r = this.serializeParams();
      const l = this.history.length;
      if (l == 0 || !this.objectEqual(this.history[this.historyIndex], r)) {
        this.history.splice(this.historyIndex + 1, l);
        this.history.push(r);
        this.historyIndex = this.history.length - 1;
        //console.log(this.history);
        ret = true;
      }
      return ret;
    },
    onKeyDown(e) {
      if (e.ctrlKey && e.key == "z") {
        this.undo();
      }
      else if (e.ctrlKey && e.key == "y") {
        this.redo();
      }
    },
    undo() {
      if (this.historyIndex > 0) {
        this.historyIndex--;
        this.deserializeParams(this.history[this.historyIndex]);
        this.beginSearch();
      }
    },
    redo() {
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
        this.deserializeParams(this.history[this.historyIndex]);
        this.beginSearch();
      }
    },

    getParamsUrl() {
      const base = this.initialState;
      const r = this.serializeParams();

      let params = {};
      for (const k in base) {
        if (!this.objectEqual(base[k], r[k])) {
          params[k] = r[k];
        }
      }

      let url = window.location.href.replace(/\?.+/, '').replace(/#.+/, '');
      url += "?p=" + encodeURIComponent(JSON.stringify(params));
      //console.log(url);
      //this.parseParamsUrl(url);
      return url;
    },
    parseParamsUrl(url) {
      let params = {};

      url = decodeURIComponent(url);
      let q = url.match(/\?p=(.+)$/);
      if (q) {
        params = JSON.parse(q[1]);
        this.deserializeParams(params);
        this.pushHistory();
        this.beginSearch();
      }
    },

  },

  computed: {
    mainChrPick() {
      return this.mainChrs.filter(a => this.filterMatchMainChr(a, this.pickFilter));
    },

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

  updated: function () {

    if (this.pushHistory()) {
      this.progress.pending = true;
    }
    if (this.progress.pending && this.progress.completed) {
      this.progress.pending = false;
      this.beginSearch();
    }
  },

}
</script>

<style scoped>
  div.about {
  }

  .about h2 {
    font-size: 1.75em;
    margin-left: 1em;
  }
  .about h3 {
    font-size: 1.5em;
    margin-left: 1em;
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
    color: rgb(150, 150, 150);
  }

  label.disabled {
    color: rgb(180, 180, 180);
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

  div.total-params {
    padding: 3px;
    margin: 5px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 0.3rem;
    background: rgb(245, 245, 245);
    flex-grow: initial;
    box-shadow: 0 3px 6px rgba(140,149,159,0.5);
  }
  div.character {
    padding: 3px;
    margin: 5px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 0.3rem;
    background: rgb(245, 245, 245);
    flex-grow: initial;
    box-shadow: 0 3px 6px rgba(140,149,159,0.5);
  }

  label {
    margin: 0.2rem 0 !important;
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
    padding: 1px;
    vertical-align: middle;
  }

  input::placeholder {
    color: rgb(190, 190, 190) !important;
    font-size: small !important;
  }

  .param-highlighted {
    background-color: rgb(255, 190, 190) !important;
  }

  .effect-group {
    display: flex;
    flex-wrap: wrap;
    margin-top: 5px;
  }

  .effect-box {
    margin: 1px 2px;
    padding: 0px 2px;
    min-height: 21px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 0.3rem;
    background: white;
    display: flex;
    align-items: center;
    white-space: nowrap;
    font-size: 75%;
  }

  .exclude-menu {
    margin-top: 5px;
  }
  .exclude-menu .btn {
    margin-right: 4px;
  }
  .exclude-box {
    flex-wrap: wrap;
    align-items: flex-start;
    align-content: flex-start;
    width: 275px;
    min-height: 150px;
    max-height: 200px;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .button-box {
    display: flex;
  }
  .left-align {
    margin: 2px auto 2px 0px;
  }
  .right-align {
    margin: 2px 0px 2px auto;
  }

  .popover {
    max-width: 450px;
  }

</style>
