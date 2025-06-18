"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../../db");
async function updateSchema() {
    try {
        console.log('Starting schema update migration...');
        // Add the action column to client_logs table
        await (0, db_1.query)(`
      ALTER TABLE client_logs
      ADD COLUMN action VARCHAR(50);
    `);
        console.log('Added action column to client_logs table');
        console.log('Schema update completed successfully!');
    }
    catch (error) {
        console.error('Error updating schema:', error);
        throw error;
    }
}
// Execute the migration
updateSchema()
    .then(() => {
    console.log('Migration completed');
    process.exit(0);
})
    .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
//# sourceMappingURL=updateSchema.js.map