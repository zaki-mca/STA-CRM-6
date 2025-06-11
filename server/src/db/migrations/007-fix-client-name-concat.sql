-- Migration to fix client name concatenation issues
-- Make sure name field can accept NULL values during insert operations
ALTER TABLE clients
  ALTER COLUMN name DROP NOT NULL;

-- Make sure all fields used in concatenation are properly handled
-- Update existing records to ensure name is properly set
UPDATE clients
SET name = CONCAT(
  COALESCE(gender, ''),
  CASE WHEN gender IS NOT NULL AND gender != '' THEN ' ' ELSE '' END,
  COALESCE(first_name, ''),
  CASE WHEN first_name IS NOT NULL AND first_name != '' AND last_name IS NOT NULL AND last_name != '' THEN ' ' ELSE '' END,
  COALESCE(last_name, '')
)
WHERE first_name IS NOT NULL OR last_name IS NOT NULL;

-- Add a trigger to automatically update name when first_name, last_name or gender changes
CREATE OR REPLACE FUNCTION update_client_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name = CONCAT(
    COALESCE(NEW.gender, ''),
    CASE WHEN NEW.gender IS NOT NULL AND NEW.gender != '' THEN ' ' ELSE '' END,
    COALESCE(NEW.first_name, ''),
    CASE WHEN NEW.first_name IS NOT NULL AND NEW.first_name != '' AND NEW.last_name IS NOT NULL AND NEW.last_name != '' THEN ' ' ELSE '' END,
    COALESCE(NEW.last_name, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it already exists
DROP TRIGGER IF EXISTS update_client_name_trigger ON clients;

-- Create the trigger
CREATE TRIGGER update_client_name_trigger
BEFORE INSERT OR UPDATE OF gender, first_name, last_name
ON clients
FOR EACH ROW
EXECUTE FUNCTION update_client_name(); 