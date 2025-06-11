import { Request, Response, NextFunction } from 'express';
import { query } from '../db';
import { catchAsync, AppError } from '../utils/errorHandler';
import { BaseController } from '../utils/baseController';

// Define interface for product data
interface ProductRow {
  id: number;
  name?: string;
  description?: string;
  sku?: string;
  sell_price?: string | number;
  buy_price?: string | number;
  price?: string | number;
  quantity?: string | number;
  category_id?: number | null;
  category_name?: string;
  brand_id?: number | null;
  brand_name?: string;
  image_url?: string;
  reference?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

class ProductController extends BaseController {
  constructor() {
    super('products');
  }

  // Override getAll to include category, brand details, and all price fields
  getAll = catchAsync(async (req: Request, res: Response) => {
    const result = await query(`
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
    const products = result.rows.map((product: ProductRow) => ({
      ...product,
      // Ensure these fields are never null/undefined for the frontend
      name: product.name || '',
      description: product.description || '',
      sku: product.sku || '',
      sell_price: parseFloat(product.sell_price as string) || parseFloat(product.price as string) || 0,
      buy_price: parseFloat(product.buy_price as string) || parseFloat(product.price as string) * 0.7 || 0,
      price: parseFloat(product.price as string) || parseFloat(product.sell_price as string) || 0,
      quantity: parseInt(product.quantity as string) || 0,
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
  getById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    
    const result = await query(`
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
      return next(new AppError('Product not found with this ID', 404));
    }
    
    // Ensure the product has all required fields
    const productRow: ProductRow = result.rows[0];
    const product = {
      ...productRow,
      // Ensure these fields are never null/undefined for the frontend
      name: productRow.name || '',
      description: productRow.description || '',
      sku: productRow.sku || '',
      sell_price: parseFloat(productRow.sell_price as string) || parseFloat(productRow.price as string) || 0,
      buy_price: parseFloat(productRow.buy_price as string) || parseFloat(productRow.price as string) * 0.7 || 0,
      price: parseFloat(productRow.price as string) || parseFloat(productRow.sell_price as string) || 0,
      quantity: parseInt(productRow.quantity as string) || 0,
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
  create = catchAsync(async (req: Request, res: Response) => {
    const { 
      name, description, sell_price, buy_price, quantity, 
      category_id, brand_id, sku, image_url, reference
    } = req.body;
    
    // Create SQL query with all fields
    const result = await query(`
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
      const categoryResult = await query('SELECT id, name FROM product_categories WHERE id = $1', [category_id]);
      if (categoryResult.rows.length > 0) {
        category = categoryResult.rows[0];
      }
    }
    
    if (brand_id) {
      const brandResult = await query('SELECT id, name FROM product_brands WHERE id = $1', [brand_id]);
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
  update = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { 
      name, description, sell_price, buy_price, quantity, 
      category_id, brand_id, sku, image_url, reference
    } = req.body;
    
    // Validate that product exists
    const productCheck = await query('SELECT id FROM products WHERE id = $1', [id]);
    if (productCheck.rows.length === 0) {
      return next(new AppError('Product not found with this ID', 404));
    }
    
    // Create SQL query with all fields
    const result = await query(`
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
      const categoryResult = await query('SELECT id, name FROM product_categories WHERE id = $1', [updatedCategoryId]);
      if (categoryResult.rows.length > 0) {
        category = categoryResult.rows[0];
      }
    }
    
    if (updatedBrandId) {
      const brandResult = await query('SELECT id, name FROM product_brands WHERE id = $1', [updatedBrandId]);
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
  getByCategory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { categoryId } = req.params;
    
    // First check if category exists
    const categoryCheck = await query('SELECT id FROM product_categories WHERE id = $1', [categoryId]);
    
    if (categoryCheck.rows.length === 0) {
      return next(new AppError('Category not found with this ID', 404));
    }
    
    const result = await query(`
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
    const products = result.rows.map((product: ProductRow) => {
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
  getByBrand = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { brandId } = req.params;
    
    // First check if brand exists
    const brandCheck = await query('SELECT id FROM product_brands WHERE id = $1', [brandId]);
    
    if (brandCheck.rows.length === 0) {
      return next(new AppError('Brand not found with this ID', 404));
    }
    
    const result = await query(`
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
    const products = result.rows.map((product: ProductRow) => {
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
  getLowStock = catchAsync(async (req: Request, res: Response) => {
    const { threshold = 10 } = req.query;
    
    const result = await query(`
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
    const products = result.rows.map((product: ProductRow) => {
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
  updateQuantity = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { quantity, operation = 'set' } = req.body;
    
    if (quantity === undefined) {
      return next(new AppError('Quantity is required', 400));
    }
    
    let queryText;
    
    if (operation === 'add') {
      queryText = `
        UPDATE products
        SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
    } else if (operation === 'subtract') {
      queryText = `
        UPDATE products
        SET quantity = GREATEST(0, quantity - $1), updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
    } else { // 'set' operation
      queryText = `
        UPDATE products
        SET quantity = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
    }
    
    const result = await query(queryText, [quantity, id]);
    
    if (result.rows.length === 0) {
      return next(new AppError('Product not found with this ID', 404));
    }
    
    // Get category and brand details for the updated product
    let category = null;
    let brand = null;
    
    const updatedCategoryId = result.rows[0].category_id;
    const updatedBrandId = result.rows[0].brand_id;
    
    if (updatedCategoryId) {
      const categoryResult = await query('SELECT id, name FROM product_categories WHERE id = $1', [updatedCategoryId]);
      if (categoryResult.rows.length > 0) {
        category = categoryResult.rows[0];
      }
    }
    
    if (updatedBrandId) {
      const brandResult = await query('SELECT id, name FROM product_brands WHERE id = $1', [updatedBrandId]);
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

export default new ProductController(); 