"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Script to fix invoice provider associations
const db_1 = require("./db");
async function fixInvoiceProviders() {
    console.log('Fixing invoice provider associations...');
    try {
        // Start a transaction
        await (0, db_1.query)('BEGIN');
        // Check if there are any providers
        const providersResult = await (0, db_1.query)('SELECT id, name FROM providers ORDER BY name LIMIT 1');
        if (providersResult.rows.length === 0) {
            console.log('No providers found. Creating a default provider...');
            // Create a default provider
            const createResult = await (0, db_1.query)(`
        INSERT INTO providers (name, email, phone, address)
        VALUES ('Default Provider', 'default@example.com', '123-456-7890', '123 Main St')
        RETURNING id, name
      `);
            const defaultProvider = createResult.rows[0];
            console.log(`Created default provider: ${defaultProvider.name} (ID: ${defaultProvider.id})`);
            // Update all invoices to use this provider
            const updateAllResult = await (0, db_1.query)(`
        UPDATE invoices
        SET provider_id = $1
        WHERE provider_id IS NULL OR provider_id NOT IN (SELECT id FROM providers)
        RETURNING id, invoice_number
      `, [defaultProvider.id]);
            console.log(`Updated ${updateAllResult.rowCount} invoices to use the default provider.`);
        }
        else {
            const defaultProvider = providersResult.rows[0];
            console.log(`Using existing provider as default: ${defaultProvider.name} (ID: ${defaultProvider.id})`);
            // Find invoices without valid providers
            const invalidResult = await (0, db_1.query)(`
        SELECT i.id, i.invoice_number 
        FROM invoices i
        LEFT JOIN providers p ON i.provider_id = p.id
        WHERE p.id IS NULL
      `);
            if (invalidResult.rows.length > 0) {
                console.log(`Found ${invalidResult.rows.length} invoices with invalid or missing providers.`);
                // Update them to use the default provider
                const updateResult = await (0, db_1.query)(`
          UPDATE invoices
          SET provider_id = $1
          WHERE id IN (${invalidResult.rows.map((row) => `'${row.id}'`).join(',')})
          RETURNING id, invoice_number
        `, [defaultProvider.id]);
                console.log(`Updated ${updateResult.rowCount} invoices to use the default provider.`);
            }
            else {
                console.log('All invoices have valid provider associations.');
            }
        }
        // Commit the transaction
        await (0, db_1.query)('COMMIT');
        // Verify the updates
        const verifyResult = await (0, db_1.query)(`
      SELECT 
        i.id,
        i.invoice_number,
        p.id AS provider_id,
        p.name AS provider_name
      FROM invoices i
      JOIN providers p ON i.provider_id = p.id
      LIMIT 10
    `);
        console.log('\nSample of invoices after fix:');
        verifyResult.rows.forEach((row, index) => {
            console.log(`${index + 1}. Invoice #${row.invoice_number}, Provider: ${row.provider_name} (ID: ${row.provider_id})`);
        });
        // Count invoices by provider
        const countResult = await (0, db_1.query)(`
      SELECT 
        p.name AS provider_name,
        COUNT(i.id) AS invoice_count
      FROM providers p
      LEFT JOIN invoices i ON p.id = i.provider_id
      GROUP BY p.name
      ORDER BY invoice_count DESC
    `);
        console.log('\nInvoice count by provider:');
        countResult.rows.forEach((row, index) => {
            console.log(`${index + 1}. ${row.provider_name}: ${row.invoice_count} invoices`);
        });
    }
    catch (error) {
        // Rollback the transaction in case of error
        await (0, db_1.query)('ROLLBACK');
        console.error('Error fixing invoice provider associations:', error.message);
        console.error(error.stack);
    }
}
// Run the function
fixInvoiceProviders()
    .then(() => {
    console.log('\nFix completed successfully.');
    process.exit(0);
})
    .catch((error) => {
    console.error('Fix failed:', error);
    process.exit(1);
});
//# sourceMappingURL=fixInvoiceProviders.js.map