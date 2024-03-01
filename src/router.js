import Vue from 'vue'
import Router from 'vue-router'
import MainCharacters from './components/MainCharacters.vue'
import SupportCharacters from './components/SupportCharacters.vue'
import Items from './components/Items.vue'
import Lookup from './components/Lookup.vue'
import About from './components/About.vue'
import Misc from './components/Misc.vue'
import Battle from './components/Battle.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
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
      path: '/lookup.html',
      name: 'lookup',
      component: Lookup
    },
    {
      path: '/about.html',
      name: 'about',
      component: About
    },
    {
      path: '/misc.html',
      name: 'misc',
      component: Misc
    },
    {
      path: '/battle.html',
      name: 'battle',
      component: Battle
    }
  ]
})