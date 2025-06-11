import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Connection settings
const connectionConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Create a connection pool
const pool = new Pool(connectionConfig);

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to database. Running invoice items migration...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '012-add-sample-invoice-items.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');
    
    console.log('Migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error running migration:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
runMigration()
  .then(() => console.log('Migration process finished.'))
  .catch(err => console.error('Migration process failed:', err)); 