-- Migration to fix client fields
-- First, ensure all required fields exist with correct types
ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS gender VARCHAR(10),
  ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS ccp_account VARCHAR(50),
  ADD COLUMN IF NOT EXISTS cle VARCHAR(10),
  ADD COLUMN IF NOT EXISTS rip VARCHAR(100),
  ADD COLUMN IF NOT EXISTS rip_cle VARCHAR(10),
  ADD COLUMN IF NOT EXISTS revenue DECIMAL(12,2) DEFAULT 0;

-- Make sure we have the correct column types
ALTER TABLE clients
  ALTER COLUMN gender TYPE VARCHAR(10),
  ALTER COLUMN first_name TYPE VARCHAR(100),
  ALTER COLUMN last_name TYPE VARCHAR(100),
  ALTER COLUMN birth_date TYPE DATE USING birth_date::DATE,
  ALTER COLUMN ccp_account TYPE VARCHAR(50),
  ALTER COLUMN cle TYPE VARCHAR(10),
  ALTER COLUMN rip TYPE VARCHAR(100),
  ALTER COLUMN rip_cle TYPE VARCHAR(10),
  ALTER COLUMN revenue TYPE DECIMAL(12,2) USING revenue::DECIMAL(12,2);

-- Make sure name field is populated from first_name and last_name
UPDATE clients
SET name = CONCAT(gender, ' ', first_name, ' ', last_name)
WHERE first_name IS NOT NULL AND last_name IS NOT NULL AND (name IS NULL OR name = ''); 