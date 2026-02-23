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
