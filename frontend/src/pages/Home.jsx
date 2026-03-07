import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch('/api/properties/', { credentials: 'include' })
        const data = await res.json().catch(() => [])
        if (!res.ok) throw new Error()
        if (!cancelled) setProperties(Array.isArray(data) ? data : [])
      } catch {
        if (!cancelled) setProperties([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-overlay" />
        <div className="home-hero-content">
          <h1>Find your perfect place.</h1>
          <p>Browse thousands of rentals, compare options, and book with confidence.</p>
          <form
            className="home-hero-search"
            onSubmit={(e) => {
              e.preventDefault()
            }}
          >
            <input
              type="text"
              placeholder="City, Neighborhood, ZIP"
              aria-label="Search by city, neighborhood, or ZIP"
            />
            <button type="submit">Search</button>
          </form>
        </div>
      </section>

      <div className="page home-page-inner">
        <section className="home-section-header">
          <h2>Properties for you</h2>
          <p>These properties are trending. Find the perfect place, book a tour, or contact to learn more.</p>
        </section>

        <section className="property-cards">
          {loading && (
            <p className="muted">Loading properties…</p>
          )}
          {!loading && properties.length === 0 && (
            <p className="muted">No properties listed yet. Check back soon.</p>
          )}
          {!loading &&
            properties.map((p, index) => {
              const gradientClass =
                index % 3 === 0 ? 'property-card-image-1' : index % 3 === 1 ? 'property-card-image-2' : 'property-card-image-3'
              const imageStyle = p.image
                ? { backgroundImage: `url(${p.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : {}
              return (
                <article key={p.id} className="property-card">
                  <div className={`property-card-image ${gradientClass}`} style={imageStyle}>
                    {/* badges can come from data later */}
                  </div>
                  <div className="property-card-body">
                    <h3>${p.price_per_day}+</h3>
                    <p className="property-location">{p.title}</p>
                    <p className="property-address">
                      {p.address_line1 || '—'}
                      {p.city ? `, ${p.city}` : ''}
                      {p.state ? `, ${p.state}` : ''}
                      {p.zip_code ? ` ${p.zip_code}` : ''}
                    </p>
                    <p className="property-meta">
                      {p.beds} Beds · {p.baths} Baths
                    </p>
                    <div className="card-actions">
                      <Link to={`/property/${p.id}`}>View Details</Link>
                      <button type="button" aria-label="Add to favorites">
                        ♥ Favorites
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
