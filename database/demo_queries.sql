-- ============================================================
-- VEHICLE SERVICE HISTORY MANAGEMENT SYSTEM
-- Viva Demonstration Queries
-- Database: vehicle_service_db | PostgreSQL
-- ============================================================

-- 1. List all public tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Multi-table JOIN: Complete Service Overview
SELECT
    c.name AS customer_name,
    v.registration_no,
    v.brand,
    v.model,
    b.service_type,
    b.booking_date,
    s.service_date,
    s.description,
    m.name AS mechanic_name,
    s.total_cost
FROM customers c
JOIN vehicles v ON c.customer_id = v.customer_id
JOIN service_bookings b ON v.vehicle_id = b.vehicle_id
JOIN service_records s ON b.booking_id = s.booking_id
JOIN mechanics m ON s.mechanic_id = m.mechanic_id
ORDER BY s.service_date DESC;

-- 3. Stored Function Execution: Search History by Registration Number
SELECT * FROM get_vehicle_service_history('TS09AB1234');

-- 4. View Query: Querying service_history_view
SELECT * FROM service_history_view WHERE registration_no = 'TS09AB1234';

-- 5. Low Stock Parts Query (Threshold < 20)
SELECT part_id, part_name, stock_quantity, price
FROM spare_parts
WHERE stock_quantity < 20
ORDER BY stock_quantity ASC;

-- 6. Parts Usage Analysis (JOIN + SUM + GROUP BY)
SELECT
    sp.part_id,
    sp.part_name,
    SUM(pu.quantity) AS total_quantity_used,
    sp.price,
    SUM(pu.quantity * sp.price) AS total_parts_revenue
FROM parts_used pu
JOIN spare_parts sp ON pu.part_id = sp.part_id
GROUP BY sp.part_id, sp.part_name, sp.price
ORDER BY total_quantity_used DESC;

-- 7. Service Statistics (Aggregations: COUNT, SUM, AVG, MIN, MAX)
SELECT
    COUNT(*) AS total_services_completed,
    SUM(labour_cost + parts_cost) AS total_revenue,
    ROUND(AVG(labour_cost + parts_cost), 2) AS avg_service_cost,
    MIN(labour_cost + parts_cost) AS min_service_cost,
    MAX(labour_cost + parts_cost) AS max_service_cost
FROM service_records;

-- 8. Revenue & Service Breakdown by Service Type (GROUP BY)
SELECT
    b.service_type,
    COUNT(s.service_id) AS service_count,
    SUM(s.total_cost) AS total_type_revenue,
    ROUND(AVG(s.total_cost), 2) AS avg_type_cost
FROM service_bookings b
JOIN service_records s ON b.booking_id = s.booking_id
GROUP BY b.service_type
ORDER BY total_type_revenue DESC;

-- 9. Complete Invoice Summary with GST
SELECT
    i.invoice_id,
    c.name AS customer_name,
    v.registration_no,
    s.service_date,
    s.labour_cost,
    s.parts_cost,
    s.total_cost,
    i.gst,
    i.grand_total
FROM invoices i
JOIN service_records s ON i.service_id = s.service_id
JOIN service_bookings b ON s.booking_id = b.booking_id
JOIN vehicles v ON b.vehicle_id = v.vehicle_id
JOIN customers c ON v.customer_id = c.customer_id;
