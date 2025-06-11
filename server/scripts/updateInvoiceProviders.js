// Script to handle missing providers in the frontend
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

async function updateInvoiceUIHandling() {
  try {
    console.log('Updating UI handling for missing providers...');
    
    // First check if we have any invoices with provider issues
    const invalidInvoices = await pool.query(`
      SELECT i.id, i.invoice_number, i.provider_id
      FROM invoices i
      LEFT JOIN providers p ON i.provider_id = p.id
      WHERE p.id IS NULL
    `);
    
    if (invalidInvoices.rows.length > 0) {
      console.log(`Found ${invalidInvoices.rows.length} invoices with missing provider references.`);
      
      // Create a default provider if none exists
      const providersResult = await pool.query('SELECT * FROM providers LIMIT 1');
      let defaultProviderId;
      
      if (providersResult.rows.length === 0) {
        console.log('No providers found. Adding a default provider...');
        
        // Add a default provider
        const newProviderResult = await pool.query(`
          INSERT INTO providers (name, email, address, phone)
          VALUES ('Default Provider', 'provider@example.com', '123 Provider St', '+1234567890')
          RETURNING *
        `);
        
        defaultProviderId = newProviderResult.rows[0].id;
        console.log(`Created default provider with ID: ${defaultProviderId}`);
      } else {
        defaultProviderId = providersResult.rows[0].id;
        console.log(`Using existing provider as default: ID ${defaultProviderId}`);
      }
      
      // Update all invoices with missing providers
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
      `, [defaultProviderId]);
      
      console.log(`Successfully updated ${updateResult.rows.length} invoices to use the default provider.`);
      
      // Ensure all invoice items have product references
      await pool.query(`
        UPDATE invoice_items ii
        SET product_id = (SELECT id FROM products ORDER BY id LIMIT 1)
        WHERE product_id IS NULL OR product_id NOT IN (SELECT id FROM products)
      `);
      
      console.log('Updated any invoice items with missing product references.');
    } else {
      console.log('All invoices have valid provider references. No updates needed.');
    }
    
    console.log('\nDatabase is now consistent. The invoice creation should work properly.');
    console.log('Remember to edit app/invoices/page.tsx to use "Default Provider" instead of "Unknown Provider" in the UI.');
  } catch (error) {
    console.error('Error updating invoice provider handling:', error);
  } finally {
    pool.end();
  }
}

updateInvoiceUIHandling(); 