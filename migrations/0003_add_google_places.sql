-- Add Google Places columns to medical_facilities
ALTER TABLE medical_facilities
    ADD COLUMN google_place_id TEXT UNIQUE,
    ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();

-- Create index for Google Places ID lookups
CREATE INDEX medical_facilities_google_place_id_idx ON medical_facilities(google_place_id);

-- Add PostGIS extension for spatial queries if not exists
CREATE EXTENSION IF NOT EXISTS postgis; 