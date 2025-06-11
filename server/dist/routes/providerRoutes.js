"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const providerController_1 = __importDefault(require("../controllers/providerController"));
const validateRequest_1 = require("../middleware/validateRequest");
const schemas_1 = require("../config/schemas");
const router = (0, express_1.Router)();
// Standard CRUD routes
router.get('/', providerController_1.default.getAll);
router.get('/:id', (0, validateRequest_1.validateRequest)(schemas_1.providerIdSchema), providerController_1.default.getById);
router.post('/', (0, validateRequest_1.validateRequest)(schemas_1.providerSchema), providerController_1.default.create);
router.put('/:id', (0, validateRequest_1.validateRequest)(schemas_1.providerUpdateSchema), providerController_1.default.update);
router.delete('/:id', (0, validateRequest_1.validateRequest)(schemas_1.providerIdSchema), providerController_1.default.delete);
// Additional routes
router.get('/:id/products', (0, validateRequest_1.validateRequest)(schemas_1.providerIdSchema), providerController_1.default.getProviderProducts);
router.get('/:id/orders', (0, validateRequest_1.validateRequest)(schemas_1.providerIdSchema), providerController_1.default.getProviderOrders);
exports.default = router;
//# sourceMappingURL=providerRoutes.js.map