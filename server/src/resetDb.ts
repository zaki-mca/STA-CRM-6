import fs from 'fs';
import path from 'path';
import { query } from './db';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function resetDatabase() {
  try {
    console.log('Starting database reset...');
    
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema SQL
    console.log('Executing schema SQL...');
    await query(schema);
    
    console.log('Database reset completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

// Run the reset function
resetDatabase(); 