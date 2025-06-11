"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./db");
async function checkSchema() {
    try {
        // Check invoices table
        const invoiceColumns = await (0, db_1.query)(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' 
      ORDER BY column_name
    `);
        console.log('Invoices table columns:');
        console.log(invoiceColumns.rows);
        // Check providers table
        const providerColumns = await (0, db_1.query)(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'providers' 
      ORDER BY column_name
    `);
        console.log('\nProviders table columns:');
        console.log(providerColumns.rows);
        // Check for provider_id in invoices
        const providerIdExists = await (0, db_1.query)(`
      SELECT constraint_name
      FROM information_schema.constraint_column_usage
      WHERE table_name = 'invoices' AND column_name = 'provider_id'
    `);
        console.log('\nProvider_id constraints:');
        console.log(providerIdExists.rows);
        // Check if client_id still exists
        const clientIdExists = await (0, db_1.query)(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'invoices' AND column_name = 'client_id'
    `);
        console.log('\nClient_id check:');
        console.log(clientIdExists.rows);
    }
    catch (error) {
        console.error('Error checking schema:', error);
    }
    finally {
        process.exit(0);
    }
}
checkSchema();
//# sourceMappingURL=checkSchema.js.map