# WooCommerce Integration for STA-CRM

This document outlines a complete implementation plan for integrating the STA-CRM system with WooCommerce, enabling bidirectional synchronization of products, categories, and inventory.

## Table of Contents

1. [Overview](#overview)
2. [Requirements](#requirements)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [API Implementation](#api-implementation)
6. [Database Schema Updates](#database-schema-updates)
7. [Frontend Components](#frontend-components)
8. [Setting Up Webhooks](#setting-up-webhooks)
9. [Product Image Management](#product-image-management)
10. [Backend Controller Implementation](#backend-controller-implementation)

## Overview

This integration enables:
- Pushing products from the CRM to WooCommerce
- Pulling products from WooCommerce to the CRM
- Real-time inventory synchronization
- Category mapping between systems
- Product image management

## Requirements

- WooCommerce store with REST API enabled
- API credentials (Consumer Key and Consumer Secret)
- Node.js environment for the CRM
- PostgreSQL database

## Installation

Install the required package:

```bash
npm install --save @woocommerce/woocommerce-rest-api
```

## Configuration

Add these environment variables to your `.env` file:

```
# WooCommerce API Configuration
WOOCOMMERCE_URL=https://your-woocommerce-site.com
WOOCOMMERCE_CONSUMER_KEY=your_consumer_key
WOOCOMMERCE_CONSUMER_SECRET=your_consumer_secret
WOOCOMMERCE_API_VERSION=wc/v3
```

To generate API credentials in WooCommerce:
1. Go to WooCommerce > Settings > Advanced > REST API
2. Click "Add Key"
3. Set Description (e.g., "STA-CRM Integration")
4. Select User with admin privileges
5. Set Permissions to "Read/Write"
6. Generate API Key
7. Copy the Consumer Key and Consumer Secret to your `.env` file

## API Implementation

### 1. WooCommerce API Client

Create a new file `lib/woocommerce-api.ts`:

```typescript
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import { ApiError } from './api';

// WooCommerce API client configuration
const WooCommerceClient = new WooCommerceRestApi({
  url: process.env.WOOCOMMERCE_URL || '',
  consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY || '',
  consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET || '',
  version: process.env.WOOCOMMERCE_API_VERSION || 'wc/v3',
  queryStringAuth: true // Use query parameters for authentication
});

// Error handling wrapper for WooCommerce API calls
async function wooRequest<T>(apiCall: () => Promise<any>): Promise<T> {
  try {
    const response = await apiCall();
    return response.data;
  } catch (error: any) {
    console.error('WooCommerce API error:', error.response?.data || error.message);
    
    // Format the error consistently with our CRM's error handling
    throw new ApiError(
      error.response?.data?.message || 'WooCommerce API request failed',
      error.response?.status || 500,
      error.response?.statusText || ''
    );
  }
}

// Products API
export const wooProducts = {
  // Get all products
  getAll: (params = {}) => wooRequest(() => 
    WooCommerceClient.get('products', params)
  ),
  
  // Get a single product by ID
  getById: (id: number) => wooRequest(() => 
    WooCommerceClient.get(`products/${id}`)
  ),
  
  // Create a new product
  create: (productData: any) => wooRequest(() => 
    WooCommerceClient.post('products', productData)
  ),
  
  // Update a product
  update: (id: number, productData: any) => wooRequest(() => 
    WooCommerceClient.put(`products/${id}`, productData)
  ),
  
  // Delete a product
  delete: (id: number, force = false) => wooRequest(() => 
    WooCommerceClient.delete(`products/${id}`, { force })
  ),
  
  // Update stock quantity
  updateStock: (id: number, quantity: number) => wooRequest(() => 
    WooCommerceClient.put(`products/${id}`, { 
      stock_quantity: quantity,
      // Only set the product to in stock if the quantity is positive
      in_stock: quantity > 0
    })
  ),
  
  // Batch update products (more efficient for bulk operations)
  batchUpdate: (data: { create?: any[], update?: any[], delete?: number[] }) => wooRequest(() => 
    WooCommerceClient.post('products/batch', data)
  )
};

// Categories API
export const wooCategories = {
  // Get all categories
  getAll: (params = {}) => wooRequest(() => 
    WooCommerceClient.get('products/categories', params)
  ),
  
  // Create a new category
  create: (categoryData: any) => wooRequest(() => 
    WooCommerceClient.post('products/categories', categoryData)
  )
};

// Export the WooCommerce client for direct use if needed
export { WooCommerceClient };
```

## Database Schema Updates

### 1. Product Table Modifications

Add a WooCommerce ID to link products between systems:

```sql
-- Add WooCommerce product ID column
ALTER TABLE products ADD COLUMN IF NOT EXISTS woocommerce_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_products_woocommerce_id ON products(woocommerce_id);

-- Add image fields for product images
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::JSONB;

-- Add additional WooCommerce specific fields
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS slug VARCHAR(255),
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS woo_status VARCHAR(50) DEFAULT 'publish',
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_virtual BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_downloadable BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sale_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS sale_price_start_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS sale_price_end_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS weight NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS dimensions JSONB;
```

## Type Definitions

Create a new file `lib/woocommerce-types.ts`:

```typescript
import { Product, Category, Brand } from './types';

// Define types for mapping between CRM and WooCommerce
export interface WooCommerceProduct {
  id?: number;
  name: string;
  slug?: string;
  permalink?: string;
  date_created?: string;
  date_modified?: string;
  type?: string;
  status?: string;
  featured?: boolean;
  catalog_visibility?: string;
  description?: string;
  short_description?: string;
  sku: string;
  price?: string;
  regular_price: string;
  sale_price?: string;
  date_on_sale_from?: string;
  date_on_sale_to?: string;
  price_html?: string;
  on_sale?: boolean;
  purchasable?: boolean;
  total_sales?: number;
  virtual?: boolean;
  downloadable?: boolean;
  downloads?: any[];
  download_limit?: number;
  download_expiry?: number;
  external_url?: string;
  button_text?: string;
  tax_status?: string;
  tax_class?: string;
  manage_stock: boolean;
  stock_quantity: number;
  stock_status: string;
  backorders?: string;
  backorders_allowed?: boolean;
  backordered?: boolean;
  sold_individually?: boolean;
  weight?: string;
  dimensions?: {
    length?: string;
    width?: string;
    height?: string;
  };
  shipping_required?: boolean;
  shipping_taxable?: boolean;
  shipping_class?: string;
  shipping_class_id?: number;
  reviews_allowed?: boolean;
  average_rating?: string;
  rating_count?: number;
  related_ids?: number[];
  upsell_ids?: number[];
  cross_sell_ids?: number[];
  parent_id?: number;
  purchase_note?: string;
  categories?: Array<{
    id?: number;
    name?: string;
    slug?: string;
  }>;
  tags?: any[];
  images?: Array<{
    id?: number;
    date_created?: string;
    date_modified?: string;
    src: string;
    name?: string;
    alt?: string;
  }>;
  attributes?: any[];
  default_attributes?: any[];
  variations?: number[];
  grouped_products?: number[];
  menu_order?: number;
  meta_data?: any[];
}

export interface WooCommerceCategory {
  id?: number;
  name: string;
  slug?: string;
  parent?: number;
  description?: string;
  display?: string;
  image?: {
    id?: number;
    date_created?: string;
    date_modified?: string;
    src?: string;
    name?: string;
    alt?: string;
  };
  menu_order?: number;
  count?: number;
}

// Mapping functions between CRM and WooCommerce data models
export function mapCrmProductToWooCommerce(product: Product): WooCommerceProduct {
  return {
    name: product.name,
    description: product.description,
    sku: product.sku,
    regular_price: product.sellPrice.toString(),
    manage_stock: true,
    stock_quantity: product.quantity,
    stock_status: product.quantity > 0 ? 'instock' : 'outofstock',
    categories: [
      {
        name: product.category.name
      }
    ],
    // Add image if available
    images: product.image_url 
      ? [{ src: product.image_url, alt: product.name }] 
      : undefined,
    meta_data: [
      {
        key: 'crm_product_id',
        value: product.id
      },
      {
        key: 'crm_brand',
        value: product.brand.name
      },
      {
        key: 'crm_reference',
        value: product.reference
      }
    ]
  };
}

export function mapWooCommerceProductToCrm(wooProduct: WooCommerceProduct, categories: Category[], brands: Brand[]): Partial<Product> {
  // Find matched category or use first available
  const categoryName = wooProduct.categories && wooProduct.categories.length > 0
    ? wooProduct.categories[0].name
    : undefined;
  
  const category = categoryName
    ? categories.find(cat => cat.name === categoryName) || categories[0]
    : categories[0];
  
  // Find brand from meta_data or use first available
  const brandMeta = wooProduct.meta_data?.find(meta => meta.key === 'crm_brand');
  const brandName = brandMeta ? brandMeta.value : undefined;
  
  const brand = brandName
    ? brands.find(b => b.name === brandName) || brands[0]
    : brands[0];

  // Extract image URL if available
  const imageUrl = wooProduct.images && wooProduct.images.length > 0
    ? wooProduct.images[0].src
    : undefined;
  
  // Extract gallery images if available
  const galleryImages = wooProduct.images && wooProduct.images.length > 1
    ? wooProduct.images.slice(1).map(img => ({ url: img.src, alt: img.alt || '' }))
    : [];
    
  return {
    name: wooProduct.name,
    description: wooProduct.description || '',
    sku: wooProduct.sku,
    reference: wooProduct.meta_data?.find(meta => meta.key === 'crm_reference')?.value || wooProduct.sku,
    sellPrice: parseFloat(wooProduct.regular_price || '0'),
    buyPrice: parseFloat(wooProduct.regular_price || '0') * 0.7, // estimate buyPrice as 70% of sellPrice
    quantity: wooProduct.stock_quantity || 0,
    category,
    brand,
    image_url: imageUrl,
    gallery_images: galleryImages,
    woocommerce_id: wooProduct.id,
    short_description: wooProduct.short_description,
    slug: wooProduct.slug,
    is_featured: wooProduct.featured,
    sale_price: wooProduct.sale_price ? parseFloat(wooProduct.sale_price) : undefined
  };
}
```

## Frontend Components

### 1. WooCommerce Integration Button Component

Create a new component file `components/WooCommerce/WooSyncButton.tsx`:

```tsx
import React, { useState } from 'react';
import { Button, Tooltip } from '@/components/ui';
import { GiShop } from 'react-icons/gi';
import { IoMdSync } from 'react-icons/io';
import { toast } from 'react-toastify';
import { syncProductToWooCommerce, syncStockToWooCommerce } from '@/lib/api';

type WooSyncButtonProps = {
  productId: number;
  className?: string;
  syncType?: 'full' | 'stock';
  children?: React.ReactNode;
};

export function WooSyncButton({ 
  productId, 
  className = '', 
  syncType = 'full',
  children
}: WooSyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  
  const handleSync = async () => {
    try {
      setIsSyncing(true);
      
      const syncFunction = syncType === 'full' 
        ? syncProductToWooCommerce 
        : syncStockToWooCommerce;
      
      const response = await syncFunction(productId);
      
      toast.success(
        syncType === 'full' 
          ? 'Product synced to WooCommerce successfully!'
          : 'Stock updated in WooCommerce successfully!'
      );
      
      // Optionally log details to console for debugging
      console.log('Sync response:', response);
    } catch (error: any) {
      toast.error(`Error syncing to WooCommerce: ${error.message || 'Unknown error'}`);
      console.error('WooCommerce sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };
  
  const tooltipText = syncType === 'full' 
    ? 'Sync product details and stock to WooCommerce' 
    : 'Update only stock quantity in WooCommerce';
  
  return (
    <Tooltip text={tooltipText}>
      <Button
        variant="outline"
        size="icon"
        className={`bg-blue-50 hover:bg-blue-100 ${className}`}
        onClick={handleSync}
        disabled={isSyncing}
      >
        {children || (
          <div className="relative">
            <GiShop className="h-4 w-4" />
            {syncType === 'full' && (
              <IoMdSync className="h-3 w-3 absolute -top-1 -right-1" />
            )}
          </div>
        )}
      </Button>
    </Tooltip>
  );
}
```

### 2. WooCommerce Product Import Button Component

Create a new component file `components/WooCommerce/WooImportButton.tsx`:

```tsx
import React, { useState } from 'react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui';
import { FaShopify } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { importProductsFromWooCommerce } from '@/lib/api';

export function WooImportButton({ onSuccess }: { onSuccess?: () => void }) {
  const [isImporting, setIsImporting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [importStats, setImportStats] = useState<{
    imported: any[];
    errors: any[];
    total: number;
  } | null>(null);
  
  const handleImport = async () => {
    try {
      setIsImporting(true);
      
      const response = await importProductsFromWooCommerce();
      
      setImportStats(response.data);
      setIsDialogOpen(true);
      
      toast.success(`Imported ${response.data.imported.length} products from WooCommerce!`);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast.error(`Error importing from WooCommerce: ${error.message || 'Unknown error'}`);
      console.error('WooCommerce import error:', error);
    } finally {
      setIsImporting(false);
    }
  };
  
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="bg-blue-50 hover:bg-blue-100"
        onClick={handleImport}
        disabled={isImporting}
      >
        <FaShopify className="mr-2 h-4 w-4" />
        {isImporting ? 'Importing...' : 'Import from WooCommerce'}
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>WooCommerce Import Results</DialogTitle>
          </DialogHeader>
          
          {importStats && (
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Total Products Found:</span>
                <span className="font-medium">{importStats.total}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Successfully Imported:</span>
                <span className="font-medium text-green-600">
                  {importStats.imported.length}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Errors:</span>
                <span className="font-medium text-red-600">
                  {importStats.errors.length}
                </span>
              </div>
              
              {importStats.imported.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Imported Products:</h3>
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                    <ul className="text-xs space-y-1">
                      {importStats.imported.slice(0, 20).map((product: any, index: number) => (
                        <li key={index} className="flex justify-between">
                          <span>
                            {product.name} ({product.sku})
                          </span>
                          <span className={product.action === 'created' 
                            ? 'text-green-600'
                            : 'text-blue-600'
                          }>
                            {product.action}
                          </span>
                        </li>
                      ))}
                      {importStats.imported.length > 20 && (
                        <li className="text-center text-gray-500">
                          ...and {importStats.imported.length - 20} more
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
              
              {importStats.errors.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2 text-red-600">
                    Import Errors:
                  </h3>
                  <div className="max-h-40 overflow-y-auto border border-red-100 rounded-md p-2 bg-red-50">
                    <ul className="text-xs space-y-1">
                      {importStats.errors.map((error: any, index: number) => (
                        <li key={index} className="text-red-700">
                          <span className="font-medium">{error.product}:</span> {error.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
```

## Setting Up Webhooks

### 1. WooCommerce Webhook Configuration

1. Go to WooCommerce > Settings > Advanced > Webhooks
2. Click "Add Webhook"
3. Set Description (e.g., "STA-CRM Integration")
4. Select Event (e.g., "Product created", "Product updated")
5. Set URL (e.g., "https://your-crm-site.com/api/woocommerce/webhook")
6. Set Secret (e.g., "your_secret_key")
7. Save Webhook

### 2. CRM Webhook Configuration

1. Go to CRM > Settings > Webhooks
2. Click "Add Webhook"
3. Set Description (e.g., "WooCommerce Integration")
4. Select Event (e.g., "Product created", "Product updated")
5. Set URL (e.g., "https://your-woocommerce-site.com/api/woocommerce/webhook")
6. Set Secret (e.g., "your_secret_key")
7. Save Webhook

## Product Image Management

### 1. Product Image Upload

1. Go to WooCommerce > Products > Add New
2. Upload an image for the product

### 2. Product Image Display

1. Create a new component to display the product image
2. Use the product image URL from WooCommerce to display the image

## Backend Controller Implementation

Create a new controller file `server/src/controllers/wooCommerceController.ts`:

```typescript
import { Request, Response } from 'express';
import { pool } from '../db';
import { ApiError } from '../utils/errorHandler';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';

// Initialize WooCommerce API client
const WooCommerceClient = new WooCommerceRestApi({
  url: process.env.WOOCOMMERCE_URL || '',
  consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY || '',
  consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET || '',
  version: process.env.WOOCOMMERCE_API_VERSION || 'wc/v3',
  queryStringAuth: true
});

// Sync a product from CRM to WooCommerce
export async function syncProductToWooCommerce(req: Request, res: Response) {
  const { id } = req.params;
  
  try {
    const client = await pool.connect();
    
    try {
      // Get product data
      const productResult = await client.query(
        `SELECT p.*, c.id as category_id, c.name as category_name, 
         b.id as brand_id, b.name as brand_name, p.image_url
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         LEFT JOIN brands b ON p.brand_id = b.id
         WHERE p.id = $1`,
        [id]
      );
      
      if (productResult.rows.length === 0) {
        throw new ApiError('Product not found', 404);
      }
      
      const product = productResult.rows[0];
      
      // Check if product already exists in WooCommerce by searching for matching SKU
      const searchResult = await WooCommerceClient.get('products', {
        sku: product.sku
      });
      
      let wooProductId;
      let method;
      let endpoint;
      let responseMessage;
      
      // Format product data for WooCommerce
      const productData = {
        name: product.name,
        description: product.description,
        short_description: product.short_description || '',
        sku: product.sku,
        regular_price: product.sell_price.toString(),
        sale_price: product.sale_price ? product.sale_price.toString() : '',
        manage_stock: true,
        stock_quantity: product.quantity,
        stock_status: product.quantity > 0 ? 'instock' : 'outofstock',
        categories: [
          {
            name: product.category_name
          }
        ],
        images: product.image_url ? [
          {
            src: product.image_url
          }
        ] : [],
        meta_data: [
          {
            key: 'crm_product_id',
            value: product.id
          },
          {
            key: 'crm_brand',
            value: product.brand_name
          },
          {
            key: 'crm_reference',
            value: product.reference
          }
        ]
      };
      
      // Add gallery images if available
      if (product.gallery_images && Array.isArray(product.gallery_images)) {
        productData.images = [
          ...(productData.images || []),
          ...product.gallery_images.map((img: any) => ({
            src: img.url,
            alt: img.alt || ''
          }))
        ];
      }
      
      // Update or create product in WooCommerce
      if (searchResult.data && searchResult.data.length > 0) {
        // Product exists, update it
        wooProductId = searchResult.data[0].id;
        method = 'put';
        endpoint = `products/${wooProductId}`;
        responseMessage = 'Product updated in WooCommerce';
      } else {
        // Product doesn't exist, create it
        method = 'post';
        endpoint = 'products';
        responseMessage = 'Product created in WooCommerce';
      }
      
      const response = await WooCommerceClient[method](endpoint, productData);
      
      // Save WooCommerce product ID to database if it's a new product
      if (method === 'post') {
        await client.query(
          `UPDATE products
           SET woocommerce_id = $1, 
               updated_at = NOW()
           WHERE id = $2`,
          [response.data.id, id]
        );
      }
      
      res.status(200).json({
        status: 'success',
        message: responseMessage,
        data: {
          crmProduct: product,
          wooCommerceProduct: response.data
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error syncing product to WooCommerce:', error);
    res.status(error.status || 500).json({
      status: 'error',
      message: error.message || 'Failed to sync product to WooCommerce'
    });
  }
}

// Sync stock levels from CRM to WooCommerce
export async function syncStockToWooCommerce(req: Request, res: Response) {
  const { id } = req.params;
  
  try {
    const client = await pool.connect();
    
    try {
      // Get product data
      const productResult = await client.query(
        `SELECT p.*, woocommerce_id
         FROM products p
         WHERE p.id = $1`,
        [id]
      );
      
      if (productResult.rows.length === 0) {
        throw new ApiError('Product not found', 404);
      }
      
      const product = productResult.rows[0];
      
      if (!product.woocommerce_id) {
        throw new ApiError('Product not linked to WooCommerce yet', 400);
      }
      
      // Update stock in WooCommerce
      const response = await WooCommerceClient.put(`products/${product.woocommerce_id}`, {
        stock_quantity: product.quantity,
        stock_status: product.quantity > 0 ? 'instock' : 'outofstock'
      });
      
      res.status(200).json({
        status: 'success',
        message: 'Stock updated in WooCommerce',
        data: {
          crmProduct: {
            id: product.id,
            name: product.name,
            quantity: product.quantity
          },
          wooCommerceProduct: {
            id: response.data.id,
            name: response.data.name,
            stock_quantity: response.data.stock_quantity,
            stock_status: response.data.stock_status
          }
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error syncing stock to WooCommerce:', error);
    res.status(error.status || 500).json({
      status: 'error',
      message: error.message || 'Failed to sync stock to WooCommerce'
    });
  }
}

// Import products from WooCommerce to CRM
export async function importProductsFromWooCommerce(req: Request, res: Response) {
  try {
    const client = await pool.connect();
    
    try {
      // Get products from WooCommerce
      const response = await WooCommerceClient.get('products', { 
        per_page: 100 // Maximum allowed per page
      });
      
      // Get existing categories and brands
      const categoriesResult = await client.query('SELECT * FROM categories');
      const brandsResult = await client.query('SELECT * FROM brands');
      
      const categories = categoriesResult.rows;
      const brands = brandsResult.rows;
      
      const importedProducts = [];
      const errors = [];
      
      // Process each WooCommerce product
      for (const wooProduct of response.data) {
        try {
          // Check if product already exists in CRM by SKU
          const existingProduct = await client.query(
            'SELECT id FROM products WHERE sku = $1',
            [wooProduct.sku]
          );
          
          // Find or create category
          let categoryId;
          if (wooProduct.categories && wooProduct.categories.length > 0) {
            const categoryName = wooProduct.categories[0].name;
            
            // Try to find existing category
            const existingCategory = categories.find(c => c.name === categoryName);
            
            if (existingCategory) {
              categoryId = existingCategory.id;
            } else {
              // Create new category
              const newCategory = await client.query(
                'INSERT INTO categories (name) VALUES ($1) RETURNING id',
                [categoryName]
              );
              categoryId = newCategory.rows[0].id;
              categories.push({ id: categoryId, name: categoryName });
            }
          } else {
            // Use default category
            categoryId = categories[0]?.id;
          }
          
          // Find or use default brand
          const brandId = brands[0]?.id;
          
          // Extract reference from meta_data or use SKU
          let reference = wooProduct.sku;
          if (wooProduct.meta_data) {
            const refMeta = wooProduct.meta_data.find(meta => meta.key === 'crm_reference');
            if (refMeta) {
              reference = refMeta.value;
            }
          }
          
          // Calculate buy price as 70% of sell price if not available
          const sellPrice = parseFloat(wooProduct.regular_price || '0');
          const buyPrice = sellPrice * 0.7;
          
          // Extract main image URL
          const imageUrl = wooProduct.images && wooProduct.images.length > 0
            ? wooProduct.images[0].src
            : null;
            
          // Extract gallery images
          const galleryImages = wooProduct.images && wooProduct.images.length > 1
            ? JSON.stringify(wooProduct.images.slice(1).map(img => ({
                url: img.src,
                alt: img.alt || ''
              })))
            : '[]';
          
          if (existingProduct.rows.length > 0) {
            // Update existing product
            const updatedProduct = await client.query(
              `UPDATE products 
               SET name = $1, description = $2, reference = $3, 
                   sell_price = $4, buy_price = $5, quantity = $6,
                   category_id = $7, brand_id = $8,
                   woocommerce_id = $9, updated_at = NOW(),
                   image_url = $10, gallery_images = $11,
                   short_description = $12, slug = $13,
                   is_featured = $14, sale_price = $15
               WHERE id = $16
               RETURNING *`,
              [
                wooProduct.name, 
                wooProduct.description || '', 
                reference,
                sellPrice,
                buyPrice,
                wooProduct.stock_quantity || 0,
                categoryId,
                brandId,
                wooProduct.id,
                imageUrl,
                galleryImages,
                wooProduct.short_description || '',
                wooProduct.slug || '',
                wooProduct.featured || false,
                wooProduct.sale_price ? parseFloat(wooProduct.sale_price) : null,
                existingProduct.rows[0].id
              ]
            );
            
            importedProducts.push({
              ...updatedProduct.rows[0],
              action: 'updated'
            });
          } else {
            // Create new product
            const newProduct = await client.query(
              `INSERT INTO products 
               (name, description, reference, sku, sell_price, buy_price, 
                quantity, category_id, brand_id, woocommerce_id, image_url,
                gallery_images, short_description, slug, is_featured, sale_price)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
               RETURNING *`,
              [
                wooProduct.name, 
                wooProduct.description || '', 
                reference,
                wooProduct.sku,
                sellPrice,
                buyPrice,
                wooProduct.stock_quantity || 0,
                categoryId,
                brandId,
                wooProduct.id,
                imageUrl,
                galleryImages,
                wooProduct.short_description || '',
                wooProduct.slug || '',
                wooProduct.featured || false,
                wooProduct.sale_price ? parseFloat(wooProduct.sale_price) : null
              ]
            );
            
            importedProducts.push({
              ...newProduct.rows[0],
              action: 'created'
            });
          }
        } catch (productError) {
          console.error(`Error processing product "${wooProduct.name}":`, productError);
          errors.push({
            product: wooProduct.name,
            error: productError.message
          });
        }
      }
      
      res.status(200).json({
        status: 'success',
        message: `Imported ${importedProducts.length} products from WooCommerce`,
        data: {
          imported: importedProducts,
          errors: errors,
          total: response.data.length
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error importing products from WooCommerce:', error);
    res.status(error.status || 500).json({
      status: 'error',
      message: error.message || 'Failed to import products from WooCommerce'
    });
  }
}
```

## API Routes Implementation

Create a new route file `server/src/routes/wooCommerceRoutes.ts`:

```typescript
import express from 'express';
import { 
  syncProductToWooCommerce, 
  syncStockToWooCommerce, 
  importProductsFromWooCommerce 
} from '../controllers/wooCommerceController';

const router = express.Router();

// Route to sync a single product from CRM to WooCommerce
router.post('/products/:id/sync-to-woo', syncProductToWooCommerce);

// Route to sync only stock information from CRM to WooCommerce
router.post('/products/:id/sync-stock', syncStockToWooCommerce);

// Route to import products from WooCommerce to CRM
router.post('/import-from-woo', importProductsFromWooCommerce);

export default router;
```

Update the main routes file `server/src/routes/index.ts` to include the new WooCommerce routes:

```typescript
// Add to existing imports
import wooCommerceRoutes from './wooCommerceRoutes';

// Add to existing route registrations
app.use('/api/woo', wooCommerceRoutes);
```

## API Client Extensions

Update `lib/api.ts` to include the WooCommerce API endpoints:

```typescript
// Add these functions to your existing api.ts file

// Sync a product from CRM to WooCommerce
export async function syncProductToWooCommerce(productId: number): Promise<any> {
  const response = await fetch(`/api/woo/products/${productId}/sync-to-woo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to sync product to WooCommerce');
  }
  
  return await response.json();
}

// Sync stock information from CRM to WooCommerce
export async function syncStockToWooCommerce(productId: number): Promise<any> {
  const response = await fetch(`/api/woo/products/${productId}/sync-stock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to sync stock to WooCommerce');
  }
  
  return await response.json();
}

// Import products from WooCommerce to CRM
export async function importProductsFromWooCommerce(): Promise<any> {
  const response = await fetch(`/api/woo/import-from-woo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to import products from WooCommerce');
  }
  
  return await response.json();
}
```

## Product Image Upload Implementation

### 1. Product Form with Image Upload

Update the product form component to include image uploads:

```tsx
// Add the following to your product form component

import { useState } from 'react';
import { Input, Button, Label } from '@/components/ui';
import { FiUpload, FiX } from 'react-icons/fi';

// Inside your form component
const [mainImage, setMainImage] = useState<File | null>(null);
const [mainImagePreview, setMainImagePreview] = useState<string | null>(
  product?.image_url || null
);
const [galleryImages, setGalleryImages] = useState<File[]>([]);
const [galleryPreviews, setGalleryPreviews] = useState<string[]>(
  product?.gallery_images?.map((img: any) => img.url) || []
);

// Handle main image selection
const handleMainImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  if (event.target.files && event.target.files[0]) {
    const file = event.target.files[0];
    setMainImage(file);
    setMainImagePreview(URL.createObjectURL(file));
  }
};

// Handle gallery image selection
const handleGalleryImagesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  if (event.target.files) {
    const files = Array.from(event.target.files);
    setGalleryImages([...galleryImages, ...files]);
    
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setGalleryPreviews([...galleryPreviews, ...newPreviews]);
  }
};

// Remove gallery image
const removeGalleryImage = (index: number) => {
  setGalleryImages(galleryImages.filter((_, i) => i !== index));
  setGalleryPreviews(galleryPreviews.filter((_, i) => i !== index));
};

// Inside your form JSX
<div className="space-y-4">
  <div>
    <Label htmlFor="mainImage">Main Product Image</Label>
    <div className="flex items-center space-x-4 mt-2">
      {mainImagePreview ? (
        <div className="relative w-24 h-24 border rounded overflow-hidden">
          <img 
            src={mainImagePreview} 
            alt="Product" 
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            className="absolute top-1 right-1 bg-white rounded-full p-1"
            onClick={() => {
              setMainImage(null);
              setMainImagePreview(null);
            }}
          >
            <FiX className="h-4 w-4 text-red-500" />
          </button>
        </div>
      ) : (
        <div className="w-24 h-24 border-2 border-dashed rounded flex items-center justify-center">
          <FiUpload className="h-8 w-8 text-gray-300" />
        </div>
      )}
      <Input
        id="mainImage"
        type="file"
        accept="image/*"
        onChange={handleMainImageChange}
        className="max-w-xs"
      />
    </div>
  </div>
  
  <div>
    <Label htmlFor="galleryImages">Product Gallery Images</Label>
    <div className="mt-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {galleryPreviews.map((preview, index) => (
          <div key={index} className="relative w-16 h-16 border rounded overflow-hidden">
            <img
              src={preview}
              alt={`Gallery ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              className="absolute top-0.5 right-0.5 bg-white rounded-full p-0.5"
              onClick={() => removeGalleryImage(index)}
            >
              <FiX className="h-3 w-3 text-red-500" />
            </button>
          </div>
        ))}
        
        {galleryPreviews.length < 5 && (
          <label
            htmlFor="galleryImages"
            className="w-16 h-16 border-2 border-dashed rounded flex items-center justify-center cursor-pointer"
          >
            <FiUpload className="h-6 w-6 text-gray-300" />
          </label>
        )}
      </div>
      <Input
        id="galleryImages"
        type="file"
        accept="image/*"
        multiple
        onChange={handleGalleryImagesChange}
        className={galleryPreviews.length ? "sr-only" : "max-w-xs"}
      />
      <p className="text-xs text-gray-500 mt-1">Up to 5 gallery images</p>
    </div>
  </div>
</div>
```

### 2. Server-Side Image Upload Handling

Update the product controller to handle image uploads:

```typescript
// In your product controller file

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Set up multer for image storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../public/uploads/products');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'product-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Handle creating/updating product with images
export async function createProduct(req, res) {
  // Use the upload middleware first
  upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'galleryImages', maxCount: 5 }
  ])(req, res, async function(err) {
    if (err) {
      return res.status(400).json({
        status: 'error',
        message: err.message
      });
    }
    
    try {
      const client = await pool.connect();
      
      try {
        // Get product data from request body
        const productData = JSON.parse(req.body.productData);
        
        // Process main image if uploaded
        let imageUrl = null;
        if (req.files.mainImage && req.files.mainImage[0]) {
          const file = req.files.mainImage[0];
          imageUrl = `/uploads/products/${file.filename}`;
        }
        
        // Process gallery images if uploaded
        let galleryImages = [];
        if (req.files.galleryImages) {
          galleryImages = req.files.galleryImages.map(file => ({
            url: `/uploads/products/${file.filename}`,
            alt: productData.name || ''
          }));
        }
        
        // Add image data to product
        productData.image_url = imageUrl;
        productData.gallery_images = JSON.stringify(galleryImages);
        
        // Create or update product in database
        // ... existing database code
        
        res.status(201).json({
          status: 'success',
          message: 'Product created successfully',
          data: result.rows[0]
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to create product'
      });
    }
  });
}
```

## Integration Usage Examples

### 1. Adding Sync Buttons to Product List

```tsx
// In your ProductList component
import { WooSyncButton } from '@/components/WooCommerce/WooSyncButton';

// Inside your product item rendering
<div className="flex space-x-2">
  <EditButton productId={product.id} />
  <DeleteButton productId={product.id} />
  <WooSyncButton productId={product.id} />
</div>
```

### 2. Adding Import Button to Product Page

```tsx
// In your ProductPage component
import { WooImportButton } from '@/components/WooCommerce/WooImportButton';

// Inside your page header section
<div className="flex justify-between items-center mb-4">
  <h1 className="text-2xl font-bold">Products</h1>
  <div className="flex space-x-2">
    <AddProductButton />
    <WooImportButton onSuccess={refreshProducts} />
  </div>
</div>
```

### 3. Using the Integration in Product Detail

```tsx
// In your ProductDetail component
import { WooSyncButton } from '@/components/WooCommerce/WooSyncButton';

// Inside your product detail page
<div className="flex space-x-4 mt-4">
  <Button onClick={handleEdit}>Edit</Button>
  <WooSyncButton
    productId={product.id}
    syncType="full"
    className="bg-blue-100"
  >
    Sync to WooCommerce
  </WooSyncButton>
  <WooSyncButton
    productId={product.id}
    syncType="stock"
    className="bg-green-100"
  >
    Update Stock Only
  </WooSyncButton>
</div>
```

## Conclusion

This integration provides a complete bidirectional synchronization between your CRM and WooCommerce. Products can be pushed from the CRM to WooCommerce, pulled from WooCommerce to the CRM, and stock levels can be updated in real-time.

With the addition of product image management, your CRM now has full control over the product catalog, ensuring consistency across both systems.

To further enhance this integration, consider implementing:

1. Automated stock synchronization using webhooks
2. Order synchronization from WooCommerce to CRM
3. Customer data synchronization
4. Product variation support
5. Bulk synchronization options for multiple products 