/**
 * API helpers with cookie credentials and CSRF for Django REST backend.
 */

function getCsrfToken() {
  const name = 'csrftoken'
  const cookies = document.cookie.split(';')
  for (let i = 0; i < cookies.length; i++) {
    const c = cookies[i].trim()
    if (c.startsWith(name + '=')) return c.slice(name.length + 1)
  }
  return ''
}

async function getCsrfCookie() {
  await fetch('/api/auth/csrf/', { method: 'GET', credentials: 'include' })
}

export async function register(data) {
  await getCsrfCookie()
  const res = await fetch('/api/auth/register/', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCsrfToken(),
    },
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.username?.[0] || json.password?.[0] || json.role?.[0] || json.detail || 'Registration failed')
  return json
}

export async function login(data) {
  await getCsrfCookie()
  const res = await fetch('/api/auth/login/', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCsrfToken(),
    },
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.detail || json.non_field_errors?.[0] || 'Invalid username or password')
  return json
}

export async function logout() {
  await getCsrfCookie()
  await fetch('/api/auth/logout/', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'X-CSRFToken': getCsrfToken(),
    },
  })
}

export async function updateMyProfile(formData) {
  await getCsrfCookie()
  const res = await fetch('/api/auth/me/', {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'X-CSRFToken': getCsrfToken(),
    },
    body: formData,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(json.email?.[0] || json.profile_photo?.[0] || json.detail || 'Failed to update profile')
  }
  return json
}

export async function getPublicUserProfile(userId) {
  const res = await fetch(`/api/users/public/${userId}/`, { credentials: 'include' })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(json.detail || 'Failed to load profile')
  }
  return json
}

export async function createRide(formData) {
  await getCsrfCookie()
  const res = await fetch('/api/properties/', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'X-CSRFToken': getCsrfToken(),
    },
    body: formData,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const firstError =
      json.title?.[0] ||
      json.description?.[0] ||
      json.price_per_seat?.[0] ||
      json.from_city?.[0] ||
      json.to_city?.[0] ||
      json.departure_time?.[0] ||
      json.max_passengers?.[0] ||
      json.image?.[0] ||
      json.detail ||
      'Failed to create ride'
    throw new Error(firstError)
  }
  return json
}

export async function searchRides(params = {}) {
  const query = new URLSearchParams()
  const fromCity = String(params.from_city || '').trim()
  const toCity = String(params.to_city || '').trim()
  const departureDate = String(params.departure_date || '').trim()

  if (fromCity) query.set('from_city', fromCity)
  if (toCity) query.set('to_city', toCity)
  if (departureDate) query.set('departure_date', departureDate)

  const suffix = query.toString() ? `?${query.toString()}` : ''
  const res = await fetch(`/api/properties/${suffix}`, { credentials: 'include' })
  const json = await res.json().catch(() => [])
  if (!res.ok) {
    throw new Error(json.detail || 'Failed to load rides')
  }
  return Array.isArray(json) ? json : []
}

export async function listDriverRides() {
  const res = await fetch('/api/properties/?mine=true', { credentials: 'include' })
  const json = await res.json().catch(() => [])
  if (!res.ok) {
    throw new Error(json.detail || 'Failed to load your rides')
  }
  return Array.isArray(json) ? json : []
}

export async function createRideBooking(data) {
  await getCsrfCookie()
  const res = await fetch('/api/bookings/', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCsrfToken(),
    },
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      json.passenger_count?.[0] ||
      json.property?.[0] ||
      json.requested_bid_per_seat?.[0] ||
      json.detail ||
      'Failed to book ride'
    )
  }
  return json
}

export async function updateBookingStatus(id, status, options = {}) {
  await getCsrfCookie()
  const payload = { status }
  if (options.driver_counter_offer_per_seat !== undefined && options.driver_counter_offer_per_seat !== '') {
    payload.driver_counter_offer_per_seat = options.driver_counter_offer_per_seat
  }

  const res = await fetch(`/api/bookings/${id}/`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCsrfToken(),
    },
    body: JSON.stringify(payload),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      json.status?.[0] ||
      json.driver_counter_offer_per_seat?.[0] ||
      json.detail ||
      'Failed to update booking request'
    )
  }
  return json
}

export async function negotiateBookingBid(id, requestedBidPerSeat) {
  await getCsrfCookie()
  const res = await fetch(`/api/bookings/${id}/`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCsrfToken(),
    },
    body: JSON.stringify({ status: 'pending', requested_bid_per_seat: requestedBidPerSeat }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(json.requested_bid_per_seat?.[0] || json.detail || 'Failed to submit negotiated bid')
  }
  return json
}

export async function acceptCounterOffer(id) {
  await getCsrfCookie()
  const res = await fetch(`/api/bookings/${id}/`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCsrfToken(),
    },
    body: JSON.stringify({ status: 'approved' }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(json.status?.[0] || json.detail || 'Failed to accept counter-offer')
  }
  return json
}

export async function listMyBookings() {
  const res = await fetch('/api/bookings/', { credentials: 'include' })
  const json = await res.json().catch(() => [])
  if (!res.ok) {
    throw new Error(json.detail || 'Failed to load bookings')
  }
  return Array.isArray(json) ? json : []
}

export async function createInquiry(data) {
  await getCsrfCookie()
  const res = await fetch('/api/property-inquiries/', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCsrfToken(),
    },
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(json.message?.[0] || json.detail || 'Failed to send inquiry')
  }
  return json
}

export async function listInquiries(propertyId) {
  const res = await fetch(`/api/property-inquiries/?property=${propertyId}`, {
    credentials: 'include',
  })
  const json = await res.json().catch(() => [])
  if (!res.ok) {
    throw new Error(json.detail || 'Failed to load inquiries')
  }
  return Array.isArray(json) ? json : []
}

export async function updateInquiryStatus(id, status) {
  await getCsrfCookie()
  const res = await fetch(`/api/property-inquiries/${id}/`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCsrfToken(),
    },
    body: JSON.stringify({ status }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(json.detail || 'Failed to update inquiry')
  }
  return json
}

export async function updateProperty(id, formData) {
  await getCsrfCookie()
  const res = await fetch(`/api/properties/${id}/`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'X-CSRFToken': getCsrfToken(),
    },
    body: formData,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const firstError =
      json.title?.[0] ||
      json.description?.[0] ||
      json.price_per_seat?.[0] ||
      json.image?.[0] ||
      json.detail ||
      'Failed to update ride'
    throw new Error(firstError)
  }
  return json
}

export async function deleteProperty(id) {
  await getCsrfCookie()
  const res = await fetch(`/api/properties/${id}/`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'X-CSRFToken': getCsrfToken(),
    },
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json.detail || 'Failed to delete ride')
  }
}
