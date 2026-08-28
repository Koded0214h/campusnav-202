// Seed data shaped like the real API responses described in the PRD.
// UNILAG main campus.

// Used as the GPS fallback when location is denied/unavailable — kept
// distinct from every seeded building/POI below so a route to any of them
// is never a degenerate (identical start/end) request.
export const CAMPUS_CENTER = { lat: 6.5178, lng: 3.3958 }

export let buildings = [
  {
    id: 12,
    name: 'Faculty of Science',
    officialCode: 'FOS',
    category: 'faculty',
    description:
      'Houses the departments of Physics, Chemistry, Biochemistry, and Mathematics.',
    lat: 6.5175,
    lng: 3.3976,
    aliases: ['Fac of Sci', 'Science Building', 'FOS'],
  },
  {
    id: 13,
    name: 'Faculty of Engineering',
    officialCode: 'FOE',
    category: 'faculty',
    description: 'Home to Civil, Mechanical, Electrical, and Systems Engineering.',
    lat: 6.519,
    lng: 3.3991,
    aliases: ['Fac of Eng', 'Engineering'],
  },
  {
    id: 14,
    name: 'Senate Building',
    officialCode: 'SEN',
    category: 'admin',
    description: "The university's central administrative building.",
    lat: 6.5165,
    lng: 3.3962,
    aliases: ['Senate', 'Admin Block'],
  },
  {
    id: 15,
    name: 'Moremi Hall',
    officialCode: 'MOR',
    category: 'hostel',
    description: "Female undergraduate hostel.",
    lat: 6.5142,
    lng: 3.3998,
    aliases: ['Moremi', "Moremi Hostel"],
  },
  {
    id: 16,
    name: 'Jaja Hall',
    officialCode: 'JAJ',
    category: 'hostel',
    description: 'Male undergraduate hostel.',
    lat: 6.5205,
    lng: 3.4012,
    aliases: ['Jaja', 'Jaja Hostel'],
  },
  {
    id: 17,
    name: 'Main Library',
    officialCode: 'LIB',
    category: 'library',
    description: 'Kenneth Dike Library — main university library.',
    lat: 6.5183,
    lng: 3.3949,
    aliases: ['Kenneth Dike Library', 'KDL', 'The Library'],
  },
  {
    id: 18,
    name: 'Sports Complex',
    officialCode: 'SPC',
    category: 'recreation',
    description: 'Stadium, courts, and gymnasium.',
    lat: 6.5221,
    lng: 3.3937,
    aliases: ['Stadium', 'Sports Centre'],
  },
]

export let floors = [
  {
    id: 3,
    buildingId: 12,
    floorNumber: 1,
    accessibilityNotes: 'Ramp at east entrance',
  },
  {
    id: 4,
    buildingId: 12,
    floorNumber: 2,
    accessibilityNotes: 'Stairs only, no elevator',
  },
  {
    id: 5,
    buildingId: 13,
    floorNumber: 1,
    accessibilityNotes: 'Level entrance, wide corridors',
  },
]

export let pois = [
  { id: 44, buildingId: 12, floorId: 3, name: "Dean's Office", category: 'office', lat: 6.5176, lng: 3.3977 },
  { id: 45, buildingId: 12, floorId: 4, name: 'Physics Lab', category: 'lab', lat: 6.5174, lng: 3.3975 },
  { id: 46, buildingId: 17, floorId: null, name: 'Reading Room A', category: 'study', lat: 6.5184, lng: 3.395 },
  { id: 47, buildingId: null, floorId: null, name: 'Cafeteria', category: 'cafeteria', lat: 6.5178, lng: 3.3968 },
]

// A handful of pre-existing (already-approved) community pins so the map
// isn't empty on first load.
export let communityPins = [
  {
    id: 80,
    lat: 6.5188,
    lng: 3.3982,
    suggestedName: 'Mama Put Junction',
    suggestedCategory: 'landmark',
    aliasText: null,
    note: 'Everyone meets here before lectures',
    deviceId: 'seed-device',
    status: 'approved',
    submittedAt: '2026-08-01T09:00:00Z',
    reviewedBy: 1,
    reviewedAt: '2026-08-02T10:00:00Z',
    rejectionReason: null,
  },
]

let nextPinId = 91
export function reserveNextPinId() {
  return nextPinId++
}

export const admins = [
  { id: 1, email: 'admin@campusnav.app', password: 'campusnav123', role: 'superadmin' },
]

// --- simple in-memory mutation helpers (mock DB) ---

export function addBuilding(building) {
  const id = Math.max(0, ...buildings.map((b) => b.id)) + 1
  const record = { ...building, id, aliases: building.aliases ?? [] }
  buildings = [...buildings, record]
  return record
}

export function updateBuilding(id, patch) {
  buildings = buildings.map((b) => (b.id === id ? { ...b, ...patch } : b))
  return buildings.find((b) => b.id === id)
}

export function removeBuilding(id) {
  buildings = buildings.filter((b) => b.id !== id)
}

export function addPin(pin) {
  communityPins = [...communityPins, pin]
  return pin
}

export function updatePin(id, patch) {
  communityPins = communityPins.map((p) => (p.id === id ? { ...p, ...patch } : p))
  return communityPins.find((p) => p.id === id)
}
