CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE buildings (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    official_code VARCHAR(20),
    category VARCHAR(50) NOT NULL,
    geom GEOMETRY(Point, 4326) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_buildings_official_code UNIQUE (official_code)
);

CREATE TABLE aliases (
    id BIGSERIAL PRIMARY KEY,
    building_id BIGINT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    alias_text VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_aliases_building_text UNIQUE (building_id, alias_text)
);

CREATE TABLE floors (
    id BIGSERIAL PRIMARY KEY,
    building_id BIGINT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    floor_number INTEGER NOT NULL,
    accessibility_notes TEXT,
    CONSTRAINT uq_floors_building_number UNIQUE (building_id, floor_number)
);

CREATE TABLE pois (
    id BIGSERIAL PRIMARY KEY,
    building_id BIGINT REFERENCES buildings(id) ON DELETE SET NULL,
    floor_id BIGINT REFERENCES floors(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    geom GEOMETRY(Point, 4326) NOT NULL
);

CREATE TABLE paths (
    id BIGSERIAL PRIMARY KEY,
    geom GEOMETRY(LineString, 4326) NOT NULL,
    walkable BOOLEAN NOT NULL DEFAULT true,
    accessible BOOLEAN NOT NULL DEFAULT true,
    surface_type VARCHAR(30)
);

CREATE TABLE admins (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'moderator',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_admins_role CHECK (role IN ('moderator', 'superadmin'))
);

CREATE TABLE pin_submissions (
    id BIGSERIAL PRIMARY KEY,
    geom GEOMETRY(Point, 4326) NOT NULL,
    suggested_name VARCHAR(150) NOT NULL,
    suggested_category VARCHAR(50),
    alias_text VARCHAR(150),
    note TEXT,
    device_id VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_by BIGINT REFERENCES admins(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    CONSTRAINT ck_pin_submissions_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX idx_buildings_geom ON buildings USING GIST (geom);
CREATE INDEX idx_pois_geom ON pois USING GIST (geom);
CREATE INDEX idx_paths_geom ON paths USING GIST (geom);
CREATE INDEX idx_pin_submissions_geom ON pin_submissions USING GIST (geom);
CREATE INDEX idx_pin_submissions_device_status ON pin_submissions (device_id, status);
CREATE INDEX idx_aliases_lower_text ON aliases (lower(alias_text));
CREATE INDEX idx_buildings_lower_name ON buildings (lower(name));
CREATE INDEX idx_pois_lower_name ON pois (lower(name));
