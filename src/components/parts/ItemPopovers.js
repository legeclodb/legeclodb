export default {
  data() {
    return {
      popoverElements: [],
    }
  },

  methods: {
    po(e) {
      let a = e?.$el;
      if (a && !this.popoverElements.includes(a)) {
        let item = this.findItem(a.innerText);
        if (item) {
          a.item = item;
          this.pushArray(this.popoverElements, a);
        }
      }
    },

    addPo(elements) {
      for (let a of elements) {
        if (a && !this.popoverElements.includes(a)) {
          let item = this.findItem(a.innerText);
          if (item) {
            a.item = item;
            this.pushArray(this.popoverElements, a);
          }
        }
      }
    },

    removePo(elements) {
      if (elements.length) {
        this.popoverElements = this.popoverElements.filter(a => !elements.includes(a));
      }
    },
  },
}
