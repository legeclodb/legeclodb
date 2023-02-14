import Vue from 'vue'
import Router from 'vue-router'
import MainCharacters from './components/MainCharacters.vue'
import SupportCharacters from './components/SupportCharacters.vue'
import Items from './components/Items.vue'
import About from './components/About.vue'

Vue.use(Router)

export default new Router({
  mode: process.env.IS_ELECTRON ? 'hash' : 'history',
  base: '/' ,
  routes: [
    {
      path: '/',
      name: 'index',
      component: MainCharacters
    },
    {
      path: '/main.html',
      name: 'main',
      component: MainCharacters
    },
    {
      path: '/support.html',
      name: 'support',
      component: SupportCharacters
    },
    {
      path: '/item.html',
      name: 'item',
      component: Items
    },
    {
      path: '/about.html',
      name: 'about',
      component: About
    }
  ]
})