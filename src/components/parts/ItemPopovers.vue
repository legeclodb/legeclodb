<template >
  <div>
    <template v-for="(e, i) in popoverElements">
      <b-popover :target="e" :key="i" triggers="hover focus" custom-class="item_po" :title="e.item.name" placement="top" boundary="window">
        <div class="flex">
          <div><b-img-lazy :src="getImageURL(e.item.icon)" width="50" height="50" /></div>
          <div><span v-html="descToHtml(e.item)"></span><span v-if="e.item.note" class="note" v-html="noteToHtml(e.item)"></span></div>
        </div>
        <div v-if="e.item.owners" class="owners">
          所持者:<br />
          <b-img-lazy v-for="(owner, oi) in e.item.owners" :key="oi" :src="getImageURL(owner.icon)" :title="descToTitle(owner)" width="50" height="50" />
        </div>
      </b-popover>
    </template>
  </div>
</template >

<script>
export default {
  name: 'ItemPopovers',

  created() {
    // 更新に追従するため popoverElements はプロパティ化
    Object.defineProperty(this, 'popoverElements', {
      get: () => this.$parent.popoverElements
    });
    this.getImageURL = this.$parent.getImageURL;
    this.descToHtml = this.$parent.descToHtml;
    this.noteToHtml = this.$parent.noteToHtml;
    this.descToTitle = this.$parent.descToTitle;
  },
}
</script>
