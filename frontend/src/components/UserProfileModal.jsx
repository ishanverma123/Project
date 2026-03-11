import { useEffect, useState } from 'react'
import { getPublicUserProfile } from '../lib/api'

function initials(profile) {
  const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()
  if (!fullName) return (profile?.username || 'U').slice(0, 1).toUpperCase()
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0].toUpperCase())
    .join('')
}

export default function UserProfileModal({ userId, onClose }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      setLoading(true)
      setError('')
      try {
        const data = await getPublicUserProfile(userId)
        if (!cancelled) setProfile(data)
      } catch (e) {
        if (!cancelled) {
          setError(e.message || 'Failed to load profile details')
          setProfile(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (userId) loadProfile()

    return () => {
      cancelled = true
    }
  }, [userId])

  if (!userId) return null

  return (
    <div className="inquiry-modal-backdrop" onClick={onClose} role="presentation">
      <div className="inquiry-modal user-profile-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="inquiry-modal-header">
          <h2>User profile</h2>
          <button type="button" className="inquiry-modal-close" onClick={onClose} aria-label="Close profile modal">
            Close
          </button>
        </div>

        {loading && <p className="muted">Loading profile...</p>}
        {!loading && error && <div className="panel-error" role="alert">{error}</div>}

        {!loading && !error && profile && (
          <div className="user-profile-modal-body">
            {profile.profile_photo ? (
              <img src={profile.profile_photo} alt={profile.username} className="user-profile-modal-avatar" />
            ) : (
              <div className="user-profile-modal-avatar user-profile-modal-avatar-fallback">{initials(profile)}</div>
            )}

            <h3>{`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username}</h3>
            <p className="muted">@{profile.username} · {profile.role}</p>

            <div className="user-profile-modal-grid">
              <p><strong>Email:</strong> {profile.email || 'Not provided'}</p>
              <p><strong>Phone:</strong> {profile.phone || 'Not provided'}</p>
              <p><strong>Rides listed:</strong> {profile.rides_listed_count ?? 0}</p>
              <p><strong>Rides booked:</strong> {profile.rides_booked_count ?? 0}</p>
            </div>

            {profile.bio && <p className="user-profile-modal-bio">{profile.bio}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
