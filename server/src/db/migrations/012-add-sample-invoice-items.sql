-- Migration: Add sample invoice items
-- This migration adds sample items to existing invoices that don't have any items

-- First, check if we have invoices without items
DO $$
DECLARE
    invoice_count INTEGER;
    items_count INTEGER;
    invoice_record RECORD;
BEGIN
    -- Get count of invoices and items
    SELECT COUNT(*) INTO invoice_count FROM invoices;
    SELECT COUNT(*) INTO items_count FROM invoice_items;
    
    RAISE NOTICE 'Found % invoices and % invoice items', invoice_count, items_count;
    
    -- Only proceed if we have invoices but no items
    IF invoice_count > 0 AND items_count = 0 THEN
        RAISE NOTICE 'Adding sample invoice items to existing invoices';
        
        -- Loop through each invoice
        FOR invoice_record IN SELECT id FROM invoices LOOP
            -- Add 2-3 random products to each invoice
            INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, discount)
            SELECT 
                invoice_record.id,
                p.id,
                FLOOR(RANDOM() * 5) + 1, -- Random quantity between 1 and 5
                p.price,
                FLOOR(RANDOM() * 10) -- Random discount between 0 and 10 percent
            FROM products p
            ORDER BY RANDOM()
            LIMIT FLOOR(RANDOM() * 2) + 2; -- Add 2-3 products per invoice
        END LOOP;
        
        RAISE NOTICE 'Added sample invoice items successfully';
    ELSE
        RAISE NOTICE 'No need to add sample invoice items (invoices: %, items: %)', invoice_count, items_count;
    END IF;
END $$; 