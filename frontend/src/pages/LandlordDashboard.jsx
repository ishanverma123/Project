import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteProperty, listDriverRides, updateBookingStatus, updateProperty } from '../lib/api'
import { useAuth } from '../lib/authContext'
import UserProfileModal from '../components/UserProfileModal'

function toDateTimeLocalValue(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset()
  const adjusted = new Date(date.getTime() - offset * 60000)
  return adjusted.toISOString().slice(0, 16)
}

function EditRideModal({ ride, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: ride.title ?? '',
    description: ride.description ?? '',
    from_city: ride.from_city ?? '',
    to_city: ride.to_city ?? '',
    pickup_point: ride.pickup_point ?? '',
    dropoff_point: ride.dropoff_point ?? '',
    departure_time: toDateTimeLocalValue(ride.departure_time),
    price_per_seat: ride.price_per_seat ?? '',
    max_passengers: ride.max_passengers ?? 1,
    car_make: ride.car_make ?? '',
    car_model: ride.car_model ?? '',
    car_color: ride.car_color ?? '',
    car_plate: ride.car_plate ?? '',
  })
  const [imageFile, setImageFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setError('')
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) return setError('Title is required.')
    if (!form.from_city.trim() || !form.to_city.trim()) return setError('From city and to city are required.')
    if (!form.departure_time) return setError('Departure time is required.')

    setSaving(true)
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([k, v]) => formData.append(k, String(v)))
      if (imageFile) formData.append('image', imageFile)
      const updated = await updateProperty(ride.id, formData)
      onSaved(updated)
    } catch (err) {
      setError(err.message || 'Failed to update ride.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="inquiry-modal-backdrop" role="dialog" aria-modal="true">
      <div className="inquiry-modal edit-modal">
        <div className="inquiry-modal-header">
          <h2>Edit ride</h2>
          <button type="button" className="inquiry-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="panel-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} className="edit-modal-body">
          <div className="edit-modal-section">
            <p className="edit-modal-section-label">Ride basics</p>
            <div className="edit-modal-fields">
              <label className="edit-field">
                <span>Title</span>
                <input name="title" value={form.title} onChange={handleChange} required />
              </label>
              <label className="edit-field">
                <span>Description</span>
                <textarea name="description" rows={3} value={form.description} onChange={handleChange} />
              </label>
              <div className="edit-modal-row">
                <label className="edit-field">
                  <span>Price per seat</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="price_per_seat"
                    value={form.price_per_seat}
                    onChange={handleChange}
                  />
                </label>
                <label className="edit-field">
                  <span>Max passengers</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    name="max_passengers"
                    value={form.max_passengers}
                    onChange={handleChange}
                  />
                </label>
              </div>
            </div>
          </div>

          <hr className="edit-modal-divider" />

          <div className="edit-modal-section">
            <p className="edit-modal-section-label">Journey details</p>
            <div className="edit-modal-fields">
              <div className="edit-modal-row">
                <label className="edit-field">
                  <span>From city</span>
                  <input name="from_city" value={form.from_city} onChange={handleChange} required />
                </label>
                <label className="edit-field">
                  <span>To city</span>
                  <input name="to_city" value={form.to_city} onChange={handleChange} required />
                </label>
              </div>
              <label className="edit-field">
                <span>Departure time</span>
                <input
                  type="datetime-local"
                  name="departure_time"
                  value={form.departure_time}
                  onChange={handleChange}
                  required
                />
              </label>
              <div className="edit-modal-row">
                <label className="edit-field">
                  <span>Pickup point</span>
                  <input name="pickup_point" value={form.pickup_point} onChange={handleChange} />
                </label>
                <label className="edit-field">
                  <span>Dropoff point</span>
                  <input name="dropoff_point" value={form.dropoff_point} onChange={handleChange} />
                </label>
              </div>
            </div>
          </div>

          <hr className="edit-modal-divider" />

          <div className="edit-modal-section">
            <p className="edit-modal-section-label">Car details</p>
            <div className="edit-modal-fields">
              <div className="edit-modal-row-3">
                <label className="edit-field">
                  <span>Make</span>
                  <input name="car_make" value={form.car_make} onChange={handleChange} />
                </label>
                <label className="edit-field">
                  <span>Model</span>
                  <input name="car_model" value={form.car_model} onChange={handleChange} />
                </label>
                <label className="edit-field">
                  <span>Color</span>
                  <input name="car_color" value={form.car_color} onChange={handleChange} />
                </label>
              </div>
              <label className="edit-field">
                <span>Plate number</span>
                <input name="car_plate" value={form.car_plate} onChange={handleChange} />
              </label>
              <label className="edit-field">
                <span>Replace image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          </div>

          <div className="edit-modal-actions">
            <button type="button" className="button secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="button primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BookingRequestModal({ request, onClose, onDecision, loading }) {
  if (!request) return null

  return (
    <div className="inquiry-modal-backdrop" role="dialog" aria-modal="true">
      <div className="inquiry-modal request-review-modal">
        <div className="inquiry-modal-header">
          <h2>Review booking request</h2>
          <button type="button" className="inquiry-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="request-review-body">
          <p><strong>Ride:</strong> {request.rideTitle}</p>
          <p><strong>Traveller:</strong> @{request.username}</p>
          <p><strong>Name:</strong> {request.name}</p>
          <p><strong>Requested seats:</strong> {request.passenger_count}</p>
          <p className="muted">Choose whether to accept or reject this booking request.</p>
        </div>

        <div className="edit-modal-actions">
          <button type="button" className="button secondary" onClick={onClose} disabled={loading}>
            Close
          </button>
          <button
            type="button"
            className="button secondary"
            onClick={() => onDecision(request.id, 'rejected')}
            disabled={loading}
          >
            Reject
          </button>
          <button
            type="button"
            className="button primary"
            onClick={() => onDecision(request.id, 'approved')}
            disabled={loading}
          >
            {loading ? 'Updating…' : 'Accept'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LandlordDashboard() {
  const { user } = useAuth()
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [editingRide, setEditingRide] = useState(null)
  const [updatingRequestId, setUpdatingRequestId] = useState(null)
  const [reviewRequest, setReviewRequest] = useState(null)
  const [selectedProfileUserId, setSelectedProfileUserId] = useState(null)

  const loadRides = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listDriverRides()
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
  }, [])

  const handleRideSaved = (updated) => {
    setRides((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)))
    setEditingRide(null)
  }

  const handleDeleteRide = async (rideId) => {
    if (!window.confirm('Delete this ride? This cannot be undone.')) return
    setDeletingId(rideId)
    setError('')
    try {
      await deleteProperty(rideId)
      setRides((prev) => prev.filter((item) => item.id !== rideId))
    } catch (e) {
      setError(e.message || 'Failed to delete ride')
    } finally {
      setDeletingId(null)
    }
  }

  const handleBookingDecision = async (bookingId, status) => {
    setUpdatingRequestId(bookingId)
    setError('')
    try {
      await updateBookingStatus(bookingId, status)
      await loadRides()
      setReviewRequest(null)
    } catch (e) {
      setError(e.message || 'Failed to update booking request')
    } finally {
      setUpdatingRequestId(null)
    }
  }

  return (
    <div className="dashboard-shell landlord-shell">
      <div className="page landlord-dashboard">
        <header className="dashboard-header landlord-header">
          <div>
            <h1>Driver Dashboard</h1>
            <p className="muted">Manage rides, capacity, and booked passengers.</p>
          </div>
          <div className="dashboard-header-actions">
            <Link className="button secondary" to="/profile">
              My profile
            </Link>
            <Link className="button primary" to="/dashboard/new-ride">
              Create a new ride
            </Link>
          </div>
        </header>

        {error && <div className="panel-error" role="alert">{error}</div>}

        <section className="panel landlord-panel">
          <div className="panel-header">
            <h2>My rides</h2>
            <button type="button" className="link-button" onClick={loadRides} disabled={loading}>
              Refresh
            </button>
          </div>

          {loading && <p className="muted">Loading…</p>}
          {!loading && rides.length === 0 && <p className="muted">No rides listed yet.</p>}

          {!loading && rides.length > 0 && (
            <div className="landlord-cards landlord-cards-grid">
              {rides.map((ride, index) => {
                const gradientClass =
                  index % 3 === 0
                    ? 'property-card-image-1'
                    : index % 3 === 1
                    ? 'property-card-image-2'
                    : 'property-card-image-3'
                const imageStyle = ride.image
                  ? { backgroundImage: `url(${ride.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : {}

                return (
                  <article key={ride.id} className="landlord-card">
                    <div className={`property-card-image ${gradientClass}`} style={imageStyle}>
                      <div className="ride-card-driver-avatar-wrap">
                        {user?.profile_photo ? (
                          <img
                            src={user.profile_photo}
                            alt={user.first_name || user.username || 'Driver'}
                            className="ride-card-driver-avatar avatar-clickable"
                            onClick={() => setSelectedProfileUserId(user.id)}
                          />
                        ) : (
                          <div
                            className="ride-card-driver-avatar ride-card-driver-avatar-fallback avatar-clickable"
                            onClick={() => setSelectedProfileUserId(user?.id)}
                          >
                            {(user?.first_name || user?.username || 'D').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="landlord-card-body">
                      <div className="landlord-card-top">
                        <h3>{ride.title}</h3>
                        <span className="price-chip">${ride.price_per_seat}/seat</span>
                      </div>
                      <p className="muted">{ride.from_city} to {ride.to_city}</p>
                      <p className="muted">Departure: {new Date(ride.departure_time).toLocaleString()}</p>
                      <p className="inquiry-meta">Seats left: {ride.seats_left} / {ride.max_passengers}</p>
                      <p className="inquiry-meta">Booked seats: {ride.booked_passengers_count}</p>
                      <p className="inquiry-meta">Pending requests: {ride.pending_requests_count ?? 0}</p>
                      <div className="landlord-card-actions">
                        <button
                          type="button"
                          className="button secondary small-button"
                          onClick={() => setEditingRide(ride)}
                          disabled={savingId === ride.id || deletingId === ride.id}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="button danger small-button"
                          onClick={() => handleDeleteRide(ride.id)}
                          disabled={deletingId === ride.id || savingId === ride.id}
                        >
                          {deletingId === ride.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                      {Array.isArray(ride.booked_passengers) && ride.booked_passengers.length > 0 ? (
                        <ul className="inquiry-list">
                          {ride.booked_passengers.map((bp) => (
                            <li key={`${ride.id}-${bp.username}`} className="inquiry-item">
                              <div className="inquiry-main">
                                <div className="inquiry-header-row">
                                  <span className="inquiry-tenant passenger-with-avatar">
                                    {bp.profile_photo ? (
                                      <img
                                        src={bp.profile_photo}
                                        alt={bp.name}
                                        className="booking-driver-avatar avatar-clickable"
                                        onClick={() => setSelectedProfileUserId(bp.user_id)}
                                      />
                                    ) : (
                                      <span
                                        className="booking-driver-avatar booking-driver-avatar-fallback avatar-clickable"
                                        onClick={() => setSelectedProfileUserId(bp.user_id)}
                                      >
                                        {(bp.name || bp.username || 'P').slice(0, 1).toUpperCase()}
                                      </span>
                                    )}
                                    @{bp.username}
                                  </span>
                                </div>
                                <p className="inquiry-message">{bp.name} booked {bp.passenger_count} seat(s).</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="muted">No passengers booked yet.</p>
                      )}

                      {Array.isArray(ride.pending_requests) && ride.pending_requests.length > 0 && (
                        <>
                          <p className="inquiry-meta">Pending booking requests</p>
                          <ul className="inquiry-list">
                            {ride.pending_requests.map((req) => (
                              <li
                                key={req.id}
                                className="inquiry-item request-item"
                                role="button"
                                tabIndex={0}
                                onClick={() => setReviewRequest({ ...req, rideTitle: ride.title })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    setReviewRequest({ ...req, rideTitle: ride.title })
                                  }
                                }}
                              >
                                <div className="inquiry-main">
                                  <div className="inquiry-header-row">
                                    <span className="inquiry-tenant">@{req.username}</span>
                                    <span className="inquiry-status inquiry-status-pending">pending</span>
                                  </div>
                                  <p className="inquiry-message">{req.name} requested {req.passenger_count} seat(s).</p>
                                  <p className="muted">Review request</p>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {selectedProfileUserId && (
        <UserProfileModal userId={selectedProfileUserId} onClose={() => setSelectedProfileUserId(null)} />
      )}

      {editingRide && (
        <EditRideModal
          ride={editingRide}
          onClose={() => setEditingRide(null)}
          onSaved={handleRideSaved}
        />
      )}

      <BookingRequestModal
        request={reviewRequest}
        onClose={() => setReviewRequest(null)}
        onDecision={handleBookingDecision}
        loading={updatingRequestId === reviewRequest?.id}
      />
    </div>
  )
}
