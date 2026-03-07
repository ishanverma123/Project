import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { createInquiry } from '../lib/api'

export default function PropertyDetail() {
  const { id } = useParams()
  const [property, setProperty] = useState(null)
  const [sending, setSending] = useState(false)
  const [inquiryError, setInquiryError] = useState('')
  const [inquirySent, setInquirySent] = useState(false)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    move_in_date: '',
    message: "Hello, I'd like more information about this property.",
  })

  useEffect(() => {
    let cancelled = false

    async function loadProperty() {
      try {
        const res = await fetch(`/api/properties/${id}/`, { credentials: 'include' })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setProperty(data)
      } catch {
        // ignore for now; keep static fallback content
      }
    }

    loadProperty()
    return () => {
      cancelled = true
    }
  }, [id])

  const handleContactChange = (e) => {
    const { name, value } = e.target
    setInquiryError('')
    setInquirySent(false)
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleContactSubmit = async (e) => {
    e.preventDefault()
    setInquiryError('')
    setInquirySent(false)
    setSending(true)
    try {
      await createInquiry({
        property: id,
        message: form.message,
        move_in_date: form.move_in_date || null,
      })
      setInquirySent(true)
    } catch (err) {
      setInquiryError(err.message || 'Failed to send inquiry.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="property-detail-shell">
      <div className="page property-detail-page">
        <header className="property-detail-header">
          <div>
            <h1>{property?.title || 'Norland Trails'}</h1>
            <p className="property-detail-address">
              700 NW Advance Dr, Poulsbo, WA 98370
            </p>
            <p className="property-detail-meta">1–3 Beds · 1–2.5 Baths · 820–1,531 Sqft</p>
            <p className="property-detail-owner">
              Listed by <span>{property?.owner_username || 'Landlord'}</span>
            </p>
          </div>
          <div className="property-detail-price">
            <div className="price-main">$1,950+</div>
            <div className="price-sub">1 Bed · 1 Bath</div>
            <Link to={`/booking/${id}`} className="button primary">
              Check availability
            </Link>
          </div>
        </header>

        <nav className="property-detail-tabs" aria-label="Property sections">
          <button type="button" className="tab active">Overview</button>
          <button type="button" className="tab">Property Highlights</button>
          <button type="button" className="tab">Floor Plans</button>
          <button type="button" className="tab">Pet Policy</button>
          <button type="button" className="tab">Amenities & Features</button>
          <button type="button" className="tab">About</button>
          <button type="button" className="tab">Schools</button>
          <button type="button" className="tab">Getting Around</button>
        </nav>

        <div className="property-detail-layout">
          <main className="property-detail-main">
            <section className="property-panel">
              <h2>Popular Rental</h2>
              <p className="property-panel-sub">198 people recently viewed this rental.</p>
            </section>

            <section className="property-panel">
              <h2>Property Highlights</h2>
              <div className="chip-row">
                <span className="chip">Pet Friendly</span>
                <span className="chip">Washer &amp; Dryer</span>
                <span className="chip">Fitness Center</span>
                <span className="chip">TV Lounge</span>
                <span className="chip">Barbecue Area</span>
                <span className="chip">Clubroom</span>
              </div>
              <button type="button" className="link-button">
                View all amenities &amp; features
              </button>
            </section>

            <section className="property-panel">
              <div className="panel-header">
                <h2>Floor Plans</h2>
                <button type="button" className="link-button">
                  Fees may apply · View breakdown
                </button>
              </div>
              <div className="pill-row">
                <button type="button" className="pill active">All (6)</button>
                <button type="button" className="pill">1 Bed $1,950+</button>
                <button type="button" className="pill">3 Beds $2,665+</button>
              </div>
              <div className="floorplan-card">
                <div className="floorplan-meta">
                  <div className="floorplan-title">1 Bedroom · Apartment</div>
                  <div className="floorplan-price">$1,950</div>
                  <div className="floorplan-details">1 Bed · 1 Bath · 820 Sqft</div>
                </div>
                <div className="floorplan-actions">
                  <button type="button" className="button secondary">1 unit available now</button>
                  <Link to={`/booking/${id}`} className="button primary">
                    Contact for availability
                  </Link>
                </div>
              </div>
            </section>

            <section className="property-panel">
              <h2>About this property</h2>
              <p>
                Norland Trails is where the energy of the Pacific Northwest and the conveniences of the Kitsap Peninsula
                collide, steps away from nightlife, restaurants, and shops. Choose from one, two, or three bedroom
                flats with stainless steel appliances and elevated modern finishes throughout.
              </p>
            </section>

            <section className="property-panel">
              <h2>Schools</h2>
              <p className="property-panel-sub">Learn about schools near this property.</p>
              <ul className="schools-list">
                <li>
                  <span className="school-name">Vinland Elementary School</span>
                  <span className="school-meta">Grades PK–5 · Public · 0.7 miles</span>
                </li>
                <li>
                  <span className="school-name">Poulsbo Middle School</span>
                  <span className="school-meta">Grades 6–8 · Public · 2.0 miles</span>
                </li>
                <li>
                  <span className="school-name">North Kitsap High School</span>
                  <span className="school-meta">Grades 9–12 · Public · 2.6 miles</span>
                </li>
              </ul>
            </section>
          </main>

          <aside className="property-detail-sidebar" aria-label="Contact property">
            <div className="contact-card">
              <h2>Contact landlord</h2>
              {inquiryError && <div className="panel-error" role="alert">{inquiryError}</div>}
              {inquirySent && !inquiryError && (
                <p className="muted">Your inquiry has been sent. The landlord will get back to you.</p>
              )}
              <form onSubmit={handleContactSubmit}>
                <div className="contact-grid">
                  <label>
                    First name *
                    <input
                      type="text"
                      name="first_name"
                      value={form.first_name}
                      onChange={handleContactChange}
                      required
                    />
                  </label>
                  <label>
                    Last name *
                    <input
                      type="text"
                      name="last_name"
                      value={form.last_name}
                      onChange={handleContactChange}
                      required
                    />
                  </label>
                </div>
                <label>
                  Email *
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleContactChange}
                    required
                  />
                </label>
                <label>
                  Phone *
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleContactChange}
                    required
                  />
                </label>
                <label>
                  Move in on
                  <input
                    type="date"
                    name="move_in_date"
                    value={form.move_in_date}
                    onChange={handleContactChange}
                  />
                </label>
                <label>
                  Message
                  <textarea
                    rows={3}
                    name="message"
                    value={form.message}
                    onChange={handleContactChange}
                  />
                </label>
                <button type="submit" className="button primary contact-submit" disabled={sending}>
                  {sending ? 'Sending…' : 'Send'}
                </button>
              </form>
              <p className="contact-disclaimer">
                By submitting this form, you agree to receive communications about this property.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
