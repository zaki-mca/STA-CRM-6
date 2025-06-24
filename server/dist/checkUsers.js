"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./db");
async function checkUsers() {
    try {
        const result = await (0, db_1.query)('SELECT * FROM users');
        console.log('Users in database:', result.rows);
    }
    catch (error) {
        console.error('Error checking users:', error);
    }
}
checkUsers();
//# sourceMappingURL=checkUsers.js.map