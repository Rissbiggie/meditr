import { pool } from './db';

async function migrate() {
  try {
    const client = await pool.connect();
    
    console.log('Adding missing columns to users table...');
    
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS verification_token TEXT,
      ADD COLUMN IF NOT EXISTS verification_expiry TIMESTAMP,
      ADD COLUMN IF NOT EXISTS reset_token TEXT,
      ADD COLUMN IF NOT EXISTS reset_expiry TIMESTAMP,
      ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
    `);

    console.log('Adding missing columns to medical_facilities table...');

    await client.query(`
      ALTER TABLE medical_facilities
      ADD COLUMN IF NOT EXISTS capacity INTEGER,
      ADD COLUMN IF NOT EXISTS current_occupancy INTEGER,
      ADD COLUMN IF NOT EXISTS last_update TIMESTAMP,
      ADD COLUMN IF NOT EXISTS google_place_id TEXT UNIQUE,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

      -- Create index for Google Places ID lookups if not exists
      CREATE INDEX IF NOT EXISTS medical_facilities_google_place_id_idx ON medical_facilities(google_place_id);
    `);
    
    console.log('Migration completed successfully');
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate(); 