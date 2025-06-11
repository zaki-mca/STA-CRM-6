"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const clientLogController_1 = __importDefault(require("../controllers/clientLogController"));
const validateRequest_1 = require("../middleware/validateRequest");
const schemas_1 = require("../config/schemas");
const router = (0, express_1.Router)();
// Standard CRUD routes
router.get('/', clientLogController_1.default.getAll);
router.get('/:id', (0, validateRequest_1.validateRequest)(schemas_1.clientLogIdSchema), clientLogController_1.default.getById);
router.post('/', (0, validateRequest_1.validateRequest)(schemas_1.clientLogSchema), clientLogController_1.default.create);
router.put('/:id', (0, validateRequest_1.validateRequest)(schemas_1.clientLogUpdateSchema), clientLogController_1.default.update);
router.delete('/:id', (0, validateRequest_1.validateRequest)(schemas_1.clientLogIdSchema), clientLogController_1.default.delete);
// Additional routes
router.get('/client/:clientId', clientLogController_1.default.getLogsByClient);
router.get('/date-range', clientLogController_1.default.getLogsByDateRange);
router.get('/today', clientLogController_1.default.getTodayLogs);
exports.default = router;
//# sourceMappingURL=clientLogRoutes.js.map