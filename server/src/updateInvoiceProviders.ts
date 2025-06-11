// Script to update invoice provider relationships
import { query } from './db';

async function updateInvoiceProviders() {
  console.log('Checking and updating invoice provider relationships...');
  
  try {
    // Start a transaction
    await query('BEGIN');
    
         // 1. Find all invoices to check their providers
     const allInvoicesResult = await query(`
       SELECT 
         i.id, 
         i.invoice_number, 
         i.provider_id,
         COALESCE(p.name, 'Unknown Provider') as provider_name
       FROM invoices i
       LEFT JOIN providers p ON i.provider_id = p.id
       ORDER BY i.invoice_number
     `);
     
     console.log(`Found total ${allInvoicesResult.rows.length} invoices.`);
     
     // Filter out invoices with missing or invalid providers
     const invalidInvoicesResult = {
       rows: allInvoicesResult.rows.filter((row: any) => 
         !row.provider_id || row.provider_name === 'Unknown Provider'
       )
     };
    
    if (invalidInvoicesResult.rows.length === 0) {
      console.log('No invoices with missing provider names found. Everything looks good!');
      await query('ROLLBACK');
      return;
    }
    
    console.log(`Found ${invalidInvoicesResult.rows.length} invoices with missing or invalid provider names:`);
    invalidInvoicesResult.rows.forEach((row: any, index: number) => {
      console.log(`${index + 1}. Invoice #${row.invoice_number}, Provider ID: ${row.provider_id || 'null'}, Provider Name: ${row.provider_name}`);
    });
    
    // 2. Get a valid provider to assign to these invoices
    const validProviderResult = await query(`
      SELECT id, name FROM providers LIMIT 1
    `);
    
    if (validProviderResult.rows.length === 0) {
      console.log('No valid providers found in the database. Creating one...');
      
      // Create a default provider
      const newProviderResult = await query(`
        INSERT INTO providers (name, email, phone, address)
        VALUES ('Default Provider', 'default@example.com', '123-456-7890', 'Default Address')
        RETURNING id, name
      `);
      
      const defaultProvider = newProviderResult.rows[0];
      console.log(`Created default provider: ${defaultProvider.name} (${defaultProvider.id})`);
      
      // Update all invalid invoices with this provider
      const updateResult = await query(`
        UPDATE invoices
        SET provider_id = $1
        WHERE id IN (${invalidInvoicesResult.rows.map((row: any) => `'${row.id}'`).join(',')})
        RETURNING id, invoice_number
      `, [defaultProvider.id]);
      
      console.log(`Updated ${updateResult.rows.length} invoices with the default provider.`);
    } else {
      const validProvider = validProviderResult.rows[0];
      console.log(`Using existing provider: ${validProvider.name} (${validProvider.id})`);
      
      // Update all invalid invoices with this provider
      const updateResult = await query(`
        UPDATE invoices
        SET provider_id = $1
        WHERE id IN (${invalidInvoicesResult.rows.map((row: any) => `'${row.id}'`).join(',')})
        RETURNING id, invoice_number
      `, [validProvider.id]);
      
      console.log(`Updated ${updateResult.rows.length} invoices with a valid provider.`);
    }
    
    // Commit the transaction
    await query('COMMIT');
    
    // Verify the updates
    console.log('\nVerifying updates...');
    const verifyResult = await query(`
      SELECT 
        i.id, 
        i.invoice_number, 
        i.provider_id,
        COALESCE(p.name, 'Unknown Provider') as provider_name
      FROM invoices i
      LEFT JOIN providers p ON i.provider_id = p.id
      WHERE i.id IN (${invalidInvoicesResult.rows.map((row: any) => `'${row.id}'`).join(',')})
    `);
    
    verifyResult.rows.forEach((row: any, index: number) => {
      console.log(`${index + 1}. Invoice #${row.invoice_number}, Provider ID: ${row.provider_id || 'null'}, Provider Name: ${row.provider_name}`);
    });
    
    console.log('\nInvoice provider relationships updated successfully!');
  } catch (error: any) {
    // Rollback on error
    await query('ROLLBACK');
    console.error('Error updating invoice provider relationships:', error.message);
  }
}

// Run the function
updateInvoiceProviders()
  .then(() => {
    console.log('\nUpdate process completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Update process failed:', error);
    process.exit(1);
  }); 