-- ============================================================
-- VEHICLE SERVICE HISTORY MANAGEMENT SYSTEM
-- Complete Consolidated Production Database Migration
-- Target: Cloud PostgreSQL (Neon / Supabase / Aiven / Railway)
-- Preserves: 8 Original Tables + Auth + Appointments + Views + Functions + Triggers + Seed Data
-- ============================================================

-- ============================================================
-- 1. DDL: CORE TABLES & CONSTRAINTS
-- ============================================================
-- ============================================================
-- VEHICLE SERVICE HISTORY MANAGEMENT SYSTEM
-- Database Schema Definition (DDL)
-- Database: vehicle_service_db | PostgreSQL
-- ============================================================

-- 1. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    customer_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(100),
    address TEXT
);

-- 2. Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    registration_no VARCHAR(20) NOT NULL UNIQUE,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    manufacturing_year INTEGER CHECK (manufacturing_year >= 1900 AND manufacturing_year <= 2100),
    fuel_type VARCHAR(20),
    mileage INTEGER DEFAULT 0 CHECK (mileage >= 0)
);

-- 3. Mechanics Table
CREATE TABLE IF NOT EXISTS mechanics (
    mechanic_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    specialization VARCHAR(100),
    experience_years INTEGER DEFAULT 0 CHECK (experience_years >= 0)
);

-- 4. Service Bookings Table
CREATE TABLE IF NOT EXISTS service_bookings (
    booking_id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    problem_description TEXT,
    service_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled'))
);

-- 5. Service Records Table
CREATE TABLE IF NOT EXISTS service_records (
    service_id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES service_bookings(booking_id) ON DELETE CASCADE,
    mechanic_id INTEGER NOT NULL REFERENCES mechanics(mechanic_id),
    service_date DATE NOT NULL,
    odometer_reading INTEGER CHECK (odometer_reading >= 0),
    description TEXT,
    labour_cost NUMERIC(10, 2) DEFAULT 0 CHECK (labour_cost >= 0),
    parts_cost NUMERIC(10, 2) DEFAULT 0 CHECK (parts_cost >= 0),
    total_cost NUMERIC(10, 2) DEFAULT 0 CHECK (total_cost >= 0)
);

-- 6. Spare Parts Table
CREATE TABLE IF NOT EXISTS spare_parts (
    part_id SERIAL PRIMARY KEY,
    part_name VARCHAR(100) NOT NULL,
    stock_quantity INTEGER DEFAULT 0 CONSTRAINT chk_stock CHECK (stock_quantity >= 0),
    price NUMERIC(10, 2) NOT NULL CONSTRAINT chk_part_price CHECK (price >= 0)
);

-- 7. Parts Used Table (Junction Table for M:M relationship)
CREATE TABLE IF NOT EXISTS parts_used (
    service_id INTEGER NOT NULL REFERENCES service_records(service_id) ON DELETE CASCADE,
    part_id INTEGER NOT NULL REFERENCES spare_parts(part_id),
    quantity INTEGER NOT NULL CONSTRAINT chk_quantity CHECK (quantity > 0),
    PRIMARY KEY (service_id, part_id)
);

-- 8. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    invoice_id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL UNIQUE REFERENCES service_records(service_id) ON DELETE CASCADE,
    invoice_date DATE DEFAULT CURRENT_DATE,
    gst NUMERIC(10, 2) DEFAULT 0 CHECK (gst >= 0),
    grand_total NUMERIC(10, 2) NOT NULL CHECK (grand_total >= 0)
);

-- Create Indexes for performance on frequently searched columns
CREATE INDEX IF NOT EXISTS idx_vehicles_registration ON vehicles(registration_no);
CREATE INDEX IF NOT EXISTS idx_vehicles_customer ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle ON service_bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON service_bookings(status);
CREATE INDEX IF NOT EXISTS idx_records_booking ON service_records(booking_id);
CREATE INDEX IF NOT EXISTS idx_records_mechanic ON service_records(mechanic_id);


-- ============================================================
-- 2. DDL: AUTHENTICATION USERS TABLE
-- ============================================================
-- ============================================================
-- VEHICLE SERVICE HISTORY MANAGEMENT SYSTEM
-- Authentication Database Extension
-- Database: vehicle_service_db | PostgreSQL
-- ============================================================

-- Create Users Table for Authentication & Role-Based Access Control
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'service_center')),
    customer_id INTEGER REFERENCES customers(customer_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for authentication lookup performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_customer ON users(customer_id);


-- ============================================================
-- 3. DDL: APPOINTMENTS, PICKUP REQUESTS & NOTIFICATIONS
-- ============================================================
-- ============================================================
-- VEHICLE SERVICE HISTORY MANAGEMENT SYSTEM
-- Appointment, Vehicle Pickup, Insurance & Notification Extension
-- Database: vehicle_service_db | PostgreSQL
-- ============================================================

-- 1. Safely add columns to existing service_bookings table
ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS preferred_time_slot VARCHAR(50) DEFAULT 'Morning (9:00 AM - 12:00 PM)';
ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS odometer_reading INTEGER;
ALTER TABLE service_bookings ADD COLUMN IF NOT EXISTS pickup_required BOOLEAN DEFAULT FALSE;

-- 2. Dedicated Pickup Requests Table
CREATE TABLE IF NOT EXISTS pickup_requests (
    pickup_id SERIAL PRIMARY KEY,
    booking_id INTEGER UNIQUE NOT NULL REFERENCES service_bookings(booking_id) ON DELETE CASCADE,
    flat_building VARCHAR(150),
    street VARCHAR(150),
    area VARCHAR(150),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    full_address TEXT NOT NULL,
    instructions TEXT,
    pickup_status VARCHAR(30) DEFAULT 'Requested' CHECK (pickup_status IN ('Requested', 'Accepted', 'Pickup Scheduled', 'Picked Up', 'Rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Dedicated Insurance Documents Table
CREATE TABLE IF NOT EXISTS insurance_documents (
    document_id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES service_bookings(booking_id) ON DELETE CASCADE,
    customer_id INTEGER NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Dedicated Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    recipient_role VARCHAR(20) DEFAULT 'service_center',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    booking_id INTEGER REFERENCES service_bookings(booking_id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pickup_booking ON pickup_requests(booking_id);
CREATE INDEX IF NOT EXISTS idx_pickup_status ON pickup_requests(pickup_status);
CREATE INDEX IF NOT EXISTS idx_insurance_booking ON insurance_documents(booking_id);
CREATE INDEX IF NOT EXISTS idx_insurance_customer ON insurance_documents(customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_role ON notifications(recipient_role);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);


-- ============================================================
-- 4. VIEWS & STORED FUNCTIONS
-- ============================================================
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


-- ============================================================
-- 5. TRIGGERS & INVENTORY STOCK MANAGEMENT
-- ============================================================
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


-- ============================================================
-- 6. PRODUCTION SEED DATA
-- ============================================================

-- Seed Data: customers
INSERT INTO customers (customer_id, name, phone, email, address) VALUES (1, 'Rahul Sharma', '9876543210', 'rahul.sharma@gmail.com', 'Hyderabad') ON CONFLICT DO NOTHING;
INSERT INTO customers (customer_id, name, phone, email, address) VALUES (2, 'Priya Reddy', '9876543211', 'priya.reddy@gmail.com', 'Secunderabad') ON CONFLICT DO NOTHING;
INSERT INTO customers (customer_id, name, phone, email, address) VALUES (3, 'Arjun Kumar', '9876543212', 'arjun.kumar@gmail.com', 'Kompally') ON CONFLICT DO NOTHING;
INSERT INTO customers (customer_id, name, phone, email, address) VALUES (4, 'Sneha Rao', '9876543213', 'sneha.rao@gmail.com', 'Begumpet') ON CONFLICT DO NOTHING;
INSERT INTO customers (customer_id, name, phone, email, address) VALUES (5, 'Vikram Singh', '9876543214', 'vikram.singh@gmail.com', 'Sainikpuri') ON CONFLICT DO NOTHING;
INSERT INTO customers (customer_id, name, phone, email, address) VALUES (8, 'G Manikanta', '9554433221', 'manikanta@test.com', 'Vijayawada') ON CONFLICT DO NOTHING;
INSERT INTO customers (customer_id, name, phone, email, address) VALUES (7, 'Tanish Pilly', '9392007939', 'tanishpilly@gmail.com', 'KL University Campus') ON CONFLICT DO NOTHING;
INSERT INTO customers (customer_id, name, phone, email, address) VALUES (6, 'Eshwar Siddhartha', '9988776655', 'es@test.com', 'KL University') ON CONFLICT DO NOTHING;
INSERT INTO customers (customer_id, name, phone, email, address) VALUES (9, 'Test Customer', '999886604', 'testuser_6604@example.com', '123 Test Street') ON CONFLICT DO NOTHING;
INSERT INTO customers (customer_id, name, phone, email, address) VALUES (10, 'Test Customer', '999887253', 'testuser_7253@example.com', '123 Test Street') ON CONFLICT DO NOTHING;
INSERT INTO customers (customer_id, name, phone, email, address) VALUES (11, 'Tanish Pilly', '988773961', 'pickup_user_3961@example.com', 'Flat 402, ABC Apartments, Kukatpally') ON CONFLICT DO NOTHING;
SELECT setval(pg_get_serial_sequence('customers', 'customer_id'), COALESCE((SELECT MAX(customer_id) FROM customers), 1), true);

-- Seed Data: vehicles
INSERT INTO vehicles (vehicle_id, customer_id, registration_no, brand, model, manufacturing_year, fuel_type, mileage) VALUES (1, 1, 'TS09AB1234', 'Mahindra', 'Thar', 2022, 'Diesel', 42000) ON CONFLICT DO NOTHING;
INSERT INTO vehicles (vehicle_id, customer_id, registration_no, brand, model, manufacturing_year, fuel_type, mileage) VALUES (2, 2, 'TS10CD5678', 'Hyundai', 'Creta', 2023, 'Petrol', 28000) ON CONFLICT DO NOTHING;
INSERT INTO vehicles (vehicle_id, customer_id, registration_no, brand, model, manufacturing_year, fuel_type, mileage) VALUES (3, 3, 'TS08EF9012', 'Toyota', 'Fortuner', 2021, 'Diesel', 56000) ON CONFLICT DO NOTHING;
INSERT INTO vehicles (vehicle_id, customer_id, registration_no, brand, model, manufacturing_year, fuel_type, mileage) VALUES (4, 4, 'TS11GH3456', 'Tata', 'Nexon', 2024, 'Petrol', 12000) ON CONFLICT DO NOTHING;
INSERT INTO vehicles (vehicle_id, customer_id, registration_no, brand, model, manufacturing_year, fuel_type, mileage) VALUES (5, 5, 'TS09IJ7890', 'Honda', 'City', 2020, 'Petrol', 68000) ON CONFLICT DO NOTHING;
INSERT INTO vehicles (vehicle_id, customer_id, registration_no, brand, model, manufacturing_year, fuel_type, mileage) VALUES (8, 8, 'TS12GM9999', 'Hyundai', 'Verna', 2024, 'Petrol', 5000) ON CONFLICT DO NOTHING;
INSERT INTO vehicles (vehicle_id, customer_id, registration_no, brand, model, manufacturing_year, fuel_type, mileage) VALUES (9, 7, 'TG07B8999', 'Mahindra', 'Thar Roxx', 2025, 'Diesel', 30500) ON CONFLICT DO NOTHING;
INSERT INTO vehicles (vehicle_id, customer_id, registration_no, brand, model, manufacturing_year, fuel_type, mileage) VALUES (7, 7, 'TG13C9830', 'Mahindra', 'XUV700', 2025, 'Diesel', 29500) ON CONFLICT DO NOTHING;
INSERT INTO vehicles (vehicle_id, customer_id, registration_no, brand, model, manufacturing_year, fuel_type, mileage) VALUES (6, 6, 'TS07VIVA2026', 'Tata', 'Harrier', 2024, 'Diesel', 45000) ON CONFLICT DO NOTHING;
INSERT INTO vehicles (vehicle_id, customer_id, registration_no, brand, model, manufacturing_year, fuel_type, mileage) VALUES (10, 9, 'TS10EX6604', 'Honda', 'City', 2023, 'Petrol', 12000) ON CONFLICT DO NOTHING;
INSERT INTO vehicles (vehicle_id, customer_id, registration_no, brand, model, manufacturing_year, fuel_type, mileage) VALUES (11, 10, 'TS10EX7253', 'Honda', 'City', 2023, 'Petrol', 12500) ON CONFLICT DO NOTHING;
INSERT INTO vehicles (vehicle_id, customer_id, registration_no, brand, model, manufacturing_year, fuel_type, mileage) VALUES (12, 11, 'TS09THAR3961', 'Mahindra', 'Thar ROXX', 2024, 'Diesel', 8600) ON CONFLICT DO NOTHING;
SELECT setval(pg_get_serial_sequence('vehicles', 'vehicle_id'), COALESCE((SELECT MAX(vehicle_id) FROM vehicles), 1), true);

-- Seed Data: mechanics
INSERT INTO mechanics (mechanic_id, name, phone, specialization, experience_years) VALUES (1, 'Ramesh Kumar', '9000011111', 'Engine and General Service', 8) ON CONFLICT DO NOTHING;
INSERT INTO mechanics (mechanic_id, name, phone, specialization, experience_years) VALUES (2, 'Suresh Rao', '9000011112', 'Brakes and Suspension', 6) ON CONFLICT DO NOTHING;
INSERT INTO mechanics (mechanic_id, name, phone, specialization, experience_years) VALUES (3, 'Imran Khan', '9000011113', 'Electrical Systems', 5) ON CONFLICT DO NOTHING;
INSERT INTO mechanics (mechanic_id, name, phone, specialization, experience_years) VALUES (4, 'Vijay Sharma', '9000011114', 'AC and Cooling Systems', 7) ON CONFLICT DO NOTHING;
INSERT INTO mechanics (mechanic_id, name, phone, specialization, experience_years) VALUES (5, 'Naveen Reddy', '9000011115', 'Transmission and Clutch', 9) ON CONFLICT DO NOTHING;
INSERT INTO mechanics (mechanic_id, name, phone, specialization, experience_years) VALUES (6, 'Gaurav Kumar', '9080706055', 'Service Expert', 10) ON CONFLICT DO NOTHING;
SELECT setval(pg_get_serial_sequence('mechanics', 'mechanic_id'), COALESCE((SELECT MAX(mechanic_id) FROM mechanics), 1), true);

-- Seed Data: spare_parts
INSERT INTO spare_parts (part_id, part_name, stock_quantity, price) VALUES (5, 'Air Filter', 25, '700.00') ON CONFLICT DO NOTHING;
INSERT INTO spare_parts (part_id, part_name, stock_quantity, price) VALUES (6, 'Car Battery', 15, '6500.00') ON CONFLICT DO NOTHING;
INSERT INTO spare_parts (part_id, part_name, stock_quantity, price) VALUES (4, 'AC Refrigerant Gas', 24, '1800.00') ON CONFLICT DO NOTHING;
INSERT INTO spare_parts (part_id, part_name, stock_quantity, price) VALUES (8, 'Clutch Plate', 9, '8500.00') ON CONFLICT DO NOTHING;
INSERT INTO spare_parts (part_id, part_name, stock_quantity, price) VALUES (2, 'Oil Filter', 28, '450.00') ON CONFLICT DO NOTHING;
INSERT INTO spare_parts (part_id, part_name, stock_quantity, price) VALUES (3, 'Front Brake Pads', 99, '4500.00') ON CONFLICT DO NOTHING;
INSERT INTO spare_parts (part_id, part_name, stock_quantity, price) VALUES (7, 'Brake Fluid', 38, '500.00') ON CONFLICT DO NOTHING;
INSERT INTO spare_parts (part_id, part_name, stock_quantity, price) VALUES (1, 'Engine Oil 5W-30', 45, '1200.00') ON CONFLICT DO NOTHING;
SELECT setval(pg_get_serial_sequence('spare_parts', 'part_id'), COALESCE((SELECT MAX(part_id) FROM spare_parts), 1), true);

-- Seed Data: users
INSERT INTO users (user_id, username, email, password_hash, role, customer_id, created_at) VALUES (1, 'admin', 'admin@servicecenter.com', '$2b$10$tiNjGU1fGxZMYBtHHsucR.sf57Vi.5C3xvlj7.Pzi4WzX32YTJgVm', 'service_center', NULL, '2026-10-02') ON CONFLICT DO NOTHING;
INSERT INTO users (user_id, username, email, password_hash, role, customer_id, created_at) VALUES (2, 'rahul', 'rahul.sharma@gmail.com', '$2b$10$EicbyRF0v2d/w/y46HmRveZ8zJlLn8Opob4SrrHsSgkPJN.Yo0AbK', 'customer', 1, '2026-10-02') ON CONFLICT DO NOTHING;
INSERT INTO users (user_id, username, email, password_hash, role, customer_id, created_at) VALUES (3, 'priya', 'priya.reddy@gmail.com', '$2b$10$wKbvPBuBogLnDwcgzX9xjuTOW/Pfm.2taBMUTb3SA.nqqF.alKkTm', 'customer', 2, '2026-10-02') ON CONFLICT DO NOTHING;
INSERT INTO users (user_id, username, email, password_hash, role, customer_id, created_at) VALUES (4, 'arjun', 'arjun.kumar@gmail.com', '$2b$10$9er9lBwGXOWVoDP/EbocA.u2KpnnIhY8WMUEC.nSwlLYipEhD4FWC', 'customer', 3, '2026-10-02') ON CONFLICT DO NOTHING;
INSERT INTO users (user_id, username, email, password_hash, role, customer_id, created_at) VALUES (5, 'sneha', 'sneha.rao@gmail.com', '$2b$10$lJzKPHOyuzZjrRW0lNKbOOwo9cbHo3UYKk2P60LfKcdctRKUBPGLi', 'customer', 4, '2026-10-02') ON CONFLICT DO NOTHING;
INSERT INTO users (user_id, username, email, password_hash, role, customer_id, created_at) VALUES (6, 'vikram', 'vikram.singh@gmail.com', '$2b$10$pHwBKH73Sxv932yz4Zyd1OFw7O1R5kjr5eBO7VKONBlQv6Txfjiiy', 'customer', 5, '2026-10-02') ON CONFLICT DO NOTHING;
INSERT INTO users (user_id, username, email, password_hash, role, customer_id, created_at) VALUES (7, 'g', 'manikanta@test.com', '$2b$10$/pHv5xUqTYKykbtwAJ..3.0c9CCSmk1TD53yeXyHHo2FX3hSLvSee', 'customer', 8, '2026-10-02') ON CONFLICT DO NOTHING;
INSERT INTO users (user_id, username, email, password_hash, role, customer_id, created_at) VALUES (8, 'tanish', 'tanishpilly@gmail.com', '$2b$10$zA4qAdyFdlClpogm6POV4OyXx3BDKIrug7Zbah7FZlIklgqmnZypm', 'customer', 7, '2026-10-02') ON CONFLICT DO NOTHING;
INSERT INTO users (user_id, username, email, password_hash, role, customer_id, created_at) VALUES (9, 'eshwar', 'es@test.com', '$2b$10$1gNIYN/BTh0tz9ZMcATfkOHfIDvESC.5yrQMCPnkOpVXMnzrMr0/i', 'customer', 6, '2026-10-02') ON CONFLICT DO NOTHING;
INSERT INTO users (user_id, username, email, password_hash, role, customer_id, created_at) VALUES (10, 'testuser_6604', 'testuser_6604@example.com', '$2b$10$Q5p5CICHK1Vr/LYLee0kUuuayTWRbOvZquvBWDO4Q9qAzqznlPJGC', 'customer', 9, '2026-10-02') ON CONFLICT DO NOTHING;
INSERT INTO users (user_id, username, email, password_hash, role, customer_id, created_at) VALUES (11, 'testuser_7253', 'testuser_7253@example.com', '$2b$10$nebn0CHtduoCK0R7jm.u4uJJu5sZljJI.738kzLwPUbh8yMKz59gi', 'customer', 10, '2026-10-02') ON CONFLICT DO NOTHING;
INSERT INTO users (user_id, username, email, password_hash, role, customer_id, created_at) VALUES (12, 'pickup_user_3961', 'pickup_user_3961@example.com', '$2b$10$0oa.kTKEQ/rXQnM02YHm1OkvRPnzb2O5cBdKQb/LSx8wxO5gZDg3K', 'customer', 11, '2026-10-06') ON CONFLICT DO NOTHING;
SELECT setval(pg_get_serial_sequence('users', 'user_id'), COALESCE((SELECT MAX(user_id) FROM users), 1), true);

-- Seed Data: service_bookings
INSERT INTO service_bookings (booking_id, vehicle_id, booking_date, problem_description, service_type, status, preferred_time_slot, odometer_reading, pickup_required) VALUES (1, 1, '2026-07-31', 'Engine oil change and general inspection', 'Periodic Service', 'Completed', 'Morning (9:00 AM - 12:00 PM)', NULL, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO service_bookings (booking_id, vehicle_id, booking_date, problem_description, service_type, status, preferred_time_slot, odometer_reading, pickup_required) VALUES (2, 2, '2026-08-02', 'Brake noise while driving', 'Brake Service', 'Completed', 'Morning (9:00 AM - 12:00 PM)', NULL, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO service_bookings (booking_id, vehicle_id, booking_date, problem_description, service_type, status, preferred_time_slot, odometer_reading, pickup_required) VALUES (3, 3, '2026-08-04', 'AC cooling is not effective', 'AC Service', 'Completed', 'Morning (9:00 AM - 12:00 PM)', NULL, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO service_bookings (booking_id, vehicle_id, booking_date, problem_description, service_type, status, preferred_time_slot, odometer_reading, pickup_required) VALUES (4, 4, '2026-08-09', 'Regular maintenance and oil replacement', 'Periodic Service', 'In Progress', 'Morning (9:00 AM - 12:00 PM)', NULL, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO service_bookings (booking_id, vehicle_id, booking_date, problem_description, service_type, status, preferred_time_slot, odometer_reading, pickup_required) VALUES (6, 1, '2026-08-14', 'Wheel alignment and suspension check', 'General Service', 'Pending', 'Morning (9:00 AM - 12:00 PM)', NULL, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO service_bookings (booking_id, vehicle_id, booking_date, problem_description, service_type, status, preferred_time_slot, odometer_reading, pickup_required) VALUES (7, 2, '2026-08-17', 'Battery inspection and electrical check', 'Electrical Service', 'Pending', 'Morning (9:00 AM - 12:00 PM)', NULL, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO service_bookings (booking_id, vehicle_id, booking_date, problem_description, service_type, status, preferred_time_slot, odometer_reading, pickup_required) VALUES (8, 3, '2026-08-19', 'Transmission oil replacement', 'Transmission Service', 'Pending', 'Morning (9:00 AM - 12:00 PM)', NULL, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO service_bookings (booking_id, vehicle_id, booking_date, problem_description, service_type, status, preferred_time_slot, odometer_reading, pickup_required) VALUES (5, 5, '2026-08-11', 'Clutch feels hard while shifting gears', 'Clutch Service', 'Completed', 'Morning (9:00 AM - 12:00 PM)', NULL, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO service_bookings (booking_id, vehicle_id, booking_date, problem_description, service_type, status, preferred_time_slot, odometer_reading, pickup_required) VALUES (10, 7, '2026-09-17', 'First periodic checkup and filter change', 'Periodic Service', 'Completed', 'Morning (9:00 AM - 12:00 PM)', NULL, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO service_bookings (booking_id, vehicle_id, booking_date, problem_description, service_type, status, preferred_time_slot, odometer_reading, pickup_required) VALUES (9, 6, '2026-09-17', 'Engine tuning and brake pad replacement', 'General Service', 'Completed', 'Morning (9:00 AM - 12:00 PM)', NULL, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO service_bookings (booking_id, vehicle_id, booking_date, problem_description, service_type, status, preferred_time_slot, odometer_reading, pickup_required) VALUES (11, 8, '2026-09-17', 'AC cooling check and cabin filter replacement', 'AC Maintenance', 'Completed', 'Morning (9:00 AM - 12:00 PM)', NULL, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO service_bookings (booking_id, vehicle_id, booking_date, problem_description, service_type, status, preferred_time_slot, odometer_reading, pickup_required) VALUES (12, 6, '2026-09-22', 'it met with an accident', 'Periodic Service', 'Pending', 'Morning (9:00 AM - 12:00 PM)', NULL, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO service_bookings (booking_id, vehicle_id, booking_date, problem_description, service_type, status, preferred_time_slot, odometer_reading, pickup_required) VALUES (13, 10, '2026-10-01', 'Engine noise during high speeds', 'Full Comprehensive Inspection', 'Pending', 'Morning (9:00 AM - 12:00 PM)', NULL, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO service_bookings (booking_id, vehicle_id, booking_date, problem_description, service_type, status, preferred_time_slot, odometer_reading, pickup_required) VALUES (14, 11, '2026-10-01', 'Engine noise during high speeds', 'Full Comprehensive Inspection', 'Completed', 'Morning (9:00 AM - 12:00 PM)', NULL, FALSE) ON CONFLICT DO NOTHING;
INSERT INTO service_bookings (booking_id, vehicle_id, booking_date, problem_description, service_type, status, preferred_time_slot, odometer_reading, pickup_required) VALUES (15, 12, '2026-10-09', 'Engine oil service & brake pads checkup', 'Periodic Service', 'Completed', 'Morning (9:00 AM - 12:00 PM)', 8600, TRUE) ON CONFLICT DO NOTHING;
SELECT setval(pg_get_serial_sequence('service_bookings', 'booking_id'), COALESCE((SELECT MAX(booking_id) FROM service_bookings), 1), true);

-- Seed Data: service_records
INSERT INTO service_records (service_id, booking_id, mechanic_id, service_date, odometer_reading, description, labour_cost, parts_cost, total_cost) VALUES (1, 1, 1, '2026-07-31', 42000, 'Engine oil replaced, oil filter replaced and complete vehicle inspection performed', '800.00', '3500.00', '4300.00') ON CONFLICT DO NOTHING;
INSERT INTO service_records (service_id, booking_id, mechanic_id, service_date, odometer_reading, description, labour_cost, parts_cost, total_cost) VALUES (2, 2, 2, '2026-08-02', 28000, 'Front brake pads inspected and replaced, brake system checked', '1000.00', '4500.00', '5500.00') ON CONFLICT DO NOTHING;
INSERT INTO service_records (service_id, booking_id, mechanic_id, service_date, odometer_reading, description, labour_cost, parts_cost, total_cost) VALUES (3, 3, 4, '2026-08-04', 56000, 'AC gas checked and refilled, cooling system inspected', '700.00', '2200.00', '2900.00') ON CONFLICT DO NOTHING;
INSERT INTO service_records (service_id, booking_id, mechanic_id, service_date, odometer_reading, description, labour_cost, parts_cost, total_cost) VALUES (4, 5, 5, '2026-08-23', 68000, 'Clutch plate inspected and replaced, clutch system adjusted and tested', '1500.00', '8500.00', '10000.00') ON CONFLICT DO NOTHING;
INSERT INTO service_records (service_id, booking_id, mechanic_id, service_date, odometer_reading, description, labour_cost, parts_cost, total_cost) VALUES (6, 10, 2, '2026-09-17', 9000, 'Engine oil and oil filter replaced successfully', '1500.00', '1650.00', '3150.00') ON CONFLICT DO NOTHING;
INSERT INTO service_records (service_id, booking_id, mechanic_id, service_date, odometer_reading, description, labour_cost, parts_cost, total_cost) VALUES (7, 9, 6, '2026-09-17', 45000, 'Engine tuning and brake pad replacement', '1500.00', '6200.00', '7700.00') ON CONFLICT DO NOTHING;
INSERT INTO service_records (service_id, booking_id, mechanic_id, service_date, odometer_reading, description, labour_cost, parts_cost, total_cost) VALUES (8, 14, 1, '2026-10-01', 12500, 'Completed engine checkup and replaced oil filter.', '1500.00', '1200.00', '2700.00') ON CONFLICT DO NOTHING;
INSERT INTO service_records (service_id, booking_id, mechanic_id, service_date, odometer_reading, description, labour_cost, parts_cost, total_cost) VALUES (9, 15, 1, '2026-10-09', 8600, 'Vehicle picked up from customer door-step. Replaced engine oil filter.', '1200.00', '1200.00', '2400.00') ON CONFLICT DO NOTHING;
SELECT setval(pg_get_serial_sequence('service_records', 'service_id'), COALESCE((SELECT MAX(service_id) FROM service_records), 1), true);

-- Seed Data: parts_used
INSERT INTO parts_used (service_id, part_id, quantity) VALUES (1, 1, 1) ON CONFLICT DO NOTHING;
INSERT INTO parts_used (service_id, part_id, quantity) VALUES (1, 2, 1) ON CONFLICT DO NOTHING;
INSERT INTO parts_used (service_id, part_id, quantity) VALUES (2, 3, 1) ON CONFLICT DO NOTHING;
INSERT INTO parts_used (service_id, part_id, quantity) VALUES (2, 7, 1) ON CONFLICT DO NOTHING;
INSERT INTO parts_used (service_id, part_id, quantity) VALUES (3, 4, 1) ON CONFLICT DO NOTHING;
INSERT INTO parts_used (service_id, part_id, quantity) VALUES (4, 8, 1) ON CONFLICT DO NOTHING;
INSERT INTO parts_used (service_id, part_id, quantity) VALUES (6, 1, 1) ON CONFLICT DO NOTHING;
INSERT INTO parts_used (service_id, part_id, quantity) VALUES (6, 2, 1) ON CONFLICT DO NOTHING;
INSERT INTO parts_used (service_id, part_id, quantity) VALUES (7, 1, 1) ON CONFLICT DO NOTHING;
INSERT INTO parts_used (service_id, part_id, quantity) VALUES (7, 3, 1) ON CONFLICT DO NOTHING;
INSERT INTO parts_used (service_id, part_id, quantity) VALUES (7, 7, 1) ON CONFLICT DO NOTHING;
INSERT INTO parts_used (service_id, part_id, quantity) VALUES (8, 1, 1) ON CONFLICT DO NOTHING;
INSERT INTO parts_used (service_id, part_id, quantity) VALUES (9, 1, 1) ON CONFLICT DO NOTHING;

-- Seed Data: invoices
INSERT INTO invoices (invoice_id, service_id, invoice_date, gst, grand_total) VALUES (1, 1, '2026-07-31', '774.00', '5074.00') ON CONFLICT DO NOTHING;
INSERT INTO invoices (invoice_id, service_id, invoice_date, gst, grand_total) VALUES (2, 2, '2026-08-02', '990.00', '6490.00') ON CONFLICT DO NOTHING;
INSERT INTO invoices (invoice_id, service_id, invoice_date, gst, grand_total) VALUES (3, 3, '2026-08-04', '522.00', '3422.00') ON CONFLICT DO NOTHING;
INSERT INTO invoices (invoice_id, service_id, invoice_date, gst, grand_total) VALUES (4, 4, '2026-08-23', '1800.00', '11800.00') ON CONFLICT DO NOTHING;
INSERT INTO invoices (invoice_id, service_id, invoice_date, gst, grand_total) VALUES (5, 6, '2026-09-17', '567.00', '3717.00') ON CONFLICT DO NOTHING;
INSERT INTO invoices (invoice_id, service_id, invoice_date, gst, grand_total) VALUES (6, 7, '2026-09-17', '1386.00', '9086.00') ON CONFLICT DO NOTHING;
INSERT INTO invoices (invoice_id, service_id, invoice_date, gst, grand_total) VALUES (7, 8, '2026-10-01', '486.00', '3186.00') ON CONFLICT DO NOTHING;
INSERT INTO invoices (invoice_id, service_id, invoice_date, gst, grand_total) VALUES (8, 9, '2026-10-09', '432.00', '2832.00') ON CONFLICT DO NOTHING;
SELECT setval(pg_get_serial_sequence('invoices', 'invoice_id'), COALESCE((SELECT MAX(invoice_id) FROM invoices), 1), true);

-- Seed Data: pickup_requests
INSERT INTO pickup_requests (pickup_id, booking_id, flat_building, street, area, city, state, pincode, full_address, instructions, pickup_status, created_at, updated_at) VALUES (1, 15, 'Flat 402, ABC Apartments', 'Road No. 5', 'Kukatpally', 'Hyderabad', 'Telangana', '500072', 'Flat 402, ABC Apartments, Road No. 5, Kukatpally, Hyderabad, Telangana, 500072', 'Please call 15 minutes before pickup.', 'Accepted', '2026-10-06', '2026-10-06') ON CONFLICT DO NOTHING;
SELECT setval(pg_get_serial_sequence('pickup_requests', 'pickup_id'), COALESCE((SELECT MAX(pickup_id) FROM pickup_requests), 1), true);

-- Seed Data: insurance_documents
INSERT INTO insurance_documents (document_id, booking_id, customer_id, original_filename, stored_filename, file_path, file_size, mime_type, uploaded_at) VALUES (1, 15, 11, 'thar_insurance_policy.pdf', 'doc-1791257794172-999858574.pdf', 'C:\Users\Tanish Chandra Pilly\.gemini\antigravity\scratch\Vehicle-Service-History-Management\backend\uploads\insurance_docs\doc-1791257794172-999858574.pdf', 71, 'application/pdf', '2026-10-06') ON CONFLICT DO NOTHING;
SELECT setval(pg_get_serial_sequence('insurance_documents', 'document_id'), COALESCE((SELECT MAX(document_id) FROM insurance_documents), 1), true);

-- Seed Data: notifications
INSERT INTO notifications (notification_id, recipient_role, title, message, booking_id, is_read, created_at) VALUES (1, 'service_center', '🔔 New Vehicle Pickup Request', 'Customer Tanish Pilly requested vehicle pickup for TS09THAR3961 (Mahindra Thar ROXX). Address: Flat 402, ABC Apartments, Road No. 5, Kukatpally, Hyderabad, Telangana, 500072', 15, TRUE, '2026-10-06') ON CONFLICT DO NOTHING;
SELECT setval(pg_get_serial_sequence('notifications', 'notification_id'), COALESCE((SELECT MAX(notification_id) FROM notifications), 1), true);
