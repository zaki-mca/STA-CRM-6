"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = __importDefault(require("../controllers/authController"));
const validateRequest_1 = require("../middleware/validateRequest");
const schemas_1 = require("../config/schemas");
const router = (0, express_1.Router)();
// Auth routes
router.post('/login', (0, validateRequest_1.validateRequest)(schemas_1.loginSchema), authController_1.default.login);
router.post('/register', (0, validateRequest_1.validateRequest)(schemas_1.registerSchema), authController_1.default.register);
router.get('/validate', authController_1.default.validate);
router.post('/forgot-password', (0, validateRequest_1.validateRequest)(schemas_1.forgotPasswordSchema), authController_1.default.forgotPassword);
router.post('/logout', authController_1.default.logout);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map