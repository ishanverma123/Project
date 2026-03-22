import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { acceptCounterOffer, listMyBookings, negotiateBookingBid } from '../lib/api'
import UserProfileModal from '../components/UserProfileModal'

export default function UserDashboard() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedProfileUserId, setSelectedProfileUserId] = useState(null)
  const [bidDrafts, setBidDrafts] = useState({})
  const [negotiatingId, setNegotiatingId] = useState(null)
  const [acceptingId, setAcceptingId] = useState(null)

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

  const loadBookings = async () => {
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

  const submitCounterBid = async (booking) => {
    const draft = bidDrafts[booking.id]
    if (!draft) {
      setError('Enter your updated bid first.')
      return
    }
    setNegotiatingId(booking.id)
    setError('')
    try {
      await negotiateBookingBid(booking.id, draft)
      await loadBookings()
    } catch (e) {
      setError(e.message || 'Failed to submit bid')
    } finally {
      setNegotiatingId(null)
    }
  }

  const acceptDriverCounter = async (booking) => {
    setAcceptingId(booking.id)
    setError('')
    try {
      await acceptCounterOffer(booking.id)
      await loadBookings()
    } catch (e) {
      setError(e.message || 'Failed to accept counter-offer')
    } finally {
      setAcceptingId(null)
    }
  }

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
                      <p className="inquiry-message">
                        Listed: ${b.listed_price_per_seat || 0} · Platform: ${b.platform_suggested_price_per_seat || 0}
                      </p>
                      <p className="inquiry-message">
                        Your bid: {b.requested_bid_per_seat ? `$${b.requested_bid_per_seat}` : 'No bid submitted'}
                      </p>
                      {b.driver_counter_offer_per_seat && (
                        <p className="inquiry-message">
                          Driver counter-offer: ${b.driver_counter_offer_per_seat}
                        </p>
                      )}
                      {b.status === 'countered' && (
                        <div className="booking-negotiation-row">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={bidDrafts[b.id] || ''}
                            onChange={(e) => setBidDrafts((prev) => ({ ...prev, [b.id]: e.target.value }))}
                            placeholder="Your new bid per seat"
                            aria-label="Your new bid per seat"
                          />
                          <button
                            type="button"
                            className="button secondary small-button"
                            onClick={() => submitCounterBid(b)}
                            disabled={negotiatingId === b.id}
                          >
                            {negotiatingId === b.id ? 'Submitting…' : 'Send counter bid'}
                          </button>
                          <button
                            type="button"
                            className="button primary small-button"
                            onClick={() => acceptDriverCounter(b)}
                            disabled={acceptingId === b.id}
                          >
                            {acceptingId === b.id ? 'Accepting…' : 'Accept driver offer'}
                          </button>
                        </div>
                      )}
                      {Array.isArray(b.negotiation_events) && b.negotiation_events.length > 0 && (
                        <div className="booking-timeline">
                          <p className="booking-timeline-title">Negotiation timeline</p>
                          <ul>
                            {b.negotiation_events.map((event) => (
                              <li key={event.id}>
                                <span className="booking-timeline-time">{new Date(event.created_at).toLocaleString()}</span>
                                <span className="booking-timeline-message">{event.message}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
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
