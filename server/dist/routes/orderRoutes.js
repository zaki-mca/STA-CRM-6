"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = __importDefault(require("../controllers/orderController"));
const validateRequest_1 = require("../middleware/validateRequest");
const schemas_1 = require("../config/schemas");
const router = (0, express_1.Router)();
// Standard CRUD routes
router.get('/', orderController_1.default.getAll);
router.get('/:id', (0, validateRequest_1.validateRequest)(schemas_1.orderIdSchema), orderController_1.default.getById);
router.post('/', (0, validateRequest_1.validateRequest)(schemas_1.orderSchema), orderController_1.default.create);
router.put('/:id', (0, validateRequest_1.validateRequest)(schemas_1.orderUpdateSchema), orderController_1.default.update);
router.delete('/:id', (0, validateRequest_1.validateRequest)(schemas_1.orderIdSchema), orderController_1.default.delete);
// Additional routes
router.get('/status/:status', orderController_1.default.getByStatus);
router.patch('/:id/status', (0, validateRequest_1.validateRequest)(schemas_1.orderIdSchema), orderController_1.default.updateStatus);
router.post('/:id/create-invoice', (0, validateRequest_1.validateRequest)(schemas_1.orderIdSchema), orderController_1.default.createInvoice);
router.get('/:id/logs', (0, validateRequest_1.validateRequest)(schemas_1.orderIdSchema), orderController_1.default.getOrderLogs);
exports.default = router;
//# sourceMappingURL=orderRoutes.js.map