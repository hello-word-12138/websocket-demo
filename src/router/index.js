import Vue from 'vue'
import Router from 'vue-router'
import chat from '@/page/chat'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'main',
      component: chat
    }
  ]
})
