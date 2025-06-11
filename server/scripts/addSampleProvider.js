// Script to add a sample provider to the database
const { Pool } = require('pg');
require('dotenv').config(); // Load environment variables from .env file

// Use environment variables for database connection - matching the .env file
const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'STA-CRM-6',
  password: process.env.PGPASSWORD || 'postgres',
  port: process.env.PGPORT || 5432,
});

async function addSampleProvider() {
  try {
    console.log('Adding a sample provider...');
    
    // Check if any providers exist
    const existingProviders = await pool.query('SELECT COUNT(*) FROM providers');
    if (parseInt(existingProviders.rows[0].count) > 0) {
      console.log(`Found ${existingProviders.rows[0].count} existing providers. Adding a new one anyway.`);
    }
    
    // Add a default provider
    const result = await pool.query(`
      INSERT INTO providers (name, email, address, phone)
      VALUES ('Default Provider', 'provider@example.com', '123 Provider St', '+1234567890')
      RETURNING *
    `);
    
    const newProvider = result.rows[0];
    console.log('Successfully added sample provider:');
    console.log(`ID: ${newProvider.id}, Name: ${newProvider.name}, Email: ${newProvider.email}`);
    console.log('Use this provider ID for creating invoices.');
    
    return newProvider;
  } catch (error) {
    console.error('Error adding sample provider:', error);
  } finally {
    pool.end();
  }
}

addSampleProvider(); 