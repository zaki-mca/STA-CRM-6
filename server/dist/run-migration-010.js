"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./db");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function runMigration() {
    try {
        // Read the migration file
        const migrationPath = path_1.default.resolve(__dirname, 'db/migrations/010-ensure-product-price-fields.sql');
        const migration = fs_1.default.readFileSync(migrationPath, 'utf8');
        console.log('Running migration: 010-ensure-product-price-fields.sql');
        // Execute the migration
        await (0, db_1.query)(migration);
        console.log('Migration completed successfully');
    }
    catch (error) {
        console.error('Error running migration:', error);
    }
}
// Run the migration
runMigration();
//# sourceMappingURL=run-migration-010.js.map