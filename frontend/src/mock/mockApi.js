// Mock backend. Mirrors the endpoint contracts documented in the PRD
// (section 6.3) so this layer can be swapped for real `fetch` calls later
// without touching any component code.

import {
  admins,
  buildings,
  communityPins,
  floors,
  pois,
  addBuilding,
  addPin,
  removeBuilding,
  reserveNextPinId,
  updateBuilding,
  updatePin,
} from './mockData'
import { haversineMeters } from '../lib/geo'

const LATENCY_MS = 350

function delay(value, ms = LATENCY_MS) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

function apiError(status, message) {
  const err = new Error(message)
  err.status = status
  return err
}

// --- device id (for anonymous pin rate-limiting, per PRD 6.2) ---

export function getDeviceId() {
  let id = localStorage.getItem('campusnav_device_id')
  if (!id) {
    id = `dev_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
    localStorage.setItem('campusnav_device_id', id)
  }
  return id
}

// --- search & discovery ---

function aliasMatch(building, query) {
  const q = query.toLowerCase()
  if (building.name.toLowerCase().includes(q)) return building.name
  const alias = building.aliases.find((a) => a.toLowerCase().includes(q))
  return alias ?? null
}

export async function searchLocations(query, limit = 10) {
  if (!query || !query.trim()) return delay([])
  const q = query.trim().toLowerCase()

  const buildingResults = buildings
    .map((b) => {
      const matchedAlias = aliasMatch(b, q)
      return matchedAlias ? { ...b, matchedAlias } : null
    })
    .filter(Boolean)
    .map((b) => ({
      id: b.id,
      type: 'building',
      name: b.name,
      category: b.category,
      matchedAlias: b.matchedAlias,
      lat: b.lat,
      lng: b.lng,
    }))

  const poiResults = pois
    .filter((p) => p.name.toLowerCase().includes(q))
    .map((p) => ({
      id: p.id,
      type: 'poi',
      name: p.name,
      category: p.category,
      matchedAlias: p.name,
      lat: p.lat,
      lng: p.lng,
    }))

  return delay([...buildingResults, ...poiResults].slice(0, limit))
}

export async function getLocation(id) {
  const building = buildings.find((b) => b.id === Number(id))
  if (!building) throw apiError(404, 'Location not found')
  const buildingFloors = floors
    .filter((f) => f.buildingId === building.id)
    .map((f) => ({ id: f.id, floorNumber: f.floorNumber, accessibilityNotes: f.accessibilityNotes }))
  const buildingPois = pois
    .filter((p) => p.buildingId === building.id)
    .map((p) => ({ id: p.id, name: p.name, category: p.category }))

  return delay({
    id: building.id,
    name: building.name,
    category: building.category,
    description: building.description,
    lat: building.lat,
    lng: building.lng,
    aliases: building.aliases,
    floors: buildingFloors,
    pois: buildingPois,
  })
}

export async function getFloors(buildingId) {
  const result = floors
    .filter((f) => f.buildingId === Number(buildingId))
    .map((f) => ({
      id: f.id,
      floorNumber: f.floorNumber,
      accessibilityNotes: f.accessibilityNotes,
      pois: pois
        .filter((p) => p.floorId === f.id)
        .map((p) => ({ id: p.id, name: p.name })),
    }))
  return delay(result)
}

// --- routing ---

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

// There's no real routing backend yet, so pull an actual walking route from
// Mapbox's Directions API (PRD 6.1 lists it as a fallback/complement to
// backend-computed routes) — this snaps the line to real roads/paths
// instead of drawing a straight ruler line between two points.
async function fetchWalkingDirections(from, to, { alternatives = false } = {}) {
  if (!MAPBOX_TOKEN) return null
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/walking/${coords}` +
    `?geometries=geojson&overview=full${alternatives ? '&alternatives=true' : ''}` +
    `&access_token=${MAPBOX_TOKEN}`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    return data.routes?.length ? data.routes : null
  } catch {
    return null
  }
}

// Builds a plausible (not real-routing-engine) walking path: a couple of
// midpoint jogs so it doesn't look like a straight ruler line on the map.
function buildMockPath(from, to, accessible) {
  const jogSign = accessible ? 1 : -1
  const mid1 = {
    lat: from.lat + (to.lat - from.lat) * 0.33 + jogSign * 0.0004,
    lng: from.lng + (to.lng - from.lng) * 0.33,
  }
  const mid2 = {
    lat: from.lat + (to.lat - from.lat) * 0.66 - jogSign * 0.0002,
    lng: from.lng + (to.lng - from.lng) * 0.66,
  }
  return {
    type: 'LineString',
    coordinates: [
      [from.lng, from.lat],
      [mid1.lng, mid1.lat],
      [mid2.lng, mid2.lat],
      [to.lng, to.lat],
    ],
  }
}

const WALK_SPEED_M_PER_S = 1.3

export async function getRoute({ fromLat, fromLng, toId, toLat, toLng, accessible = false }) {
  // Callers that already have the destination's coordinates (e.g. a marker
  // just clicked on the map — including community pins, which aren't in
  // the buildings/pois tables) can pass toLat/toLng directly. Otherwise
  // fall back to the PRD-shaped toId lookup against known locations.
  let to = toLat != null && toLng != null ? { lat: Number(toLat), lng: Number(toLng) } : null
  if (!to) {
    to = buildings.find((b) => b.id === Number(toId)) ?? pois.find((p) => p.id === Number(toId))
  }
  if (!to) throw apiError(404, 'Destination not found')

  const from = { lat: Number(fromLat), lng: Number(fromLng) }

  // Prefer a real, road/path-following walking route from Mapbox. When
  // accessible is requested we ask for alternatives and pick the second
  // one if Mapbox offers it — a real (if imperfect) stand-in until pilot
  // buildings have actual stair/ramp path data (PRD 5.2, 6.4 `paths` table).
  const routes = await fetchWalkingDirections(from, to, { alternatives: accessible })
  if (routes) {
    const chosen = accessible && routes.length > 1 ? routes[1] : routes[0]
    let distanceMeters = Math.round(chosen.distance)
    let durationSeconds = Math.round(chosen.duration)
    if (accessible) {
      distanceMeters = Math.round(distanceMeters * 1.05)
      durationSeconds = Math.round(durationSeconds * 1.2) // slower, careful pace
    }
    return { distanceMeters, durationSeconds, accessible, path: chosen.geometry }
  }

  // No token / request failed — fall back to a synthetic path so the app
  // still works offline or without a Mapbox key.
  let distanceMeters = Math.round(haversineMeters(from, to))
  if (accessible) distanceMeters = Math.round(distanceMeters * 1.15)
  const durationSeconds = Math.round(distanceMeters / WALK_SPEED_M_PER_S)

  return delay({
    distanceMeters,
    durationSeconds,
    accessible,
    path: buildMockPath(from, to, accessible),
  })
}

// --- community pins (public) ---

const MAX_PENDING_PER_DEVICE = 5

export async function submitPin({ lat, lng, suggestedName, suggestedCategory, aliasText, note, deviceId }) {
  const pending = communityPins.filter((p) => p.deviceId === deviceId && p.status === 'pending')
  if (pending.length >= MAX_PENDING_PER_DEVICE) {
    throw apiError(429, 'Too many pending submissions from this device. Wait for review.')
  }
  if (!suggestedName || !suggestedName.trim()) {
    throw apiError(400, 'suggestedName is required')
  }

  const pin = {
    id: reserveNextPinId(),
    lat,
    lng,
    suggestedName: suggestedName.trim(),
    suggestedCategory: suggestedCategory ?? null,
    aliasText: aliasText ?? null,
    note: note ?? null,
    deviceId,
    status: 'pending',
    submittedAt: new Date().toISOString(),
    reviewedBy: null,
    reviewedAt: null,
    rejectionReason: null,
  }
  addPin(pin)
  return delay({ id: pin.id, status: pin.status, message: 'Submitted for review' }, 500)
}

export async function listApprovedPins() {
  return delay(communityPins.filter((p) => p.status === 'approved'))
}

// --- admin auth ---

const ADMIN_TOKEN_KEY = 'campusnav_admin_token'
const ADMIN_TOKEN_TTL_MS = 12 * 60 * 60 * 1000 // 12h

function encodeMockToken(payload) {
  return `mock.${btoa(JSON.stringify(payload))}.jwt`
}

export async function adminLogin({ email, password }) {
  const admin = admins.find((a) => a.email === email && a.password === password)
  if (!admin) throw apiError(401, 'Invalid email or password')

  const expiresAt = new Date(Date.now() + ADMIN_TOKEN_TTL_MS).toISOString()
  const token = encodeMockToken({ sub: admin.id, email: admin.email, role: admin.role, expiresAt })
  const session = { token, expiresAt, email: admin.email, role: admin.role }
  localStorage.setItem(ADMIN_TOKEN_KEY, JSON.stringify(session))
  return delay({ token, expiresAt })
}

export function adminLogout() {
  localStorage.removeItem(ADMIN_TOKEN_KEY)
}

export function getAdminSession() {
  const raw = localStorage.getItem(ADMIN_TOKEN_KEY)
  if (!raw) return null
  try {
    const session = JSON.parse(raw)
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      localStorage.removeItem(ADMIN_TOKEN_KEY)
      return null
    }
    return session
  } catch {
    return null
  }
}

function requireAdmin() {
  const session = getAdminSession()
  if (!session) throw apiError(401, 'Admin authentication required')
  return session
}

// --- admin pins ---

export async function adminListPins(status = 'pending') {
  requireAdmin()
  return delay(communityPins.filter((p) => p.status === status))
}

export async function adminApprovePin(id, asType) {
  const session = requireAdmin()
  const pin = communityPins.find((p) => p.id === Number(id))
  if (!pin) throw apiError(404, 'Pin not found')

  let createdEntityId = null
  if (asType === 'building') {
    createdEntityId = addBuilding({
      name: pin.suggestedName,
      officialCode: null,
      category: pin.suggestedCategory ?? 'other',
      description: pin.note ?? '',
      lat: pin.lat,
      lng: pin.lng,
      aliases: pin.aliasText ? [pin.aliasText] : [],
    }).id
  } else if (asType === 'poi') {
    // Simplified: POIs from pins aren't attached to a building/floor.
    createdEntityId = pin.id
  } else if (asType === 'alias') {
    createdEntityId = pin.id
  }

  updatePin(pin.id, {
    status: 'approved',
    reviewedBy: session.email,
    reviewedAt: new Date().toISOString(),
  })

  return delay({ id: pin.id, status: 'approved', createdEntityId })
}

export async function adminRejectPin(id, reason) {
  const session = requireAdmin()
  const pin = communityPins.find((p) => p.id === Number(id))
  if (!pin) throw apiError(404, 'Pin not found')

  updatePin(pin.id, {
    status: 'rejected',
    rejectionReason: reason ?? null,
    reviewedBy: session.email,
    reviewedAt: new Date().toISOString(),
  })
  return delay({ id: pin.id, status: 'rejected' })
}

// --- admin buildings CRUD ---

export async function adminListBuildings() {
  requireAdmin()
  return delay(buildings)
}

export async function adminCreateBuilding(payload) {
  requireAdmin()
  return delay(addBuilding(payload))
}

export async function adminUpdateBuilding(id, payload) {
  requireAdmin()
  const updated = updateBuilding(Number(id), payload)
  if (!updated) throw apiError(404, 'Building not found')
  return delay(updated)
}

export async function adminDeleteBuilding(id) {
  requireAdmin()
  removeBuilding(Number(id))
  return delay({ id: Number(id), deleted: true })
}

// --- health check (mocked cron target) ---

export async function health() {
  return delay({ status: 'ok' }, 50)
}
