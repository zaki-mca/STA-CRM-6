-- Migration to add new fields to clients table
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

-- Update existing clients to split name into first_name and last_name
UPDATE clients 
SET 
  gender = 'Mr.',
  first_name = SPLIT_PART(name, ' ', 1),
  last_name = SUBSTRING(name FROM POSITION(' ' IN name) + 1)
WHERE first_name IS NULL; 