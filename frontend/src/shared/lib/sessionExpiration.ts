const AUTH_TOKEN_STORAGE_KEY = 'Trail.auth.token'
const ADMIN_TOKEN_STORAGE_KEY = 'Trail.admin.token'
const ADMIN_EMAIL_STORAGE_KEY = 'Trail.admin.email'
const LEGACY_AUTH_TOKEN_STORAGE_KEY = 'trail.auth.token'
const LEGACY_ADMIN_TOKEN_STORAGE_KEY = 'trail.admin.token'
const LEGACY_ADMIN_EMAIL_STORAGE_KEY = 'trail.admin.email'

const USER_EXPIRED_REDIRECT = '/auth?mode=register&reason=expired'
const ADMIN_EXPIRED_REDIRECT = '/admin/login?reason=expired'

export function handleExpiredSession(requestPath: string) {
  if (typeof window === 'undefined') {
    return
  }

  const isAdminRequest = requestPath.startsWith('/admin/')

  if (isAdminRequest) {
    window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
    window.localStorage.removeItem(ADMIN_EMAIL_STORAGE_KEY)
    window.localStorage.removeItem(LEGACY_ADMIN_TOKEN_STORAGE_KEY)
    window.localStorage.removeItem(LEGACY_ADMIN_EMAIL_STORAGE_KEY)
  } else {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    window.localStorage.removeItem(LEGACY_AUTH_TOKEN_STORAGE_KEY)
  }

  const redirectPath = isAdminRequest ? ADMIN_EXPIRED_REDIRECT : USER_EXPIRED_REDIRECT
  const currentPath = `${window.location.pathname}${window.location.search}`

  if (currentPath !== redirectPath) {
    window.location.replace(redirectPath)
  }
}
