"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = __importDefault(require("../controllers/productController"));
const validateRequest_1 = require("../middleware/validateRequest");
const schemas_1 = require("../config/schemas");
const router = (0, express_1.Router)();
// Standard CRUD routes
router.get('/', productController_1.default.getAll);
router.get('/:id', (0, validateRequest_1.validateRequest)(schemas_1.productIdSchema), productController_1.default.getById);
router.post('/', (0, validateRequest_1.validateRequest)(schemas_1.productSchema), productController_1.default.create);
router.put('/:id', (0, validateRequest_1.validateRequest)(schemas_1.productUpdateSchema), productController_1.default.update);
router.delete('/:id', (0, validateRequest_1.validateRequest)(schemas_1.productIdSchema), productController_1.default.delete);
// Additional routes
router.get('/category/:categoryId', productController_1.default.getByCategory);
router.get('/brand/:brandId', productController_1.default.getByBrand);
router.get('/low-stock', productController_1.default.getLowStock);
router.patch('/:id/quantity', (0, validateRequest_1.validateRequest)(schemas_1.productIdSchema), productController_1.default.updateQuantity);
exports.default = router;
//# sourceMappingURL=productRoutes.js.map