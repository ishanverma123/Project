import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { listInquiries, updateInquiryStatus, updateProperty, deleteProperty } from '../lib/api'

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditPropertyModal({ property, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: property.title ?? '',
    description: property.description ?? '',
    price_per_day: property.price_per_day ?? '',
    address_line1: property.address_line1 ?? '',
    city: property.city ?? '',
    state: property.state ?? '',
    zip_code: property.zip_code ?? '',
  })
  const [imageFile, setImageFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    setError('')
    setSaving(true)
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([k, v]) => formData.append(k, v))
      if (imageFile) formData.append('image', imageFile)
      const updated = await updateProperty(property.id, formData)
      onSaved(updated)
    } catch (e) {
      setError(e.message || 'Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  return (
      <div className="inquiry-modal-backdrop" role="dialog" aria-modal="true">
        <div className="inquiry-modal edit-modal">
  
          <div className="inquiry-modal-header">
            <h2>Edit listing</h2>
            <button type="button" className="inquiry-modal-close" onClick={onClose}>✕</button>
          </div>
  
          {error && <div className="panel-error" role="alert">{error}</div>}
  
          <div className="edit-modal-body">
            <div className="edit-modal-fields">
  
              {/* ── Basic info ── */}
              <div className="edit-modal-section">
                <p className="edit-modal-section-label">Listing details</p>
                <div className="edit-modal-fields">
                  <label className="edit-field">
                    <span>Title</span>
                    <input name="title" value={form.title} onChange={handleChange} />
                  </label>
                  <label className="edit-field">
                    <span>Price per day ($)</span>
                    <input type="number" name="price_per_day" value={form.price_per_day} onChange={handleChange} />
                  </label>
                  <label className="edit-field">
                    <span>Description</span>
                    <textarea name="description" value={form.description} onChange={handleChange} rows={3} />
                  </label>
                </div>
              </div>
  
              <hr className="edit-modal-divider" />
  
              {/* ── Location ── */}
              <div className="edit-modal-section">
                <p className="edit-modal-section-label">Location</p>
                <div className="edit-modal-fields">
                  <label className="edit-field">
                    <span>Address</span>
                    <input name="address_line1" value={form.address_line1} onChange={handleChange} />
                  </label>
                  <div className="edit-modal-row-3">
                    <label className="edit-field">
                      <span>City</span>
                      <input name="city" value={form.city} onChange={handleChange} />
                    </label>
                    <label className="edit-field">
                      <span>State</span>
                      <input name="state" value={form.state} onChange={handleChange} />
                    </label>
                    <label className="edit-field">
                      <span>ZIP</span>
                      <input name="zip_code" value={form.zip_code} onChange={handleChange} />
                    </label>
                  </div>
                </div>
              </div>
  
              <hr className="edit-modal-divider" />
  
              {/* ── Image ── */}
              <div className="edit-modal-section">
                <p className="edit-modal-section-label">Photo</p>
                <label className="edit-field">
                  <span>Replace image</span>
                  <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0] ?? null)} />
                </label>
              </div>
  
            </div>
          </div>
  
          <div className="edit-modal-actions">
            <button type="button" className="button secondary" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="button" className="button primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
  
        </div>
      </div>
    )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function LandlordDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [properties, setProperties] = useState([])

  // Inquiries modal
  const [inquiriesModalOpen, setInquiriesModalOpen] = useState(false)
  const [activeProperty, setActiveProperty] = useState(null)
  const [inquiries, setInquiries] = useState([])
  const [inquiriesLoading, setInquiriesLoading] = useState(false)
  const [inquiriesError, setInquiriesError] = useState('')

  // Edit modal
  const [editProperty, setEditProperty] = useState(null)

  // Per-card delete confirmation: stores the id currently awaiting confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const myUsername = user?.username
  const myProperties = useMemo(() => {
    if (!myUsername) return []
    return properties.filter((p) => p.owner_username === myUsername)
  }, [properties, myUsername])

  const loadProperties = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/properties/', { credentials: 'include' })
      const data = await res.json().catch(() => [])
      if (!res.ok) throw new Error(data?.detail || 'Failed to load properties')
      setProperties(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message || 'Failed to load properties')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProperties()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openInquiries = async (property) => {
    setActiveProperty(property)
    setInquiries([])
    setInquiriesError('')
    setInquiriesLoading(true)
    setInquiriesModalOpen(true)
    try {
      const data = await listInquiries(property.id)
      setInquiries(data)
    } catch (e) {
      setInquiriesError(e.message || 'Failed to load inquiries.')
    } finally {
      setInquiriesLoading(false)
    }
  }

  const handleUpdateStatus = async (inquiryId, status) => {
    try {
      const updated = await updateInquiryStatus(inquiryId, status)
      setInquiries((prev) => prev.map((q) => (q.id === updated.id ? updated : q)))
    } catch (e) {
      setInquiriesError(e.message || 'Failed to update inquiry.')
    }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await deleteProperty(id)
      setProperties((prev) => prev.filter((p) => p.id !== id))
    } catch (e) {
      setError(e.message || 'Failed to delete property.')
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
    }
  }

  const handleSaved = (updated) => {
    setProperties((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))
    setEditProperty(null)
  }

  return (
    <div className="dashboard-shell landlord-shell">
      <div className="page landlord-dashboard">
        <header className="dashboard-header landlord-header">
          <div>
            <h1>Landlord Dashboard</h1>
            <p className="muted">Manage your listings and create new properties.</p>
          </div>
          <Link className="button primary" to="/dashboard/new-property">
            List a new property
          </Link>
        </header>

        {error && <div className="panel-error" role="alert">{error}</div>}

        <section className="panel landlord-panel">
          <div className="panel-header">
            <h2>My Listings</h2>
            <button type="button" className="link-button" onClick={loadProperties} disabled={loading}>
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="muted">Loading…</p>
          ) : myProperties.length === 0 ? (
            <p className="muted">You haven't listed any properties yet.</p>
          ) : (
            <div className="landlord-cards landlord-cards-grid">
              {myProperties.map((p, index) => {
                const gradientClass =
                  index % 3 === 0
                    ? 'property-card-image-1'
                    : index % 3 === 1
                    ? 'property-card-image-2'
                    : 'property-card-image-3'
                const imageStyle = p.image
                  ? { backgroundImage: `url(${p.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : {}
                const isDeleting = deletingId === p.id
                const awaitingConfirm = confirmDeleteId === p.id

                return (
                  <article key={p.id} className="landlord-card">
                    <div className={`property-card-image ${gradientClass}`} style={imageStyle} />
                    <div className="landlord-card-body">
                      <div className="landlord-card-top">
                        <h3>{p.title}</h3>
                        <span className="price-chip">${p.price_per_day}/day</span>
                      </div>
                      <p className="muted">
                        {(p.address_line1 || '—')}
                        {p.city ? `, ${p.city}` : ''}
                        {p.state ? `, ${p.state}` : ''}
                        {p.zip_code ? ` ${p.zip_code}` : ''}
                      </p>
                      {typeof p.inquiry_count === 'number' && (
                        <p className="inquiry-meta">
                          {p.inquiry_count === 0
                            ? 'No inquiries yet'
                            : p.inquiry_count === 1
                            ? '1 inquiry'
                            : `${p.inquiry_count} inquiries`}
                        </p>
                      )}
                      <div className="landlord-card-actions">
                        {/* ── Edit ── */}
                        <button
                          type="button"
                          className="button secondary small-button"
                          onClick={() => setEditProperty(p)}
                        >
                          Edit
                        </button>

                        {/* ── Delete (two-step) ── */}
                        {awaitingConfirm ? (
                          <>
                            <button
                              type="button"
                              className="button danger small-button"
                              onClick={() => handleDelete(p.id)}
                              disabled={isDeleting}
                            >
                              {isDeleting ? 'Deleting…' : 'Confirm delete'}
                            </button>
                            <button
                              type="button"
                              className="button secondary small-button"
                              onClick={() => setConfirmDeleteId(null)}
                              disabled={isDeleting}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="button danger small-button"
                            onClick={() => setConfirmDeleteId(p.id)}
                          >
                            Delete
                          </button>
                        )}

                        {/* ── View inquiries ── */}
                        {p.inquiry_count > 0 && (
                          <button
                            type="button"
                            className="button secondary small-button"
                            onClick={() => openInquiries(p)}
                          >
                            View inquiries
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* ── Edit modal ── */}
      {editProperty && (
        <EditPropertyModal
          property={editProperty}
          onClose={() => setEditProperty(null)}
          onSaved={handleSaved}
        />
      )}

      {/* ── Inquiries modal ── */}
      {inquiriesModalOpen && (
        <div className="inquiry-modal-backdrop" role="dialog" aria-modal="true">
          <div className="inquiry-modal">
            <div className="inquiry-modal-header">
              <h2>Inquiries for {activeProperty?.title}</h2>
              <button
                type="button"
                className="inquiry-modal-close"
                onClick={() => setInquiriesModalOpen(false)}
              >
                ✕
              </button>
            </div>
            {inquiriesError && <div className="panel-error" role="alert">{inquiriesError}</div>}
            {inquiriesLoading ? (
              <p className="muted">Loading inquiries…</p>
            ) : inquiries.length === 0 ? (
              <p className="muted">No inquiries for this property yet.</p>
            ) : (
              <ul className="inquiry-list">
                {inquiries.map((inq) => (
                  <li key={inq.id} className="inquiry-item">
                    <div className="inquiry-main">
                      <div className="inquiry-header-row">
                        <span className="inquiry-tenant">@{inq.tenant_username}</span>
                        <span className={`inquiry-status inquiry-status-${inq.status}`}>
                          {inq.status}
                        </span>
                      </div>
                      <p className="inquiry-message">{inq.message}</p>
                      <p className="inquiry-meta-small">
                        {inq.move_in_date && <>Move in: {inq.move_in_date} · </>}
                        Created: {new Date(inq.created_at).toLocaleString()}
                      </p>
                    </div>
                    {inq.status === 'pending' && (
                      <div className="inquiry-actions">
                        <button
                          type="button"
                          className="button secondary small-button"
                          onClick={() => handleUpdateStatus(inq.id, 'approved')}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="button secondary small-button"
                          onClick={() => handleUpdateStatus(inq.id, 'rejected')}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}