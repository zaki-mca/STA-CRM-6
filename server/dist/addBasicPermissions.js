"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./db");
const basicPermissions = [
    { name: 'read:brands', description: 'Can view brands' },
    { name: 'write:brands', description: 'Can create/edit brands' },
    { name: 'read:categories', description: 'Can view categories' },
    { name: 'write:categories', description: 'Can create/edit categories' },
    { name: 'read:products', description: 'Can view products' },
    { name: 'write:products', description: 'Can create/edit products' },
    { name: 'read:orders', description: 'Can view orders' },
    { name: 'write:orders', description: 'Can create/edit orders' },
    { name: 'read:clients', description: 'Can view clients' },
    { name: 'write:clients', description: 'Can create/edit clients' },
    { name: 'read:providers', description: 'Can view providers' },
    { name: 'write:providers', description: 'Can create/edit providers' },
    { name: 'read:invoices', description: 'Can view invoices' },
    { name: 'write:invoices', description: 'Can create/edit invoices' }
];
async function addBasicPermissions() {
    try {
        // Add permissions
        for (const perm of basicPermissions) {
            await (0, db_1.query)(`INSERT INTO permissions (name, description)
         VALUES ($1, $2)
         ON CONFLICT (name) DO NOTHING`, [perm.name, perm.description]);
        }
        console.log('Added basic permissions');
        // Get admin user
        const adminResult = await (0, db_1.query)('SELECT id FROM users WHERE email = $1', ['admin@stacrm.com']);
        if (adminResult.rows.length === 0) {
            console.log('Admin user not found');
            return;
        }
        const adminId = adminResult.rows[0].id;
        // Grant all permissions to admin
        await (0, db_1.query)(`INSERT INTO user_permissions (user_id, permission_id)
       SELECT $1, id FROM permissions
       ON CONFLICT (user_id, permission_id) DO NOTHING`, [adminId]);
        console.log('Granted all permissions to admin');
        // Verify admin permissions
        const verifyResult = await (0, db_1.query)(`SELECT p.name 
       FROM permissions p
       JOIN user_permissions up ON p.id = up.permission_id
       WHERE up.user_id = $1`, [adminId]);
        console.log('Admin permissions:', verifyResult.rows);
    }
    catch (err) {
        console.error('Error:', err);
    }
}
addBasicPermissions();
//# sourceMappingURL=addBasicPermissions.js.map