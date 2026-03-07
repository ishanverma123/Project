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
  await fetch('/api/auth/login/', { method: 'GET', credentials: 'include' })
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

export async function createProperty(formData) {
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
      json.price_per_day?.[0] ||
      json.image?.[0] ||
      json.detail ||
      'Failed to create property'
    throw new Error(firstError)
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
      json.price_per_day?.[0] ||
      json.image?.[0] ||
      json.detail ||
      'Failed to update property'
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
    throw new Error(json.detail || 'Failed to delete property')
  }
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
