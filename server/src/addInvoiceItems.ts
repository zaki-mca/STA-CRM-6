// Script to add sample invoice items to existing invoices
import { query } from './db';
// We don't need uuid for this script

async function addInvoiceItems() {
  console.log('Adding sample invoice items to existing invoices...');
  
  try {
    // Start a transaction
    await query('BEGIN');
    
    // 1. Get all invoices that don't have items
    const invoicesResult = await query(`
      SELECT i.id 
      FROM invoices i
      LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
      WHERE ii.id IS NULL
      GROUP BY i.id
    `);
    
    if (invoicesResult.rows.length === 0) {
      console.log('No invoices without items found.');
      await query('ROLLBACK');
      return;
    }
    
    console.log(`Found ${invoicesResult.rows.length} invoices without items.`);
    
    // 2. Get some sample products to use
    const productsResult = await query(`
      SELECT id, name, price 
      FROM products 
      LIMIT 10
    `);
    
    if (productsResult.rows.length === 0) {
      console.log('No products found. Creating a sample product...');
      
      // Create a sample product if none exist
      const productResult = await query(`
        INSERT INTO products (
          name, description, reference, sku, 
          category_id, brand_id, price, cost_price, 
          quantity, reorder_level
        )
        VALUES (
          'Sample Product', 'A sample product for testing', 'SP-001', 'SKU001',
          NULL, NULL, 333.00, 200.00,
          100, 10
        )
        RETURNING id, name, price
      `);
      
      if (productResult.rows.length === 0) {
        throw new Error('Failed to create sample product');
      }
      
      productsResult.rows = [productResult.rows[0]];
    }
    
    console.log(`Using ${productsResult.rows.length} products for sample invoice items.`);
    
    // 3. Add items to each invoice
    for (const invoice of invoicesResult.rows) {
      const invoiceId = invoice.id;
      const numItems = Math.floor(Math.random() * 2) + 1; // 1 to 2 items per invoice
      
      console.log(`Adding ${numItems} items to invoice ${invoiceId}...`);
      
      for (let i = 0; i < numItems; i++) {
        // Pick a random product
        const productIndex = Math.floor(Math.random() * productsResult.rows.length);
        const product = productsResult.rows[productIndex];
        
        const quantity = Math.floor(Math.random() * 5) + 1; // 1 to 5 items
        const unitPrice = product.price;
        const discount = 0; // No discount for sample data
        
        // Insert the invoice item
        await query(`
          INSERT INTO invoice_items (
            invoice_id, product_id, quantity, unit_price, discount
          )
          VALUES ($1, $2, $3, $4, $5)
        `, [
          invoiceId,
          product.id,
          quantity,
          unitPrice,
          discount
        ]);
        
        console.log(`Added item: Product ${product.name}, Quantity ${quantity}, Unit Price ${unitPrice}`);
      }
    }
    
    // Commit the transaction
    await query('COMMIT');
    console.log('Successfully added sample invoice items.');
    
  } catch (error) {
    await query('ROLLBACK');
    console.error('Error adding sample invoice items:', error);
  }
}

// Run the function
addInvoiceItems()
  .then(() => {
    console.log('Script completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 