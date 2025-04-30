-- Create location_updates table
CREATE TABLE location_updates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    accuracy NUMERIC,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    source TEXT NOT NULL DEFAULT 'user'
);

-- Add index for faster location queries
CREATE INDEX location_updates_user_id_idx ON location_updates(user_id);
CREATE INDEX location_updates_timestamp_idx ON location_updates(timestamp);

-- Update emergency_alerts table
ALTER TABLE emergency_alerts
    ALTER COLUMN latitude TYPE NUMERIC USING latitude::numeric,
    ALTER COLUMN longitude TYPE NUMERIC USING longitude::numeric,
    ADD COLUMN accuracy NUMERIC,
    ADD COLUMN updated_at TIMESTAMP DEFAULT NOW(),
    ADD COLUMN resolved_at TIMESTAMP,
    ADD COLUMN assigned_at TIMESTAMP,
    ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium',
    ALTER COLUMN status SET DEFAULT 'pending';

-- Update ambulance_units table
ALTER TABLE ambulance_units
    ALTER COLUMN latitude TYPE NUMERIC USING latitude::numeric,
    ALTER COLUMN longitude TYPE NUMERIC USING longitude::numeric,
    ADD COLUMN accuracy NUMERIC,
    ADD COLUMN last_location_update TIMESTAMP,
    ADD COLUMN current_emergency_id INTEGER REFERENCES emergency_alerts(id);

-- Update medical_facilities table
ALTER TABLE medical_facilities
    ALTER COLUMN latitude TYPE NUMERIC USING latitude::numeric,
    ALTER COLUMN longitude TYPE NUMERIC USING longitude::numeric,
    ADD COLUMN capacity INTEGER,
    ADD COLUMN current_occupancy INTEGER DEFAULT 0,
    ADD COLUMN last_update TIMESTAMP;

-- Add indexes for spatial queries
CREATE INDEX emergency_alerts_location_idx ON emergency_alerts(latitude, longitude);
CREATE INDEX ambulance_units_location_idx ON ambulance_units(latitude, longitude);
CREATE INDEX medical_facilities_location_idx ON medical_facilities(latitude, longitude);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_emergency_alerts_updated_at
    BEFORE UPDATE ON emergency_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 