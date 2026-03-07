import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext({
  user: null,
  loading: true,
  setUser: () => {},
  refreshUser: () => {},
  logout: async () => {},
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchMe() {
      try {
        const res = await fetch('/api/auth/me/', {
          credentials: 'include',
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
    try {
      const res = await fetch('/api/auth/me/', {
        credentials: 'include',
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

export function useAuth() {
  return useContext(AuthContext)
}

