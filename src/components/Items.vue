<template>
  <div class="root" @mousemove="onMouseMove">
    <div class="header" :class="{ 'hidden': !showHeader }">
      <Navigation />
      <div class="menu-content">
        <div class="menu-panel">
          <b-tabs nav-class="tab-index" v-model="searchTabIndex">
            <b-tab title="タグ検索">
              <div class="menu-widgets flex">
                <div class="widget" style="width: 300px ">
                  <b-form-input v-model="tagSearchPattern" type="text" debounce="500" size="sm" placeholder="検索ワード (正規表現)" :update="updateQuery('tag')" />
                </div>
              </div>
              <div class="menu-widgets flex">
                <div class="widget" style="margin-right:0px" v-for="(tc, tci) in tagCategory" :key="tci">
                  <b-dropdown :text="tc.display" :ref="tc.name" size="sm" @show="onTagDropdownShow($event, tc)" @hide="onTagDropdownHide($event, tc)">
                    <b-dropdown-item class="d-flex flex-column" v-for="t in getFilteredMainTags(tc.tags)" :key="mainTagTable[t].id" :id="genTagID(t)" @click="setTagSearchPattern(t); hideTagDropdown(tc, t);">
                      {{t}} <span class="note" v-html="`(${mainTagTable[t].count})`"></span> <span v-if="mainTagTable[t].note" class="note" v-html="mainTagTable[t].note"></span>
                      <b-popover v-if="subTagTable[t]" :target="genTagID(t)" triggers="hover focus" :delay="{show:0, hide:250}" no-fade @show="onSubtagPopoverShow(tc, t)" @hidden="onSubtagPopoverHide(tc, t)">
                        <b-dropdown-item class="d-flex flex-column" v-for="st in getFilteredSubTags(t)" :key="tagTable[st].id" @click="setTagSearchPattern(st, true); hideTagDropdown(tc, t);">
                          {{st}} <span class="note" v-html="`(${tagTable[st].count})`"></span>
                        </b-dropdown-item>
                      </b-popover>
                    </b-dropdown-item>
                  </b-dropdown>
                </div>
                <div class="widget">
                  <b-button variant="secondary" size="sm" @click="tagSearchPattern=''">クリア</b-button>
                </div>
              </div>
            </b-tab>
            <b-tab title="フリーワード検索">
              <div class="menu-widgets flex">
                <div class="widget" style="width: 300px">
                  <b-form-input v-model="freeSearchPattern" type="text" debounce="500" size="sm" placeholder="検索ワード (正規表現)" :update="updateQuery('free')" />
                </div>
                <div class="widget">
                  <b-button variant="secondary" size="sm" @click="freeSearchPattern=''">クリア</b-button>
                </div>
              </div>
            </b-tab>
          </b-tabs>
        </div>
        <div class="menu-panel">
          <div class="menu-widgets flex">
            <div class="widget">
              <h6>フィルター</h6>
            </div>
          </div>
          <div class="menu-widgets flex">
            <div class="widget">
              <b-button-group size="sm" id="class_selector">
                <b-button v-for="(c, i) in classFilter" :key="i" :pressed.sync="c.state" @click="updateQuery('class')" variant="outline-secondary">
                  <b-img-lazy :src="getImageURL(classes[i])" width="25" height="25" />
                </b-button>
              </b-button-group>
            </div>
          </div>
          <div class="menu-widgets flex">
            <div class="widget">
              <b-button-group size="sm" id="item_type_selector">
                <b-button v-for="(c, i) in itemTypeFilter" :key="i" :pressed.sync="c.state" @click="updateQuery('itemType')" variant="outline-secondary">
                  <b-img-lazy :src="getImageURL(itemTypes[i])" width="25" height="25" />
                </b-button>
              </b-button-group>
            </div>
            <div class="widget">
              <b-button-group size="sm" id="rareiry_selector">
                <b-button v-for="(c, i) in rarityFilter" :key="i" :pressed.sync="c.state" @click="updateQuery('rarity')" variant="outline-secondary">
                  <b-img-lazy :src="getImageURL(rarities[i])" width="36" height="20" />
                </b-button>
              </b-button-group>
            </div>
          </div>
        </div>
        <div class="menu-panel">
          <b-tabs nav-class="tab-index" v-model="settingsTabIndex">
            <b-tab title="表示">
              <div class="menu-widgets flex">
                <div class="widget">
                  <span>件数：</span>
                  <b-dropdown :text="displayCounts[displayCount]" size="sm" id="detail_selector">
                    <b-dropdown-item class="d-flex flex-column" v-for="(c, i) in displayCounts" :key="i" @click="displayCount=i">
                      {{ c }}
                    </b-dropdown-item>
                  </b-dropdown>
                </div>
                <div class="widget">
                  <span>形式：</span>
                  <b-dropdown :text="displayTypes[displayType]" size="sm" id="detail_selector">
                    <b-dropdown-item class="d-flex flex-column" v-for="(c, i) in displayTypes" :key="i" @click="displayType=i">
                      {{ c }}
                    </b-dropdown-item>
                  </b-dropdown>
                </div>
              </div>
              <div class="menu-widgets flex">
                <div class="widget">
                  <span>ソート：</span>
                  <b-dropdown :text="sortTypes[sortType]" size="sm" id="sort_selector">
                    <b-dropdown-item class="d-flex flex-column" v-for="(c, i) in sortTypes" :key="i" @click="sortType=i">
                      {{ c }}
                    </b-dropdown-item>
                  </b-dropdown>
                  <span style="width:5px"></span>
                  <b-dropdown :text="sortOrders[sortOrder]" size="sm" id="sort_order_selector">
                    <b-dropdown-item class="d-flex flex-column" v-for="(c, i) in sortOrders" :key="i" @click="sortOrder=i">
                      {{ c }}
                    </b-dropdown-item>
                  </b-dropdown>
                  <span style="width:5px"></span>
                  <b-button :pressed.sync="sortBySlot" variant="outline-secondary" size="sm">
                    種類別
                  </b-button>
                </div>
              </div>
            </b-tab>
            <b-tab title="ステータス">
              <div class="flex">
                <div class="menu-widgets">
                  <b-container>
                    <b-form-row v-for="(param, name, index) in [stat.base.level]" :key="index">
                      <b-col style="text-align: right" align-self="end">
                        <label :for="`stat-${name}`">{{param.label}}</label>
                      </b-col>
                      <b-col>
                        <b-form-input style="width: 4em" :id="`stat-${name}`" v-model.number="param.value" size="sm" type="number" class="input-param" :min="param.min" :max="param.max"></b-form-input>
                      </b-col>
                    </b-form-row>
                  </b-container>
                </div>
                <div class="menu-widgets">
                  <div style="margin: 3px">
                  </div>
                  <div style="margin: 3px">
                    <b-button variant="secondary" size="sm" style="width: 7em" @click="updateStatus()">適用</b-button>
                  </div>
                </div>
              </div>
            </b-tab>
          </b-tabs>
        </div>
      </div>
    </div>

    <div id="content" class="content" style="margin-top: 200px;" :style="style">

      <div class="pages" v-if="getPageCount(items) > 1">
        <b-pagination v-model="page"
                      :total-rows="items.length"
                      :per-page="displayCountNum"
                      @change="onPage"
                      limit="10"
                      hide-goto-end-buttons></b-pagination>
        <ul class="pagination b-pagination" style="margin-left: 0px;">
          <li class="page-item">
            <b-button @click="scrollToBottom()" variant="outline-secondary" class="page-link">
              ↓
            </b-button>
          </li>
        </ul>
      </div>

      <template v-for="item in pagedItems">
        <div class="item" :id="'item_'+item.id" :key="item.id">
          <div class="flex">
            <div class="portrait" :id="'item_'+item.id+'_icon'">
              <b-img-lazy :src="getImageURL(item.name)" :alt="item.name" width="60" height="60" rounded />
              <b-popover v-if="displayType==1" :target="'item_'+item.id+'_icon'" triggers="hover focus" :title="item.name" placement="top">
                <div class="flex">
                  <div v-html="descToHtml(item)"></div>
                </div>
              </b-popover>
            </div>
            <div class="detail" v-show="displayType >= 1">
              <div class="info" :class="{ 'highlighted': isInfoHighlighted(item) }">
                <h5 v-html="item.name"></h5>
                <div class="status">
                  <b-img-lazy :src="getImageURL(item.slot)" :title="'部位:'+item.slot" height="25" />
                  <b-img-lazy :src="getImageURL(item.rarity)" :title="'レアリティ:'+item.rarity" height="20" />
                  <div class="param-box"><span class="param-name">実装日:</span><span class="param-value">{{item.date}}</span></div>
                </div>
              </div>
              <div class="info">
                <div class="status" v-html="itemClassesToHtml(item)"></div>
                <div class="status2" v-html="statusToHtml(item.status, '+')" title="テクニックはメイン+サポートの攻撃力が 3000 の前提で戦闘力に計上"></div>
              </div>
              <div class="skills">
                <div class="skill" :class="{ 'highlighted': isDescHighlighted(item) }" v-show="displayType >= 2" style="flex-grow: 1">
                  <div class="desc">
                    <p><span v-html="descToHtml(item)"></span><span v-if="item.note" class="note" v-html="noteToHtml(item)"></span></p>
                  </div>
                  <div class="tags">
                    <b-badge class="tag" :key="i" v-for="(tag, i) in item.tags" variant="info" pill @click="setTagSearchPattern(tag)">{{ tag }}</b-badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <div class="pages" v-if="getPageCount(items) > 1">
        <b-pagination v-model="page"
                      :total-rows="items.length"
                      :per-page="displayCountNum"
                      @change="onPage"
                      limit="10"
                      hide-goto-end-buttons></b-pagination>
        <ul class="pagination b-pagination" style="margin-left: 0px;">
          <li class="page-item">
            <b-button @click="scrollToTop()" variant="outline-secondary" class="page-link">
              ↑
            </b-button>
          </li>
        </ul>
      </div>

    </div>
  </div>
</template>

<script>
import Navigation from './Navigation.vue'
import jsonItems from '../assets/items.json'
import jsonConstants from '../assets/constants.json'
import common from "./common";

export default {
  name: 'Equipments',
  components: {
    Navigation,
  },
  mixins: [common],

  data() {
    return {
      equipments: jsonItems,
      constants: jsonConstants,

      classes: jsonConstants.classes,
      itemTypes: jsonConstants.itemTypes,
      rarities: jsonConstants.rarities,

      displayTypes: [
        "アイコン",
        "シンプル",
        "詳細",
      ],
      sortTypes: [
        "実装日",
        "戦闘力",
        "HP",
        "アタック",
        "ディフェンス",
        "マジック",
        "レジスト",
        "テクニック",
      ],
      sortOrders: [
        "降順",
        "昇順"
      ],

      tagCategory: {
        buff: {
          display: "バフ系",
          name: "tags_buff",
          tags: new Set(),
        },
        debuff: {
          display: "デバフ系",
          name: "tags_debuff",
          tags: new Set(),
        },
        resist: {
          display: "無効化系",
          name: "tags_resist",
          tags: new Set(),
        },
        action: {
          display: "攻撃/回復",
          name: "tags_action",
          tags: new Set(),
        },
        other: {
          display: "その他",
          name: "tags_other",
          tags: new Set(),
        },
      },
      subTagTable: {},

      classFilter: [],
      itemTypeFilter: [],
      rarityFilter: [],

      stat: {
        base: {
          level: {
            label: "レベル",
            type: "number",
            min: 1,
            value: 50,
          },
        },
      },

      enableUpdateURL: false,
      prevURL: "",
    };
  },

  computed: {
    rawItems() {
      return this.characters;
    },
    items() {
      let ret = this.equipments.filter(a => this.filterItem(a)); // filter & shallow copy

      const c = this.compare;
      const comparer = [
        (a, b) => b.date.localeCompare(a.date), // 実装日
        (a, b) => c(a.status[6], b.status[6]), // 戦闘力
        (a, b) => c(a.status[0], b.status[0]), // HP
        (a, b) => c(a.status[1], b.status[1]), // アタック
        (a, b) => c(a.status[2], b.status[2]), // ディフェンス
        (a, b) => c(a.status[3], b.status[3]), // マジック
        (a, b) => c(a.status[4], b.status[4]), // レジスト
        (a, b) => c(a.status[5], b.status[5]), // テクニック
      ];
      if (this.sortType >= 0 && this.sortType < comparer.length) {
        const fn = comparer[this.sortType]
        if (this.sortOrder == 0)
          ret.sort((a, b) => fn(a, b));
        else
          ret.sort((a, b) => fn(b, a));
      }

      if (this.sortBySlot) // 種類別
        ret.sort((a, b) => a.slotId < b.slotId ? -1 : 1);

      return ret;
    },
    pagedItems() {
      return this.applyPage(this.items);
    },
  },

  created() {
    this.setupDB();

    this.fillFilter(this.classFilter, this.classes);
    this.fillFilter(this.itemTypeFilter, this.itemTypes);
    this.fillFilter(this.rarityFilter, this.rarities);

    this.decodeURL();
    this.updateTagCounts();
  },

  mounted() {
    this.enableUpdateURL = true;
    window.onpopstate = function () {
      this.enableUpdateURL = false;
      this.decodeURL(true);
      this.$nextTick(function () {
        this.enableUpdateURL = true;
      });
    }.bind(this);
  },

  methods: {
    setupDB() {
      // 外部 json 由来のデータへの変更はセッションをまたいでしまうので、deep copy しておく
      this.equipments = structuredClone(this.equipments).filter(a => !a.hidden && a.slot != "アミュレット");

      this.predefinedMainTags.push("分類");
      this.predefinedMainTags.push("デメリット");

      let itemId = 0;
      for (let item of this.equipments) {
        item.recordType = 'item';
        item.id = ++itemId;
        if (item.classes) {
          item.classIds = item.classes.map(c1 => this.classes.findIndex(c2 => c1 == c2));
        }
        item.slotId = this.itemTypes.findIndex(v => v == item.slot);
        item.rarityId = this.rarities.findIndex(v => v == item.rarity);
        this.$set(item, 'status', [])

        this.registerTags(item.tags);
      }

      let handledTags = new Set();
      this.appendSet(handledTags, this.constants.tagsHidden);

      const isAction = function (t) {
        for (const n of this.constants.tagsAction) {
          if (t.startsWith(n))
            return true;
        }
        return false;
      }.bind(this);
      this.stat.defaults = [
        ...Object.values(this.stat.base).map(a => a.value),
      ];
      this.updateStatus();

      for (let t of this.getMainTags()) {
        if (handledTags.has(t))
          continue;

        if (t.match(/^バフ:/))
          this.tagCategory.buff.tags.add(t);
        else if (t.match(/^デバフ:/))
          this.tagCategory.debuff.tags.add(t);
        else if (t.match(/^無効化:/))
          this.tagCategory.resist.tags.add(t);
        else if (isAction(t))
          this.tagCategory.action.tags.add(t);
        else
          this.tagCategory.other.tags.add(t);
      }
      this.reorderSet(this.tagCategory.buff.tags, this.constants.tagsBuff);
      this.reorderSet(this.tagCategory.debuff.tags, this.constants.tagsDebuff);
      this.reorderSet(this.tagCategory.resist.tags, this.constants.tagsResist);
      this.reorderSet(this.tagCategory.action.tags, this.constants.tagsAction);
      this.reorderSet(this.tagCategory.other.tags, this.constants.tagsOther);
      this.reorderSubtag();

      this.reorderSet(this.subTagTable["デメリット"], this.constants.tagsDemerit);
    },

    updateStatus() {
      const base = Object.values(this.stat.base).map(a => a.value);
      for (let item of this.equipments) {
        const status = this.getItemStatus(item, ...base);
        if (status) {
          item.status = [...status, this.getEstimatedItemBattlePower(status)];
        }
      }
      this.$forceUpdate();
    },
    resetStatus() {
      let vals = [...this.stat.defaults];
      for (let v of [...Object.values(this.stat.base)])
        v.value = vals.shift();
      this.updateStatus();
    },

    itemClassesToHtml(item) {
      let r = "";
      if (item.classes)
        r += item.classes.map(c => `<img src="${this.getImageURL(c)}" title="${c}" width="24" height="24" />`).join("")
      else
        r += `<img src="${this.getImageURL('全クラス')}" title="全クラス" height="24" />`;
      return r;
    },

    isInfoHighlighted(chr) {
      return this.freeSearchFn && this.freeSearchFn(chr.name)
        ? 2 : 0;
    },
    isDescHighlighted(chr) {
      let r = 0;
      if (this.tagSearchFn) {
        r |= this.tagSearchFn(chr)
          ? 1 : 0;
      }
      if (this.freeSearchFn) {
        r |= this.freeSearchFn(chr.desc)
          ? 2 : 0;
      }
      return r;
    },
    applySearchPatterns(chr) {
      let r = this.isInfoHighlighted(chr) | this.isDescHighlighted(chr);
      return r == this.getSearchMask();
    },
    applyClassFilter(chr) {
      return (!chr.classIds || this.filterMatch(this.classFilter, chr.classIds)) &&
        this.filterMatch(this.itemTypeFilter, chr.slotId) &&
        this.filterMatch(this.rarityFilter, chr.rarityId);
    },
    filterItem(chr) {
      let ok = this.applyClassFilter(chr);
      if (ok && this.isSearchPatternSet()) {
        ok = this.applySearchPatterns(chr);
      }
      return ok;
    },
    updateTagCounts() {
      this.resetTagCounts();
      for (let item of this.equipments) {
        if (this.applyClassFilter(item)) {
          this.countTags(item.tags);
        }
      }
    },

    updateURL(kvp) {
      if (!this.enableUpdateURL)
        return false;

      let seri = new this.URLSerializer();
      if (this.isFilterEnabled(this.classFilter))
        seri.class = this.serializeFilter(this.classFilter);
      if (this.isFilterEnabled(this.itemTypeFilter))
        seri.itemType = this.serializeFilter(this.itemTypeFilter);
      if (this.isFilterEnabled(this.rarityFilter))
        seri.rarity = this.serializeFilter(this.rarityFilter);
      if (this.tagSearchPattern.length > 0)
        seri.tag = this.tagSearchPattern;
      if (this.freeSearchPattern.length > 0)
        seri.free = this.freeSearchPattern;

      if (kvp) {
        for (const k in kvp)
          seri[k] = kvp[k];
      }

      let url = seri.serialize();
      if (url != this.prevURL) {
        window.history.pushState(null, null, url);
        this.prevURL = url;
        return true;
      }
      return false;
    },
    decodeURL(initState = false) {
      let data = new this.URLSerializer({
        class: 0,
        itemType: 0,
        rarity: 0,
        tag: "",
        free: "",
        p: 1,
      });

      if (data.deserialize(window.location.href) || initState) {
        this.deserializeFilter(this.classFilter, data.class);
        this.deserializeFilter(this.itemTypeFilter, data.itemType);
        this.deserializeFilter(this.rarityFilter, data.rarity);
        this.tagSearchPattern = data.tag;
        this.freeSearchPattern = data.free;
        if (this.freeSearchPattern.length != 0)
          this.searchTabIndex = 1;

        if (data.p > 0)
          this.page = data.p;
      }
    },
  }
}
</script>

<style scoped>
</style>
