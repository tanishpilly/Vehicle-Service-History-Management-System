-- ============================================================
-- VEHICLE SERVICE HISTORY MANAGEMENT SYSTEM
-- Database Triggers and Trigger Functions
-- Database: vehicle_service_db | PostgreSQL
-- ============================================================

-- 1. Trigger Function: update_spare_part_stock
-- Automatically checks stock before deduction and reduces spare parts inventory.
CREATE OR REPLACE FUNCTION update_spare_part_stock()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
DECLARE
    current_stock INTEGER;
BEGIN
    -- Check available stock for the spare part
    SELECT stock_quantity INTO current_stock
    FROM spare_parts
    WHERE part_id = NEW.part_id;

    IF current_stock IS NULL THEN
        RAISE EXCEPTION 'Spare part ID % does not exist.', NEW.part_id;
    END IF;

    IF current_stock < NEW.quantity THEN
        RAISE EXCEPTION 'Insufficient stock for part ID %: Requested %, Available %', 
            NEW.part_id, NEW.quantity, current_stock;
    END IF;

    -- Deduct used quantity from inventory stock
    UPDATE spare_parts
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE part_id = NEW.part_id;

    RETURN NEW;
END;
$$;

-- 2. Trigger: trg_update_spare_part_stock
-- Triggers AFTER INSERT on parts_used table
DROP TRIGGER IF EXISTS trg_update_spare_part_stock ON parts_used;

CREATE TRIGGER trg_update_spare_part_stock
AFTER INSERT ON parts_used
FOR EACH ROW
EXECUTE FUNCTION update_spare_part_stock();
