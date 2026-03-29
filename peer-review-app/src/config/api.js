const LOCAL_DEV_API = 'http://localhost:8080/api'

function normalizeBaseUrl(url) {
  return url.endsWith('/') ? url.slice(0, -1) : url
}

function resolveApiBaseUrl() {
  const configured = String(import.meta.env.VITE_API_BASE_URL || '').trim()
  if (configured) {
    return normalizeBaseUrl(configured)
  }

  if (import.meta.env.DEV) {
    return LOCAL_DEV_API
  }

  // In production, avoid localhost fallback and prefer same-origin /api.
  console.warn('VITE_API_BASE_URL is not set; using same-origin /api fallback.')
  return '/api'
}

export const API_BASE_URL = resolveApiBaseUrl()

export function apiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}
