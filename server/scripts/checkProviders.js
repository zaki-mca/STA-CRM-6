// Script to check if providers exist in the database
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

async function checkProviders() {
  try {
    console.log('Checking providers...');
    
    // Get all providers
    const providersResult = await pool.query('SELECT * FROM providers');
    console.log(`Found ${providersResult.rows.length} providers in the database`);
    
    if (providersResult.rows.length === 0) {
      console.log('No providers found. This could be causing invoice creation issues.');
      return;
    }
    
    // Print provider details
    console.log('Provider details:');
    providersResult.rows.forEach(provider => {
      console.log(`ID: ${provider.id}, Name: ${provider.name}, Email: ${provider.email}`);
    });
    
    // Check invoices with provider references
    const invoicesResult = await pool.query(`
      SELECT i.id, i.invoice_number, i.provider_id, p.name as provider_name
      FROM invoices i
      LEFT JOIN providers p ON i.provider_id = p.id
    `);
    
    console.log(`\nFound ${invoicesResult.rows.length} invoices in the database`);
    
    // Check for invoices with missing providers
    const invalidInvoices = invoicesResult.rows.filter(invoice => !invoice.provider_name);
    if (invalidInvoices.length > 0) {
      console.log(`\nWARNING: Found ${invalidInvoices.length} invoices with invalid or missing provider references:`);
      invalidInvoices.forEach(invoice => {
        console.log(`Invoice ID: ${invoice.id}, Number: ${invoice.invoice_number}, Provider ID: ${invoice.provider_id}`);
      });
    } else {
      console.log('\nAll invoices have valid provider references.');
    }
  } catch (error) {
    console.error('Error checking providers:', error);
  } finally {
    pool.end();
  }
}

checkProviders(); 