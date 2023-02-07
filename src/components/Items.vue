<template>
  <div class="root">
    <div class="header" :class="{ 'hidden': !showHeader }">
      <Navigation />
      <div class="menu-content">
        <div class="menu-panel">
          <div class="menu-widgets flex">
            <div class="widget">
              <h6>タグ検索</h6>
            </div>
          </div>
          <div class="menu-widgets flex">
            <div class="widget" style="width: 170px">
              <b-form-input v-model="tagSearchPattern" type="text" debounce="500" size="sm" placeholder="検索ワード (正規表現)" :update="onUpdateTagSearchPattern()" />
            </div>
          </div>
          <div class="menu-widgets flex">
            <div class="widget" style="margin-right:0px" v-for="(tc, tci) in tagCategory" :key="tci">
              <b-dropdown :text="tc.display" :ref="tc.name" size="sm" @show="onTagDropdownShow($event, tc)" @hide="onTagDropdownHide($event, tc)">
                <b-dropdown-item class="d-flex flex-column" v-for="(t, i) in tc.tags" :key="i" :id="tc.name+'_item'+i" @click="setTagSearchPattern(t); hideTagDropdown(tc, tc.name+'_item'+i);">
                  {{t}} <span v-if="constants.tagNotes[t]" class="note" v-html="constants.tagNotes[t]"></span>
                  <b-popover v-if="subTagTable[t]" :target="tc.name+'_item'+i" triggers="hover focus" :delay="{show:0, hide:250}" no-fade @show="onSubtagPopoverShow(tc, tc.name+'_item'+i)" @hidden="onSubtagPopoverHide(tc, tc.name+'_item'+i)">
                    <b-dropdown-item class="d-flex flex-column" v-for="(st, si) in subTagTable[t]" :key="si" @click="setTagSearchPattern(st, true); hideTagDropdown(tc, tc.name+'_item'+i);">{{st}}</b-dropdown-item>
                  </b-popover>
                </b-dropdown-item>
              </b-dropdown>
            </div>
            <div class="widget">
              <b-button variant="secondary" size="sm" @click="tagSearchPattern=''">クリア</b-button>
            </div>
          </div>
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
                <b-button v-for="(c, i) in classFilter" :key="i" :pressed.sync="c.state" @click="onChangeFilterState()" variant="outline-secondary">
                  <b-img-lazy :src="getImageURL(classes[i])" width="25" height="25" />
                </b-button>
              </b-button-group>
            </div>
          </div>
          <div class="menu-widgets flex">
            <div class="widget">
              <b-button-group size="sm" id="item_type_selector">
                <b-button v-for="(c, i) in itemTypeFilter" :key="i" :pressed.sync="c.state" @click="onChangeFilterState()" variant="outline-secondary">
                  <b-img-lazy :src="getImageURL(itemTypes[i])" width="25" height="25" />
                </b-button>
              </b-button-group>
            </div>
            <div class="widget">
              <b-button-group size="sm" id="rareiry_selector">
                <b-button v-for="(c, i) in rarityFilter" :key="i" :pressed.sync="c.state" @click="onChangeFilterState()" variant="outline-secondary">
                  <b-img-lazy :src="getImageURL(rarities[i])" width="36" height="20" />
                </b-button>
              </b-button-group>
            </div>
          </div>
        </div>
        <div class="menu-panel">
          <div class="menu-widgets flex">
            <div class="widget">
              <h6>設定</h6>
            </div>
          </div>
          <div class="menu-widgets flex">
            <div class="widget">
              <span>表示：</span>
              <b-dropdown :text="showDetailTypes[showDetail]" size="sm" id="detail_selector" style="width:90px">
                <b-dropdown-item class="d-flex flex-column" v-for="(c, i) in showDetailTypes" :key="i" @click="showDetail=i">
                  {{ showDetailTypes[i] }}
                </b-dropdown-item>
              </b-dropdown>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="content" style="margin-top: 210px;" :style="style">
      <template v-for="item in items">
        <div class="item" :id="'item_'+item.id" :key="item.id" v-show="filterItem(item)">
          <div class="flex">
            <div class="portrait" :id="'item_'+item.id+'_icon'">
              <b-img-lazy :src="getImageURL(item.name)" :alt="item.name" width="60" height="60" rounded />
              <b-popover v-if="showDetail==1" :target="'item_'+item.id+'_icon'" triggers="hover focus" :title="item.name" :content="item.desc" placement="top"></b-popover>
            </div>
            <div class="detail" v-show="showDetail >= 1">
              <div class="info">
                <h5 v-html="item.name"></h5>
                <b-img-lazy :src="getImageURL(item.slot)" :alt="item.slot" height="25" />
                <b-img-lazy :src="getImageURL(item.rarity)" :alt="item.rarity" height="20" />
                <b-link :href="'https://legeclo.wikiru.jp/?' + item.name" target="_blank">Wiki</b-link>
              </div>
              <div class="info">
                <div v-html="itemClassesToHtml(item)"></div>
                <div v-html="itemParamsToHtml(item)" v-show="showDetail >= 2"></div>
              </div>
              <div class="skills">
                <div class="skill" style="flex-grow: 1" v-show="showDetail >= 2">
                  <div class="desc">
                    <p><span v-html="descToHtml(item)"></span><span v-if="item.note" class="note" v-html="item.note"></span></p>
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
    </div>

  </div>
</template>

<script>
import Navigation from './Navigation.vue'
import jsonItems from '../assets/items.json'
import jsonConstants from '../assets/constants.json'

export default {
  name: 'Equipments',
  components: {
    Navigation,
  },
  data() {
    return {
      equipments: jsonItems,
      constants: jsonConstants,

      classes: jsonConstants.classes,
      itemTypes: jsonConstants.itemTypes,
      rarities: jsonConstants.rarities,

      showDetailTypes: [
        "アイコン",
        "シンプル",
        "詳細",
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

      enableUpdateURL: false,
      prevURL: "",
    };
    },

  computed: {
    items() {
      return this.equipments;
    },
  },

  created() {
    this.setupDB();

    this.fillFilter(this.classFilter, this.classes);
    this.fillFilter(this.itemTypeFilter, this.itemTypes);
    this.fillFilter(this.rarityFilter, this.rarities);
  },

  mounted() {
    this.decodeURL();

    window.onpopstate = function () {
      this.decodeURL(true);
    }.bind(this);

    this.enableUpdateURL = true;
  },

  methods: {
    setupDB() {
      // 外部 json 由来のデータへの変更はセッションをまたいでしまうので、deep copy しておく
      this.equipments = structuredClone(this.equipments);
      let idSeed = 0;
      for (let item of this.equipments) {
        item.id = ++idSeed;
        if (item.classes) {
          item.classIds = item.classes.map(c1 => this.classes.findIndex(c2 => c1 == c2));
        }
        item.slotId = this.itemTypes.findIndex(v => v == item.slot);
        item.rarityId = this.rarities.findIndex(v => v == item.rarity);

        this.registerTags(item.tags);
      }
      this.equipments.sort((a, b) => a.slotId < b.slotId ? -1 : 1);

      let handledTags = new Set();
      this.appendSet(handledTags, this.constants.tagsHidden);

      for (let t of Array.from(this.mainTags).sort()) {
        if (handledTags.has(t))
          continue;

        if (t.match(/^バフ:/))
          this.tagCategory.buff.tags.add(t);
        else if (t.match(/^デバフ:/))
          this.tagCategory.debuff.tags.add(t);
        else if (t.match(/^無効化/))
          this.tagCategory.resist.tags.add(t);
        else
          this.tagCategory.other.tags.add(t);
      }
      this.reorderSet(this.tagCategory.buff.tags, this.constants.tagsBuff);
      this.reorderSet(this.tagCategory.debuff.tags, this.constants.tagsDebuff);
      this.reorderSet(this.tagCategory.resist.tags, this.constants.tagsResist);
      this.reorderSet(this.tagCategory.other.tags, this.constants.tagsOther);
      this.reorderSubtag();
    },

    itemClassesToHtml(item) {
      if (item.classes) {
        return item.classes.map(c => `<img src="${this.getImageURL(c)}" alt="${c}" width="25" height="25" />`).join("")
      }
      else {
        return `<img src="${this.getImageURL('全クラス')}" alt="全クラス" height="25" />`;
      }
    },
    itemParamsToHtml(item) {
      const nameTable = {
        hp: "HP",
        atk: "アタック",
        def: "ディフェンス",
        mag: "マジック",
        res: "レジスト",
        tec: "テクニック",
      };
      let params = [];
      for (const k in item.params) {
        params.push(`<p><img src="${this.getImageURL(nameTable[k])}" alt="${nameTable[k]}" width="20" height="20" /> +${item.params[k]}</p>`);
      }
      return params.join("");
    },

    applyTagSearchPattern(chr) {
      let re = this.getTagRE();
      if (!re) {
        return false;
      }
      if (this.matchTags(chr.tags, re)) {
        return true;
      }
      return false;
    },
    filterItem(chr) {
      let ok = (!chr.classIds || this.filterMatch(this.classFilter, chr.classIds)) &&
        this.filterMatch(this.itemTypeFilter, chr.slotId) &&
        this.filterMatch(this.rarityFilter, chr.rarityId);
      if (ok && this.getTagRE()) {
        ok = this.applyTagSearchPattern(chr);
      }
      return ok;
    },

    updateURL() {
      if (!this.enableUpdateURL) {
        return;
      }

      let seri = new this.URLSerializer();
      if (this.isFilterEnabled(this.classFilter))
        seri.class = this.serializeFilter(this.classFilter);
      if (this.isFilterEnabled(this.itemTypeFilter))
        seri.itemType = this.serializeFilter(this.itemTypeFilter);
      if (this.isFilterEnabled(this.rarityFilter))
        seri.rarity = this.serializeFilter(this.rarityFilter);
      if (this.tagSearchPattern.length > 0)
        seri.tag = this.tagSearchPattern;

      let url = seri.serialize();
      if (url != this.prevURL) {
        window.history.pushState(null, null, url);
        this.prevURL = url;
      }
    },
    decodeURL(initState = false) {
      let data = new this.URLSerializer({
        class: 0,
        itemType: 0,
        rarity: 0,
        tag: "",
      });

      if (data.deserialize(window.location.href) || initState) {
        this.enableUpdateURL = false;
        this.deserializeFilter(this.classFilter, data.class);
        this.deserializeFilter(this.itemTypeFilter, data.itemType);
        this.deserializeFilter(this.rarityFilter, data.rarity);
        this.tagSearchPattern = data.tag;
        this.$forceUpdate();
        this.enableUpdateURL = true;
      }
    },
  }
}
</script>

<style scoped>
</style>
