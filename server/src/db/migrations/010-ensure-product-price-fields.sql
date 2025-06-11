-- Ensure products table has sell_price and buy_price columns
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sell_price DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS buy_price DECIMAL(10, 2);

-- Update products to set sell_price and buy_price based on price if they're missing
UPDATE products
SET 
  sell_price = price,
  buy_price = price * 0.7
WHERE sell_price IS NULL OR buy_price IS NULL;

-- Make sure all products have at least some price value
UPDATE products
SET 
  price = COALESCE(price, sell_price, 0),
  sell_price = COALESCE(sell_price, price, 0),
  buy_price = COALESCE(buy_price, price * 0.7, 0)
WHERE price IS NULL OR sell_price IS NULL OR buy_price IS NULL; 