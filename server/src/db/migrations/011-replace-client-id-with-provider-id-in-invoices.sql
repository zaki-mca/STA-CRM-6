-- Migration to replace client_id with provider_id in invoices table

-- First, add the provider_id column
ALTER TABLE invoices ADD COLUMN provider_id UUID REFERENCES providers(id);

-- Create a temporary function to assign default providers to invoices
-- This is a fallback to ensure we have valid data after dropping client_id
CREATE OR REPLACE FUNCTION assign_default_provider() RETURNS VOID AS $$
DECLARE
    default_provider_id UUID;
BEGIN
    -- Get the first provider as default
    SELECT id INTO default_provider_id FROM providers LIMIT 1;
    
    -- If no providers exist, create a default one
    IF default_provider_id IS NULL THEN
        INSERT INTO providers (name, email, phone, status)
        VALUES ('Default Provider', 'default@provider.com', '0000000000', 'active')
        RETURNING id INTO default_provider_id;
    END IF;
    
    -- Update all invoices to use the default provider
    UPDATE invoices SET provider_id = default_provider_id WHERE provider_id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT assign_default_provider();

-- Drop the temporary function
DROP FUNCTION assign_default_provider();

-- Make provider_id NOT NULL since we've ensured all rows have a value
ALTER TABLE invoices ALTER COLUMN provider_id SET NOT NULL;

-- Drop the foreign key constraint to client_id
ALTER TABLE invoices DROP CONSTRAINT invoices_client_id_fkey;

-- Drop the client_id column
ALTER TABLE invoices DROP COLUMN client_id;

-- Drop the old index if it exists
DROP INDEX IF EXISTS idx_invoices_client;

-- Create a new index for provider_id
CREATE INDEX idx_invoices_provider ON invoices(provider_id);

-- Add a comment to explain the change
COMMENT ON COLUMN invoices.provider_id IS 'The provider that issued this invoice, replacing the previous client_id field'; 