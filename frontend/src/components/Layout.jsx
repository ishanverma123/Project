import { Link, Outlet, useLocation } from 'react-router-dom'
import './Layout.css'

export default function Layout() {
  const location = useLocation()
  const isAuthPage = location.pathname === '/' || location.pathname === '/signin'

  return (
    <div className="layout">
      <header className={`layout-header ${isAuthPage ? 'layout-header-auth' : ''}`}>
        <Link to={isAuthPage ? '/' : '/home'} className="logo">
          Smart Rental
        </Link>
        <nav>
          {isAuthPage ? (
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
