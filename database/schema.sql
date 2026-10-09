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
