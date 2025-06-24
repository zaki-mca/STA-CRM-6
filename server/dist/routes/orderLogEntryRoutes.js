"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderLogEntryController_1 = __importDefault(require("../controllers/orderLogEntryController"));
const validateRequest_1 = require("../middleware/validateRequest");
const schemas_1 = require("../config/schemas");
const router = (0, express_1.Router)();
// Get entries for a specific log
router.get('/log/:logId', orderLogEntryController_1.default.getEntriesByLogId);
// Add a single order to a log
router.post('/', (0, validateRequest_1.validateRequest)(schemas_1.orderLogEntrySchema), orderLogEntryController_1.default.addOrderToLog);
// Add multiple orders to a log in a batch
router.post('/batch', (0, validateRequest_1.validateRequest)(schemas_1.orderLogEntryBatchSchema), orderLogEntryController_1.default.addOrdersBatch);
// Remove an order from a log
router.delete('/:id', (0, validateRequest_1.validateRequest)(schemas_1.orderLogEntryIdSchema), orderLogEntryController_1.default.removeOrderFromLog);
exports.default = router;
//# sourceMappingURL=orderLogEntryRoutes.js.map