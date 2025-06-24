"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./db");
async function checkTable() {
    try {
        const result = await (0, db_1.query)(`SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'users';`);
        console.log('Table structure:', result.rows);
    }
    catch (error) {
        console.error('Error checking table:', error);
    }
}
checkTable();
//# sourceMappingURL=checkTable.js.map