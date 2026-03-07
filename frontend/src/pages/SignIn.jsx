import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../lib/api'
import { useAuth } from '../lib/authContext'
import './Auth.css'

export default function SignIn() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ username: '', password: '', role: 'tenant' })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login({ username: form.username.trim(), password: form.password })
      setUser(user)
      navigate(user?.role === 'landlord' ? '/dashboard' : '/home')
    } catch (err) {
      setError(err.message || 'Invalid username or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen signin-screen">
      <div className="auth-hero auth-hero-signin">
        <h1 className="auth-brand">Smart Rental</h1>
        <p className="auth-tagline">Welcome back.</p>
      </div>
      <div className="auth-card-wrapper">
        <div className="auth-card">
          <h2 className="auth-card-title">Sign in to your account</h2>
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-error" role="alert">{error}</div>}
            <div className="auth-row">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={form.username}
                onChange={handleChange}
                required
                placeholder="Your username"
              />
            </div>
            <div className="auth-row">
              <label>Sign in as</label>
              <div className="role-select">
                <label className={`role-option ${form.role === 'tenant' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="tenant"
                    checked={form.role === 'tenant'}
                    onChange={handleChange}
                  />
                  <span className="role-icon" aria-hidden>👤</span>
                  <span className="role-label">Tenant</span>
                  <span className="role-sublabel">Looking to rent</span>
                </label>
                <label className={`role-option ${form.role === 'landlord' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="landlord"
                    checked={form.role === 'landlord'}
                    onChange={handleChange}
                  />
                  <span className="role-icon" aria-hidden>🏠</span>
                  <span className="role-label">Landlord</span>
                  <span className="role-sublabel">Managing listings</span>
                </label>
              </div>
            </div>
            <div className="auth-row">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Your password"
              />
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="auth-switch">
            Don&apos;t have an account? <Link to="/">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
