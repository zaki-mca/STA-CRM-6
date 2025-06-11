"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
// Test frontend order creation format
async function testOrderCreation() {
    try {
        const response = await axios_1.default.post('http://localhost:5000/api/orders', {
            client: {
                id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", // Replace with a valid client ID
                name: "Test Client",
                email: "test@example.com",
                address: "123 Test St",
                phoneNumber: "123-456-7890"
            },
            items: [
                {
                    product: {
                        id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12", // Replace with a valid product ID
                        name: "Test Product",
                        description: "Test Description",
                        sellPrice: 100
                    },
                    quantity: 1,
                    unitPrice: 100,
                    total: 100
                }
            ],
            subtotal: 100,
            total: 100,
            status: "pending",
            expectedDelivery: "2023-10-10",
            notes: "Test order"
        });
        console.log('Order created successfully:');
        console.log(JSON.stringify(response.data, null, 2));
    }
    catch (error) {
        console.error('Error creating order:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
        else {
            console.error(error.message);
        }
    }
}
// Run the test
testOrderCreation();
//# sourceMappingURL=test-order-api.js.map