// Script to fix invoices with missing provider references
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

async function fixInvoiceProviders() {
  try {
    console.log('Fixing invoices with missing provider references...');
    
    // Check if any providers exist
    const providersResult = await pool.query('SELECT * FROM providers');
    if (providersResult.rows.length === 0) {
      console.log('No providers found. Adding a default provider first...');
      
      // Add a default provider
      const newProviderResult = await pool.query(`
        INSERT INTO providers (name, email, address, phone)
        VALUES ('Default Provider', 'provider@example.com', '123 Provider St', '+1234567890')
        RETURNING *
      `);
      
      const defaultProvider = newProviderResult.rows[0];
      console.log(`Created default provider with ID: ${defaultProvider.id}`);
      
      // Find invoices with missing provider references
      const invalidInvoices = await pool.query(`
        SELECT i.id, i.invoice_number, i.provider_id
        FROM invoices i
        LEFT JOIN providers p ON i.provider_id = p.id
        WHERE p.id IS NULL
      `);
      
      if (invalidInvoices.rows.length === 0) {
        console.log('No invoices with missing provider references found.');
        return;
      }
      
      console.log(`Found ${invalidInvoices.rows.length} invoices with missing provider references. Fixing...`);
      
      // Update invoices to use the default provider
      const updateResult = await pool.query(`
        UPDATE invoices
        SET provider_id = $1
        WHERE id IN (
          SELECT i.id
          FROM invoices i
          LEFT JOIN providers p ON i.provider_id = p.id
          WHERE p.id IS NULL
        )
        RETURNING id, invoice_number
      `, [defaultProvider.id]);
      
      console.log(`Successfully updated ${updateResult.rows.length} invoices to use the default provider:`);
      updateResult.rows.forEach(invoice => {
        console.log(`Fixed Invoice ID: ${invoice.id}, Number: ${invoice.invoice_number}`);
      });
    } else {
      const defaultProvider = providersResult.rows[0];
      console.log(`Using existing provider as default: ID ${defaultProvider.id}, Name: ${defaultProvider.name}`);
      
      // Find invoices with missing provider references
      const invalidInvoices = await pool.query(`
        SELECT i.id, i.invoice_number, i.provider_id
        FROM invoices i
        LEFT JOIN providers p ON i.provider_id = p.id
        WHERE p.id IS NULL
      `);
      
      if (invalidInvoices.rows.length === 0) {
        console.log('No invoices with missing provider references found.');
        return;
      }
      
      console.log(`Found ${invalidInvoices.rows.length} invoices with missing provider references. Fixing...`);
      
      // Update invoices to use the default provider
      const updateResult = await pool.query(`
        UPDATE invoices
        SET provider_id = $1
        WHERE id IN (
          SELECT i.id
          FROM invoices i
          LEFT JOIN providers p ON i.provider_id = p.id
          WHERE p.id IS NULL
        )
        RETURNING id, invoice_number
      `, [defaultProvider.id]);
      
      console.log(`Successfully updated ${updateResult.rows.length} invoices to use the default provider:`);
      updateResult.rows.forEach(invoice => {
        console.log(`Fixed Invoice ID: ${invoice.id}, Number: ${invoice.invoice_number}`);
      });
    }
  } catch (error) {
    console.error('Error fixing invoice providers:', error);
  } finally {
    pool.end();
  }
}

fixInvoiceProviders(); 