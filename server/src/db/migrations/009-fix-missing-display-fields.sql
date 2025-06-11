-- Migration to ensure all required display fields are properly set up

-- Make sure professional domains have payment codes
UPDATE professional_domains
SET payment_code = 'CODE-' || id::text
WHERE payment_code IS NULL OR payment_code = '';

-- Make sure all clients have birth_date for age calculation
UPDATE clients
SET birth_date = '1990-01-01'
WHERE birth_date IS NULL;

-- Make sure all products have sell_price and buy_price
UPDATE products
SET 
  sell_price = price,
  buy_price = price * 0.7
WHERE sell_price IS NULL OR sell_price = 0;

-- Make sure all providers have phone numbers
UPDATE providers
SET phone = '000-000-0000'
WHERE phone IS NULL OR phone = '';

-- Add default phone numbers for clients that don't have one
UPDATE clients
SET phone = '000-000-0000'
WHERE phone IS NULL OR phone = ''; 