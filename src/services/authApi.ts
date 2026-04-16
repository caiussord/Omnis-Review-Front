import { apiClient } from './apiClient'
import { saveAuthSession } from './authSession'
import type { LoginPayload, RegisterPayload } from '../types/auth'

export type AuthResponse = {
  token?: string
  expiration?: string
  message?: string
  Message?: string
}

export type ForgotPasswordPayload = {
  userNameOrEmail: string
}

export type ResetPasswordPayload = {
  userId: string
  token: string
  newPassword: string
}

export type UserNameExistsResponse = {
  exists?: boolean
  message?: string
  Message?: string
}

export type CurrentUserResponse = {
  id: string
  userName: string
  email: string
  roles: string[]
}

async function persistSessionFromResponse(data: AuthResponse): Promise<void> {
  if (!data.token) {
    return
  }

  saveAuthSession(data.token, data.expiration)
}

export const authApi = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const data = await apiClient.post<AuthResponse>('/api/auth/login', payload, {
      skipAuthToken: true,
      skipUnauthorizedRedirect: true,
    })

    await persistSessionFromResponse(data)
    return data
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const data = await apiClient.post<AuthResponse>('/api/auth/register', payload, {
      skipAuthToken: true,
      skipUnauthorizedRedirect: true,
    })

    await persistSessionFromResponse(data)
    return data
  },

  forgotPassword(payload: ForgotPasswordPayload): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/api/auth/forgot-password', payload, {
      skipAuthToken: true,
      skipUnauthorizedRedirect: true,
    })
  },

  resetPassword(payload: ResetPasswordPayload): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/api/auth/reset-password', payload, {
      skipAuthToken: true,
      skipUnauthorizedRedirect: true,
    })
  },

  checkUsernameExists(userName: string): Promise<UserNameExistsResponse> {
    const normalizedUserName = encodeURIComponent(userName)
    return apiClient.get<UserNameExistsResponse>(
      `/api/auth/username-exists?userName=${normalizedUserName}`,
      {
        skipAuthToken: true,
        skipUnauthorizedRedirect: true,
      },
    )
  },

  getCurrentUser(): Promise<CurrentUserResponse> {
    return apiClient.get<CurrentUserResponse>('/api/auth/me')
  },
}
