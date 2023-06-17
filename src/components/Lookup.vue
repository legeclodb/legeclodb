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
                    <b-form-checkbox v-if="r.item.type == 'boolean'" v-model="r.item.value" lazy></b-form-checkbox>
                    <b-form-input v-if="r.item.type == 'number'" style="width: 3em" v-model.number="r.item.value" size="sm" type="number" class="input-param" min="0" lazy></b-form-input>
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
                    <b-img-lazy :src="getImageURL('シンボル:'+symbols[i])" width="20px" />
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
                <b-form-checkbox v-model="r.item.enabled" lazy></b-form-checkbox>
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
                <b-form-checkbox v-model="r.item.enabled" lazy></b-form-checkbox>
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
                  <b-popover target="add-prioritized" triggers="click blur" :delay="{show:0, hide:250}" no-fade placement="bottom">
                    <div style="margin: 4px 0px">
                      <b-button-group size="sm" style="margin-right: 10px">
                        <b-button v-for="(c, i) in pickFilter.class" :key="i" :pressed.sync="c.state" variant="outline-secondary">
                          <b-img-lazy :src="getImageURL(classes[i])" width="20px" />
                        </b-button>
                      </b-button-group>
                      <b-button-group size="sm">
                        <b-button v-for="(c, i) in pickFilter.symbol" :key="i" :pressed.sync="c.state" variant="outline-secondary">
                          <b-img-lazy :src="getImageURL('シンボル:'+symbols[i])" width="20px" />
                        </b-button>
                      </b-button-group>
                    </div>
                    <div class="exclude-box" style="width: 425px; max-height: 250px">
                      <b-link v-for="(v, i) in mainChrPick" :key="i" @click="addPrioritized(v)">
                        <b-img-lazy :src="getImageURL(v.name)" :title="v.name" width="50" />
                      </b-link>
                    </div>
                  </b-popover>
                  <b-button size="sm" @click="prioritized=[]" style="margin-left: 5px">クリア</b-button>
                </div>
              </div>
              <div class="flex exclude-box">
                <b-link v-for="(v, i) in prioritized" :key="i" @click="prioritized.splice(prioritized.indexOf(v), 1)">
                  <div v-if="!v.owner" :title="v.name">
                    <b-img-lazy :src="getImageURL(v.name)" :title="v.name" width="50" />
                  </div>
                  <div v-if="v.owner" style="width: 50px; height: 50px;" :title="v.owner.name + ' & ' + v.item.name">
                    <b-img-lazy :src="getImageURL(v.owner.name)" :title="v.name" width="35" style="position: relative; left: 0px; top: 0px; " />
                    <b-img-lazy :src="getImageURL(v.item.name)" :title="v.name" width="35" style="position: relative; left: -20px; top: 15px; " />
                  </div>
                </b-link>
              </div>
            </div>
            <div>
              <div class="flex">
                <h3 style="margin: 5px 0px">除外リスト</h3>
                <div class="right-align">
                  <b-button size="sm" id="add-excluded">追加</b-button>
                  <b-popover target="add-excluded" triggers="click blur" :delay="{show:0, hide:250}" no-fade placement="bottom">
                    <div style="margin: 4px 0px">
                      <b-button-group size="sm" style="margin-right: 10px">
                        <b-button v-for="(c, i) in pickFilter.class" :key="i" :pressed.sync="c.state" variant="outline-secondary">
                          <b-img-lazy :src="getImageURL(classes[i])" width="20px" />
                        </b-button>
                      </b-button-group>
                      <b-button-group size="sm">
                        <b-button v-for="(c, i) in pickFilter.symbol" :key="i" :pressed.sync="c.state" variant="outline-secondary">
                          <b-img-lazy :src="getImageURL('シンボル:'+symbols[i])" width="20px" />
                        </b-button>
                      </b-button-group>
                    </div>
                    <div class="exclude-box" style="width: 425px; max-height: 250px">
                      <b-link v-for="(v, i) in mainChrPick" :key="i" @click="addExcluded(v)">
                        <b-img-lazy :src="getImageURL(v.name)" :title="v.name" width="50" />
                      </b-link>
                    </div>
                  </b-popover>
                  <b-button size="sm" @click="excluded=[]" style="margin-left: 5px">クリア</b-button>
                </div>
              </div>
              <div class="flex exclude-box">
                <b-link v-for="(v, i) in excluded" :key="i" @click="excluded.splice(excluded.indexOf(v), 1)">
                  <div v-if="!v.owner" :title="v.name">
                    <b-img-lazy :src="getImageURL(v.name)" :title="v.name" width="50" />
                  </div>
                  <div v-if="v.owner" style="width: 50px; height: 50px; " :title="v.owner.name + ' & ' + v.item.name">
                    <b-img-lazy :src="getImageURL(v.owner.name)" :title="v.name" width="35" style="position: relative; left: 0px; top: 0px; " />
                    <b-img-lazy :src="getImageURL(v.item.name)" :title="v.name" width="35" style="position: relative; left: -20px; top: 15px; " />
                  </div>
                </b-link>
              </div>
            </div>
          </b-container>
        </div>

      </div>
    </div>

    <div v-if="result.length != 0" class="content">
      <div class="total-params">
        <div class="flex info">
          <div><h6>全ユニット合計:</h6></div>
          <template v-for="(e, ei) in allEffectsToHtml(result)">
            <div :key="ei" v-html="e" />
          </template>
        </div>
      </div>
    </div>

    <div class="content" :style="style">
      <div v-if="result.length == 0" class="menu-panel" style="padding: 10px">
        <div class="about">
          <h5 style="margin-bottom: 5px">バフ・デバフ組み合わせ検索</h5>

          指定のバフ・デバフの最適な組み合わせを探すツールです。<br />
          メインキャラ(スキル×装備)×サポート の組み合わせから、競合を考慮しつつ、総効果量の高いものを探索します。<br />
          例えば「与ダメージバフ＋クリティカルダメージ倍率バフ＋ダメージ耐性デバフ」のいい感じの組み合わせを探したい、というようなケースで役立ちます。<br />
          <br />
          味方全体の強化の最適化が目的であるため、自己バフは考慮しません。単体のバフも「<b-link @mouseenter="highlight('cb-p-allowSingleUnitBuff', true)" @mouseleave="highlight('cb-p-allowSingleUnitBuff', false)">単体バフを含める</b-link>」にチェックしていない限り考慮しません。<br />
          特定のキャラやスキルを除外or優先採用したい場合、アイコンをマウスオーバーすると出てくるポップアップから可能です。<br />
          <br />
          なお、必ずしも本当に最適な結果になるとは限らないことに注意が必要です。<br />
          完璧に解くには時間がかかりすぎるため、若干正確性を犠牲にしつつ高速に解く方法 (貪欲法) を用いています。<br />
          また、発動に条件がある効果の条件を考慮していないため、現実的ではない結果が出ることもあります。除外や優先指定で調整してみてください。<br />
        </div>
      </div>

      <template v-for="(r, ri) in result">
        <div class="character" :key="ri">
          <div class="flex info">
            <div><h6>ユニット内合計:</h6></div>
            <template v-for="(e, ei) in chrEffectsToHtml(r)">
              <div :key="ei" v-html="e" />
            </template>
          </div>
          <div class="flex">
            <div v-if="r.main" class="portrait">
              <b-img-lazy :src="getImageURL(r.main.character.name)" :title="r.main.character.name" :id="'portrait_m_'+ri" width="100" rounded />
              <b-popover v-if="displayType>=1" :target="'portrait_m_'+ri" :title="r.main.character.name" triggers="hover click blur" :delay="{show:0, hide:250}" no-fade placement="top">
                <div class="status flex">
                  <b-img-lazy :src="getImageURL(r.main.character.class)" :title="'クラス:'+r.main.character.class" height="25" />
                  <b-img-lazy :src="getImageURL('シンボル:'+r.main.character.symbol)" :title="'シンボル:'+r.main.character.symbol" height="25" />
                  <b-img-lazy :src="getImageURL(r.main.character.rarity)" :title="'レアリティ:'+r.main.character.rarity" height="20" />
                  <div class="param-box"><b-img-lazy :src="getImageURL(r.main.character.damageType)" :title="'攻撃タイプ:'+r.main.character.damageType" width="20" height="20" /></div>
                  <div class="param-box"><b-img-lazy :src="getImageURL('射程')" title="射程" width="18" height="18" /><span>{{r.main.character.range}}</span></div>
                  <div class="param-box"><b-img-lazy :src="getImageURL('移動')" title="移動" width="18" height="18" /><span>{{r.main.character.move}}</span></div>
                  <div class="param-box"><span class="param-name">実装日:</span><span class="param-value">{{r.main.character.date}}</span></div>
                </div>
                <div class="status flex">
                  <b-link v-for="(skill, si) in r.main.character.skills" :key="si" @click="addPrioritized(skill)">
                    <b-img-lazy :src="getImageURL(skill.name)" :title="skill.name" width="50" />
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
                      <b-img-lazy :src="getImageURL(skill.name)" :title="skill.name" width="50" :id="'skill_m_'+ri+'_'+si" />
                      <b-popover :target="'skill_m_'+ri+'_'+si" :title="skill.name" triggers="hover click blur" :delay="{show:0, hide:250}" no-fade placement="top">
                        <div v-if="skill.owners" class="owners">
                          所持者:<br />
                          <b-link v-for="(owner, oi) in skill.owners" :key="oi" @click="addPrioritized(owner)">
                            <b-img-lazy :src="getImageURL(owner.name)" :title="owner.name" width="50" />
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
                <div class="skill" v-for="(skill, si) in r.main.equipments" :key="si">
                  <div class="flex">
                    <div class="icon">
                      <b-img-lazy :src="getImageURL(skill.name)" :title="skill.name" width="50" :id="'item_'+ri+'_'+si" />
                      <b-popover v-if="displayType>=1" :target="'item_'+ri+'_'+si" :title="skill.name" triggers="hover click blur" :delay="{show:0, hide:250}" no-fade placement="top">
                        <div class="flex exclude-menu">
                          <b-button size="sm" @click="addPrioritized(skill)">このアイテムを優先</b-button>
                          <b-button size="sm" @click="addPrioritized(skill, r.main.character)">このキャラとアイテムの組み合わせを優先</b-button>
                        </div>
                        <div class="flex exclude-menu">
                          <b-button size="sm" @click="addExcluded(skill)">このアイテムを除外</b-button>
                          <b-button size="sm" @click="addExcluded(skill, r.main.character)">このキャラとアイテムの組み合わせを除外</b-button>
                        </div>
                      </b-popover>
                    </div>
                    <div class="desc" v-show="displayType >= 2">
                      <div class="flex">
                        <h6><b-img-lazy :src="getImageURL(skill.slot)" :title="skill.name" width="18" />{{ skill.name }}</h6>
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
            <div v-if="r.summon" class="portrait">
              <b-img-lazy :src="getImageURL(r.summon.character.name)" :title="`${r.summon.character.name} (召喚ユニット)`" :id="'portrait_m_'+ri" width="100" rounded />
            </div>
            <div v-if="r.summon" class="detail" v-show="displayType >= 1">
              <div class="skills">
                <div class="skill" v-for="(skill, si) in r.summon.skills" :class="getSkillClass(skill)" :key="si">
                  <div class="flex">
                    <div class="icon">
                      <b-img-lazy :src="getImageURL(skill.name)" :title="skill.name" width="50" :id="'skill_x_'+ri+'_'+si" />
                      <b-popover :target="'skill_x_'+ri+'_'+si" :title="skill.name" triggers="hover click blur" :delay="{show:0, hide:250}" no-fade placement="top">
                        <div v-if="skill.owners" class="owners">
                          所持者:<br />
                          <b-link v-for="(owner, oi) in skill.owners" :key="oi" @click="addPrioritized(owner)">
                            <b-img-lazy :src="getImageURL(owner.name)" :title="owner.name" width="50" height="50" />
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
              <b-img-lazy :src="getImageURL(r.support.character.name)" :title="r.support.character.name" :id="'portrait_s_'+ri" width="100" height="100" rounded />
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
                      <b-img-lazy :src="getImageURL(skill.name)" :title="skill.name" with="50" height="50" :id="'skill_s_'+ri+'_'+si" />
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

<script>import Navigation from './Navigation.vue'
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
    for (let i of this.items)
      this.setupSkill(i);

    for (let s of this.mainActive) {
      if (this.matchTags(s.tags, /^再行動$/)) {
        s.hasReaction = true;
      }
    }

    const setId = function (list, prefix) {
      for (let i = 0; i < list.length; ++i) {
        let obj = list[i];
        obj.index = i + 1;
        obj.id = `${prefix}${i + 1}`;
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

    this.searchTable = new Map();
    for (let s of this.enumerate(this.mainChrs, this.mainActive, this.mainPassive, this.mainTalents, this.supChrs, this.supActive, this.supPassive, this.items))
      this.searchTable.set(s.id, s);

    const setupPropIndex = function (obj, typeName) {
      obj.objectType = typeName;
      if (obj.class)
        obj.classId = this.classes.findIndex(v => v == obj.class);
      if (obj.symbol)
        obj.symbolId = this.symbols.findIndex(v => v == obj.symbol);
      if (obj.rarity)
        obj.rarityId = this.rarities.findIndex(v => v == obj.rarity);
      if (obj.damageType)
        obj.damageTypeId = this.damageTypes.findIndex(v => v == obj.damageType);
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

    const setSlotActive = function (skill, ownerType) {
      skill.ownerType = ownerType;
      if (skill.buff) {
        for (let v of skill.buff) {
          v.valueType = `バフ:${v.type}`
          if (!v.slot)
            v.slot = `バフ:${ownerType}${v.onBattle ? ':戦闘時' : ''}:${v.type}`;
          else
            v.hasSpecialSlot = true;
        }
      }
      if (skill.debuff) {
        for (let v of skill.debuff) {
          v.valueType = `デバフ:${v.type}`
          if (!v.slot)
            v.slot = `デバフ${ownerType}${v.onBattle ? ':戦闘時' : ''}:${v.type}`;
          else
            v.hasSpecialSlot = true;
        }
      }
    };
    const setSlotPassive = function (skill, ownerType) {
      skill.ownerType = ownerType;
      if (skill.buff)
        for (let v of skill.buff)
          v.valueType = `バフ:${v.type}`
      if (skill.debuff)
        for (let v of skill.debuff)
          v.valueType = `デバフ:${v.type}`
    };
    const apply = function (array, func) {
      for (let v of array)
        func(v);
    };
    apply(this.mainActive, a => setSlotActive(a, "メイン"));
    apply(this.mainPassive, a => setSlotPassive(a, "メイン"));
    apply(this.mainTalents, a => setSlotPassive(a, "メイン"));
    apply(this.supActive, a => setSlotActive(a, "サポート"));
    apply(this.supPassive, a => setSlotPassive(a, "サポート"));
    apply(this.items, a => setSlotPassive(a, "アイテム"));

    this.mainChrs.sort((a, b) => b.date.localeCompare(a.date));
    this.supChrs.sort((a, b) => b.date.localeCompare(a.date));
    this.items.sort((a, b) => b.date.localeCompare(a.date));

    this.fillFilter(this.filter.class, this.classes);
    this.fillFilter(this.filter.symbol, this.symbols);
    this.fillFilter(this.filter.rarity, this.rarities);
    this.fillFilter(this.pickFilter.class, this.classes);
    this.fillFilter(this.pickFilter.symbol, this.symbols);
    
    const makeOptions = function (params) {
      let r = {};
      for(const p of params) {
        const v = p[2];
        r[p[0]] = {
          name: p[0],
          label: p[1],
          value: v,
          type: typeof (p[2]),

          reset: function () {
            this.value = v;
          }
        };
      }
      return r;
    };
    this.options = makeOptions([
      ["maxPickup", "人を選出", 10],
      ["maxNonReactiveActive", "アクティブ数制限 (再行動ありを除く)", 2],
      ["allowOnBattle", "戦闘時発動効果を含める", true],
      ["allowProbability", "確率発動効果を含める", true],
      ["allowSingleUnitBuff", "単体バフを含める", false],
      ["allowSymbolSkill", "シンボルスキルを含める", false],
      ["allowSupportActive", "サポートのアクティブを含める", true],
    ]);

    const makeParams = function (effectType, types) {
      const make = function (t) {
        const l = t.limit ? t.limit : null;
        const w = t.weight ? t.weight : 10;
        return {
          label: t.label,
          enabled: false,
          limit_: l,
          weight: w,
          effectType: effectType,
          valueType: `${effectType}:${t.label}`,

          get limit() {
            return this.parent ? this.parent.limit_ : this.limit_;
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

    this.buffs = makeParams("バフ", [
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
    this.debuffs = makeParams("デバフ", [
      {label: "アタック", limit:70},
      {label: "ディフェンス", limit:70},
      {label: "マジック", limit:70},
      {label: "レジスト", limit:70},
      {label: "与ダメージ", limit:70},
      {label: "ダメージ耐性"},
      {label: "ダメージ耐性(物理)"},
      {label: "ダメージ耐性(魔法)"},
    ]);
    this.excluded = [];

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
        active: skill.skillType == 'アクティブ',
        passive: skill.skillType == 'パッシブ',
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
        let prefix = v.effectType == "デバフ" ? "-" : "+";
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
    addExcluded(item, owner = null) {
      this.addPriorityItem(this.excluded, item, owner);
    },
    removeExcluded(item) {
      this.excluded.splice(this.excluded.indexOf(item), 1);
    },
    isExcluded(list, item, owner = null) {
      if (list.includes(item))
        return true;
      else if (owner)
        return list.find(a => a.owner == owner && a.item == item) != null;
      return false;
    },
    addPrioritized(item, owner = null) {
      this.addPriorityItem(this.prioritized, item, owner);
    },
    removePrioritized(item) {
      this.prioritized.splice(this.prioritized.indexOf(item), 1);
    },

    filterMatchMainChr(chr, filter = this.filter) {
      return (!filter.class || this.filterMatch(filter.class, chr.classId)) &&
        (!filter.symbol || this.filterMatch(filter.symbol, chr.symbolId)) &&
        (!filter.rarity || this.filterMatch(filter.rarity, chr.rarityId));
    },
    filterMatchSupChr(chr, filter = this.filter) {
      return (!filter.class || this.filterMatch(filter.class, chr.classId)) &&
        (!filter.rarity || this.filterMatch(filter.rarity, chr.rarityId));
    },

    matchClass(item, chr) {
      return item && (!item.classes || item.classes.includes(chr.class));
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

    getEffectValueList(effectList, total = null) {
      const doCount = function (dst) {
        for (const e of effectList)
          dst[e.effectType][e.type] += this.getEffectValue(e);
      }.bind(this);
      if (total) {
        doCount(total);
        return total;
      }
      else {
        let buff = {};
        let debuff = {};
        for (let v of this.buffs)
          buff[v.label] = 0;
        for (let v of this.debuffs)
          debuff[v.label] = 0;
        let r = {
          "バフ": buff,
          "デバフ": debuff,
        };
        doCount(r);
        return r;
      }
    },

    chrEffectsToHtml(rec) {
      const data = this.getEffectValueList(rec.main.usedEffects);

      let lines = [];
      for (const [effectType, records] of Object.entries(data)) {
        const prefix = effectType == "バフ" ? "+" : "-";
        for (const [buffType, value] of Object.entries(records).filter(a => a[1] > 0)) {
          lines.push(`<div class="effect-box"><span class="effect caution">${buffType}${prefix}${value}%</span></div>`);
        }
      }
      return lines;
    },
    allEffectsToHtml(recs) {
      let total = null;
      for (let r of recs) {
        total = this.getEffectValueList(r.main.usedEffects, total);
      }

      let lines = [];
      for (const [effectType, records] of Object.entries(total)) {
        const prefix = effectType == "バフ" ? "+" : "-";
        for (const [buffType, value] of Object.entries(records).filter(a => a[1] > 0)) {
          lines.push(`<div class="effect-box"><span class="effect caution">${buffType}${prefix}${value}%</span></div>`);
        }
      }
      return lines;
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

    doSearch(num) {
      const opt = this.optionValues;
      const priotitized = this.prioritized;
      let excluded = [...this.excluded];
      let targets = this.enabledEffects;

      let totalAmountGlobal = {};
      let usedSlotsGlobal = {};

      for (let v of targets)
        totalAmountGlobal[v.valueType] = 0;

      const isPrioritized = function(item, owner = null) {
        if (priotitized.includes(item))
          return true;
        else if (owner)
          return priotitized.find(a => a.owner == owner && a.item == item) != null;
        return false;
      };
      const findPrioritizedChr = function (scoreList) {
        for (const p of priotitized) {
          const r = scoreList.find(a => (a.scoreMain != undefined ? a.scoreMain > 0 : a.score > 0) && a.character == p);
          if (r)
            return r;
        }
        return null;
      };

      const compareScore = function (a, b) {
        if (a.score == b.score && a.scoreMain)
          return this.compare(a.scoreMain, b.scoreMain);
        else
          return this.compare(a.score, b.score);
      }.bind(this);


      const buffCondition = function (skill, effect) {
        if (effect.onBattle && !effect.duration)
          return false;

        if (effect.effectType == "デバフ") {
          return (opt.allowOnBattle || !effect.onBattle) &&
            (opt.allowProbability || !effect.probability);
        }
        else {
          return (effect.target != "自身") &&
            (opt.allowSingleUnitBuff || effect.target != "単体") &&
            (opt.allowOnBattle || !effect.onBattle) &&
            (opt.allowProbability || !effect.probability);
        }
      };

      const getBaseSkillScore = function (skill) {
        if (!skill)
          return 0;
        let score = 0;
        for (const v of this.enumerateEffects(skill)) {
          let p = targets.find(a => a.valueType == v.valueType);
          if (p && buffCondition(skill, v))
            score += this.getEffectValue(v) * p.weight;
        }
        if (skill.summon) {
          let sch = skill.summon[0];
          for (const s of [sch.talent, ...sch.skills])
            score += getBaseSkillScore(s);
        }
        return score;
      }.bind(this);

      const getBaseChrScore = function (chr) {
        return [chr.talent, ...chr.skills].reduce((total, skill) => total += getBaseSkillScore(skill), 0);
      }.bind(this);

      const filterSkills = function (skills) {
        return skills.filter(a => !this.isExcluded(excluded, a)).filter(a => getBaseSkillScore(a));
      }.bind(this);

      const oederByBaseScore = function (chrs, filter) {
        let tmp = chrs.map(chr => [getBaseChrScore(chr), chr]).sort((a, b) => this.compare(a[0], b[0]));
        if (filter)
          tmp = tmp.filter(a => a[0] > 0);
        return tmp.map(a => a[1]);
      }.bind(this);

      // 高速化のため事前フィルタ
      let weapons = filterSkills(this.weapons);
      let armors = filterSkills(this.armors);
      let helmets = filterSkills(this.helmets);
      let accessories = filterSkills(this.accessories);

      // メインはここでは絞らないでおく
      let mainChrs = oederByBaseScore(this.mainChrs.filter(a => this.filterMatchMainChr(a)), false);
      let supChrs = oederByBaseScore(this.supChrs.filter(a => this.filterMatchSupChr(a)), true);


      const getChrScore = function (chr, parentState = null) {
        if (this.isExcluded(excluded, chr))
          return null;

        let totalAmount = { ...(parentState ? parentState.totalAmount : totalAmountGlobal) };
        let usedSlots = { ...(parentState ? parentState.usedSlots : usedSlotsGlobal) };
        let usedEffects = [];
        let conflictedEffects = [];

        const getSkillScore = function (skill, parentState = null) {
          if (this.isExcluded(excluded, skill, chr))
            return 0;
          if (!opt.allowSymbolSkill && this.matchTags(skill.tags, /^シンボルスキル$/))
            return 0;
          if (!opt.allowSupportActive && skill.skillType == "アクティブ" && skill.ownerType == "サポート")
            return 0;

          let r = {
            skill: skill,
            score: 0,
            usedEffects: [],
            conflictedEffects: [],
          };
          if (parentState) {
            r.totalAmount = parentState.totalAmount;
            r.usedSlots = parentState.usedSlots;
            r.usedEffects = parentState.usedEffects;
            r.conflictedEffects = parentState.conflictedEffects;
          }
          else {
            r.totalAmount = { ...totalAmount };
            r.usedSlots = { ...usedSlots };
          }

          let scoreBoost = 1;
          if(skill.hasReaction && skill.area >= 5 && skill.range == "自ユニット") {
              scoreBoost += 0.5;
          }
 
          for (const v of this.enumerateEffects(skill)) {
            let p = targets.find(a => a.valueType == v.valueType);
            if (p && buffCondition(skill, v)) {
              if (skill.isActive) {
                if (usedSlots[v.slot]) {
                  r.conflictedEffects.push(v);
                  continue;
                }
                r.usedSlots[v.slot] = [v.value];
              }
              const limit = p.limit;
              let hitLimit = false;
              const current = r.totalAmount[p.valueType];
              let baseAmount = this.getEffectValue(v);
              let amount = baseAmount;
              if (limit > 0 && current + amount > limit) {
                hitLimit = true;
                amount = limit - current;
              }
              let score = amount * (p.weight * 0.1) * scoreBoost;
              if (!hitLimit && skill.isActive)
                score *= Math.min(Math.pow(baseAmount / 20, 2), 1); // 中途半端な効果量のアクティブは選ばれにくいようにスコア補正

              if (score > 0) {
                r.score += score;
                r.totalAmount[v.valueType] += amount;
                r.usedEffects.push(v);
              }
              if (amount == 0) {
                r.conflictedEffects.push(v);
              }
            }
          }

          if (skill.summon) {
            let sch = skill.summon[0];
            r.summon = {
              character: sch,
              skills: [],
            };
            for (const s of [sch.talent, ...sch.skills]) {
              const sr = getSkillScore(s, r);
              if (sr.score > 0) {
                r.score += sr.score;
                r.summon.skills.push(s);
              }
            }
          }
          return r;
        }.bind(this);

        const pickEquip = function (equipments) {
          const scoreList = equipments.filter(a => this.matchClass(a, chr)).map(a => getSkillScore(a));
          for (const s of scoreList)
            if (s.score > 0 && isPrioritized(s.skill, chr))
              return s;

          scoreList.sort(compareScore);
          if (scoreList.length > 0 && scoreList[0].score > 0)
            return scoreList[0];
          return null;
        }.bind(this);

        const pickSkill = function (skills, ignoreActive) {
          let scoreList = [];
          for (const skill of skills) {
            if (ignoreActive && skill.isActive && !skill.hasReaction)
              continue;

            const r = getSkillScore(skill);
            if (r.score > 0) {
              if (isPrioritized(skill, chr))
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
          usedSlots = s.usedSlots;
          totalAmount = s.totalAmount;
          usedEffects = usedEffects.concat(s.usedEffects);
          conflictedEffects = conflictedEffects.concat(s.conflictedEffects);
        };

        if (chr.talent) {
          let r = getSkillScore(chr.talent);
          if (r.score > 0) {
            updateState(r);
            skillsScore.push(r);
          }
        }

        if (chr.skills) {
          let tmpSkills = [...chr.skills];
          let activeCount = false;
          for (let i = 0; i < 3; ++i) {
            let r = pickSkill(tmpSkills, activeCount >= opt.maxNonReactiveActive);
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

        if (chr.objectType == "メイン") {
          equipmentsScore = [];
          for (let equips of [weapons, armors, helmets, accessories]) {
            let r = pickEquip(equips);
            if (r) {
              equipmentsScore.push(r);
              updateState(r);
            }
          }
          result.scoreMain = score;

          let state = {
            totalAmount: totalAmount,
            usedSlots: usedSlots,
          };
          const supScores = supChrs.map(a => getChrScore(a, state)).filter(a => a && a.score > 0).sort(compareScore);
          if (supScores.length) {
            supportScore = findPrioritizedChr(supScores);
            if (!supportScore)
              supportScore = supScores[0];

            score += supportScore.score;
            totalAmount = supportScore.totalAmount;
            usedSlots = supportScore.usedSlots;
            usedEffects = usedEffects.concat(supportScore.usedEffects);
          }
        }

        result.score = score;
        result.skills = skillsScore.map(a => a.skill);
        if (equipmentsScore)
          result.equipments = equipmentsScore.map(a => a.skill);
        if (summonScore)
          result.summon = summonScore;
        if (supportScore)
          result.support = supportScore;
        result.totalAmount = totalAmount;
        result.usedSlots = usedSlots;
        result.usedEffects = usedEffects;
        result.conflictedEffects = conflictedEffects;
        return result;
      }.bind(this);


      let result = [];
      for (let i = 0; i < num; ++i) {
        let ordered = mainChrs.map(a => getChrScore(a)).filter(a => a && a.score > 0).sort(compareScore);
        if (ordered.length == 0)
          break;

        let best = findPrioritizedChr(ordered);
        if (!best)
          best = ordered[0];

        let r = {
          score: best.score,
          main: best,
          totalAmount: best.totalAmount, // for debug
        };

        if (best.summon)
          r.summon = best.summon;
        if (best.support)
          r.support = best.support;
        totalAmountGlobal = best.totalAmount;
        usedSlotsGlobal = best.usedSlots;

        for (let v of [r.main, r.summon, r.support]) {
          if (!v)
            continue;
          for (const s of this.enumerate(v.skills, v.equipments))
            excluded.push(s);
        }
        result.push(r);

        ordered = ordered.filter(a => a.scoreMain > 0 && a != best).sort((a, b) => this.compare(a.scoreMain, b.scoreMain));
        mainChrs = ordered.map(a => a.character);

        if (best.support) {
          supChrs.splice(supChrs.indexOf(best.support.character), 1);
        }
      }
      //console.log(result); // for debug
      return result;
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
      const r = this.serializeParams();
      const l = this.history.length;
      if (!this.rightAfterUndo && (l == 0 || !this.objectEqual(this.history[l - 1], r))) {
        this.history.splice(this.historyIndex + 1, l);
        this.history.push(r);
        this.historyIndex = this.history.length - 1;
        //console.log(this.history);
      }
      this.rightAfterUndo = false;
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
        this.rightAfterUndo = true;
        //console.log(this.history);
      }
    },
    redo() {
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
        this.deserializeParams(this.history[this.historyIndex]);
        this.rightAfterUndo = true;
        //console.log(this.history);
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
      }
      this.deserializeParams(params);
      this.pushHistory();
    },

  },

  computed: {
    mainChrPick() {
      return this.mainChrs.filter(a => this.filterMatchMainChr(a, this.pickFilter));
    },

    result() {
      return this.doSearch(this.options.maxPickup.value);
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
    this.pushHistory();
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
