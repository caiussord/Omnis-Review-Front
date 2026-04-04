import type { RouteRecordRaw } from 'vue-router'
import AuthView from '../views/AuthView.vue'
import BlankView from '../views/BlankView.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'auth',
    component: AuthView,
  },
  {
    path: '/blank',
    name: 'blank',
    component: BlankView,
  },
]
