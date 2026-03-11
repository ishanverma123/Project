import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../lib/api'
import { useAuth } from '../lib/authContext'
import './Auth.css'

export default function SignUp() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    role: 'traveller',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.password_confirm) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      const user = await register({
        username: form.username.trim(),
        email: form.email.trim() || undefined,
        password: form.password,
        first_name: form.first_name.trim() || undefined,
        last_name: form.last_name.trim() || undefined,
        role: form.role,
      })
      setUser(user)
      navigate(user?.role === 'driver' ? '/dashboard' : '/home')
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen signup-screen">
      <div className="auth-hero">
        <h1 className="auth-brand">Smart Rental</h1>
        <p className="auth-tagline">Book shared rides or drive and list your journey.</p>
      </div>
      <div className="auth-card-wrapper">
        <div className="auth-card">
          <h2 className="auth-card-title">Create your account</h2>
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-error" role="alert">{error}</div>}
            <div className="auth-row">
              <label htmlFor="username">Username *</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={form.username}
                onChange={handleChange}
                required
                placeholder="Choose a username"
              />
            </div>
            <div className="auth-row">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
              />
            </div>
            <div className="auth-row auth-row-split">
              <div>
                <label htmlFor="first_name">First name</label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  autoComplete="given-name"
                  value={form.first_name}
                  onChange={handleChange}
                  placeholder="First name"
                />
              </div>
              <div>
                <label htmlFor="last_name">Last name</label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  autoComplete="family-name"
                  value={form.last_name}
                  onChange={handleChange}
                  placeholder="Last name"
                />
              </div>
            </div>
            <div className="auth-row">
              <label>I want to</label>
              <div className="role-select">
                <label className={`role-option ${form.role === 'traveller' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="traveller"
                    checked={form.role === 'traveller'}
                    onChange={handleChange}
                  />
                  <span className="role-icon" aria-hidden>👤</span>
                  <span className="role-label">Book shared rides</span>
                  <span className="role-sublabel">Traveller</span>
                </label>
                <label className={`role-option ${form.role === 'driver' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="driver"
                    checked={form.role === 'driver'}
                    onChange={handleChange}
                  />
                  <span className="role-icon" aria-hidden>🚗</span>
                  <span className="role-label">List my ride</span>
                  <span className="role-sublabel">Driver</span>
                </label>
              </div>
            </div>
            <div className="auth-row">
              <label htmlFor="password">Password *</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
                placeholder="At least 8 characters"
              />
            </div>
            <div className="auth-row">
              <label htmlFor="password_confirm">Confirm password *</label>
              <input
                id="password_confirm"
                name="password_confirm"
                type="password"
                autoComplete="new-password"
                value={form.password_confirm}
                onChange={handleChange}
                required
                placeholder="Repeat your password"
              />
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Sign up'}
            </button>
          </form>
          <p className="auth-switch">
            Already have an account? <Link to="/signin">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
