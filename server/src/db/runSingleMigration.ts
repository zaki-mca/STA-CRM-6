import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file in the server directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Configure PostgreSQL connection using the same environment variables as the main app
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runSingleMigration() {
  // Connect to PostgreSQL
  const client = await pool.connect();
  
  try {
    console.log('Running migration for missing display fields...');
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Define the migration SQL directly
    const migrationSQL = `
      -- Migration to ensure all required display fields are properly set up

      -- Make sure professional domains have payment codes
      UPDATE professional_domains
      SET payment_code = 'CODE-' || SUBSTRING(name FROM 1 FOR 3)
      WHERE payment_code IS NULL;

      -- Make sure all clients have birth_date for age calculation
      UPDATE clients
      SET birth_date = '1980-01-01'
      WHERE birth_date IS NULL;

      -- Make sure all products have sell_price and buy_price
      UPDATE products
      SET 
        sell_price = price,
        buy_price = price * 0.7
      WHERE sell_price IS NULL OR buy_price IS NULL;

      -- Make sure all providers have phone numbers
      UPDATE providers
      SET phone = 'N/A'
      WHERE phone IS NULL OR phone = '';
    `;
    
    // Execute the migration
    await client.query(migrationSQL);
    console.log('Migration completed successfully');
    
    // Commit the transaction
    await client.query('COMMIT');
    
  } catch (error) {
    // Rollback the transaction in case of error
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    // Release the client back to the pool
    client.release();
  }
}

// Run the migration
runSingleMigration()
  .then(() => {
    console.log('Database updated successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to update database:', error);
    process.exit(1);
  }); 