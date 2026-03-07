import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/authContext'

export default function RequireRole({ allow, children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="page"><p className="muted">Loading…</p></div>
  if (!user) return <Navigate to="/signin" state={{ from: location }} replace />

  const allowed = Array.isArray(allow) ? allow : [allow]
  if (!allowed.includes(user.role)) {
    return <Navigate to={user.role === 'landlord' ? '/dashboard' : '/home'} replace />
  }

  return children
}

