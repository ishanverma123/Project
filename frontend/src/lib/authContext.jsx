import { useEffect, useState } from 'react'
import { AuthContext } from './authContextStore'

const AUTH_REQUEST_TIMEOUT_MS = 8000

function withTimeout(signal, timeoutMs = AUTH_REQUEST_TIMEOUT_MS) {
  const controller = new AbortController()
  const timerId = setTimeout(() => controller.abort(), timeoutMs)

  const cleanup = () => clearTimeout(timerId)

  if (signal) {
    signal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  return { signal: controller.signal, cleanup }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchMe() {
      const { signal, cleanup } = withTimeout()
      try {
        const res = await fetch('/api/auth/me/', {
          credentials: 'include',
          signal,
        })
        if (!res.ok) {
          if (!cancelled) setUser(null)
          return
        }
        const data = await res.json()
        if (!cancelled) setUser(data)
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        cleanup()
        if (!cancelled) setLoading(false)
      }
    }

    fetchMe()

    return () => {
      cancelled = true
    }
  }, [])

  const refreshUser = async () => {
    setLoading(true)
    const { signal, cleanup } = withTimeout()
    try {
      const res = await fetch('/api/auth/me/', {
        credentials: 'include',
        signal,
      })
      if (!res.ok) {
        setUser(null)
        return
      }
      const data = await res.json()
      setUser(data)
    } catch {
      setUser(null)
    } finally {
      cleanup()
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout/', {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      // ignore network errors here; we'll still clear local state
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, setUser, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

