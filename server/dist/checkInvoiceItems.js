"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./db");
async function checkInvoiceItems() {
    console.log('Checking invoices and invoice items in the database...');
    try {
        // Count all invoices
        const invoiceCountResult = await (0, db_1.query)('SELECT COUNT(*) FROM invoices');
        const invoiceCount = parseInt(invoiceCountResult.rows[0].count);
        console.log(`Total invoices: ${invoiceCount}`);
        // Count invoices with items
        const invoicesWithItemsResult = await (0, db_1.query)(`
      SELECT COUNT(DISTINCT invoice_id) FROM invoice_items
    `);
        const invoicesWithItems = parseInt(invoicesWithItemsResult.rows[0].count);
        console.log(`Invoices with items: ${invoicesWithItems}`);
        console.log(`Invoices without items: ${invoiceCount - invoicesWithItems}`);
        // Count total invoice items
        const itemsCountResult = await (0, db_1.query)('SELECT COUNT(*) FROM invoice_items');
        const itemsCount = parseInt(itemsCountResult.rows[0].count);
        console.log(`Total invoice items: ${itemsCount}`);
        // Check average items per invoice
        if (invoicesWithItems > 0) {
            console.log(`Average items per invoice: ${(itemsCount / invoicesWithItems).toFixed(2)}`);
        }
        // List invoices without items
        const invoicesWithoutItemsResult = await (0, db_1.query)(`
      SELECT i.id, i.invoice_number 
      FROM invoices i
      LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
      WHERE ii.id IS NULL
      GROUP BY i.id, i.invoice_number
    `);
        if (invoicesWithoutItemsResult.rows.length > 0) {
            console.log('\nInvoices without items:');
            invoicesWithoutItemsResult.rows.forEach((row, index) => {
                console.log(`${index + 1}. ID: ${row.id}, Number: ${row.invoice_number}`);
            });
        }
        // List invoices with items (sample)
        const invoicesWithItemsListResult = await (0, db_1.query)(`
      SELECT i.id, i.invoice_number, COUNT(ii.id) as item_count
      FROM invoices i
      JOIN invoice_items ii ON i.id = ii.invoice_id
      GROUP BY i.id, i.invoice_number
      LIMIT 5
    `);
        if (invoicesWithItemsListResult.rows.length > 0) {
            console.log('\nSample invoices with items:');
            invoicesWithItemsListResult.rows.forEach((row, index) => {
                console.log(`${index + 1}. ID: ${row.id}, Number: ${row.invoice_number}, Items: ${row.item_count}`);
            });
        }
        // Check if there are UUID casting errors in any related fields
        console.log('\nChecking for potential UUID issues...');
        try {
            const uuidCheckResult = await (0, db_1.query)(`
        SELECT i.id::text as invoice_id, ii.id::text as item_id, ii.product_id::text as product_id
        FROM invoices i
        JOIN invoice_items ii ON i.id = ii.invoice_id
        LIMIT 5
      `);
            console.log('UUID casting check successful. Sample data:');
            if (uuidCheckResult.rows.length > 0) {
                console.log(uuidCheckResult.rows[0]);
            }
        }
        catch (uuidError) {
            console.error('UUID casting error detected:', uuidError.message);
            console.log('This may be causing display issues with invoice items.');
        }
    }
    catch (error) {
        console.error('Error checking invoice items:', error);
    }
}
// Run the function
checkInvoiceItems()
    .then(() => {
    console.log('\nCheck completed.');
    process.exit(0);
})
    .catch((error) => {
    console.error('Check failed:', error);
    process.exit(1);
});
//# sourceMappingURL=checkInvoiceItems.js.map