"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../db");
const errorHandler_1 = require("../utils/errorHandler");
const baseController_1 = require("../utils/baseController");
class ClientController extends baseController_1.BaseController {
    constructor() {
        super('clients');
        // Override getAll to include professional domain details and all required fields
        this.getAll = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            console.log("Getting all clients");
            const result = await (0, db_1.query)(`
      SELECT 
        c.*,
        pd.name as professional_domain_name,
        pd.payment_code as professional_domain_code,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, c.birth_date)) as age
      FROM clients c
      LEFT JOIN professional_domains pd ON c.professional_domain_id = pd.id
      ORDER BY c.created_at DESC
    `);
            console.log(`Found ${result.rows.length} clients`);
            if (result.rows.length > 0) {
                console.log("First client:", result.rows[0].id, result.rows[0].name);
            }
            // Ensure all clients have the required fields
            const clients = result.rows.map(client => ({
                ...client,
                // Ensure these fields are never null/undefined for the frontend
                first_name: client.first_name || '',
                last_name: client.last_name || '',
                gender: client.gender || '',
                phone: client.phone || '',
                address: client.address || '',
                professional_domain_name: client.professional_domain_name || '',
                professional_domain_code: client.professional_domain_code || '',
                ccp_account: client.ccp_account || '',
                cle: client.cle || '',
                rip: client.rip || '',
                rip_cle: client.rip_cle || '',
                revenue: parseFloat(client.revenue) || 0,
                age: client.age || 0
            }));
            res.status(200).json({
                status: 'success',
                results: clients.length,
                data: clients
            });
        });
        // Override getById to include professional domain details and all required fields
        this.getById = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { id } = req.params;
            const result = await (0, db_1.query)(`
      SELECT 
        c.*,
        pd.name as professional_domain_name,
        pd.payment_code as professional_domain_code,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, c.birth_date)) as age
      FROM clients c
      LEFT JOIN professional_domains pd ON c.professional_domain_id = pd.id
      WHERE c.id = $1
    `, [id]);
            if (result.rows.length === 0) {
                return next(new errorHandler_1.AppError('Client not found with this ID', 404));
            }
            // Ensure the client has all required fields
            const client = {
                ...result.rows[0],
                // Ensure these fields are never null/undefined for the frontend
                first_name: result.rows[0].first_name || '',
                last_name: result.rows[0].last_name || '',
                gender: result.rows[0].gender || '',
                phone: result.rows[0].phone || '',
                address: result.rows[0].address || '',
                professional_domain_name: result.rows[0].professional_domain_name || '',
                professional_domain_code: result.rows[0].professional_domain_code || '',
                ccp_account: result.rows[0].ccp_account || '',
                cle: result.rows[0].cle || '',
                rip: result.rows[0].rip || '',
                rip_cle: result.rows[0].rip_cle || '',
                revenue: parseFloat(result.rows[0].revenue) || 0,
                age: result.rows[0].age || 0
            };
            res.status(200).json({
                status: 'success',
                data: client
            });
        });
        // Override create method to handle all client fields
        this.create = (0, errorHandler_1.catchAsync)(async (req, res) => {
            const { first_name, last_name, gender, email, phone, address, professional_domain_id, birth_date, ccp_account, cle, rip, rip_cle, revenue, company, status, notes } = req.body;
            // Create SQL query with all fields - let the database trigger handle the name field
            const result = await (0, db_1.query)(`
      INSERT INTO clients (
        first_name, last_name, gender, email, phone, address, 
        professional_domain_id, birth_date, ccp_account, cle,
        rip, rip_cle, revenue, company, status, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *, 
        (SELECT name FROM professional_domains WHERE id = professional_domain_id) as professional_domain_name,
        (SELECT payment_code FROM professional_domains WHERE id = professional_domain_id) as professional_domain_code,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date)) as age
    `, [
                first_name || '', last_name || '', gender || '', email, phone || '', address || '',
                professional_domain_id, birth_date, ccp_account || '', cle || '',
                rip || '', rip_cle || '', revenue || 0, company || '', status || 'active', notes || ''
            ]);
            res.status(201).json({
                status: 'success',
                data: result.rows[0]
            });
        });
        // Override update method to handle all client fields
        this.update = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { id } = req.params;
            const { first_name, last_name, gender, email, phone, address, professional_domain_id, birth_date, ccp_account, cle, rip, rip_cle, revenue, notes, company, status } = req.body;
            // Validate that client exists
            const clientCheck = await (0, db_1.query)('SELECT id FROM clients WHERE id = $1', [id]);
            if (clientCheck.rows.length === 0) {
                return next(new errorHandler_1.AppError('Client not found with this ID', 404));
            }
            // Create SQL query with all fields - let the database trigger handle the name field
            const result = await (0, db_1.query)(`
      UPDATE clients
      SET 
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        gender = COALESCE($3, gender),
        email = COALESCE($4, email),
        phone = COALESCE($5, phone),
        address = COALESCE($6, address),
        professional_domain_id = $7,
        birth_date = $8,
        ccp_account = COALESCE($9, ccp_account),
        cle = COALESCE($10, cle),
        rip = COALESCE($11, rip),
        rip_cle = COALESCE($12, rip_cle),
        revenue = COALESCE($13, revenue),
        notes = COALESCE($14, notes),
        company = COALESCE($15, company),
        status = COALESCE($16, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $17
      RETURNING *, 
        (SELECT name FROM professional_domains WHERE id = professional_domain_id) as professional_domain_name,
        (SELECT payment_code FROM professional_domains WHERE id = professional_domain_id) as professional_domain_code,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date)) as age
    `, [
                first_name, last_name, gender, email, phone, address,
                professional_domain_id, birth_date, ccp_account, cle,
                rip, rip_cle, revenue, notes, company, status, id
            ]);
            res.status(200).json({
                status: 'success',
                data: result.rows[0]
            });
        });
        // Get client orders
        this.getClientOrders = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { id } = req.params;
            // First check if client exists
            const clientCheck = await (0, db_1.query)('SELECT id FROM clients WHERE id = $1', [id]);
            if (clientCheck.rows.length === 0) {
                return next(new errorHandler_1.AppError('Client not found with this ID', 404));
            }
            const result = await (0, db_1.query)(`
      SELECT o.*, 
        (
          SELECT json_agg(json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', p.name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total', (oi.quantity * oi.unit_price)
          ))
          FROM order_items oi
          JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = o.id
        ) as items
      FROM orders o
      WHERE o.client_id = $1
      ORDER BY o.order_date DESC
    `, [id]);
            res.status(200).json({
                status: 'success',
                results: result.rows.length,
                data: result.rows
            });
        });
        // Get client invoices
        this.getClientInvoices = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { id } = req.params;
            // First check if client exists
            const clientCheck = await (0, db_1.query)('SELECT id FROM clients WHERE id = $1', [id]);
            if (clientCheck.rows.length === 0) {
                return next(new errorHandler_1.AppError('Client not found with this ID', 404));
            }
            const result = await (0, db_1.query)(`
      SELECT i.*, 
        (
          SELECT json_agg(json_build_object(
            'id', ii.id,
            'product_id', ii.product_id,
            'product_name', p.name,
            'quantity', ii.quantity,
            'unit_price', ii.unit_price,
            'discount', ii.discount,
            'total', (ii.quantity * ii.unit_price * (1 - COALESCE(ii.discount, 0) / 100))
          ))
          FROM invoice_items ii
          JOIN products p ON ii.product_id = p.id
          WHERE ii.invoice_id = i.id
        ) as items
      FROM invoices i
      WHERE i.client_id = $1
      ORDER BY i.date DESC
    `, [id]);
            res.status(200).json({
                status: 'success',
                results: result.rows.length,
                data: result.rows
            });
        });
        // Get client logs
        this.getClientLogs = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { id } = req.params;
            // Check if client exists
            const clientCheck = await (0, db_1.query)('SELECT id FROM clients WHERE id = $1', [id]);
            if (clientCheck.rows.length === 0) {
                return next(new errorHandler_1.AppError('Client not found with this ID', 404));
            }
            const result = await (0, db_1.query)(`
      SELECT cl.*, c.name as client_name
      FROM client_logs cl
      JOIN clients c ON cl.client_id = c.id
      WHERE cl.client_id = $1
      ORDER BY cl.log_date DESC, cl.created_at DESC
    `, [id]);
            res.status(200).json({
                status: 'success',
                results: result.rows.length,
                data: result.rows
            });
        });
    }
}
exports.default = new ClientController();
//# sourceMappingURL=clientController.js.map