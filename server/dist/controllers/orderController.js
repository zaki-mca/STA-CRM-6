"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../db");
const errorHandler_1 = require("../utils/errorHandler");
const baseController_1 = require("../utils/baseController");
class OrderController extends baseController_1.BaseController {
    constructor() {
        super('orders');
        // Override getAll to include client and items directly from products
        this.getAll = (0, errorHandler_1.catchAsync)(async (req, res) => {
            const result = await (0, db_1.query)(`
      SELECT o.*, 
        COALESCE(c.name, 'Unknown Client') as client_name, 
        COALESCE(c.email, '') as client_email,
        COALESCE(c.phone, '') as client_phone,
        COALESCE(c.address, '') as client_address,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', oi.id,
                'product_id', oi.product_id,
                'product_name', COALESCE(p.name, 'Unknown Product'),
                'product_description', COALESCE(p.description, ''),
                'reference', COALESCE(p.reference, ''),
                'sku', COALESCE(p.sku, ''),
                'quantity', COALESCE(oi.quantity, 0),
                'unit_price', COALESCE(oi.unit_price, 0),
                'total', COALESCE(oi.quantity, 0) * COALESCE(oi.unit_price, 0)
              )
            )
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = o.id
          ),
          '[]'
        ) as items,
        COALESCE(
          (
            SELECT SUM(COALESCE(oi.quantity, 0) * COALESCE(oi.unit_price, 0))
            FROM order_items oi
            WHERE oi.order_id = o.id
          ),
          0
        ) as total
      FROM orders o
      LEFT JOIN clients c ON o.client_id = c.id
      ORDER BY o.order_date DESC
    `);
            console.log("Order count:", result.rows.length);
            res.status(200).json({
                status: 'success',
                results: result.rows.length,
                data: result.rows
            });
        });
        // Override getById to include client and items directly from products
        this.getById = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { id } = req.params;
            const result = await (0, db_1.query)(`
      SELECT o.*, 
        COALESCE(c.name, 'Unknown Client') as client_name, 
        COALESCE(c.email, '') as client_email,
        COALESCE(c.phone, '') as client_phone,
        COALESCE(c.address, '') as client_address,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', oi.id,
                'product_id', oi.product_id,
                'product_name', COALESCE(p.name, 'Unknown Product'),
                'product_description', COALESCE(p.description, ''),
                'reference', COALESCE(p.reference, ''),
                'sku', COALESCE(p.sku, ''),
                'quantity', COALESCE(oi.quantity, 0),
                'unit_price', COALESCE(oi.unit_price, 0),
                'total', COALESCE(oi.quantity, 0) * COALESCE(oi.unit_price, 0)
              )
            )
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = o.id
          ),
          '[]'
        ) as items,
        COALESCE(
          (
            SELECT SUM(COALESCE(oi.quantity, 0) * COALESCE(oi.unit_price, 0))
            FROM order_items oi
            WHERE oi.order_id = o.id
          ),
          0
        ) as total
      FROM orders o
      LEFT JOIN clients c ON o.client_id = c.id
      WHERE o.id = $1
    `, [id]);
            if (result.rows.length === 0) {
                return next(new errorHandler_1.AppError('Order not found with this ID', 404));
            }
            res.status(200).json({
                status: 'success',
                data: result.rows[0]
            });
        });
        // Override create to handle order items with products directly
        this.create = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            // Handle both direct format and frontend format
            let client_id = req.body.client_id;
            let order_date = req.body.order_date;
            let status = req.body.status || 'pending';
            let notes = req.body.notes || '';
            let shipping_address = req.body.shipping_address || '';
            let expected_delivery = req.body.expected_delivery;
            let items = req.body.items;
            // Handle frontend format where client is an object
            if (req.body.client && req.body.client.id) {
                client_id = req.body.client.id;
                shipping_address = req.body.client.address || shipping_address;
            }
            // Handle expected_delivery from frontend
            if (req.body.expectedDelivery) {
                expected_delivery = req.body.expectedDelivery;
            }
            // Handle order date if not provided
            if (!order_date) {
                order_date = new Date().toISOString().split('T')[0];
            }
            // Transform items if they're in frontend format
            if (items && items.length > 0 && items[0].product) {
                items = items.map((item) => ({
                    product_id: item.product.id,
                    quantity: item.quantity,
                    unit_price: item.unitPrice || item.unit_price || 0,
                    update_inventory: item.update_inventory
                }));
            }
            if (!items || !Array.isArray(items) || items.length === 0) {
                return next(new errorHandler_1.AppError('Order must contain at least one item', 400));
            }
            // Start a transaction
            const client = await (0, db_1.query)('BEGIN');
            try {
                // Generate order number
                const orderCount = await (0, db_1.query)('SELECT COUNT(*) FROM orders');
                const orderNumber = `ORD-${String(Number(orderCount.rows[0].count) + 1).padStart(5, '0')}`;
                // Create order with expected_delivery field
                const orderResult = await (0, db_1.query)(`
        INSERT INTO orders (client_id, order_number, order_date, status, notes, shipping_address, expected_delivery)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [client_id, orderNumber, order_date, status, notes, shipping_address, expected_delivery || null]);
                const order = orderResult.rows[0];
                // Create order items
                for (const item of items) {
                    // Get product details to ensure we have the correct data
                    const productResult = await (0, db_1.query)('SELECT * FROM products WHERE id = $1', [item.product_id]);
                    if (productResult.rows.length === 0) {
                        await (0, db_1.query)('ROLLBACK');
                        return next(new errorHandler_1.AppError(`Product with ID ${item.product_id} not found`, 404));
                    }
                    const product = productResult.rows[0];
                    // Use product's sell_price if unit_price is not provided
                    const unitPrice = item.unit_price !== undefined ? item.unit_price : product.sell_price;
                    await (0, db_1.query)(`
          INSERT INTO order_items (order_id, product_id, quantity, unit_price)
          VALUES ($1, $2, $3, $4)
        `, [order.id, item.product_id, item.quantity, unitPrice]);
                    // Update product quantity if needed
                    if (item.update_inventory) {
                        await (0, db_1.query)(`
            UPDATE products
            SET quantity = GREATEST(0, quantity - $1), updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [item.quantity, item.product_id]);
                    }
                }
                // Commit the transaction
                await (0, db_1.query)('COMMIT');
                // Get the order with all details
                const result = await (0, db_1.query)(`
        SELECT o.*, 
          c.name as client_name, 
          c.email as client_email,
          c.phone as client_phone,
          c.address as client_address,
          (
            SELECT json_agg(json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'product_name', p.name,
              'product_description', p.description,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'total', (oi.quantity * oi.unit_price)
            ))
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = o.id
          ) as items,
          (
            SELECT SUM(oi.quantity * oi.unit_price)
            FROM order_items oi
            WHERE oi.order_id = o.id
          ) as total
        FROM orders o
        JOIN clients c ON o.client_id = c.id
        WHERE o.id = $1
      `, [order.id]);
                res.status(201).json({
                    status: 'success',
                    data: result.rows[0]
                });
            }
            catch (error) {
                // Rollback the transaction in case of error
                await (0, db_1.query)('ROLLBACK');
                throw error;
            }
        });
        // Override update to handle order items with products directly
        this.update = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { id } = req.params;
            // Handle both direct format and frontend format
            let client_id = req.body.client_id;
            let order_date = req.body.order_date;
            let status = req.body.status;
            let notes = req.body.notes;
            let shipping_address = req.body.shipping_address;
            let expected_delivery = req.body.expected_delivery;
            let items = req.body.items;
            let removeUnlistedItems = req.body.removeUnlistedItems;
            // Handle frontend format where client is an object
            if (req.body.client && req.body.client.id) {
                client_id = req.body.client.id;
                shipping_address = req.body.client.address || shipping_address;
            }
            // Handle expected_delivery from frontend
            if (req.body.expectedDelivery) {
                expected_delivery = req.body.expectedDelivery;
            }
            // Transform items if they're in frontend format
            if (items && items.length > 0 && items[0].product) {
                items = items.map((item) => ({
                    id: item.id,
                    product_id: item.product.id,
                    quantity: item.quantity,
                    unit_price: item.unitPrice || item.unit_price
                }));
            }
            // Start a transaction
            const client = await (0, db_1.query)('BEGIN');
            try {
                // Update order
                const updateFields = [];
                const updateValues = [];
                let valueCounter = 1;
                if (client_id !== undefined) {
                    updateFields.push(`client_id = $${valueCounter}`);
                    updateValues.push(client_id);
                    valueCounter++;
                }
                if (order_date !== undefined) {
                    updateFields.push(`order_date = $${valueCounter}`);
                    updateValues.push(order_date);
                    valueCounter++;
                }
                if (status !== undefined) {
                    updateFields.push(`status = $${valueCounter}`);
                    updateValues.push(status);
                    valueCounter++;
                }
                if (notes !== undefined) {
                    updateFields.push(`notes = $${valueCounter}`);
                    updateValues.push(notes);
                    valueCounter++;
                }
                if (shipping_address !== undefined) {
                    updateFields.push(`shipping_address = $${valueCounter}`);
                    updateValues.push(shipping_address);
                    valueCounter++;
                }
                if (expected_delivery !== undefined) {
                    updateFields.push(`expected_delivery = $${valueCounter}`);
                    updateValues.push(expected_delivery);
                    valueCounter++;
                }
                updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
                if (updateFields.length > 1) { // If there's more than just updated_at
                    updateValues.push(id);
                    const orderResult = await (0, db_1.query)(`
          UPDATE orders
          SET ${updateFields.join(', ')}
          WHERE id = $${valueCounter}
          RETURNING *
        `, updateValues);
                    if (orderResult.rows.length === 0) {
                        await (0, db_1.query)('ROLLBACK');
                        return next(new errorHandler_1.AppError('Order not found with this ID', 404));
                    }
                }
                // Handle order items if provided
                if (items && Array.isArray(items)) {
                    // Get existing order items
                    const existingItemsResult = await (0, db_1.query)(`
          SELECT id, product_id, quantity, unit_price
          FROM order_items
          WHERE order_id = $1
        `, [id]);
                    const existingItems = existingItemsResult.rows;
                    const existingItemIds = existingItems.map((item) => item.id);
                    // Process each item in the request
                    for (const item of items) {
                        if (item.id && existingItemIds.includes(item.id)) {
                            // Update existing item
                            await (0, db_1.query)(`
              UPDATE order_items
              SET product_id = $1, quantity = $2, unit_price = $3, updated_at = CURRENT_TIMESTAMP
              WHERE id = $4
            `, [item.product_id, item.quantity, item.unit_price, item.id]);
                        }
                        else {
                            // Get product details to ensure we have the correct data
                            const productResult = await (0, db_1.query)('SELECT * FROM products WHERE id = $1', [item.product_id]);
                            if (productResult.rows.length === 0) {
                                await (0, db_1.query)('ROLLBACK');
                                return next(new errorHandler_1.AppError(`Product with ID ${item.product_id} not found`, 404));
                            }
                            const product = productResult.rows[0];
                            // Create new item
                            await (0, db_1.query)(`
              INSERT INTO order_items (order_id, product_id, quantity, unit_price)
              VALUES ($1, $2, $3, $4)
            `, [id, item.product_id, item.quantity, item.unit_price || product.sell_price]);
                        }
                        // Update product quantity if needed
                        if (item.update_inventory) {
                            await (0, db_1.query)(`
              UPDATE products
              SET quantity = GREATEST(0, quantity - $1), updated_at = CURRENT_TIMESTAMP
              WHERE id = $2
            `, [item.quantity, item.product_id]);
                        }
                    }
                    // Remove unlisted items if specified
                    if (removeUnlistedItems) {
                        const itemIds = items.filter((item) => item.id).map((item) => item.id);
                        if (itemIds.length > 0) {
                            await (0, db_1.query)(`
              DELETE FROM order_items
              WHERE order_id = $1 AND id NOT IN (${itemIds.map((_, i) => `$${i + 2}`).join(', ')})
            `, [id, ...itemIds]);
                        }
                        else {
                            // If no existing items were included, delete all items
                            await (0, db_1.query)(`
              DELETE FROM order_items
              WHERE order_id = $1
            `, [id]);
                        }
                    }
                }
                // Commit the transaction
                await (0, db_1.query)('COMMIT');
                // Get the updated order with all details
                const result = await (0, db_1.query)(`
        SELECT o.*, 
          c.name as client_name, 
          c.email as client_email,
          c.phone as client_phone,
          c.address as client_address,
          (
            SELECT json_agg(json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'product_name', p.name,
              'product_description', p.description,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'total', (oi.quantity * oi.unit_price)
            ))
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = o.id
          ) as items,
          (
            SELECT SUM(oi.quantity * oi.unit_price)
            FROM order_items oi
            WHERE oi.order_id = o.id
          ) as total
        FROM orders o
        JOIN clients c ON o.client_id = c.id
        WHERE o.id = $1
      `, [id]);
                if (result.rows.length === 0) {
                    return next(new errorHandler_1.AppError('Order not found with this ID', 404));
                }
                res.status(200).json({
                    status: 'success',
                    data: result.rows[0]
                });
            }
            catch (error) {
                // Rollback the transaction in case of error
                await (0, db_1.query)('ROLLBACK');
                throw error;
            }
        });
        // Override delete to handle order items
        this.delete = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { id } = req.params;
            // Start a transaction
            const client = await (0, db_1.query)('BEGIN');
            try {
                // Check if order exists
                const orderCheck = await (0, db_1.query)('SELECT id FROM orders WHERE id = $1', [id]);
                if (orderCheck.rows.length === 0) {
                    await (0, db_1.query)('ROLLBACK');
                    return next(new errorHandler_1.AppError('Order not found with this ID', 404));
                }
                // Delete order items (would be handled by ON DELETE CASCADE, but we're being explicit)
                await (0, db_1.query)('DELETE FROM order_items WHERE order_id = $1', [id]);
                // Delete order
                await (0, db_1.query)('DELETE FROM orders WHERE id = $1', [id]);
                // Commit the transaction
                await (0, db_1.query)('COMMIT');
                res.status(200).json({
                    status: 'success',
                    data: null
                });
            }
            catch (error) {
                // Rollback the transaction in case of error
                await (0, db_1.query)('ROLLBACK');
                throw error;
            }
        });
        // Get orders by status
        this.getByStatus = (0, errorHandler_1.catchAsync)(async (req, res) => {
            const { status } = req.params;
            const result = await (0, db_1.query)(`
      SELECT o.*, 
        COALESCE(c.name, 'Unknown Client') as client_name, 
        COALESCE(c.email, '') as client_email,
        COALESCE(c.phone, '') as client_phone,
        COALESCE(c.address, '') as client_address,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', oi.id,
                'product_id', oi.product_id,
                'product_name', COALESCE(p.name, 'Unknown Product'),
                'product_description', COALESCE(p.description, ''),
                'reference', COALESCE(p.reference, ''),
                'sku', COALESCE(p.sku, ''),
                'quantity', COALESCE(oi.quantity, 0),
                'unit_price', COALESCE(oi.unit_price, 0),
                'total', COALESCE(oi.quantity, 0) * COALESCE(oi.unit_price, 0)
              )
            )
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = o.id
          ),
          '[]'
        ) as items,
        COALESCE(
          (
            SELECT SUM(COALESCE(oi.quantity, 0) * COALESCE(oi.unit_price, 0))
            FROM order_items oi
            WHERE oi.order_id = o.id
          ),
          0
        ) as total
      FROM orders o
      LEFT JOIN clients c ON o.client_id = c.id
      WHERE o.status = $1
      ORDER BY o.order_date DESC
    `, [status]);
            res.status(200).json({
                status: 'success',
                results: result.rows.length,
                data: result.rows
            });
        });
        // Update order status
        this.updateStatus = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { id } = req.params;
            const { status } = req.body;
            if (!status) {
                return next(new errorHandler_1.AppError('Status is required', 400));
            }
            // Validate status
            const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
            if (!validStatuses.includes(status)) {
                return next(new errorHandler_1.AppError(`Status must be one of: ${validStatuses.join(', ')}`, 400));
            }
            const result = await (0, db_1.query)(`
      UPDATE orders
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [status, id]);
            if (result.rows.length === 0) {
                return next(new errorHandler_1.AppError('Order not found with this ID', 404));
            }
            // Get the updated order with all details
            const updatedResult = await (0, db_1.query)(`
      SELECT o.*, 
        COALESCE(c.name, 'Unknown Client') as client_name, 
        COALESCE(c.email, '') as client_email,
        COALESCE(c.phone, '') as client_phone,
        COALESCE(c.address, '') as client_address,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', oi.id,
                'product_id', oi.product_id,
                'product_name', COALESCE(p.name, 'Unknown Product'),
                'product_description', COALESCE(p.description, ''),
                'reference', COALESCE(p.reference, ''),
                'sku', COALESCE(p.sku, ''),
                'quantity', COALESCE(oi.quantity, 0),
                'unit_price', COALESCE(oi.unit_price, 0),
                'total', COALESCE(oi.quantity, 0) * COALESCE(oi.unit_price, 0)
              )
            )
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = o.id
          ),
          '[]'
        ) as items,
        COALESCE(
          (
            SELECT SUM(COALESCE(oi.quantity, 0) * COALESCE(oi.unit_price, 0))
            FROM order_items oi
            WHERE oi.order_id = o.id
          ),
          0
        ) as total
      FROM orders o
      LEFT JOIN clients c ON o.client_id = c.id
      WHERE o.id = $1
    `, [id]);
            res.status(200).json({
                status: 'success',
                data: updatedResult.rows[0]
            });
        });
        // Create invoice from order
        this.createInvoice = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { id } = req.params;
            const { due_date, status = 'draft', notes, tax_rate = 0, provider_id } = req.body;
            // Start a transaction
            const client = await (0, db_1.query)('BEGIN');
            try {
                // Get order details
                const orderResult = await (0, db_1.query)(`
        SELECT o.*, 
          (
            SELECT json_agg(json_build_object(
              'product_id', oi.product_id,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price
            ))
            FROM order_items oi
            WHERE oi.order_id = o.id
          ) as items
        FROM orders o
        WHERE o.id = $1
      `, [id]);
                if (orderResult.rows.length === 0) {
                    await (0, db_1.query)('ROLLBACK');
                    return next(new errorHandler_1.AppError('Order not found with this ID', 404));
                }
                const order = orderResult.rows[0];
                // Check if provider exists
                if (!provider_id) {
                    await (0, db_1.query)('ROLLBACK');
                    return next(new errorHandler_1.AppError('Provider ID is required', 400));
                }
                const providerResult = await (0, db_1.query)('SELECT id FROM providers WHERE id = $1', [provider_id]);
                if (providerResult.rows.length === 0) {
                    await (0, db_1.query)('ROLLBACK');
                    return next(new errorHandler_1.AppError('Provider not found', 404));
                }
                // Generate invoice number
                const invoiceCount = await (0, db_1.query)('SELECT COUNT(*) FROM invoices');
                const invoiceNumber = `INV-${String(Number(invoiceCount.rows[0].count) + 1).padStart(5, '0')}`;
                // Create invoice
                const invoiceResult = await (0, db_1.query)(`
        INSERT INTO invoices (provider_id, invoice_number, date, due_date, status, notes, tax_rate)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [provider_id, invoiceNumber, order.order_date, due_date, status, notes || order.notes, tax_rate]);
                const invoice = invoiceResult.rows[0];
                // Create invoice items
                if (order.items && Array.isArray(order.items)) {
                    for (const item of order.items) {
                        await (0, db_1.query)(`
            INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, discount)
            VALUES ($1, $2, $3, $4, $5)
          `, [invoice.id, item.product_id, item.quantity, item.unit_price, 0]);
                    }
                }
                // Update order status to indicate an invoice was created
                await (0, db_1.query)(`
        UPDATE orders
        SET status = 'completed', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [id]);
                // Commit the transaction
                await (0, db_1.query)('COMMIT');
                // Get the invoice with all details
                const result = await (0, db_1.query)(`
        SELECT i.*, 
          p.name as provider_name, 
          p.email as provider_email,
          p.phone as provider_phone,
          p.address as provider_address,
          (
            SELECT COALESCE(json_agg(json_build_object(
              'id', ii.id,
              'product_id', ii.product_id,
              'product_name', COALESCE(prod.name, 'Unknown Product'),
              'product_description', COALESCE(prod.description, ''),
              'reference', COALESCE(prod.reference, ''),
              'sku', COALESCE(prod.sku, ''),
              'category_id', COALESCE(prod.category_id, ''),
              'category_name', COALESCE((SELECT name FROM categories WHERE id = prod.category_id), 'Uncategorized'),
              'brand_id', COALESCE(prod.brand_id, ''),
              'brand_name', COALESCE((SELECT name FROM brands WHERE id = prod.brand_id), 'Unbranded'),
              'quantity', COALESCE(ii.quantity, 0),
              'unit_price', COALESCE(ii.unit_price, 0),
              'discount', COALESCE(ii.discount, 0),
              'total', (COALESCE(ii.quantity, 0) * COALESCE(ii.unit_price, 0) * (1 - COALESCE(ii.discount, 0) / 100))
            )), '[]')
            FROM invoice_items ii
            LEFT JOIN products prod ON ii.product_id = prod.id
            WHERE ii.invoice_id = i.id
          ) as items,
          COALESCE((
            SELECT SUM(COALESCE(ii.quantity, 0) * COALESCE(ii.unit_price, 0) * (1 - COALESCE(ii.discount, 0) / 100))
            FROM invoice_items ii
            WHERE ii.invoice_id = i.id
          ), 0) as subtotal,
          COALESCE((
            SELECT SUM(COALESCE(ii.quantity, 0) * COALESCE(ii.unit_price, 0) * (1 - COALESCE(ii.discount, 0) / 100)) * (1 + COALESCE(i.tax_rate, 0) / 100)
            FROM invoice_items ii
            WHERE ii.invoice_id = i.id
          ), 0) as total
        FROM invoices i
        LEFT JOIN providers p ON i.provider_id = p.id
        WHERE i.id = $1
      `, [invoice.id]);
                res.status(201).json({
                    status: 'success',
                    data: result.rows[0]
                });
            }
            catch (error) {
                // Rollback the transaction in case of error
                await (0, db_1.query)('ROLLBACK');
                console.error("Error creating invoice from order:", error);
                return next(new errorHandler_1.AppError(`Failed to create invoice: ${error instanceof Error ? error.message : 'Unknown error'}`, 500));
            }
        });
        // Get order logs
        this.getOrderLogs = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { id } = req.params;
            // Check if order exists
            const orderCheck = await (0, db_1.query)('SELECT id FROM orders WHERE id = $1', [id]);
            if (orderCheck.rows.length === 0) {
                return next(new errorHandler_1.AppError('Order not found with this ID', 404));
            }
            const result = await (0, db_1.query)(`
      SELECT ol.*, o.order_number, c.name as client_name
      FROM order_logs ol
      JOIN orders o ON ol.order_id = o.id
      JOIN clients c ON o.client_id = c.id
      WHERE ol.order_id = $1
      ORDER BY ol.log_date DESC, ol.created_at DESC
    `, [id]);
            res.status(200).json({
                status: 'success',
                results: result.rows.length,
                data: result.rows
            });
        });
    }
}
exports.default = new OrderController();
//# sourceMappingURL=orderController.js.map