-- Migration to fix all remaining validation issues

-- Fix logo_url in product_brands to not enforce URL validation
ALTER TABLE product_brands
  ALTER COLUMN logo_url TYPE VARCHAR(255);

-- Make sure all URL fields are properly handled
COMMENT ON COLUMN product_brands.logo_url IS 'URL to brand logo image (optional, not strictly validated)';

-- Ensure all fields that can be null are properly defined
ALTER TABLE products
  ALTER COLUMN category_id DROP NOT NULL,
  ALTER COLUMN brand_id DROP NOT NULL;

-- Fix any potential issues with invoice_items and order_items
ALTER TABLE invoice_items
  ALTER COLUMN discount SET DEFAULT 0;

-- Ensure professional_domains has payment_code field
ALTER TABLE professional_domains
  ADD COLUMN IF NOT EXISTS payment_code VARCHAR(50);

COMMENT ON COLUMN professional_domains.payment_code IS 'Payment code associated with this professional domain'; 