import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { updateMyProfile } from '../lib/api'
import { useAuth } from '../lib/useAuth'

function initials(user) {
  const name = `${user?.first_name || ''} ${user?.last_name || ''}`.trim()
  if (!name) return (user?.username || 'U').slice(0, 1).toUpperCase()
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

export default function MyProfile() {
  const { user, loading, setUser } = useAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [form, setForm] = useState({
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
  })

  useEffect(() => {
    if (!user) return
    setForm({
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      bio: user.bio || '',
    })
  }, [user])

  useEffect(() => {
    if (!photoFile) {
      setPreviewUrl('')
      return
    }
    const url = URL.createObjectURL(photoFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [photoFile])
  const photoPreview = previewUrl || user?.profile_photo || ''


  if (loading) return <div className="page"><p className="muted">Loading…</p></div>
  if (!user) return <Navigate to="/signin" replace />

  const roleLabel = user.role === 'driver' ? 'Driver' : 'Traveller'

  const handleChange = (e) => {
    const { name, value } = e.target
    setError('')
    setSuccess('')
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('email', form.email.trim())
      formData.append('first_name', form.first_name.trim())
      formData.append('last_name', form.last_name.trim())
      formData.append('phone', form.phone.trim())
      formData.append('bio', form.bio)
      if (photoFile) formData.append('profile_photo', photoFile)

      const updated = await updateMyProfile(formData)
      setUser(updated)
      setPhotoFile(null)
      setSuccess('Profile updated successfully.')
    } catch (err) {
      setError(err.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dashboard-shell">
      <div className="page profile-page">
        <header className="dashboard-header">
          <div>
            <h1>My Profile</h1>
            <p className="muted">Manage your account details and profile picture.</p>
          </div>
          <span className="profile-role-pill">{roleLabel}</span>
        </header>

        <section className="profile-grid">
          <article className="panel profile-summary-card">
            <div className="profile-avatar-wrap">
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" className="profile-avatar-xl" />
              ) : (
                <div className="profile-avatar-xl profile-avatar-fallback">{initials(user)}</div>
              )}
            </div>
            <h2>{`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username}</h2>
            <p className="muted">@{user.username}</p>
            <p className="profile-email">{user.email || 'No email added'}</p>

            <div className="profile-stats-grid">
              <div className="profile-stat-card">
                <span>Rides listed</span>
                <strong>{user.rides_listed_count ?? 0}</strong>
              </div>
              <div className="profile-stat-card">
                <span>Rides booked</span>
                <strong>{user.rides_booked_count ?? 0}</strong>
              </div>
            </div>
          </article>

          <article className="panel profile-form-card">
            <h2>Edit profile</h2>
            {error && <div className="panel-error" role="alert">{error}</div>}
            {success && <p className="profile-success">{success}</p>}

            <form className="profile-form" onSubmit={handleSubmit}>
              <div className="profile-form-row">
                <label>
                  <span>Email</span>
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" />
                </label>
              </div>

              <div className="profile-form-row profile-form-row-split">
                <label>
                  <span>First name</span>
                  <input name="first_name" value={form.first_name} onChange={handleChange} placeholder="First name" />
                </label>
                <label>
                  <span>Last name</span>
                  <input name="last_name" value={form.last_name} onChange={handleChange} placeholder="Last name" />
                </label>
              </div>

              <div className="profile-form-row profile-form-row-split">
                <label>
                  <span>Phone</span>
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone number" />
                </label>
                <label>
                  <span>Profile picture</span>
                  <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>

              <div className="profile-form-row">
                <label>
                  <span>Bio</span>
                  <textarea name="bio" rows={4} value={form.bio} onChange={handleChange} placeholder="Tell people a little about yourself" />
                </label>
              </div>

              <div className="profile-actions">
                <button type="submit" className="button primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save profile'}
                </button>
              </div>
            </form>
          </article>
        </section>
      </div>
    </div>
  )
}
