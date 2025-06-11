import { query } from './db';

async function fixInvoiceItems() {
  console.log('Fixing invoice items with UUID casting issues...');
  
  try {
    // Start a transaction
    await query('BEGIN');
    
    // First, identify if the issue exists by doing a test query
    try {
      await query(`
        SELECT i.id::text, ii.id::text, ii.product_id::text 
        FROM invoices i
        JOIN invoice_items ii ON i.id = ii.invoice_id
        LIMIT 1
      `);
      
      console.log('No UUID casting issues detected. Checking for missing items...');
    } catch (uuidError: any) {
      console.error('UUID casting error confirmed:', uuidError.message);
      console.log('Will attempt to fix by rewriting the controller queries.');
      
      // Here we'll modify the invoiceController.ts file to fix the UUID casting issues
      console.log('The fix needs to be applied in the server/src/controllers/invoiceController.ts file.');
      console.log('Please update the queries to use ::text casting for UUID fields.');
    }
    
    // Check for invoices without items
    const invoicesWithoutItemsResult = await query(`
      SELECT i.id 
      FROM invoices i
      LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
      WHERE ii.id IS NULL
      GROUP BY i.id
    `);
    
    if (invoicesWithoutItemsResult.rows.length === 0) {
      console.log('No invoices without items found.');
    } else {
      console.log(`Found ${invoicesWithoutItemsResult.rows.length} invoices without items.`);
      console.log('To fix this, run the addInvoiceItems.ts script.');
    }
    
    // Rollback as this is just a diagnostic script
    await query('ROLLBACK');
    console.log('No changes were made to the database (diagnostic only).');
    
    // Provide the solution
    console.log('\nRECOMMENDED FIXES:');
    console.log('1. In invoiceController.ts, update all queries to cast UUIDs to text:');
    console.log('   - Replace "i.id" with "i.id::text as id"');
    console.log('   - Replace "ii.id" with "ii.id::text as id"');
    console.log('   - Replace "ii.product_id" with "ii.product_id::text as product_id"');
    console.log('   - Replace "i.provider_id" with "i.provider_id::text as provider_id"');
    console.log('2. Run the addInvoiceItems.ts script to add items to invoices without them');
    
  } catch (error) {
    await query('ROLLBACK');
    console.error('Error fixing invoice items:', error);
  }
}

// Run the function
fixInvoiceItems()
  .then(() => {
    console.log('\nFix process completed. Follow the recommended actions.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fix process failed:', error);
    process.exit(1);
  }); 