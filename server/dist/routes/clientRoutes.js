"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const clientController_1 = __importDefault(require("../controllers/clientController"));
const validateRequest_1 = require("../middleware/validateRequest");
const schemas_1 = require("../config/schemas");
const router = (0, express_1.Router)();
// Standard CRUD routes
router.get('/', clientController_1.default.getAll);
router.get('/:id', (0, validateRequest_1.validateRequest)(schemas_1.clientIdSchema), clientController_1.default.getById);
router.post('/', (0, validateRequest_1.validateRequest)(schemas_1.clientSchema), clientController_1.default.create);
router.put('/:id', (0, validateRequest_1.validateRequest)(schemas_1.clientUpdateSchema), clientController_1.default.update);
router.delete('/:id', (0, validateRequest_1.validateRequest)(schemas_1.clientIdSchema), clientController_1.default.delete);
// Additional routes
router.get('/:id/orders', (0, validateRequest_1.validateRequest)(schemas_1.clientIdSchema), clientController_1.default.getClientOrders);
router.get('/:id/invoices', (0, validateRequest_1.validateRequest)(schemas_1.clientIdSchema), clientController_1.default.getClientInvoices);
router.get('/:id/logs', (0, validateRequest_1.validateRequest)(schemas_1.clientIdSchema), clientController_1.default.getClientLogs);
exports.default = router;
//# sourceMappingURL=clientRoutes.js.map