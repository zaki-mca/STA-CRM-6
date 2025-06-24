"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Script to check providers in the database
const db_1 = require("./db");
async function checkProviders() {
    console.log('Checking providers table...');
    try {
        // Count providers
        const countResult = await (0, db_1.query)('SELECT COUNT(*) FROM providers');
        const count = parseInt(countResult.rows[0].count);
        console.log(`Total providers: ${count}`);
        // Sample providers
        if (count > 0) {
            const sampleResult = await (0, db_1.query)('SELECT id, name, email, phone, address FROM providers LIMIT 5');
            console.log('\nSample providers:');
            sampleResult.rows.forEach((row, index) => {
                console.log(`${index + 1}. ID: ${row.id}, Name: ${row.name || 'null'}, Email: ${row.email || 'null'}`);
            });
        }
        else {
            console.log('No providers found in the database.');
            // Create a sample provider for testing
            console.log('\nCreating a sample provider...');
            const insertResult = await (0, db_1.query)(`
        INSERT INTO providers (name, email, phone, address)
        VALUES ('Sample Provider', 'provider@example.com', '123-456-7890', '123 Main St')
        RETURNING id, name, email
      `);
            console.log('Sample provider created:');
            console.log(insertResult.rows[0]);
        }
        // Check invoices with provider_id values
        console.log('\nChecking invoice-provider relationships...');
        const invoiceResult = await (0, db_1.query)(`
      SELECT 
        i.id, 
        i.invoice_number, 
        i.provider_id,
        COALESCE(p.name, 'null') as provider_name
      FROM invoices i
      LEFT JOIN providers p ON i.provider_id = p.id
      LIMIT 10
    `);
        console.log(`\nSample invoices (with provider info):`);
        invoiceResult.rows.forEach((row, index) => {
            console.log(`${index + 1}. Invoice #${row.invoice_number}, Provider ID: ${row.provider_id || 'null'}, Provider Name: ${row.provider_name}`);
        });
    }
    catch (error) {
        console.error('Error checking providers:', error.message);
    }
}
// Run the function
checkProviders()
    .then(() => {
    console.log('\nProvider check completed.');
    process.exit(0);
})
    .catch((error) => {
    console.error('Provider check failed:', error);
    process.exit(1);
});
//# sourceMappingURL=checkProviders.js.map