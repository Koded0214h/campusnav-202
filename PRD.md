# CampusNav

**Product Requirements Document**

- **Institution:** University of Lagos (UNILAG)
- **Tech Stack:** Spring Boot (backend) · Neon PostgreSQL/PostGIS (database) · React + Mapbox GL (frontend)
- **Hosting:** Render (backend + frontend) · Neon (database) · cron-job.org (keep-alive & cleanup)
- **Team Size:** 3 developers
- **Status:** Draft v3

## 1. Overview

CampusNav is a mobile-friendly web application that helps students, staff, and visitors navigate the University of Lagos campus — including outdoor pathfinding, an immersive 3D campus map, building/POI search (with local/vernacular alias support), and accessibility-aware routing.

## 2. Problem Statement

New students, visitors, and even returning students frequently struggle to locate lecture halls, offices, hostels, and other facilities across UNILAG's large and complex campus. Signage is inconsistent, buildings are often referred to by informal or local names not reflected on any map, and there's no existing tool that accounts for accessibility needs, such as wheelchair-friendly routes.

## 3. Goals

- Provide accurate, fast wayfinding across campus with an engaging 3D map experience.
- Allow users to search for locations using both official and informal/vernacular names.
- Support accessibility-conscious routing (e.g. avoid stairs).
- Deliver a lightweight, mobile-first experience that works well on average student data plans.

### Non-Goals (Out of Scope for v1)

- Real-time GPS turn-by-turn voice navigation (v1 is map + route preview, not live walking directions).
- Full indoor navigation for every building (v1 focuses on a few high-traffic pilot buildings).
- Native mobile app (v1 is a responsive web app).

## 4. Target Users

- Incoming/new students — orientation week, finding lecture halls and hostels.
- Returning students — finding new offices, exam venues, event locations.
- Staff & visitors — locating administrative buildings, meeting rooms.
- Students with mobility needs — accessible route planning.

## 5. Core Features (v1 Scope)

### 5.1 Search & Discovery

- Search bar to find buildings, departments, and points of interest (POIs).
- Alias matching — e.g. searching "Fac of Sci" or a common nickname resolves to the correct official building.
- Autocomplete/suggestions as the user types.

### 5.2 Map & Routing (Mapbox)

- Interactive 3D campus map powered by Mapbox GL JS, with building extrusions for a realistic sense of place.
- Smooth camera fly-to / tilt / rotate interactions when a user selects a destination.
- Route calculation between two points (current location or manually selected start → destination).
- Distance and estimated walking time.
- Accessible route toggle (avoids stairs/uneven terrain where data exists).

### 5.3 Building & POI Details

- Tap a building/POI to see basic info: name, department(s) housed, floor list (where indoor data exists).
- Floor-level detail for a limited set of pilot buildings (accessibility layer).

### 5.4 User Location

- Use device GPS (with permission) to set "current location" as route start.
- Manual pin-drop fallback if GPS is unavailable or denied.

### 5.5 Community Pins (Crowdsourced Locations)

- Any user can long-press the map to drop a pin for an unlisted location (e.g. a local landmark, informal meeting spot).
- Submission requires only a name and location — no login. Submissions are rate-limited per device to deter spam.
- Pins enter a moderation queue and only appear publicly once approved by an admin.

### 5.6 Admin Panel

- Auth-gated dashboard (separate from the public app) for reviewing community pin submissions.
- Approve a pin as a new building, POI, or alias of an existing building; or reject with a reason.
- Basic CRUD on buildings, POIs, floors, and aliases for correcting/enriching map data.

## 6. Technical Architecture

### 6.1 Frontend — React + Mapbox

**Owner:** Koded

- Mapbox GL JS for the interactive 3D map — building extrusions, custom markers, fly-to camera animations.
- Mapbox APIs in use: Maps SDK / GL JS (3D map rendering), Geocoding API (address/POI lookup support), Directions API (as a fallback/complement to backend-computed routes).
- Search bar component with debounced API calls and autocomplete dropdown.
- Route display: highlighted path on map + summary panel (distance, time, accessibility flag).
- Long-press-to-drop-pin interaction for community pin submissions.
- Separate admin panel views (login, pin review queue, CRUD forms) gated behind the JWT auth flow.
- Responsive, mobile-first design.

### 6.2 Authentication

Two tiers — public users need no account; admins are the only authenticated role.

- **Public users:** no login required to search, view routes, browse, or submit a pin. A `device_id` generated client-side and stored in `localStorage` is sent with pin submissions for lightweight rate-limiting (max 5 pending submissions per device).
- **Admins:** JWT-based auth via Spring Security. Credentials stored in the `admins` table (bcrypt-hashed passwords). No public self-signup — admins are seeded manually or invited by a superadmin.
- Admin routes are namespaced under `/api/admin/**` and require a valid `Authorization: Bearer <jwt>` header.

### 6.3 Backend — Spring Boot

**Owner:** Abideen

- REST API serving map data, search/alias resolution, route computation, and pin moderation.
- Layers: Controller → Service → Repository (standard Spring Boot structure).

#### Public endpoints

**`GET /api/locations/search?q={query}&limit=10`** — search buildings/POIs with alias resolution

Response `200`:
```json
[
  {
    "id": 12, "type": "building", "name": "Faculty of Science",
    "category": "faculty", "matchedAlias": "Fac of Sci",
    "lat": 6.5175, "lng": 3.3976
  }
]
```

**`GET /api/locations/{id}`** — building/POI detail

Response `200`:
```json
{
  "id": 12, "name": "Faculty of Science", "category": "faculty",
  "description": "...", "lat": 6.5175, "lng": 3.3976,
  "aliases": ["Fac of Sci", "Science Building"],
  "floors": [
    { "id": 3, "floorNumber": 1, "accessibilityNotes": "Ramp at east entrance" }
  ],
  "pois": [
    { "id": 44, "name": "Dean's Office", "category": "office" }
  ]
}
```

**`GET /api/route?fromLat={lat}&fromLng={lng}&toId={id}&accessible={bool}`** — route between two points

Response `200`:
```json
{
  "distanceMeters": 340, "durationSeconds": 260, "accessible": true,
  "path": {
    "type": "LineString",
    "coordinates": [[3.397, 6.517], [3.398, 6.518], ...]
  }
}
```

**`GET /api/floors/{buildingId}`** — floor + POI data for pilot buildings

Response `200`:
```json
[
  {
    "id": 3, "floorNumber": 1, "accessibilityNotes": "...",
    "pois": [{ "id": 44, "name": "Dean's Office" }]
  }
]
```

**`POST /api/pins`** — submit a community pin for review

Request body:
```json
{
  "lat": 6.519, "lng": 3.399, "suggestedName": "Mama Put Junction",
  "suggestedCategory": "landmark", "aliasText": null,
  "note": "Everyone meets here", "deviceId": "abc123"
}
```

Response `201`:
```json
{ "id": 91, "status": "pending", "message": "Submitted for review" }
```

#### Admin endpoints (require Bearer token)

**`POST /api/admin/auth/login`** — authenticate and receive a JWT

Request body:
```json
{ "email": "admin@campusnav.app", "password": "••••••••" }
```

Response `200`:
```json
{ "token": "eyJhbGciOi...", "expiresAt": "2026-08-13T00:00:00Z" }
```

**`GET /api/admin/pins?status=pending`** — list pin submissions by status

**`POST /api/admin/pins/{id}/approve`** — approve a pin, creating a real entity

Request body:
```json
{ "asType": "poi" }
```
(`"poi"` | `"building"` | `"alias"`)

Response `200`:
```json
{ "id": 91, "status": "approved", "createdEntityId": 45 }
```

**`POST /api/admin/pins/{id}/reject`** — reject a pin with a reason

Request body:
```json
{ "reason": "Duplicate of existing POI" }
```

Response `200`:
```json
{ "id": 91, "status": "rejected" }
```

**`POST / PUT / DELETE /api/admin/buildings(/{id})`** — create, edit, or remove a building

**`GET /api/health`** — lightweight ping used by cron-job.org to keep the service warm

### 6.4 Database — Neon PostgreSQL + PostGIS

**Owner:** Samuel

- Neon PostgreSQL as the managed database, with the PostGIS extension enabled for spatial data types and queries.
- A GiST index on every `geom` column keeps proximity and route queries fast (`CREATE INDEX ... USING GIST (geom)`).

**Schema:**

```sql
buildings
  id              SERIAL PRIMARY KEY
  name            VARCHAR(150) NOT NULL
  official_code   VARCHAR(20)
  category        VARCHAR(50)          -- faculty, hostel, admin, ...
  geom            GEOMETRY(Point,4326) NOT NULL
  description     TEXT
  created_at      TIMESTAMPTZ DEFAULT now()
  updated_at      TIMESTAMPTZ DEFAULT now()

aliases
  id              SERIAL PRIMARY KEY
  building_id     INT REFERENCES buildings(id) ON DELETE CASCADE
  alias_text      VARCHAR(150) NOT NULL
  created_at      TIMESTAMPTZ DEFAULT now()

pois
  id              SERIAL PRIMARY KEY
  building_id     INT REFERENCES buildings(id) ON DELETE SET NULL
  floor_id        INT REFERENCES floors(id) ON DELETE SET NULL
  name            VARCHAR(150) NOT NULL
  category        VARCHAR(50)          -- office, cafeteria, landmark, ...
  geom            GEOMETRY(Point,4326) NOT NULL

floors
  id                    SERIAL PRIMARY KEY
  building_id           INT REFERENCES buildings(id) ON DELETE CASCADE
  floor_number          INT NOT NULL
  accessibility_notes   TEXT

paths
  id              SERIAL PRIMARY KEY
  geom            GEOMETRY(LineString,4326) NOT NULL
  walkable        BOOLEAN DEFAULT true
  accessible      BOOLEAN DEFAULT true
  surface_type    VARCHAR(30)          -- paved, gravel, stairs

pin_submissions
  id                  SERIAL PRIMARY KEY
  geom                GEOMETRY(Point,4326) NOT NULL
  suggested_name      VARCHAR(150) NOT NULL
  suggested_category  VARCHAR(50)
  alias_text          VARCHAR(150)
  note                TEXT
  device_id           VARCHAR(100)
  status              VARCHAR(20) DEFAULT 'pending'   -- pending | approved | rejected
  submitted_at        TIMESTAMPTZ DEFAULT now()
  reviewed_by         INT REFERENCES admins(id)
  reviewed_at         TIMESTAMPTZ
  rejection_reason    TEXT

admins
  id              SERIAL PRIMARY KEY
  email           VARCHAR(150) UNIQUE NOT NULL
  password_hash   VARCHAR(255) NOT NULL
  role            VARCHAR(20) DEFAULT 'moderator'   -- moderator | superadmin
  created_at      TIMESTAMPTZ DEFAULT now()
```

## 7. Hosting & Infrastructure

- **Backend:** Spring Boot deployed as a Render Web Service.
- **Database:** Neon PostgreSQL, with the PostGIS extension enabled.
- **Frontend:** Render Static Site (React production build).
- **Cron:** cron-job.org hits `/api/health` every ~10 minutes to prevent Render's free-tier cold-start spin-down, plus a daily job to auto-purge rejected pin submissions older than 30 days.

## 8. Product Flow (End to End)

1. **Landing** — user opens the app and sees a 3D Mapbox campus view centered on UNILAG, prompted for location permission.
2. **Search** — types "fac of sci"; autocomplete hits `/api/locations/search`, alias resolves to "Faculty of Science."
3. **Select destination** — map flies/tilts to the building; a card slides up with name, category, description, and floor list if available.
4. **Get directions** — user taps "Directions"; start point is GPS location (or a manual pin drop if GPS is denied) → `/api/route` returns the path, distance, and time; the route draws on the 3D map.
5. **Accessibility toggle** — user flips "accessible route"; the route re-fetches with `accessible=true` and recalculates to avoid stairs.
6. **Floor detail (optional)** — for buildings with indoor data, the user taps into a floor to see POIs and accessibility notes for that level.
7. **Suggest a pin** — user spots an unlisted local landmark, long-presses the map, drops a pin, names it, and adds an optional alias/note → `POST /api/pins` → confirmation toast.
8. **Moderation** — an admin logs into the admin panel, sees a queue of pending pins on a mini-map, and approves (choosing whether it becomes a building/POI/alias) or rejects with a reason.
9. **Live update** — an approved pin becomes searchable and visible to all users immediately.
10. **Keep-alive** — cron-job.org quietly pings the backend so the first real user of the day doesn't hit a cold-start delay.

## 9. Team Responsibilities (3 Devs)

| Role | Owner | Scope |
|---|---|---|
| Frontend Developer | Koded | React app, Mapbox 3D map UI, search UX, route display |
| Backend Developer | Abideen | Spring Boot API, routing logic, alias search logic |
| Database Developer | Samuel | PostGIS schema design, spatial queries, data seeding |

**Note:** with 3 devs covering the full stack, testing/integration responsibilities are shared — backend testing sits with Abideen, frontend testing with Koded, and Samuel supports both on data-related edge cases.

## 10. Non-Functional Requirements

- **Performance:** search results return in <500ms; route calculation in <1s for typical campus-scale queries.
- **Availability:** app should work reliably on 3G/4G connections common on campus.
- **Scalability:** should comfortably handle concurrent use during peak periods (e.g. first week of semester).
- **Accessibility:** UI should meet basic WCAG considerations (contrast, tap target size) in addition to route-level accessibility features.

## 11. Milestones (Draft)

| Phase | Deliverable |
|---|---|
| Phase 1 | Neon/PostGIS schema + seed data for pilot zone (few buildings), basic Spring Boot CRUD API |
| Phase 2 | Search + alias resolution working end-to-end |
| Phase 3 | React + Mapbox 3D map integration, route display |
| Phase 4 | Accessibility routing + floor data for pilot buildings |
| Phase 5 | Community pin submission flow + admin panel (auth, review queue, CRUD) |
| Phase 6 | Testing, polish, deploy to Render + Neon, cron-job.org keep-alive |

## 12. Success Metrics

- % of test users who successfully find a destination without external help.
- Average time-to-find for a location search.
- Adoption during orientation week (target to be defined).
- Number and quality of approved community pins (signal of engagement + data growth).

## 13. Open Questions

- Which buildings are in the "pilot zone" for indoor/accessibility data?
- Mapbox pricing/usage tier — expected load and free-tier limits for the project's lifespan?
- Neon plan/tier — storage and compute limits for the project's lifespan?
- How many admin accounts do we need at launch, and who can invite new admins — seeded manually for v1, or a superadmin invite flow?
