"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const data = JSON.stringify({
    email: 'admin@stacrm.com',
    password: 'admin123'
});
const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};
const req = http_1.default.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    let responseData = '';
    res.on('data', (chunk) => {
        responseData += chunk;
    });
    res.on('end', () => {
        try {
            const parsedData = JSON.parse(responseData);
            console.log('Response:', parsedData);
        }
        catch (error) {
            console.error('Error parsing response:', error);
            console.log('Raw response:', responseData);
        }
    });
});
req.on('error', (error) => {
    console.error('Error:', error);
});
req.write(data);
req.end();
//# sourceMappingURL=testApi.js.map