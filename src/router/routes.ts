import type { RouteRecordRaw } from 'vue-router'
import AuthView from '../views/AuthView.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'auth',
    component: AuthView,
  },
]
