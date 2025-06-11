"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const baseController_1 = require("../utils/baseController");
const db_1 = require("../db");
const errorHandler_1 = require("../utils/errorHandler");
class ProfessionalDomainController extends baseController_1.BaseController {
    constructor() {
        super('professional_domains');
        // Override create method to handle payment_code
        this.create = (0, errorHandler_1.catchAsync)(async (req, res) => {
            const { name, description, payment_code } = req.body;
            const result = await (0, db_1.query)(`
      INSERT INTO professional_domains (name, description, payment_code)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [name, description || '', payment_code || null]);
            res.status(201).json({
                status: 'success',
                data: result.rows[0]
            });
        });
        // Override update method to handle payment_code
        this.update = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { id } = req.params;
            const { name, description, payment_code } = req.body;
            // Validate that domain exists
            const domainCheck = await (0, db_1.query)('SELECT id FROM professional_domains WHERE id = $1', [id]);
            if (domainCheck.rows.length === 0) {
                return next(new errorHandler_1.AppError('Professional domain not found with this ID', 404));
            }
            const result = await (0, db_1.query)(`
      UPDATE professional_domains
      SET 
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        payment_code = COALESCE($3, payment_code),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [name, description, payment_code, id]);
            res.status(200).json({
                status: 'success',
                data: result.rows[0]
            });
        });
        // Get clients by professional domain
        this.getClientsByDomain = (0, errorHandler_1.catchAsync)(async (req, res) => {
            const { id } = req.params;
            const result = await (0, db_1.query)(`
      SELECT c.* 
      FROM clients c
      WHERE c.professional_domain_id = $1
      ORDER BY c.name
    `, [id]);
            res.status(200).json({
                status: 'success',
                results: result.rows.length,
                data: result.rows
            });
        });
    }
}
exports.default = new ProfessionalDomainController();
//# sourceMappingURL=professionalDomainController.js.map