# CampusNav API

Spring Boot backend for the CampusNav React client. It uses PostgreSQL/PostGIS,
Flyway migrations, stateless JWT admin authentication, and a JaCoCo cyclomatic
complexity gate.

## Run locally

Requirements: Java 21, Maven 3.9+, and Docker/Podman Compose.

```bash
docker compose -f compose.yml up -d
mvn spring-boot:run
```

Defaults match `compose.yml`. For local development, the application loads
`backend/.env`, including quoted dotenv values. Real environment variables retain
higher priority, so deployment platforms should provide secrets through their
environment/secret manager instead of shipping a dotenv file.

Flyway uses `baseline-on-migrate` because the shared Neon database was initially
created from `schema.sql`. It records that existing schema as version 1 and then
applies later migrations without recreating its tables.

The seeded development admin is `admin@campusnav.app` with password
`campusnav123`. Replace it before deployment.

## Verify

```bash
mvn verify
```

`verify` runs tests, creates the JaCoCo report at
`target/site/jacoco/index.html`, and fails when any production method exceeds a
cyclomatic complexity of 10.

## API summary

Public:

- `GET /api/health`
- `GET /api/locations`
- `GET /api/locations/search?q=FOS&limit=10`
- `GET /api/locations/{buildingId}`
- `GET /api/locations/pois/{poiId}`
- `GET /api/locations/{buildingId}/floors`
- `GET /api/floors/{buildingId}`
- `GET /api/route?fromLat=...&fromLng=...&toId=...&accessible=false`
- `GET /api/route?fromLat=...&fromLng=...&toLat=...&toLng=...`
- `POST /api/pins`
- `GET /api/pins/approved`

Admin (Bearer JWT except login):

- `POST /api/admin/auth/login`
- `GET /api/admin/pins?status=pending`
- `POST /api/admin/pins/{id}/approve`
- `POST /api/admin/pins/{id}/reject`
- `GET|POST /api/admin/buildings`
- `PUT|DELETE /api/admin/buildings/{id}`

Alias approval requires `targetBuildingId`; POI approval may include
`targetBuildingId` and `floorId`.

`GET /api/health` is provided by Spring Boot Actuator and includes its database
health indicator. It returns HTTP `200` with `{"status":"UP"}` while the
application and PostgreSQL datasource are healthy, and HTTP `503` with
`{"status":"DOWN"}` if the database becomes unavailable.

## Routing limitation

Set `MAPBOX_TOKEN` to proxy walking directions through Mapbox. Without it, the
API returns a direct GeoJSON fallback. The accessible flag currently requests
alternatives and applies an estimated fallback detour; guaranteed stair-free
routing requires connected path graph data that is not yet present in the
database schema.
