import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import './Layout.css'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const isAuthPage = location.pathname === '/' || location.pathname === '/signin'
  const homeHref = user?.role === 'driver' ? '/dashboard' : '/home'

  const handleSignOut = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="layout">
      <header className={`layout-header ${isAuthPage ? 'layout-header-auth' : ''}`}>
        <Link to={isAuthPage ? '/' : homeHref} className="logo">
          Smart Carpool
        </Link>
        <nav>
          {user ? (
            <>
              {!isAuthPage && (
                <>
                  {user.role === 'traveller' && <Link to="/home">Rides</Link>}
                  <Link to="/dashboard">Dashboard</Link>
                </>
              )}
              <span className="navbar-username">Hi, {user.first_name} {user.last_name}</span>
              <button type="button" className="navbar-signout" onClick={handleSignOut}>
                Sign out
              </button>
            </>
          ) : isAuthPage ? (
            location.pathname === '/' ? (
              <Link to="/signin">Sign in</Link>
            ) : (
              <Link to="/">Sign up</Link>
            )
          ) : (
            <>
              <Link to="/home">Home</Link>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/signin">Sign in</Link>
            </>
          )}
        </nav>
      </header>
      <main className={`layout-main ${isAuthPage ? 'layout-main-auth' : ''}`}>
        <Outlet />
      </main>
    </div>
  )
}
