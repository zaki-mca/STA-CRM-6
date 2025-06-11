-- Migration to fix product image_url validation
-- Make image_url accept null values and not enforce URL validation at database level
ALTER TABLE products
  ALTER COLUMN image_url TYPE VARCHAR(255);

-- Add comment to explain the field
COMMENT ON COLUMN products.image_url IS 'URL to product image (optional, not strictly validated)'; 