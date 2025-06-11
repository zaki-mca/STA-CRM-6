// Script to add a sample provider if none exist
import { query } from './db';

async function addSampleProvider() {
  console.log('Checking for providers...');
  
  try {
    // Check if any providers exist
    const countResult = await query('SELECT COUNT(*) FROM providers');
    const count = parseInt(countResult.rows[0].count);
    
    console.log(`Found ${count} providers in the database.`);
    
    if (count === 0) {
      console.log('No providers found. Adding a sample provider...');
      
      // Add a sample provider
      const result = await query(`
        INSERT INTO providers (name, email, phone, address)
        VALUES ('Sample Provider', 'sample@example.com', '123-456-7890', '123 Main St')
        RETURNING id, name, email
      `);
      
      console.log('Sample provider added:');
      console.log(result.rows[0]);
      
      // Check for invoices without providers
      const invoicesResult = await query(`
        SELECT COUNT(*) FROM invoices WHERE provider_id IS NULL
      `);
      
      const invoiceCount = parseInt(invoicesResult.rows[0].count);
      if (invoiceCount > 0) {
        console.log(`Found ${invoiceCount} invoices without a provider. Assigning them to the sample provider...`);
        
        // Assign the sample provider to these invoices
        const updateResult = await query(`
          UPDATE invoices
          SET provider_id = $1
          WHERE provider_id IS NULL
          RETURNING id, invoice_number
        `, [result.rows[0].id]);
        
        console.log(`Updated ${updateResult.rowCount} invoices.`);
      }
    } else {
      // List some sample providers
      const sampleResult = await query(`
        SELECT id, name, email FROM providers LIMIT 5
      `);
      
      console.log('Existing providers:');
      sampleResult.rows.forEach((row: any, index: number) => {
        console.log(`${index + 1}. ${row.name} (${row.email})`);
      });
      
      // Check for invoices with providers
      const providerInvoicesResult = await query(`
        SELECT p.name, COUNT(i.id) as invoice_count
        FROM providers p
        LEFT JOIN invoices i ON p.id = i.provider_id
        GROUP BY p.name
        ORDER BY invoice_count DESC
        LIMIT 5
      `);
      
      console.log('\nProvider usage in invoices:');
      providerInvoicesResult.rows.forEach((row: any, index: number) => {
        console.log(`${index + 1}. ${row.name}: ${row.invoice_count} invoices`);
      });
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

// Run the function
addSampleProvider()
  .then(() => {
    console.log('\nProvider check completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Provider check failed:', error);
    process.exit(1);
  }); 