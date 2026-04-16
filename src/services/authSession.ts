const TOKEN_STORAGE_KEY = 'omnis_token'
const TOKEN_EXPIRATION_STORAGE_KEY = 'omnis_token_expiration'

type JwtPayload = {
  exp?: number
  role?: string | string[]
  roles?: string | string[]
  [key: string]: unknown
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
  return atob(padded)
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.')
  if (parts.length < 2 || !parts[1]) {
    return null
  }

  try {
    const payloadRaw = decodeBase64Url(parts[1])
    return JSON.parse(payloadRaw) as JwtPayload
  } catch {
    return null
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function getTokenExpiration(): string | null {
  return localStorage.getItem(TOKEN_EXPIRATION_STORAGE_KEY)
}

export function saveAuthSession(token: string, expiration?: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)

  if (expiration) {
    localStorage.setItem(TOKEN_EXPIRATION_STORAGE_KEY, expiration)
    return
  }

  localStorage.removeItem(TOKEN_EXPIRATION_STORAGE_KEY)
}

export function clearAuthSession(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(TOKEN_EXPIRATION_STORAGE_KEY)
}

export function isTokenExpired(token: string, expiration: string | null): boolean {
  if (expiration) {
    const parsed = Date.parse(expiration)
    if (!Number.isNaN(parsed)) {
      return Date.now() >= parsed
    }
  }

  const payload = decodeJwtPayload(token)
  if (typeof payload?.exp === 'number') {
    return Date.now() >= payload.exp * 1000
  }

  return false
}

export function hasValidSession(): boolean {
  const token = getAuthToken()
  if (!token) {
    return false
  }

  return !isTokenExpired(token, getTokenExpiration())
}

export function getTokenRoles(token: string): string[] {
  const payload = decodeJwtPayload(token)
  if (!payload) {
    return []
  }

  const claimCandidates: unknown[] = [
    payload.role,
    payload.roles,
    payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
  ]

  const roles = claimCandidates.flatMap((claimValue) => {
    if (Array.isArray(claimValue)) {
      return claimValue.filter((value): value is string => typeof value === 'string')
    }

    if (typeof claimValue === 'string' && claimValue.trim()) {
      return [claimValue]
    }

    return []
  })

  return Array.from(new Set(roles))
}
