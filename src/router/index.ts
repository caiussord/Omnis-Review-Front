import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'
import { authApi } from '../services/authApi'
import {
  clearAuthSession,
  getAuthToken,
  getTokenRoles,
  hasValidSession,
} from '../services/authSession'
import { ApiError } from '../services/apiClient'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth === true)
  const requiredRoles = to.matched.flatMap((record) => {
    const roleMeta = record.meta.roles
    return Array.isArray(roleMeta)
      ? roleMeta.filter((role): role is string => typeof role === 'string')
      : []
  })

  if (!requiresAuth) {
    if (to.name === 'auth' && hasValidSession()) {
      return { name: 'blank' }
    }

    return true
  }

  if (!hasValidSession()) {
    clearAuthSession()
    return {
      name: 'auth',
      query: {
        mode: 'login',
        redirect: to.fullPath,
      },
    }
  }

  const token = getAuthToken()
  if (!token) {
    clearAuthSession()
    return {
      name: 'auth',
      query: {
        mode: 'login',
        redirect: to.fullPath,
      },
    }
  }

  if (requiredRoles.length > 0) {
    const tokenRoles = getTokenRoles(token)
    const hasRouteRole = requiredRoles.some((requiredRole) => tokenRoles.includes(requiredRole))

    if (!hasRouteRole) {
      return { name: 'home' }
    }
  }

  try {
    await authApi.getCurrentUser()
    return true
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearAuthSession()
      return {
        name: 'auth',
        query: {
          mode: 'login',
          redirect: to.fullPath,
        },
      }
    }

    return true
  }
})

export default router
