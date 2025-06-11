-- Migration to update products table with missing fields
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS reference VARCHAR(100),
  ADD COLUMN IF NOT EXISTS sell_price DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS buy_price DECIMAL(10, 2) DEFAULT 0;

-- Rename price column to sell_price for existing records
UPDATE products 
SET 
  sell_price = price,
  buy_price = price * 0.7, -- Default buy price as 70% of sell price
  reference = sku -- Use SKU as reference by default
WHERE sell_price IS NULL;

-- Add comment to explain the fields
COMMENT ON COLUMN products.reference IS 'Product reference code';
COMMENT ON COLUMN products.sell_price IS 'Selling price to customers';
COMMENT ON COLUMN products.buy_price IS 'Purchase price from suppliers'; 