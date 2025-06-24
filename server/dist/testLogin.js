"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function testLogin() {
    try {
        console.log('Attempting to login...');
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@stacrm.com',
                password: 'admin123'
            })
        });
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Login failed. Status:', response.status);
            console.error('Error data:', errorData);
            return;
        }
        const data = await response.json();
        console.log('Login response:', data);
    }
    catch (error) {
        console.error('Error:', error instanceof Error ? error.message : String(error));
    }
}
testLogin();
//# sourceMappingURL=testLogin.js.map