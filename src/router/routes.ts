import type { RouteRecordRaw } from 'vue-router'
import AuthView from '../views/AuthView.vue'
import BlankView from '../views/BlankView.vue'
import ForgotPasswordView from '../views/ForgotPasswordView.vue'
import ResetPasswordView from '../views/ResetPasswordView.vue'

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
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: ForgotPasswordView,
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: ResetPasswordView,
  },
]
