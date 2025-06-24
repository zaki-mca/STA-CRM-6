"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./db");
async function checkAdmin() {
    try {
        const result = await (0, db_1.query)('SELECT * FROM users WHERE email = $1', ['admin@stacrm.com']);
        console.log('User found:', result.rows);
    }
    catch (err) {
        console.error('Error:', err);
    }
}
checkAdmin();
//# sourceMappingURL=checkAdmin.js.map