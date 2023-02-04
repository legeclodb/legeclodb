import Vue from 'vue'
import Router from 'vue-router'
import MainCharacters from './components/MainCharacters.vue'
import SupportCharacters from './components/SupportCharacters.vue'
import Equipments from './components/Equipments.vue'
import About from './components/About.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: process.env.NODE_ENV === 'production' ? '/legeclodb/' : '/' ,
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
      path: '/equipment',
      name: 'equipment',
      component: Equipments
    },
    {
      path: '/about',
      name: 'about',
      component: About
    }
  ]
})