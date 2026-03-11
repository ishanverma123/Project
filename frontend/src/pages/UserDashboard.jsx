import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listMyBookings } from '../lib/api'
import UserProfileModal from '../components/UserProfileModal'

export default function UserDashboard() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedProfileUserId, setSelectedProfileUserId] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await listMyBookings()
        setBookings(data)
      } catch (e) {
        setError(e.message || 'Failed to load bookings')
        setBookings([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return (
    <div className="dashboard-shell">
      <div className="page dashboard-page">
        <header className="dashboard-header">
          <div>
            <h1>Traveller Dashboard</h1>
            <p className="muted">Track your booked rides and travel details.</p>
          </div>
          <div className="dashboard-header-actions">
            <Link className="button secondary" to="/profile">
              My profile
            </Link>
            <Link className="button primary" to="/home">
              Browse rides
            </Link>
          </div>
        </header>

        {error && <div className="panel-error" role="alert">{error}</div>}

        <section className="dashboard-sections">
          <article className="panel dashboard-card">
            <h2>My ride bookings</h2>
            {loading && <p className="muted">Loading…</p>}
            {!loading && bookings.length === 0 && <p className="muted">No rides booked yet.</p>}
            {!loading && bookings.length > 0 && (
              <ul className="inquiry-list">
                {bookings.map((b) => (
                  <li key={b.id} className="inquiry-item">
                    <div className="inquiry-main">
                      <div className="inquiry-header-row">
                        <span className="inquiry-tenant">{b.ride_title || `Ride #${b.property}`}</span>
                        <span className={`inquiry-status inquiry-status-${b.status}`}>{b.status}</span>
                      </div>
                      <div className="booking-driver-row">
                        {b.driver_profile_photo ? (
                          <img
                            src={b.driver_profile_photo}
                            alt={b.driver_name || 'Driver'}
                            className="booking-driver-avatar avatar-clickable"
                            onClick={() => setSelectedProfileUserId(b.driver_id)}
                          />
                        ) : (
                          <div
                            className="booking-driver-avatar booking-driver-avatar-fallback avatar-clickable"
                            onClick={() => setSelectedProfileUserId(b.driver_id)}
                          >
                            {(b.driver_name || 'D').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <span className="muted">Driver: {b.driver_name || 'Unknown'}</span>
                      </div>
                      <p className="inquiry-message">Seats booked: {b.passenger_count}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>
      </div>
      {selectedProfileUserId && (
        <UserProfileModal userId={selectedProfileUserId} onClose={() => setSelectedProfileUserId(null)} />
      )}
    </div>
  )
}
