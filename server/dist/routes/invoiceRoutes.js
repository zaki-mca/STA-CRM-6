"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invoiceController_1 = __importDefault(require("../controllers/invoiceController"));
const validateRequest_1 = require("../middleware/validateRequest");
const schemas_1 = require("../config/schemas");
const router = (0, express_1.Router)();
// Standard CRUD routes
router.get('/', invoiceController_1.default.getAll);
router.get('/:id', (0, validateRequest_1.validateRequest)(schemas_1.invoiceIdSchema), invoiceController_1.default.getById);
router.post('/', (0, validateRequest_1.validateRequest)(schemas_1.invoiceSchema), invoiceController_1.default.create);
router.put('/:id', (0, validateRequest_1.validateRequest)(schemas_1.invoiceUpdateSchema), invoiceController_1.default.update);
router.delete('/:id', (0, validateRequest_1.validateRequest)(schemas_1.invoiceIdSchema), invoiceController_1.default.delete);
// Additional routes
router.get('/status/:status', invoiceController_1.default.getByStatus);
router.patch('/:id/status', (0, validateRequest_1.validateRequest)(schemas_1.invoiceIdSchema), invoiceController_1.default.updateStatus);
exports.default = router;
//# sourceMappingURL=invoiceRoutes.js.map