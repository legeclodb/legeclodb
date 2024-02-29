import Vue from 'vue'
import App from './App.vue'
import { BootstrapVue, BootstrapVueIcons } from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import "./components/style.css";
import router from './router'

Vue.use(BootstrapVue)
Vue.use(BootstrapVueIcons)
Vue.config.productionTip = false

Vue.prototype.$idSeed = 0;
Vue.prototype.$genUniqueId = function () {
  return ++Vue.prototype.$idSeed;
};

new Vue({
  router,
  render: h => h(App),
}).$mount('#app')
