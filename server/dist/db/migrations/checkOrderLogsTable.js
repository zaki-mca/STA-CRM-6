"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../../db");
async function checkOrderLogsTable() {
    try {
        console.log('Checking order_logs table structure...');
        const result = await (0, db_1.query)(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'order_logs'
      ORDER BY ordinal_position
    `);
        console.log('order_logs table columns:');
        console.table(result.rows);
    }
    catch (error) {
        console.error('Error checking table structure:', error);
    }
}
// Execute the function
checkOrderLogsTable()
    .then(() => {
    console.log('Check completed');
    process.exit(0);
})
    .catch((err) => {
    console.error('Check failed:', err);
    process.exit(1);
});
//# sourceMappingURL=checkOrderLogsTable.js.map