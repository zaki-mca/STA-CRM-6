-- Add expected_delivery field to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS expected_delivery DATE;

-- Update existing orders to have a default expected_delivery date (7 days after order_date)
UPDATE orders
SET expected_delivery = order_date + INTERVAL '7 days'
WHERE expected_delivery IS NULL; 