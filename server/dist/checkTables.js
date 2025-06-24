"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Script to check database tables
const db_1 = require("./db");
async function checkTables() {
    console.log('Checking database tables...');
    try {
        const tablesResult = await (0, db_1.query)(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
        console.log('\nAvailable tables:');
        tablesResult.rows.forEach((row) => {
            console.log(`- ${row.table_name}`);
        });
        // Check for specific tables needed by invoiceController
        const requiredTables = ['categories', 'product_categories', 'brands', 'product_brands'];
        const missingTables = [];
        for (const tableName of requiredTables) {
            try {
                const checkResult = await (0, db_1.query)(`SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${tableName}'
        )`);
                const exists = checkResult.rows[0].exists;
                if (!exists) {
                    missingTables.push(tableName);
                }
            }
            catch (error) {
                console.error(`Error checking table ${tableName}:`, error);
            }
        }
        if (missingTables.length > 0) {
            console.log('\nMissing tables that might be needed:');
            missingTables.forEach(table => {
                console.log(`- ${table}`);
            });
        }
        // Check columns in products table
        console.log('\nChecking columns in products table...');
        const productsColumnsResult = await (0, db_1.query)(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products'
      ORDER BY column_name
    `);
        console.log('\nColumns in products table:');
        productsColumnsResult.rows.forEach((row) => {
            console.log(`- ${row.column_name} (${row.data_type})`);
        });
    }
    catch (error) {
        console.error('Error checking database tables:', error);
    }
}
// Run the function
checkTables()
    .then(() => {
    console.log('\nDatabase check completed.');
    process.exit(0);
})
    .catch((error) => {
    console.error('Database check failed:', error);
    process.exit(1);
});
//# sourceMappingURL=checkTables.js.map