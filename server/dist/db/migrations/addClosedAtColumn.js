"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../../db");
async function addClosedAtColumn() {
    try {
        console.log('Starting migration to add closed_at column to client_logs table...');
        // Check if the column already exists
        const checkColumnSQL = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'client_logs' AND column_name = 'closed_at'
    `;
        const columnCheck = await (0, db_1.query)(checkColumnSQL);
        if (columnCheck.rows.length === 0) {
            // Add the closed_at column to client_logs table if it doesn't exist
            await (0, db_1.query)(`
        ALTER TABLE client_logs
        ADD COLUMN closed_at TIMESTAMP WITH TIME ZONE
      `);
            console.log('Successfully added closed_at column to client_logs table');
        }
        else {
            console.log('closed_at column already exists in client_logs table');
        }
        console.log('Migration completed successfully!');
    }
    catch (error) {
        console.error('Error executing migration:', error);
        throw error;
    }
}
// Execute the migration
addClosedAtColumn()
    .then(() => {
    console.log('Migration completed');
    process.exit(0);
})
    .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
//# sourceMappingURL=addClosedAtColumn.js.map