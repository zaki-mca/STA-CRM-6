"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const professionalDomainController_1 = __importDefault(require("../controllers/professionalDomainController"));
const validateRequest_1 = require("../middleware/validateRequest");
const schemas_1 = require("../config/schemas");
const router = (0, express_1.Router)();
// Standard CRUD routes
router.get('/', professionalDomainController_1.default.getAll);
router.get('/:id', (0, validateRequest_1.validateRequest)(schemas_1.professionalDomainIdSchema), professionalDomainController_1.default.getById);
router.post('/', (0, validateRequest_1.validateRequest)(schemas_1.professionalDomainSchema), professionalDomainController_1.default.create);
router.put('/:id', (0, validateRequest_1.validateRequest)(schemas_1.professionalDomainUpdateSchema), professionalDomainController_1.default.update);
router.delete('/:id', (0, validateRequest_1.validateRequest)(schemas_1.professionalDomainIdSchema), professionalDomainController_1.default.delete);
// Additional routes
router.get('/:id/clients', (0, validateRequest_1.validateRequest)(schemas_1.professionalDomainIdSchema), professionalDomainController_1.default.getClientsByDomain);
exports.default = router;
//# sourceMappingURL=professionalDomainRoutes.js.map