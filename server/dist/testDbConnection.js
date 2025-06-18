"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./db");
async function testConnection() {
    try {
        console.log('Testing database connection...');
        const isHealthy = await (0, db_1.checkHealth)();
        if (isHealthy) {
            console.log('Database connection is healthy!');
        }
        else {
            console.error('Database connection is not healthy!');
        }
    }
    catch (error) {
        console.error('Error testing database connection:', error);
    }
    finally {
        process.exit(0);
    }
}
testConnection();
//# sourceMappingURL=testDbConnection.js.map