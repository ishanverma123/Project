import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import './Layout.css'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isAuthPage = location.pathname === '/' || location.pathname === '/signin'
  const homeHref = user?.role === 'driver' ? '/dashboard' : '/home'

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const handleSignOut = async () => {
    await logout()
    setMobileMenuOpen(false)
    navigate('/')
  }

  const handleNavItemClick = () => {
    setMobileMenuOpen(false)
  }

  return (
    <div className="layout">
      <header className={`layout-header ${isAuthPage ? 'layout-header-auth' : ''}`}>
        <Link to={isAuthPage ? '/' : homeHref} className="logo">
          Carpool
        </Link>
        <button
          type="button"
          className="layout-menu-toggle"
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle navigation"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
        >
          {mobileMenuOpen ? 'Close' : 'Menu'}
        </button>
        <nav className={mobileMenuOpen ? 'nav-open' : ''}>
          {user ? (
            <>
              {!isAuthPage && (
                <>
                  {user.role === 'traveller' && <Link to="/home" onClick={handleNavItemClick}>Rides</Link>}
                  <Link to="/dashboard" onClick={handleNavItemClick}>Dashboard</Link>
                  <Link to="/profile" onClick={handleNavItemClick}>My Profile</Link>
                </>
              )}
              <span className="navbar-username">Hi, {user.first_name} {user.last_name}</span>
              <button type="button" className="navbar-signout" onClick={handleSignOut}>
                Sign out
              </button>
            </>
          ) : isAuthPage ? (
            location.pathname === '/' ? (
              <Link to="/signin" onClick={handleNavItemClick}>Sign in</Link>
            ) : (
              <Link to="/" onClick={handleNavItemClick}>Sign up</Link>
            )
          ) : (
            <>
              <Link to="/home" onClick={handleNavItemClick}>Home</Link>
              <Link to="/dashboard" onClick={handleNavItemClick}>Dashboard</Link>
              <Link to="/signin" onClick={handleNavItemClick}>Sign in</Link>
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
