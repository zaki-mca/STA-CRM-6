"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./db");
const bcrypt_1 = __importDefault(require("bcrypt"));
async function addDefaultAdmin() {
    try {
        // Check if admin already exists
        const existingAdmin = await (0, db_1.query)('SELECT id FROM users WHERE email = $1', ['admin@stacrm.com']);
        if (existingAdmin.rows.length > 0) {
            console.log('Admin user already exists');
            return;
        }
        // Create admin user
        const passwordHash = await bcrypt_1.default.hash('admin123', 12);
        const result = await (0, db_1.query)(`INSERT INTO users (username, email, password_hash, first_name, last_name, is_admin)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, first_name, last_name, is_admin`, ['admin', 'admin@stacrm.com', passwordHash, 'Admin', 'User', true]);
        console.log('Admin user created:', result.rows[0]);
        // Add all permissions for admin
        const permissionResult = await (0, db_1.query)(`INSERT INTO permissions (name, description)
       VALUES 
         ('read:brands', 'Can read brands'),
         ('write:brands', 'Can write brands'),
         ('read:categories', 'Can read categories'),
         ('write:categories', 'Can write categories'),
         ('read:products', 'Can read products'),
         ('write:products', 'Can write products'),
         ('read:orders', 'Can read orders'),
         ('write:orders', 'Can write orders')
       ON CONFLICT (name) DO NOTHING
       RETURNING id, name`);
        console.log('Permissions created:', permissionResult.rows);
        // Grant all permissions to admin
        await (0, db_1.query)(`INSERT INTO user_permissions (user_id, permission_id)
       SELECT $1, id FROM permissions`, [result.rows[0].id]);
        console.log('All permissions granted to admin');
    }
    catch (err) {
        console.error('Error:', err);
    }
}
addDefaultAdmin();
//# sourceMappingURL=addDefaultAdmin.js.map