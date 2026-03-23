import { useCallback, useEffect, useState } from 'react'
import { createRideBooking, listMyBookings, searchRides } from '../lib/api'
import UserProfileModal from '../components/UserProfileModal'

const normalizeText = (value) => String(value || '').trim().toLowerCase()

const matchesFilters = (ride, params = {}) => {
  const fromCity = normalizeText(params.from_city)
  const toCity = normalizeText(params.to_city)
  const departureDate = String(params.departure_date || '').trim()

  const rideFrom = normalizeText(ride?.from_city)
  const rideTo = normalizeText(ride?.to_city)
  const rideDepartureRaw = typeof ride?.departure_time === 'string' ? ride.departure_time : ''
  const rideDepartureDate = rideDepartureRaw.slice(0, 10)

  if (fromCity && !rideFrom.includes(fromCity)) return false
  if (toCity && !rideTo.includes(toCity)) return false
  if (departureDate && rideDepartureDate !== departureDate) return false

  return true
}

export default function Home() {
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bookingError, setBookingError] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState('')
  const [search, setSearch] = useState({ from_city: '', to_city: '', departure_date: '' })
  const [myBookingsByRide, setMyBookingsByRide] = useState({})
  const [selectedRide, setSelectedRide] = useState(null)
  const [selectedProfileUserId, setSelectedProfileUserId] = useState(null)
  const [bookingDraftByRide, setBookingDraftByRide] = useState({})

  const loadMyBookings = useCallback(async () => {
    try {
      const bookings = await listMyBookings()
      const map = {}
      bookings.forEach((b) => {
        const current = map[b.property]
        if (!current || new Date(b.created_at) > new Date(current.created_at)) {
          map[b.property] = b
        }
      })
      setMyBookingsByRide(map)
    } catch {
      setMyBookingsByRide({})
    }
  }, [])

  const loadRides = useCallback(async (params = {}) => {
    setLoading(true)
    setError('')
    try {
      const data = await searchRides(params)
      setRides(data.filter((ride) => matchesFilters(ride, params)))
    } catch (e) {
      setError(e.message || 'Failed to load rides')
      setRides([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRides()
    loadMyBookings()
  }, [loadMyBookings, loadRides])

  const handleBookRide = async (rideId) => {
    setBookingError('')
    setBookingSuccess('')
    const draft = bookingDraftByRide[rideId] || {}
    const passengerCount = Number(draft.passenger_count || 1)
    const bidValue = draft.requested_bid_per_seat
    const payload = {
      property: rideId,
      passenger_count: Number.isFinite(passengerCount) && passengerCount > 0 ? passengerCount : 1,
    }
    if (bidValue !== undefined && bidValue !== null && String(bidValue).trim() !== '') {
      payload.requested_bid_per_seat = bidValue
    }

    try {
      await createRideBooking(payload)
      setBookingSuccess('Booking request sent to driver.')
      await loadRides(search)
      await loadMyBookings()
    } catch (e) {
      setBookingError(e.message || 'Failed to book ride')
    }
  }

  const statusLabel = (status) => {
    if (status === 'approved' || status === 'confirmed') return 'Approved'
    if (status === 'rejected') return 'Cancelled'
    if (status === 'countered') return 'Driver countered'
    return 'Requested'
  }

  const statusClass = (status) => {
    if (status === 'approved' || status === 'confirmed') return 'inquiry-status-approved'
    if (status === 'rejected') return 'inquiry-status-rejected'
    if (status === 'countered') return 'inquiry-status-pending'
    return 'inquiry-status-pending'
  }

  const handleSearchSubmit = async (e) => {
    e.preventDefault()
    await loadRides(search)
  }

  const handleResetSearch = async () => {
    const reset = { from_city: '', to_city: '', departure_date: '' }
    setSearch(reset)
    await loadRides(reset)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setSearch((prev) => ({ ...prev, [name]: value }))
  }

  const formatDeparture = (ride) => {
    if (!ride?.departure_time) return 'Not specified'
    const date = new Date(ride.departure_time)
    if (Number.isNaN(date.getTime())) return 'Not specified'
    return date.toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const handleDraftChange = (rideId, key, value) => {
    setBookingDraftByRide((prev) => ({
      ...prev,
      [rideId]: {
        ...(prev[rideId] || {}),
        [key]: value,
      },
    }))
  }

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-overlay" />
        <div className="home-hero-content">
          <h1>Find your next ride.</h1>
          <p>Search rides by journey and date, then book your seat instantly.</p>
          <form className="home-hero-search" onSubmit={handleSearchSubmit}>
            <label className="search-field" htmlFor="from_city">
              <span>From</span>
              <input
                id="from_city"
                name="from_city"
                type="text"
                value={search.from_city}
                onChange={handleChange}
                placeholder="Origin city"
                aria-label="Search by origin city"
              />
            </label>
            <label className="search-field" htmlFor="to_city">
              <span>To</span>
              <input
                id="to_city"
                name="to_city"
                type="text"
                value={search.to_city}
                onChange={handleChange}
                placeholder="Destination city"
                aria-label="Search by destination city"
              />
            </label>
            <label className="search-field" htmlFor="departure_date">
              <span>Date</span>
              <input
                id="departure_date"
                name="departure_date"
                type="date"
                value={search.departure_date}
                onChange={handleChange}
                aria-label="Search by departure date"
              />
            </label>
            <div className="search-actions">
              <button type="submit">Search</button>
              <button type="button" className="button secondary" onClick={handleResetSearch}>
                Reset
              </button>
            </div>
          </form>
        </div>
      </section>

      <div className="page home-page-inner">
        <section className="home-section-header">
          <h2 style={{color:"grey"}}>Available rides</h2>
          <p>See driver details, seats left, and booked passengers before reserving your seat.</p>
        </section>
        {error && <div className="panel-error" role="alert">{error}</div>}
        {bookingError && <div className="panel-error" role="alert">{bookingError}</div>}
        {bookingSuccess && <p className="muted">{bookingSuccess}</p>}

        <section className="property-cards">
          {loading && <p className="muted">Loading rides…</p>}
          {!loading && rides.length === 0 && <p className="muted">No rides found for this search.</p>}
          {!loading &&
            rides.map((p, index) => {
              const myBooking = myBookingsByRide[p.id]
              const alreadyRequested = Boolean(myBooking)
              const fareDelta = Number(p.fare_comparison?.difference ?? 0)
              const fareDeltaAbs = Math.abs(fareDelta).toFixed(2)
              const fareTrend = fareDelta > 0 ? 'higher' : fareDelta < 0 ? 'lower' : 'equal'
              const gradientClass =
                index % 3 === 0 ? 'property-card-image-1' : index % 3 === 1 ? 'property-card-image-2' : 'property-card-image-3'
              const imageStyle = p.image
                ? { backgroundImage: `url(${p.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : {}
              return (
                <article
                  key={p.id}
                  className={`property-card property-card-clickable property-card-list property-card-trend-${fareTrend}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedRide(p)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedRide(p)
                    }
                  }}
                >
                  <div className={`property-card-image ${gradientClass}`} style={imageStyle}>
                    <div className="ride-card-driver-avatar-wrap">
                      {p.driver_profile_photo ? (
                        <img
                          src={p.driver_profile_photo}
                          alt={p.driver_name || 'Driver'}
                          className="ride-card-driver-avatar avatar-clickable"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedProfileUserId(p.driver)
                          }}
                        />
                      ) : (
                        <div
                          className="ride-card-driver-avatar ride-card-driver-avatar-fallback avatar-clickable"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedProfileUserId(p.driver)
                          }}
                        >
                          {(p.driver_name || 'D').slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="property-card-body">
                    <div className="property-card-headline">
                      <h3>{p.title}</h3>
                      <span className="price-chip">${p.price_per_seat}/seat</span>
                    </div>
                    <div className={`fare-badge fare-badge-${fareTrend} fare-badge-inline`}>
                      Suggested ${p.platform_suggested_price_per_seat ?? p.price_per_seat}
                      {fareTrend === 'equal'
                        ? ' (matches listed)'
                        : ` (${fareDeltaAbs} ${fareTrend} than listed)`}
                    </div>
                    <p className="property-address">{p.from_city} to {p.to_city}</p>
                    <p className="property-meta">
                      Driver: {p.driver_name} · Seats left: {p.seats_left}
                    </p>
                    <p className="property-meta">
                      Difference vs listed: ${p.fare_comparison?.difference ?? 0}
                      {' '}({p.fare_comparison?.comparison || 'equal'})
                    </p>
                    <p className="property-meta">Booked passengers: {p.booked_passengers_count}</p>
                    {myBooking && (
                      <div className="card-actions" style={{ marginTop: '0.35rem' }}>
                        <span className={`inquiry-status ${statusClass(myBooking.status)}`}>
                          {statusLabel(myBooking.status)}
                        </span>
                      </div>
                    )}
                    {Array.isArray(p.booked_passengers) && p.booked_passengers.length > 0 && (
                      <p className="property-meta">
                        {p.booked_passengers.map((bp) => `${bp.name} (${bp.passenger_count})`).join(', ')}
                      </p>
                    )}
                    <div className="card-actions">
                      <button
                        type="button"
                        className="property-card-secondary-btn open-modal-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedRide(p)
                        }}
                      >
                        {alreadyRequested ? 'Manage in details' : 'Open details'}
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
        </section>
      </div>

      {selectedRide && (
        <div className="inquiry-modal-backdrop ride-detail-backdrop" onClick={() => setSelectedRide(null)} role="presentation">
          <div className="inquiry-modal ride-detail-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="inquiry-modal-header">
              <h2>{selectedRide.title}</h2>
              <button type="button" className="inquiry-modal-close" onClick={() => setSelectedRide(null)} aria-label="Close details modal">
                Close
              </button>
            </div>
            <div className="ride-detail-grid">
              <p><strong>Route:</strong> {selectedRide.from_city} to {selectedRide.to_city}</p>
              <p><strong>Departure:</strong> {formatDeparture(selectedRide)}</p>
              <p><strong>Driver:</strong> {selectedRide.driver_name || 'Not specified'}</p>
              <p><strong>Car:</strong> {selectedRide.car_make || ''} {selectedRide.car_model || ''} {selectedRide.car_year ? `(${selectedRide.car_year})` : ''}</p>
              <p><strong>Price:</strong> ${selectedRide.price_per_seat} per seat</p>
              <p><strong>Platform suggested:</strong> ${selectedRide.platform_suggested_price_per_seat ?? selectedRide.price_per_seat} per seat</p>
              <p><strong>Demand multiplier:</strong> {selectedRide.fare_comparison?.demand_multiplier ?? 1}</p>
              <p><strong>Fuel surcharge/km:</strong> ${selectedRide.fare_comparison?.inputs?.fuel_surcharge_per_km ?? 0}</p>
              <p><strong>Distance / Duration:</strong> {selectedRide.fare_comparison?.inputs?.distance_km ?? 0} km / {selectedRide.fare_comparison?.inputs?.estimated_duration_min ?? 0} min</p>
              <p><strong>Seats:</strong> {selectedRide.seats_left} left of {selectedRide.max_passengers}</p>
            </div>
            {(() => {
              const selectedBooking = myBookingsByRide[selectedRide.id]
              if (!selectedBooking) return <p className="muted">No booking yet. You can request seats with your bid below.</p>

              return (
                <div className="selected-booking-state">
                  <p>
                    <strong>Current booking status:</strong>{' '}
                    <span className={`inquiry-status ${statusClass(selectedBooking.status)}`}>{statusLabel(selectedBooking.status)}</span>
                  </p>
                  {selectedBooking.requested_bid_per_seat && (
                    <p><strong>Your latest bid:</strong> ${selectedBooking.requested_bid_per_seat} per seat</p>
                  )}
                  {selectedBooking.driver_counter_offer_per_seat && (
                    <p><strong>Driver counter-offer:</strong> ${selectedBooking.driver_counter_offer_per_seat} per seat</p>
                  )}
                </div>
              )
            })()}
            {selectedRide.fare_comparison?.breakdown && (
              <div className="ride-fare-breakdown">
                <h4>Price trail</h4>
                <ul>
                  <li>Base fare: ${selectedRide.fare_comparison.breakdown.base_component}</li>
                  <li>Distance component: ${selectedRide.fare_comparison.breakdown.distance_component}</li>
                  <li>Duration component: ${selectedRide.fare_comparison.breakdown.duration_component}</li>
                  <li>Fuel component: ${selectedRide.fare_comparison.breakdown.fuel_component}</li>
                  <li>Demand surge: ${selectedRide.fare_comparison.breakdown.surge_component}</li>
                  <li>Peak-hour adjustment: ${selectedRide.fare_comparison.breakdown.peak_component}</li>
                  <li>Holiday surcharge: ${selectedRide.fare_comparison.breakdown.holiday_component}</li>
                  <li>Total discounts: -${selectedRide.fare_comparison.breakdown.discounts_total}</li>
                  <li><strong>Final suggested fare: ${selectedRide.fare_comparison.breakdown.total}</strong></li>
                </ul>
              </div>
            )}
            {(() => {
              const selectedBooking = myBookingsByRide[selectedRide.id]
              const selectedIsWaiting = selectedBooking?.status === 'pending' || selectedBooking?.status === 'countered'
              const selectedShowBidInputs = !selectedBooking || selectedIsWaiting

              if (!selectedShowBidInputs) {
                return null
              }

              return (
                <div className="ride-bid-row">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={bookingDraftByRide[selectedRide.id]?.passenger_count || 1}
                    onChange={(e) => handleDraftChange(selectedRide.id, 'passenger_count', e.target.value)}
                    aria-label="Passenger count"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={bookingDraftByRide[selectedRide.id]?.requested_bid_per_seat || ''}
                    onChange={(e) => handleDraftChange(selectedRide.id, 'requested_bid_per_seat', e.target.value)}
                    placeholder="Your bid per seat"
                    aria-label="Bid per seat"
                  />
                  <button
                    type="button"
                    className="button primary"
                    onClick={() => handleBookRide(selectedRide.id)}
                    disabled={selectedRide.seats_left <= 0 || Boolean(selectedBooking)}
                  >
                    {selectedIsWaiting ? 'Waiting for driver' : 'Request with bid'}
                  </button>
                </div>
              )
            })()}
            {selectedRide.description && <p className="ride-detail-description">{selectedRide.description}</p>}
            {Array.isArray(selectedRide.booked_passengers) && selectedRide.booked_passengers.length > 0 ? (
              <div className="ride-detail-passengers">
                <h4>Booked passengers</h4>
                <ul>
                  {selectedRide.booked_passengers.map((bp, idx) => (
                    <li key={`${bp.name}-${idx}`} className="modal-passenger-item">
                      {bp.profile_photo ? (
                        <img
                          src={bp.profile_photo}
                          alt={bp.name}
                          className="modal-passenger-avatar avatar-clickable"
                          onClick={() => setSelectedProfileUserId(bp.user_id)}
                        />
                      ) : (
                        <div
                          className="modal-passenger-avatar modal-passenger-avatar-fallback avatar-clickable"
                          onClick={() => setSelectedProfileUserId(bp.user_id)}
                        >
                          {(bp.name || 'P').slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <span>{bp.name} ({bp.passenger_count} seat{bp.passenger_count > 1 ? 's' : ''})</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="muted">No approved passengers yet.</p>
            )}
          </div>
        </div>
      )}

      {selectedProfileUserId && (
        <UserProfileModal userId={selectedProfileUserId} onClose={() => setSelectedProfileUserId(null)} />
      )}
    </div>
  )
}
