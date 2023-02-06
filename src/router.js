import Vue from 'vue'
import Router from 'vue-router'
import MainCharacters from './components/MainCharacters.vue'
import SupportCharacters from './components/SupportCharacters.vue'
import Items from './components/Items.vue'
import About from './components/About.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: '/' ,
  routes: [
    {
      path: '/',
      name: 'index',
      component: MainCharacters
    },
    {
      path: '/main',
      name: 'main',
      component: MainCharacters
    },
    {
      path: '/support',
      name: 'support',
      component: SupportCharacters
    },
    {
      path: '/item',
      name: 'item',
      component: Items
    },
    {
      path: '/about',
      name: 'about',
      component: About
    }
  ]
})