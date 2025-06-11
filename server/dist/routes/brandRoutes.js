"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const brandController_1 = __importDefault(require("../controllers/brandController"));
const validateRequest_1 = require("../middleware/validateRequest");
const schemas_1 = require("../config/schemas");
const router = (0, express_1.Router)();
// Standard CRUD routes
router.get('/', brandController_1.default.getAll);
router.get('/:id', (0, validateRequest_1.validateRequest)(schemas_1.brandIdSchema), brandController_1.default.getById);
router.post('/', (0, validateRequest_1.validateRequest)(schemas_1.brandSchema), brandController_1.default.create);
router.put('/:id', (0, validateRequest_1.validateRequest)(schemas_1.brandUpdateSchema), brandController_1.default.update);
router.delete('/:id', (0, validateRequest_1.validateRequest)(schemas_1.brandIdSchema), brandController_1.default.delete);
exports.default = router;
//# sourceMappingURL=brandRoutes.js.map