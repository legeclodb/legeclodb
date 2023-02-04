import Vue from 'vue'
import App from './App.vue'
import BootstrapVue from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import "./components/style.css";
import router from './router'
import common from "./components/common";

Vue.use(BootstrapVue)
Vue.config.productionTip = false
Vue.mixin(common);

new Vue({
  router,
  render: h => h(App),
}).$mount('#app')
