-- ============================================================
-- VEHICLE SERVICE HISTORY MANAGEMENT SYSTEM
-- Database Views and Stored Functions
-- Database: vehicle_service_db | PostgreSQL
-- ============================================================

-- 1. Service History View
-- Multi-table JOIN combining Customer, Vehicle, Booking, Record, Mechanic, and Invoice details
CREATE OR REPLACE VIEW service_history_view AS
SELECT 
    c.name AS customer_name,
    c.phone AS customer_phone,
    v.registration_no,
    v.brand,
    v.model,
    b.service_type,
    b.booking_date,
    s.service_id,
    s.service_date,
    s.odometer_reading,
    s.description AS service_description,
    m.name AS mechanic_name,
    s.labour_cost,
    s.parts_cost,
    s.total_cost,
    i.invoice_id,
    i.gst,
    i.grand_total
FROM customers c
JOIN vehicles v ON c.customer_id = v.customer_id
JOIN service_bookings b ON v.vehicle_id = b.vehicle_id
JOIN service_records s ON b.booking_id = s.booking_id
JOIN mechanics m ON s.mechanic_id = m.mechanic_id
LEFT JOIN invoices i ON s.service_id = i.service_id;

-- 2. Stored Function: get_vehicle_service_history
-- Takes vehicle registration number as input and returns complete service history timeline
CREATE OR REPLACE FUNCTION get_vehicle_service_history(reg_no VARCHAR)
RETURNS TABLE (
    customer_name VARCHAR,
    registration_no VARCHAR,
    vehicle_brand VARCHAR,
    vehicle_model VARCHAR,
    service_type VARCHAR,
    service_date DATE,
    mechanic_name VARCHAR,
    description TEXT,
    total_cost NUMERIC
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.name AS customer_name,
        v.registration_no,
        v.brand AS vehicle_brand,
        v.model AS vehicle_model,
        b.service_type,
        s.service_date,
        m.name AS mechanic_name,
        s.description,
        s.total_cost
    FROM customers c
    JOIN vehicles v ON c.customer_id = v.customer_id
    JOIN service_bookings b ON v.vehicle_id = b.vehicle_id
    JOIN service_records s ON b.booking_id = s.booking_id
    JOIN mechanics m ON s.mechanic_id = m.mechanic_id
    WHERE LOWER(v.registration_no) = LOWER(reg_no)
    ORDER BY s.service_date DESC;
END;
$$;
