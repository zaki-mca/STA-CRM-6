import { query } from './db';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  try {
    // Read the migration file
    const migrationPath = path.resolve(__dirname, 'db/migrations/010-ensure-product-price-fields.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Running migration: 010-ensure-product-price-fields.sql');
    
    // Execute the migration
    await query(migration);
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error running migration:', error);
  }
}

// Run the migration
runMigration(); 