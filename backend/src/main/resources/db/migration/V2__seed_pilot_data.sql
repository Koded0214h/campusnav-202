WITH seed(name, official_code, category, lng, lat, description) AS (
    VALUES
    ('Faculty of Science', 'FOS', 'faculty', 3.3976, 6.5175, 'Houses the science departments.'),
    ('Faculty of Engineering', 'FOE', 'faculty', 3.3991, 6.5190, 'Home to the engineering departments.'),
    ('UNILAG Senate Building', 'SEN', 'admin', 3.3987129, 6.5194683, 'University administration and Senate chambers.'),
    ('Moremi Hall', 'MOREMI', 'hostel', 3.3971292, 6.5179703, 'Female student hostel.'),
    ('King Jaja Hall', 'JAJA', 'hostel', 3.3978204, 6.5161610, 'Male student hostel.'),
    ('University of Lagos Main Library', 'MAINLIB', 'library', 3.3999487, 6.5200958, 'Central university library.'),
    ('Sports Center, University of Lagos Akoka', 'SPORTS', 'recreation', 3.3865737, 6.5166212, 'UNILAG Sports Complex.')
)
INSERT INTO buildings (name, official_code, category, geom, description)
SELECT seed.name, seed.official_code, seed.category,
       ST_SetSRID(ST_MakePoint(seed.lng, seed.lat), 4326), seed.description
FROM seed
WHERE NOT EXISTS (
    SELECT 1 FROM buildings existing WHERE existing.official_code = seed.official_code
);

WITH seed(official_code, alias_text) AS (
    VALUES
    ('FOS', 'Fac of Sci'), ('FOS', 'Science Building'),
    ('FOE', 'Fac of Eng'), ('FOE', 'Engineering'),
    ('SEN', 'Senate'), ('SEN', 'Admin Block'),
    ('MOREMI', 'Moremi Hostel'), ('JAJA', 'Jaja Hostel'),
    ('MAINLIB', 'Kenneth Dike Library'), ('MAINLIB', 'KDL'),
    ('SPORTS', 'Stadium'), ('SPORTS', 'Sports Centre')
)
INSERT INTO aliases (building_id, alias_text)
SELECT building.id, seed.alias_text
FROM seed
JOIN buildings building ON building.official_code = seed.official_code
WHERE NOT EXISTS (
    SELECT 1 FROM aliases existing
    WHERE existing.building_id = building.id
      AND lower(existing.alias_text) = lower(seed.alias_text)
);

INSERT INTO floors (building_id, floor_number, accessibility_notes)
SELECT building.id, floor_data.floor_number, floor_data.notes
FROM buildings building
CROSS JOIN (VALUES (1, 'Ramp at east entrance'), (2, 'Stairs only, no elevator'))
    AS floor_data(floor_number, notes)
WHERE building.official_code = 'FOS'
  AND NOT EXISTS (
      SELECT 1 FROM floors existing
      WHERE existing.building_id = building.id
        AND existing.floor_number = floor_data.floor_number
  );

INSERT INTO pois (building_id, floor_id, name, category, geom)
SELECT building.id, floor.id, 'Dean''s Office', 'office',
       ST_SetSRID(ST_MakePoint(3.3977, 6.5176), 4326)
FROM buildings building
JOIN floors floor ON floor.building_id = building.id AND floor.floor_number = 1
WHERE building.official_code = 'FOS'
  AND NOT EXISTS (
      SELECT 1 FROM pois existing
      WHERE existing.building_id = building.id
        AND lower(existing.name) = lower('Dean''s Office')
  );

INSERT INTO admins (email, password_hash, role)
SELECT 'admin@campusnav.app',
       '$2y$12$3Re6JfFDfB0oLSLTXcpG5us.boZpXkGHhPeRANqdZ8gyvSfP9gJpe',
       'superadmin'
WHERE NOT EXISTS (
    SELECT 1 FROM admins WHERE lower(email) = lower('admin@campusnav.app')
);
