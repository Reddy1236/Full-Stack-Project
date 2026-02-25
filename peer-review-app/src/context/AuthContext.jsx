import { createContext, useContext, useState } from 'react'
import { API_BASE_URL } from '../config/api'

const AuthContext = createContext(null)

function toAppRole(role) {
  return String(role || '').toLowerCase() === 'teacher' ? 'teacher' : 'student'
}

async function readApiError(response, fallback) {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const data = await response.json().catch(() => null)
    const message = data?.message || data?.error
    if (message) return String(message)
  }

  const text = await response.text().catch(() => '')
  return text || fallback
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('peerReview_user') || sessionStorage.getItem('peerReview_user')
    if (!saved) return null

    try {
      return JSON.parse(saved)
    } catch {
      localStorage.removeItem('peerReview_user')
      sessionStorage.removeItem('peerReview_user')
      return null
    }
  })
  const [loading] = useState(false)

  const login = async (email, password, role, rememberMe) => {
    try {
      const e = String(email || '').trim().toLowerCase()
      const p = String(password || '').trim()

      if (!e || !p) {
        return { success: false, error: 'Email and password are required.' }
      }

      const loginPayload = { email: e, password: p }
      const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginPayload),
      })

      if (!loginRes.ok) {
        if (loginRes.status === 401) {
          return { success: false, error: 'Account not found or password incorrect. Please register first.' }
        }

        const errorMessage = await readApiError(loginRes, 'Login failed. Please try again.')
        return { success: false, error: errorMessage }
      }

      const data = await loginRes.json()
      const userData = {
        id: data.id,
        email: data.email,
        name: data.name,
        role: toAppRole(data.role),
      }
      setUser(userData)
      if (rememberMe) {
        localStorage.setItem('peerReview_user', JSON.stringify(userData))
        sessionStorage.removeItem('peerReview_user')
      } else {
        localStorage.removeItem('peerReview_user')
        sessionStorage.setItem('peerReview_user', JSON.stringify(userData))
      }
      return { success: true, role: userData.role }
    } catch {
      return { success: false, error: 'Cannot connect to backend server. Please try again.' }
    }
  }

  const register = async ({ email, password, name, role }) => {
    try {
      const e = String(email || '').trim().toLowerCase()
      const p = String(password || '').trim()
      const n = String(name || '').trim()
      const r = toAppRole(role)
      if (!e || !p || !n) {
        return { success: false, error: 'Name, email, and password are required.' }
      }

      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: e,
          password: p,
          name: n,
          role: r.toUpperCase(),
        }),
      })

      if (res.status === 409) {
        return { success: false, error: 'Email already registered. Please login.' }
      }
      if (!res.ok) {
        const errorMessage = await readApiError(res, 'Registration failed. Try again.')
        return { success: false, error: errorMessage }
      }

      let message = 'Successfully registered. Please login with the same credentials.'
      try {
        const data = await res.json()
        if (data?.message) message = data.message
      } catch {
        // Keep default success message even if backend returns empty/non-JSON body.
      }

      return { success: true, message }
    } catch {
      return { success: false, error: 'Cannot connect to backend server. Please try again.' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('peerReview_user')
    sessionStorage.removeItem('peerReview_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
