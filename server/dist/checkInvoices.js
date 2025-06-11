"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./db");
async function checkInvoices() {
    try {
        // Check if there are any invoices in the database
        const invoiceCount = await (0, db_1.query)(`
      SELECT COUNT(*) FROM invoices
    `);
        console.log('Total invoices in database:', invoiceCount.rows[0].count);
        // Check if invoices have provider_id populated
        const providersInInvoices = await (0, db_1.query)(`
      SELECT provider_id, COUNT(*) 
      FROM invoices 
      GROUP BY provider_id
    `);
        console.log('\nProviders in invoices:');
        console.log(providersInInvoices.rows);
        // Check if there are any invoice items
        const itemCount = await (0, db_1.query)(`
      SELECT COUNT(*) FROM invoice_items
    `);
        console.log('\nTotal invoice items:', itemCount.rows[0].count);
        // Show a sample invoice with its items
        if (parseInt(invoiceCount.rows[0].count) > 0) {
            const sampleInvoice = await (0, db_1.query)(`
        SELECT i.*, 
          p.name as provider_name, 
          p.email as provider_email,
          (
            SELECT json_agg(json_build_object(
              'id', ii.id,
              'product_id', ii.product_id,
              'product_name', prod.name,
              'quantity', ii.quantity,
              'unit_price', ii.unit_price,
              'discount', ii.discount,
              'total', (ii.quantity * ii.unit_price * (1 - COALESCE(ii.discount, 0) / 100))
            ))
            FROM invoice_items ii
            JOIN products prod ON ii.product_id = prod.id
            WHERE ii.invoice_id = i.id
          ) as items
        FROM invoices i
        JOIN providers p ON i.provider_id = p.id
        LIMIT 1
      `);
            console.log('\nSample invoice:');
            console.log(JSON.stringify(sampleInvoice.rows[0], null, 2));
        }
    }
    catch (error) {
        console.error('Error checking invoices:', error);
    }
    finally {
        process.exit(0);
    }
}
checkInvoices();
//# sourceMappingURL=checkInvoices.js.map