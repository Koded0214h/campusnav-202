-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Buildings Table
CREATE TABLE buildings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    official_code VARCHAR(20),
    category VARCHAR(50),
    geom GEOMETRY(Point,4326) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Aliases Table
CREATE TABLE aliases (
    id SERIAL PRIMARY KEY,
    building_id INT REFERENCES buildings(id) ON DELETE CASCADE,
    alias_text VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Floors Table
CREATE TABLE floors (
    id SERIAL PRIMARY KEY,
    building_id INT REFERENCES buildings(id) ON DELETE CASCADE,
    floor_number INT NOT NULL,
    accessibility_notes TEXT
);

-- 4. POIs Table
CREATE TABLE pois (
    id SERIAL PRIMARY KEY,
    building_id INT REFERENCES buildings(id) ON DELETE SET NULL,
    floor_id INT REFERENCES floors(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50),
    geom GEOMETRY(Point,4326) NOT NULL
);

-- 5. Paths Table
CREATE TABLE paths (
    id SERIAL PRIMARY KEY,
    geom GEOMETRY(LineString,4326) NOT NULL,
    walkable BOOLEAN DEFAULT true,
    accessible BOOLEAN DEFAULT true,
    surface_type VARCHAR(30)
);

-- 6. Admins Table
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'moderator',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Pin Submissions Table
CREATE TABLE pin_submissions (
    id SERIAL PRIMARY KEY,
    geom GEOMETRY(Point,4326) NOT NULL,
    suggested_name VARCHAR(150) NOT NULL,
    suggested_category VARCHAR(50),
    alias_text VARCHAR(150),
    note TEXT,
    device_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    submitted_at TIMESTAMPTZ DEFAULT now(),
    reviewed_by INT REFERENCES admins(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT
);

-- Spatial Indexes for Fast Spatial Queries
CREATE INDEX IF NOT EXISTS idx_buildings_geom ON buildings USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_pois_geom ON pois USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_paths_geom ON paths USING GIST (geom);