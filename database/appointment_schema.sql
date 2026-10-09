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
