import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createRide } from '../lib/api'

export default function CreateProperty() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    from_city: '',
    to_city: '',
    pickup_point: '',
    dropoff_point: '',
    departure_time: '',
    price_per_seat: '',
    max_passengers: 1,
    distance_km: '12',
    estimated_duration_min: '25',
    fuel_surcharge_per_km: '0.25',
    promo_discount_pct: '0',
    loyalty_discount_pct: '0',
    eco_incentive_pct: '0',
    holiday_surcharge_pct: '0',
    car_make: '',
    car_model: '',
    car_color: '',
    car_plate: '',
    image: null,
  })

  const previewRoute = useMemo(() => {
    if (!form.from_city && !form.to_city) return '—'
    return `${form.from_city || '—'} to ${form.to_city || '—'}`
  }, [form.from_city, form.to_city])

  const handleChange = (e) => {
    const { name, value, files } = e.target
    setError('')
    if (name === 'image') {
      setForm((prev) => ({ ...prev, image: files?.[0] || null }))
      return
    }
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.title.trim()) return setError('Title is required.')
    if (!form.description.trim()) return setError('Description is required.')
    if (!form.from_city.trim() || !form.to_city.trim()) return setError('From and to city are required.')
    if (!form.departure_time) return setError('Departure time is required.')
    if (!form.price_per_seat || Number.isNaN(Number(form.price_per_seat))) return setError('Price per seat is required.')
    if (Number(form.price_per_seat) <= 0) return setError('Price per seat must be greater than 0.')

    const fd = new FormData()
    fd.append('title', form.title.trim())
    fd.append('description', form.description.trim())
    fd.append('from_city', form.from_city.trim())
    fd.append('to_city', form.to_city.trim())
    fd.append('pickup_point', form.pickup_point.trim())
    fd.append('dropoff_point', form.dropoff_point.trim())
    fd.append('departure_time', form.departure_time)
    fd.append('price_per_seat', String(form.price_per_seat))
    fd.append('max_passengers', String(form.max_passengers))
    fd.append('distance_km', String(form.distance_km))
    fd.append('estimated_duration_min', String(form.estimated_duration_min))
    fd.append('fuel_surcharge_per_km', String(form.fuel_surcharge_per_km))
    fd.append('promo_discount_pct', String(form.promo_discount_pct))
    fd.append('loyalty_discount_pct', String(form.loyalty_discount_pct))
    fd.append('eco_incentive_pct', String(form.eco_incentive_pct))
    fd.append('holiday_surcharge_pct', String(form.holiday_surcharge_pct))
    fd.append('car_make', form.car_make.trim())
    fd.append('car_model', form.car_model.trim())
    fd.append('car_color', form.car_color.trim())
    fd.append('car_plate', form.car_plate.trim())
    if (form.image) fd.append('image', form.image)

    setLoading(true)
    try {
      await createRide(fd)
      navigate('/dashboard')
    } catch (e) {
      setError(e.message || 'Failed to create property')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="property-detail-shell create-property-shell">
      <div className="page property-detail-page create-property-page">
        <header className="property-detail-header">
          <div>
            <h1>Create ride listing</h1>
            <p className="property-detail-address">Add route, departure, car details, and available seats.</p>
            <p className="property-detail-owner">
              <Link to="/dashboard">← Back to dashboard</Link>
            </p>
          </div>
          <div className="property-detail-price">
            <div className="price-main">
              {form.price_per_seat ? `$${form.price_per_seat}/seat` : '—'}
            </div>
            <div className="price-sub">Max seats: {form.max_passengers}</div>
          </div>
        </header>

        {error && <div className="panel-error" role="alert">{error}</div>}

        <div className="property-detail-layout">
          <main className="property-detail-main">
            <section className="property-panel">
              <h2>Basic info</h2>
              <form className="create-property-form" onSubmit={handleSubmit}>
                <label>
                  Title *
                  <input name="title" value={form.title} onChange={handleChange} required />
                </label>
                <label>
                  Description *
                  <textarea name="description" rows={5} value={form.description} onChange={handleChange} required />
                </label>

                <div className="grid-3">
                  <label>
                    Price per seat *
                    <input
                      name="price_per_seat"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price_per_seat}
                      onChange={handleChange}
                      required
                    />
                  </label>
                  <label>
                    Max passengers
                    <input name="max_passengers" type="number" min="1" step="1" value={form.max_passengers} onChange={handleChange} />
                  </label>
                  <label>
                    Departure time *
                    <input name="departure_time" type="datetime-local" value={form.departure_time} onChange={handleChange} required />
                  </label>
                </div>
              </form>
            </section>

            <section className="property-panel create-location-panel create-property-form">
              <h2>Journey details</h2>
              <div className="grid-3">
                <label>
                  From city *
                  <input name="from_city" value={form.from_city} onChange={handleChange} required />
                </label>
                <label>
                  To city *
                  <input name="to_city" value={form.to_city} onChange={handleChange} required />
                </label>
                <label>
                  Pickup point
                  <input name="pickup_point" value={form.pickup_point} onChange={handleChange} />
                </label>
              </div>
              <div className="grid-3">
                <label>
                  Dropoff point
                  <input name="dropoff_point" value={form.dropoff_point} onChange={handleChange} />
                </label>
                <label>
                  Distance (km)
                  <input name="distance_km" type="number" min="1" step="0.1" value={form.distance_km} onChange={handleChange} />
                </label>
                <label>
                  Duration (min)
                  <input name="estimated_duration_min" type="number" min="1" step="1" value={form.estimated_duration_min} onChange={handleChange} />
                </label>
              </div>
            </section>

            <section className="property-panel create-media-panel create-property-form">
              <h2>Pricing analysis inputs</h2>
              <div className="grid-3">
                <label>
                  Fuel surcharge per km
                  <input
                    name="fuel_surcharge_per_km"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.fuel_surcharge_per_km}
                    onChange={handleChange}
                  />
                </label>
                <label>
                  Promo discount %
                  <input name="promo_discount_pct" type="number" min="0" step="0.1" value={form.promo_discount_pct} onChange={handleChange} />
                </label>
                <label>
                  Loyalty discount %
                  <input name="loyalty_discount_pct" type="number" min="0" step="0.1" value={form.loyalty_discount_pct} onChange={handleChange} />
                </label>
              </div>
              <div className="grid-3">
                <label>
                  Eco incentive %
                  <input name="eco_incentive_pct" type="number" min="0" step="0.1" value={form.eco_incentive_pct} onChange={handleChange} />
                </label>
                <label>
                  Holiday surcharge %
                  <input
                    name="holiday_surcharge_pct"
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.holiday_surcharge_pct}
                    onChange={handleChange}
                  />
                </label>
              </div>
            </section>

            <section className="property-panel create-media-panel create-property-form">
              <h2>Car details</h2>
              <div className="grid-3">
                <label>
                  Car make
                  <input name="car_make" value={form.car_make} onChange={handleChange} />
                </label>
                <label>
                  Car model
                  <input name="car_model" value={form.car_model} onChange={handleChange} />
                </label>
                <label>
                  Color
                  <input name="car_color" value={form.car_color} onChange={handleChange} />
                </label>
              </div>
              <label>
                Plate number
                <input name="car_plate" value={form.car_plate} onChange={handleChange} />
              </label>
            </section>

            <section className="property-panel create-media-panel create-property-form">
              <h2>Media</h2>
              <label>
                Car image
                <input name="image" type="file" accept="image/*" onChange={handleChange} />
              </label>
              <div className="create-property-actions">
                <button type="submit" className="button primary" disabled={loading} onClick={handleSubmit}>
                  {loading ? 'Creating…' : 'Create ride'}
                </button>
                <Link className="button secondary" to="/dashboard">
                  Cancel
                </Link>
              </div>
            </section>
          </main>

          <aside className="property-detail-sidebar" aria-label="Preview">
            <div className="contact-card">
              <h2>Preview</h2>
              <p className="muted">This is how key details will appear to travellers.</p>
              <div className="preview-row">
                <span className="preview-label">Title</span>
                <span className="preview-value">{form.title || '—'}</span>
              </div>
              <div className="preview-row">
                <span className="preview-label">Route</span>
                <span className="preview-value">{previewRoute}</span>
              </div>
              <div className="preview-row">
                <span className="preview-label">Departure</span>
                <span className="preview-value">{form.departure_time || '—'}</span>
              </div>
              <div className="preview-row">
                <span className="preview-label">Seats / Price</span>
                <span className="preview-value">{form.max_passengers} / ${form.price_per_seat || '—'}</span>
              </div>
              <div className="preview-row">
                <span className="preview-label">Distance / Duration</span>
                <span className="preview-value">{form.distance_km} km / {form.estimated_duration_min} min</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

