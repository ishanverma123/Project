import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createProperty } from '../lib/api'

export default function CreateProperty() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    price_per_day: '',
    address_line1: '',
    city: '',
    state: '',
    zip_code: '',
    beds: 1,
    baths: 1.0,
    sqft: 0,
    image: null,
  })

  const previewAddress = useMemo(() => {
    const parts = [form.address_line1, form.city, form.state, form.zip_code].filter(Boolean)
    return parts.length ? parts.join(', ') : '—'
  }, [form.address_line1, form.city, form.state, form.zip_code])

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
    if (!form.price_per_day || Number.isNaN(Number(form.price_per_day))) return setError('Price per day is required.')
    if (Number(form.price_per_day) <= 0) return setError('Price per day must be greater than 0.')

    const fd = new FormData()
    fd.append('title', form.title.trim())
    fd.append('description', form.description.trim())
    fd.append('price_per_day', String(form.price_per_day))
    fd.append('address_line1', form.address_line1.trim())
    fd.append('city', form.city.trim())
    fd.append('state', form.state.trim())
    fd.append('zip_code', form.zip_code.trim())
    fd.append('beds', String(form.beds))
    fd.append('baths', String(form.baths))
    fd.append('sqft', String(form.sqft))
    if (form.image) fd.append('image', form.image)

    setLoading(true)
    try {
      await createProperty(fd)
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
            <h1>Create property listing</h1>
            <p className="property-detail-address">Add the key details tenants will see on the listing page.</p>
            <p className="property-detail-owner">
              <Link to="/dashboard">← Back to dashboard</Link>
            </p>
          </div>
          <div className="property-detail-price">
            <div className="price-main">
              {form.price_per_day ? `$${form.price_per_day}/day` : '—'}
            </div>
            <div className="price-sub">{form.beds} bed · {form.baths} bath</div>
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
                    Price per day *
                    <input
                      name="price_per_day"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price_per_day}
                      onChange={handleChange}
                      required
                    />
                  </label>
                  <label>
                    Beds
                    <input name="beds" type="number" min="0" step="1" value={form.beds} onChange={handleChange} />
                  </label>
                  <label>
                    Baths
                    <input name="baths" type="number" min="0" step="0.5" value={form.baths} onChange={handleChange} />
                  </label>
                </div>
              </form>
            </section>

            <section className="property-panel create-location-panel create-property-form">
              <h2>Location</h2>
              <div className="grid-3">
                <label className="grid-span-2">
                  Address
                  <input name="address_line1" value={form.address_line1} onChange={handleChange} />
                </label>
                <label>
                  Sqft
                  <input name="sqft" type="number" min="0" step="1" value={form.sqft} onChange={handleChange} />
                </label>
              </div>
              <div className="grid-3">
                <label>
                  City
                  <input name="city" value={form.city} onChange={handleChange} />
                </label>
                <label>
                  State
                  <input name="state" value={form.state} onChange={handleChange} />
                </label>
                <label>
                  ZIP
                  <input name="zip_code" value={form.zip_code} onChange={handleChange} />
                </label>
              </div>
            </section>

            <section className="property-panel create-media-panel create-property-form">
              <h2>Media</h2>
              <label>
                Cover image
                <input name="image" type="file" accept="image/*" onChange={handleChange} />
              </label>
              <div className="create-property-actions">
                <button type="submit" className="button primary" disabled={loading} onClick={handleSubmit}>
                  {loading ? 'Creating…' : 'Create listing'}
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
              <p className="muted">This is how key details will appear to tenants.</p>
              <div className="preview-row">
                <span className="preview-label">Title</span>
                <span className="preview-value">{form.title || '—'}</span>
              </div>
              <div className="preview-row">
                <span className="preview-label">Address</span>
                <span className="preview-value">{previewAddress}</span>
              </div>
              <div className="preview-row">
                <span className="preview-label">Beds/Baths</span>
                <span className="preview-value">{form.beds} / {form.baths}</span>
              </div>
              <div className="preview-row">
                <span className="preview-label">Sqft</span>
                <span className="preview-value">{form.sqft || '—'}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

