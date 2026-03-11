import { useEffect, useState } from 'react'
import { createRideBooking, searchRides } from '../lib/api'

export default function Home() {
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bookingError, setBookingError] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState('')
  const [search, setSearch] = useState({ from_city: '', to_city: '', departure_date: '' })

  const loadRides = async (params = {}) => {
    setLoading(true)
    setError('')
    try {
      const data = await searchRides(params)
      setRides(data)
    } catch (e) {
      setError(e.message || 'Failed to load rides')
      setRides([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRides()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleBookRide = async (rideId) => {
    setBookingError('')
    setBookingSuccess('')
    try {
      await createRideBooking({ property: rideId, passenger_count: 1 })
      setBookingSuccess('Booking request sent to driver.')
      await loadRides(search)
    } catch (e) {
      setBookingError(e.message || 'Failed to book ride')
    }
  }

  const handleSearchSubmit = async (e) => {
    e.preventDefault()
    await loadRides(search)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setSearch((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-overlay" />
        <div className="home-hero-content">
          <h1>Find your next ride.</h1>
          <p>Search rides by journey and date, then book your seat instantly.</p>
          <form className="home-hero-search" onSubmit={handleSearchSubmit}>
            <input
              name="from_city"
              type="text"
              value={search.from_city}
              onChange={handleChange}
              placeholder="From city"
              aria-label="Search by origin city"
            />
            <input
              name="to_city"
              type="text"
              value={search.to_city}
              onChange={handleChange}
              placeholder="To city"
              aria-label="Search by destination city"
            />
            <input
              name="departure_date"
              type="date"
              value={search.departure_date}
              onChange={handleChange}
              aria-label="Search by departure date"
            />
            <button type="submit">Search</button>
          </form>
        </div>
      </section>

      <div className="page home-page-inner">
        <section className="home-section-header">
          <h2>Available rides</h2>
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
              const gradientClass =
                index % 3 === 0 ? 'property-card-image-1' : index % 3 === 1 ? 'property-card-image-2' : 'property-card-image-3'
              const imageStyle = p.image
                ? { backgroundImage: `url(${p.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : {}
              return (
                <article key={p.id} className="property-card">
                  <div className={`property-card-image ${gradientClass}`} style={imageStyle} />
                  <div className="property-card-body">
                    <h3>${p.price_per_seat} / seat</h3>
                    <p className="property-location">{p.title}</p>
                    <p className="property-address">{p.from_city} to {p.to_city}</p>
                    <p className="property-meta">
                      Driver: {p.driver_name} · Seats left: {p.seats_left}
                    </p>
                    <p className="property-meta">Booked passengers: {p.booked_passengers_count}</p>
                    {Array.isArray(p.booked_passengers) && p.booked_passengers.length > 0 && (
                      <p className="property-meta">
                        {p.booked_passengers.map((bp) => `${bp.name} (${bp.passenger_count})`).join(', ')}
                      </p>
                    )}
                    <div className="card-actions">
                      <button type="button" onClick={() => handleBookRide(p.id)} disabled={p.seats_left <= 0}>
                        {p.seats_left <= 0 ? 'Full' : 'Request booking'}
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
        </section>
      </div>
    </div>
  )
}
