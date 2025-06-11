"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customerController_1 = require("../controllers/customerController");
const validateRequest_1 = require("../middleware/validateRequest");
const schemas_1 = require("../config/schemas");
const router = (0, express_1.Router)();
// Get all customers
router.get('/', customerController_1.getAllCustomers);
// Get a single customer
router.get('/:id', (0, validateRequest_1.validateRequest)(schemas_1.customerIdSchema), customerController_1.getCustomerById);
// Create a new customer
router.post('/', (0, validateRequest_1.validateRequest)(schemas_1.customerSchema), customerController_1.createCustomer);
// Update a customer
router.put('/:id', (0, validateRequest_1.validateRequest)(schemas_1.customerUpdateSchema), customerController_1.updateCustomer);
// Delete a customer
router.delete('/:id', (0, validateRequest_1.validateRequest)(schemas_1.customerIdSchema), customerController_1.deleteCustomer);
exports.default = router;
//# sourceMappingURL=customerRoutes.js.map