-- Migration to add payment_code field to professional_domains table
ALTER TABLE professional_domains 
  ADD COLUMN IF NOT EXISTS payment_code VARCHAR(50);

-- Add comment to explain the field
COMMENT ON COLUMN professional_domains.payment_code IS 'Payment code associated with this professional domain'; 