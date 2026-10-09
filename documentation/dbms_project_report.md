# DBMS Project Report: Vehicle Service History Management System

**Project Title**: Vehicle Service History Management System  
**Course**: Database Management Systems (DBMS)  

**Team Members**:
1. Tanish Pilly – 2510030055
2. A Eshwar Sidhartha – 2510030265
3. G Manikanta – 2510030199

---

## 1. System Requirements & Architecture

### 1.1 Problem Statement
Automotive service centers require a centralized, reliable relational database system to manage customer records, vehicle registrations, service bookings, technician assignments, spare part inventory deduction, and billing history. Without automated inventory validation and service tracking, stock discrepancies and lost service records occur.

### 1.2 System Architecture
```
┌──────────────────────────────────────────────┐
│           React 18 + Vite Frontend           │
│  (Modern Dashboard, History Search, Forms)   │
└──────────────────────────────────────────────┘
                       │ REST API (JSON)
                       ▼
┌──────────────────────────────────────────────┐
│           Node.js / Express Backend          │
│      (Controllers, Routes, Transactions)     │
└──────────────────────────────────────────────┘
                       │ Parameterized SQL
                       ▼
┌──────────────────────────────────────────────┐
│             PostgreSQL Database              │
│            (vehicle_service_db)              │
│   [8 Tables, View, Function, Stock Trigger]  │
└──────────────────────────────────────────────┘
```

---

## 2. Database Design & Relational Schema

### 2.1 Entity Relationship (ER) & Schema Overview

1. **`customers`** (Parent entity for vehicle owners)
   - `customer_id` (INT, Primary Key, Auto-increment)
   - `name` (VARCHAR(100), NOT NULL)
   - `phone` (VARCHAR(15), NOT NULL, UNIQUE)
   - `email` (VARCHAR(100))
   - `address` (TEXT)

2. **`vehicles`** (Child of customers)
   - `vehicle_id` (INT, Primary Key, Auto-increment)
   - `customer_id` (INT, Foreign Key referencing `customers.customer_id` ON DELETE CASCADE)
   - `registration_no` (VARCHAR(20), NOT NULL, UNIQUE)
   - `brand` (VARCHAR(50), NOT NULL)
   - `model` (VARCHAR(50), NOT NULL)
   - `manufacturing_year` (INT, CHECK 1900-2100)
   - `fuel_type` (VARCHAR(20))
   - `mileage` (INT, CHECK >= 0)

3. **`mechanics`** (Technician details)
   - `mechanic_id` (INT, Primary Key, Auto-increment)
   - `name` (VARCHAR(100), NOT NULL)
   - `phone` (VARCHAR(15))
   - `specialization` (VARCHAR(100))
   - `experience_years` (INT, CHECK >= 0)

4. **`service_bookings`** (Service appointments)
   - `booking_id` (INT, Primary Key, Auto-increment)
   - `vehicle_id` (INT, Foreign Key referencing `vehicles.vehicle_id` ON DELETE CASCADE)
   - `booking_date` (DATE, NOT NULL)
   - `problem_description` (TEXT)
   - `service_type` (VARCHAR(50))
   - `status` (VARCHAR(20), CHECK IN ('Pending', 'In Progress', 'Completed', 'Cancelled'))

5. **`service_records`** (Executed service record)
   - `service_id` (INT, Primary Key, Auto-increment)
   - `booking_id` (INT, Foreign Key referencing `service_bookings.booking_id` ON DELETE CASCADE)
   - `mechanic_id` (INT, Foreign Key referencing `mechanics.mechanic_id`)
   - `service_date` (DATE, NOT NULL)
   - `odometer_reading` (INT, CHECK >= 0)
   - `description` (TEXT)
   - `labour_cost` (NUMERIC(10,2), CHECK >= 0)
   - `parts_cost` (NUMERIC(10,2), CHECK >= 0)
   - `total_cost` (NUMERIC(10,2), CHECK >= 0)

6. **`spare_parts`** (Parts inventory)
   - `part_id` (INT, Primary Key, Auto-increment)
   - `part_name` (VARCHAR(100), NOT NULL)
   - `stock_quantity` (INT, CHECK >= 0)
   - `price` (NUMERIC(10,2), CHECK >= 0)

7. **`parts_used`** (M:M Junction entity)
   - `service_id` (INT, Foreign Key referencing `service_records.service_id` ON DELETE CASCADE)
   - `part_id` (INT, Foreign Key referencing `spare_parts.part_id`)
   - `quantity` (INT, CHECK > 0)
   - Primary Key: (`service_id`, `part_id`)

8. **`invoices`** (Billing entity)
   - `invoice_id` (INT, Primary Key, Auto-increment)
   - `service_id` (INT, Foreign Key referencing `service_records.service_id` ON DELETE CASCADE, UNIQUE)
   - `invoice_date` (DATE)
   - `gst` (NUMERIC(10,2), CHECK >= 0)
   - `grand_total` (NUMERIC(10,2), CHECK >= 0)

---

## 3. Advanced DBMS Features Implemented

### 3.1 PostgreSQL Stored Function: `get_vehicle_service_history`
```sql
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
```

### 3.2 PostgreSQL Trigger & Stock Validation: `trg_update_spare_part_stock`
```sql
CREATE OR REPLACE FUNCTION update_spare_part_stock()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
DECLARE
    current_stock INTEGER;
BEGIN
    SELECT stock_quantity INTO current_stock
    FROM spare_parts
    WHERE part_id = NEW.part_id;

    IF current_stock < NEW.quantity THEN
        RAISE EXCEPTION 'Insufficient stock for part ID %: Requested %, Available %', 
            NEW.part_id, NEW.quantity, current_stock;
    END IF;

    UPDATE spare_parts
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE part_id = NEW.part_id;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_spare_part_stock
AFTER INSERT ON parts_used
FOR EACH ROW
EXECUTE FUNCTION update_spare_part_stock();
```

---

## 4. Viva Q&A Guide

**Q1: How does the system handle inventory deduction?**  
*Answer*: Inventory deduction is enforced directly at the PostgreSQL database level using the `trg_update_spare_part_stock` trigger function attached `AFTER INSERT ON parts_used`. If requested quantity exceeds `stock_quantity`, PostgreSQL raises an exception and aborts the entire transaction.

**Q2: How is service history retrieved?**  
*Answer*: The backend invokes the PL/pgSQL stored function `get_vehicle_service_history(reg_no)`, performing multi-table JOINs across `customers`, `vehicles`, `service_bookings`, `service_records`, and `mechanics`.

**Q3: How is data consistency maintained when completing a service?**  
*Answer*: Service completion uses a **PostgreSQL Transaction** (`BEGIN` ... `COMMIT` / `ROLLBACK`). Inserting the service record, inserting parts used (which fires the trigger), updating booking status to 'Completed', and generating the GST invoice happen atomically.

---

## 5. Conclusion
The **Vehicle Service History Management System** fulfills all DBMS curriculum requirements, demonstrating normalized 3NF relational design, referential integrity constraints, multi-table JOINs, PL/pgSQL stored functions, triggers, transactions, and aggregate analytics behind a modern full-stack web interface.
