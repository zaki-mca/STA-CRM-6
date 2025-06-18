"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../db");
const errorHandler_1 = require("../utils/errorHandler");
const baseController_1 = require("../utils/baseController");
class ProductController extends baseController_1.BaseController {
    constructor() {
        super('products');
        // Override getAll to include category, brand details, and all price fields
        this.getAll = (0, errorHandler_1.catchAsync)(async (req, res) => {
            const result = await (0, db_1.query)(`
      SELECT 
        p.*,
        c.id as category_id,
        c.name as category_name,
        b.id as brand_id,
        b.name as brand_name
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      LEFT JOIN product_brands b ON p.brand_id = b.id
      ORDER BY p.created_at DESC
    `);
            // Ensure all products have the required fields
            const products = result.rows.map((product) => ({
                ...product,
                // Ensure these fields are never null/undefined for the frontend
                name: product.name || '',
                description: product.description || '',
                sku: product.sku || '',
                sell_price: parseFloat(product.sell_price) || parseFloat(product.price) || 0,
                buy_price: parseFloat(product.buy_price) || parseFloat(product.price) * 0.7 || 0,
                price: parseFloat(product.price) || parseFloat(product.sell_price) || 0,
                quantity: parseInt(product.quantity) || 0,
                category_id: product.category_id || null,
                category_name: product.category_name || 'Uncategorized',
                brand_id: product.brand_id || null,
                brand_name: product.brand_name || 'Unbranded'
            }));
            res.status(200).json({
                status: 'success',
                results: products.length,
                data: products
            });
        });
        // Override getById to include category, brand details, and all price fields
        this.getById = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { id } = req.params;
            const result = await (0, db_1.query)(`
      SELECT 
        p.*,
        c.id as category_id,
        c.name as category_name,
        b.id as brand_id,
        b.name as brand_name
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      LEFT JOIN product_brands b ON p.brand_id = b.id
      WHERE p.id = $1
    `, [id]);
            if (result.rows.length === 0) {
                return next(new errorHandler_1.AppError('Product not found with this ID', 404));
            }
            // Ensure the product has all required fields
            const productRow = result.rows[0];
            const product = {
                ...productRow,
                // Ensure these fields are never null/undefined for the frontend
                name: productRow.name || '',
                description: productRow.description || '',
                sku: productRow.sku || '',
                sell_price: parseFloat(productRow.sell_price) || parseFloat(productRow.price) || 0,
                buy_price: parseFloat(productRow.buy_price) || parseFloat(productRow.price) * 0.7 || 0,
                price: parseFloat(productRow.price) || parseFloat(productRow.sell_price) || 0,
                quantity: parseInt(productRow.quantity) || 0,
                category_id: productRow.category_id || null,
                category_name: productRow.category_name || 'Uncategorized',
                brand_id: productRow.brand_id || null,
                brand_name: productRow.brand_name || 'Unbranded'
            };
            res.status(200).json({
                status: 'success',
                data: product
            });
        });
        // Override create method to handle all product fields
        this.create = (0, errorHandler_1.catchAsync)(async (req, res) => {
            const { name, description, sell_price, buy_price, quantity, category_id, brand_id, sku, image_url, reference } = req.body;
            // Create SQL query with all fields
            const result = await (0, db_1.query)(`
      INSERT INTO products (
        name, description, sell_price, buy_price, quantity, 
        category_id, brand_id, sku, image_url, reference, price
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $3)
      RETURNING *
    `, [
                name, description || '', sell_price, buy_price || 0, quantity || 0,
                category_id, brand_id, sku, image_url || '', reference || sku || ''
            ]);
            // Get category and brand details
            let category = null;
            let brand = null;
            if (category_id) {
                const categoryResult = await (0, db_1.query)('SELECT id, name FROM product_categories WHERE id = $1', [category_id]);
                if (categoryResult.rows.length > 0) {
                    category = categoryResult.rows[0];
                }
            }
            if (brand_id) {
                const brandResult = await (0, db_1.query)('SELECT id, name FROM product_brands WHERE id = $1', [brand_id]);
                if (brandResult.rows.length > 0) {
                    brand = brandResult.rows[0];
                }
            }
            // Add category and brand objects to the response
            const product = {
                ...result.rows[0],
                category,
                brand,
                category_name: category?.name,
                brand_name: brand?.name
            };
            res.status(201).json({
                status: 'success',
                data: product
            });
        });
        // Override update method to handle all product fields
        this.update = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { id } = req.params;
            const { name, description, sell_price, buy_price, quantity, category_id, brand_id, sku, image_url, reference } = req.body;
            // Validate that product exists
            const productCheck = await (0, db_1.query)('SELECT id FROM products WHERE id = $1', [id]);
            if (productCheck.rows.length === 0) {
                return next(new errorHandler_1.AppError('Product not found with this ID', 404));
            }
            // Create SQL query with all fields
            const result = await (0, db_1.query)(`
      UPDATE products
      SET 
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        sell_price = COALESCE($3, sell_price),
        buy_price = COALESCE($4, buy_price),
        quantity = COALESCE($5, quantity),
        category_id = COALESCE($6, category_id),
        brand_id = COALESCE($7, brand_id),
        sku = COALESCE($8, sku),
        image_url = COALESCE($9, image_url),
        reference = COALESCE($10, reference),
        price = COALESCE($3, sell_price), -- Keep price field in sync with sell_price
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `, [
                name, description, sell_price, buy_price, quantity,
                category_id, brand_id, sku, image_url, reference, id
            ]);
            // Get category and brand details
            let category = null;
            let brand = null;
            const updatedCategoryId = result.rows[0].category_id;
            const updatedBrandId = result.rows[0].brand_id;
            if (updatedCategoryId) {
                const categoryResult = await (0, db_1.query)('SELECT id, name FROM product_categories WHERE id = $1', [updatedCategoryId]);
                if (categoryResult.rows.length > 0) {
                    category = categoryResult.rows[0];
                }
            }
            if (updatedBrandId) {
                const brandResult = await (0, db_1.query)('SELECT id, name FROM product_brands WHERE id = $1', [updatedBrandId]);
                if (brandResult.rows.length > 0) {
                    brand = brandResult.rows[0];
                }
            }
            // Add category and brand objects to the response
            const product = {
                ...result.rows[0],
                category,
                brand,
                category_name: category?.name,
                brand_name: brand?.name
            };
            res.status(200).json({
                status: 'success',
                data: product
            });
        });
        // Get products by category
        this.getByCategory = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { categoryId } = req.params;
            // First check if category exists
            const categoryCheck = await (0, db_1.query)('SELECT id FROM product_categories WHERE id = $1', [categoryId]);
            if (categoryCheck.rows.length === 0) {
                return next(new errorHandler_1.AppError('Category not found with this ID', 404));
            }
            const result = await (0, db_1.query)(`
      SELECT 
        p.*,
        c.id as category_id,
        c.name as category_name,
        b.id as brand_id,
        b.name as brand_name
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      LEFT JOIN product_brands b ON p.brand_id = b.id
      WHERE p.category_id = $1
      ORDER BY p.name
    `, [categoryId]);
            // Transform the results to include category and brand as objects
            const products = result.rows.map((product) => {
                return {
                    ...product,
                    category: product.category_id ? {
                        id: product.category_id,
                        name: product.category_name
                    } : null,
                    brand: product.brand_id ? {
                        id: product.brand_id,
                        name: product.brand_name
                    } : null
                };
            });
            res.status(200).json({
                status: 'success',
                results: products.length,
                data: products
            });
        });
        // Get products by brand
        this.getByBrand = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { brandId } = req.params;
            // First check if brand exists
            const brandCheck = await (0, db_1.query)('SELECT id FROM product_brands WHERE id = $1', [brandId]);
            if (brandCheck.rows.length === 0) {
                return next(new errorHandler_1.AppError('Brand not found with this ID', 404));
            }
            const result = await (0, db_1.query)(`
      SELECT 
        p.*,
        c.id as category_id,
        c.name as category_name,
        b.id as brand_id,
        b.name as brand_name
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      LEFT JOIN product_brands b ON p.brand_id = b.id
      WHERE p.brand_id = $1
      ORDER BY p.name
    `, [brandId]);
            // Transform the results to include category and brand as objects
            const products = result.rows.map((product) => {
                return {
                    ...product,
                    category: product.category_id ? {
                        id: product.category_id,
                        name: product.category_name
                    } : null,
                    brand: product.brand_id ? {
                        id: product.brand_id,
                        name: product.brand_name
                    } : null
                };
            });
            res.status(200).json({
                status: 'success',
                results: products.length,
                data: products
            });
        });
        // Get low stock products
        this.getLowStock = (0, errorHandler_1.catchAsync)(async (req, res) => {
            const { threshold = 10 } = req.query;
            const result = await (0, db_1.query)(`
      SELECT 
        p.*,
        c.id as category_id,
        c.name as category_name,
        b.id as brand_id,
        b.name as brand_name
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      LEFT JOIN product_brands b ON p.brand_id = b.id
      WHERE p.quantity < $1
      ORDER BY p.quantity ASC
    `, [threshold]);
            // Transform the results to include category and brand as objects
            const products = result.rows.map((product) => {
                return {
                    ...product,
                    category: product.category_id ? {
                        id: product.category_id,
                        name: product.category_name
                    } : null,
                    brand: product.brand_id ? {
                        id: product.brand_id,
                        name: product.brand_name
                    } : null
                };
            });
            res.status(200).json({
                status: 'success',
                results: products.length,
                data: products
            });
        });
        // Update product quantity
        this.updateQuantity = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { id } = req.params;
            const { quantity, operation = 'set' } = req.body;
            if (quantity === undefined) {
                return next(new errorHandler_1.AppError('Quantity is required', 400));
            }
            let queryText;
            if (operation === 'add') {
                queryText = `
        UPDATE products
        SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
            }
            else if (operation === 'subtract') {
                queryText = `
        UPDATE products
        SET quantity = GREATEST(0, quantity - $1), updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
            }
            else { // 'set' operation
                queryText = `
        UPDATE products
        SET quantity = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
            }
            const result = await (0, db_1.query)(queryText, [quantity, id]);
            if (result.rows.length === 0) {
                return next(new errorHandler_1.AppError('Product not found with this ID', 404));
            }
            // Get category and brand details for the updated product
            let category = null;
            let brand = null;
            const updatedCategoryId = result.rows[0].category_id;
            const updatedBrandId = result.rows[0].brand_id;
            if (updatedCategoryId) {
                const categoryResult = await (0, db_1.query)('SELECT id, name FROM product_categories WHERE id = $1', [updatedCategoryId]);
                if (categoryResult.rows.length > 0) {
                    category = categoryResult.rows[0];
                }
            }
            if (updatedBrandId) {
                const brandResult = await (0, db_1.query)('SELECT id, name FROM product_brands WHERE id = $1', [updatedBrandId]);
                if (brandResult.rows.length > 0) {
                    brand = brandResult.rows[0];
                }
            }
            // Add category and brand objects to the response
            const product = {
                ...result.rows[0],
                category,
                brand,
                category_name: category?.name,
                brand_name: brand?.name
            };
            res.status(200).json({
                status: 'success',
                data: product
            });
        });
    }
}
exports.default = new ProductController();
//# sourceMappingURL=productController.js.map