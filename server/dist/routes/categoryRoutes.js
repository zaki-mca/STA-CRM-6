"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const categoryController_1 = __importDefault(require("../controllers/categoryController"));
const validateRequest_1 = require("../middleware/validateRequest");
const schemas_1 = require("../config/schemas");
const router = (0, express_1.Router)();
// Standard CRUD routes
router.get('/', categoryController_1.default.getAll);
router.get('/:id', (0, validateRequest_1.validateRequest)(schemas_1.categoryIdSchema), categoryController_1.default.getById);
router.post('/', (0, validateRequest_1.validateRequest)(schemas_1.categorySchema), categoryController_1.default.create);
router.put('/:id', (0, validateRequest_1.validateRequest)(schemas_1.categoryUpdateSchema), categoryController_1.default.update);
router.delete('/:id', (0, validateRequest_1.validateRequest)(schemas_1.categoryIdSchema), categoryController_1.default.delete);
exports.default = router;
//# sourceMappingURL=categoryRoutes.js.map