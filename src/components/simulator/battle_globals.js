export let $g = {
  sim: null,
  get config() {
    return this.sim?.config;
  },
  log(text) {
    console.log(text);
  },
};
