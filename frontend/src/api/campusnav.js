// Real client for the CampusNav Spring Boot API (see backend/README.md for
// the endpoint list). Every function here matches an endpoint 1:1 — no
// client-side simulation. Function names/signatures intentionally match
// the mock layer this replaced, so components didn't need to change.

import { API_BASE_URL } from '../config'

const ADMIN_SESSION_KEY = 'campusnav_admin_token'

function apiError(status, message) {
  const err = new Error(message)
  err.status = status
  return err
}

async function apiFetch(path, { method = 'GET', body, params, auth = false } = {}) {
  const url = new URL(path, API_BASE_URL)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value)
      }
    }
  }

  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth) {
    const session = getAdminSession()
    if (session) headers.Authorization = `Bearer ${session.token}`
  }

  let res
  try {
    res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined })
  } catch {
    throw apiError(0, 'Could not reach the CampusNav API — is the backend running?')
  }

  if (!res.ok) {
    let message = res.statusText || `Request failed (${res.status})`
    try {
      const data = await res.json()
      message = data.message || data.error || message
    } catch {
      // non-JSON error body — keep the status text
    }
    if (res.status === 401 && auth) clearAdminSession()
    throw apiError(res.status, message)
  }

  if (res.status === 204) return null
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

// --- device id (anonymous pin rate-limiting, PRD 6.2) ---

export function getDeviceId() {
  let id = localStorage.getItem('campusnav_device_id')
  if (!id) {
    id = `dev_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
    localStorage.setItem('campusnav_device_id', id)
  }
  return id
}

// --- locations ---

export async function getMapData() {
  return apiFetch('/api/locations')
}

export async function searchLocations(query, limit = 10) {
  if (!query || !query.trim()) return []
  return apiFetch('/api/locations/search', { params: { q: query.trim(), limit } })
}

export async function getLocation(id) {
  return apiFetch(`/api/locations/${id}`)
}

export async function getPoiDetail(id) {
  return apiFetch(`/api/locations/pois/${id}`)
}

export async function getFloors(buildingId) {
  return apiFetch(`/api/floors/${buildingId}`)
}

// --- routing ---

export async function getRoute({ fromLat, fromLng, toId, toLat, toLng, accessible = false }) {
  return apiFetch('/api/route', { params: { fromLat, fromLng, toId, toLat, toLng, accessible } })
}

// --- community pins (public) ---

export async function submitPin({ lat, lng, suggestedName, suggestedCategory, aliasText, note, deviceId }) {
  return apiFetch('/api/pins', {
    method: 'POST',
    body: { lat, lng, suggestedName, suggestedCategory, aliasText, note, deviceId },
  })
}

export async function listApprovedPins() {
  return apiFetch('/api/pins/approved')
}

// --- admin auth ---

export async function adminLogin({ email, password }) {
  const result = await apiFetch('/api/admin/auth/login', { method: 'POST', body: { email, password } })
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(result))
  return result
}

export function adminLogout() {
  clearAdminSession()
}

function clearAdminSession() {
  localStorage.removeItem(ADMIN_SESSION_KEY)
}

export function getAdminSession() {
  const raw = localStorage.getItem(ADMIN_SESSION_KEY)
  if (!raw) return null
  try {
    const session = JSON.parse(raw)
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      clearAdminSession()
      return null
    }
    return session
  } catch {
    return null
  }
}

// --- admin pins ---

export async function adminListPins(status = 'pending') {
  return apiFetch('/api/admin/pins', { params: { status }, auth: true })
}

export async function adminApprovePin(id, asType, { targetBuildingId, floorId } = {}) {
  return apiFetch(`/api/admin/pins/${id}/approve`, {
    method: 'POST',
    auth: true,
    body: { asType, targetBuildingId: targetBuildingId ?? null, floorId: floorId ?? null },
  })
}

export async function adminRejectPin(id, reason) {
  return apiFetch(`/api/admin/pins/${id}/reject`, { method: 'POST', auth: true, body: { reason } })
}

// --- admin buildings CRUD ---

export async function adminListBuildings() {
  return apiFetch('/api/admin/buildings', { auth: true })
}

export async function adminCreateBuilding(payload) {
  return apiFetch('/api/admin/buildings', { method: 'POST', auth: true, body: payload })
}

export async function adminUpdateBuilding(id, payload) {
  return apiFetch(`/api/admin/buildings/${id}`, { method: 'PUT', auth: true, body: payload })
}

export async function adminDeleteBuilding(id) {
  return apiFetch(`/api/admin/buildings/${id}`, { method: 'DELETE', auth: true })
}

// --- health check ---

export async function health() {
  return apiFetch('/api/health')
}
