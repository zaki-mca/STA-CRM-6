"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./db");
async function dropTables() {
    try {
        await (0, db_1.query)('DROP TABLE IF EXISTS user_permissions, permissions, users CASCADE;');
        console.log('Tables dropped successfully');
    }
    catch (error) {
        console.error('Error dropping tables:', error);
    }
}
dropTables();
//# sourceMappingURL=dropTables.js.map