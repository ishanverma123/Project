import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import LandlordDashboard from './LandlordDashboard'
import UserDashboard from './UserDashboard'

export default function Dashboard() {
  const { user, loading } = useAuth()

  if (loading) return <div className="page"><p className="muted">Loading…</p></div>
  if (!user) return <Navigate to="/signin" replace />

  if (user.role === 'driver') return <LandlordDashboard />
  return <UserDashboard />
}

