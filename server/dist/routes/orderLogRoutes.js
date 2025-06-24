"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderLogController_1 = __importDefault(require("../controllers/orderLogController"));
const validateRequest_1 = require("../middleware/validateRequest");
const schemas_1 = require("../config/schemas");
const router = (0, express_1.Router)();
// Additional routes - these must come BEFORE the parameterized routes
router.get('/order/:orderId', orderLogController_1.default.getLogsByOrder);
router.get('/date-range', orderLogController_1.default.getLogsByDateRange);
router.get('/today', orderLogController_1.default.getTodayLogs);
// Standard CRUD routes
router.get('/', orderLogController_1.default.getAll);
router.get('/:id', (0, validateRequest_1.validateRequest)(schemas_1.orderLogIdSchema), orderLogController_1.default.getById);
router.post('/', (0, validateRequest_1.validateRequest)(schemas_1.orderLogSchema), orderLogController_1.default.create);
router.put('/:id', (0, validateRequest_1.validateRequest)(schemas_1.orderLogUpdateSchema), orderLogController_1.default.update);
router.delete('/:id', (0, validateRequest_1.validateRequest)(schemas_1.orderLogIdSchema), orderLogController_1.default.delete);
exports.default = router;
//# sourceMappingURL=orderLogRoutes.js.map