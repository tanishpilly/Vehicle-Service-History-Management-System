# 🚗 Vehicle Service History Management System

A full-stack, review-aligned, production-grade DBMS web application built with **React 18, Node.js, Express.js, and PostgreSQL**. Designed for vehicle owners and service center management.

Developed as a B.Tech Computer Science DBMS Project by:
- **Tanish Pilly** (Roll No: `2510030055`)
- **A Eshwar Sidhartha** (Roll No: `2510030265`)
- **G Manikanta** (Roll No: `2510030199`)

---

## 🌟 Key Features

### 👤 Customer Portal (Primary & Priority Interface)
- **Mandatory Authentication**: Role-based access control with secure bcrypt password hashing & JWT session tokens.
- **My Vehicles**: View registered vehicles, add new vehicles, and generate dynamic vehicle QR Code tags (view, print, or download PNG).
- **Multi-Step Service Booking**:
  1. *Select Vehicle & Odometer Reading*
  2. *Service Type & Date Selection* (`General Service`, `Periodic Service`, `Brake Service`, `Engine Service`, `AC Service`, `Electrical Service`, `Tyre Service`, etc.)
  3. *Doorstep Vehicle Pickup Request* (Pickup address: Flat/Building, Street, Area, City, State, PIN, and custom instructions)
  4. *Insurance Document Upload* (PDF, JPG, PNG attachments up to 10MB)
  5. *Review & Submit*
- **Live Status Tracker**: Visual stepper showing both **Pickup Progress** (`Requested` ➔ `Accepted` ➔ `Pickup Scheduled` ➔ `Picked Up`) and **Service Status** (`Pending` ➔ `In Progress` ➔ `Completed`).
- **Vehicle Service History**: Complete chronological log of past repairs, technician notes, odometer readings, and itemized spare parts used.
- **GST Invoices**: View and print official tax invoices.

### 🏢 Service Center Portal (Workshop Administration)
- **In-App Notification Center**: Real-time bell notification for new doorstep pickup requests.
- **Pickup Requests Dispatch**: Filter, inspect pickup addresses, view attached insurance PDFs/images, and update dispatch statuses.
- **Service Bookings & Records**: Assign mechanics, input labour charges, and select spare parts used.
- **PostgreSQL Stock Deduction Trigger**: `trg_update_spare_part_stock` automatically checks inventory and deducts stock when parts are attached to a service record.
- **Spare Parts Inventory**: Stock management with low-stock alerts (< 20 units).
- **DBMS Reports & Analytics**: Live PostgreSQL queries showcasing `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`, and `GROUP BY` aggregations.

### 📱 QR Code Verification & Camera Scanner
- Mobile QR Code generation allowing instant service history retrieval over Wi-Fi/LAN host binding (`0.0.0.0`).
- Integrated camera QR scanner on the Service History page.

---

## 📁 Review Presentations Included

The repository includes all four project review presentation files inside the `presentations/` folder:
- 📊 [`presentations/Review_1_Project_Proposal.pptx`](presentations/Review_1_Project_Proposal.pptx)
- 📊 [`presentations/Review_2_Literature_Review.pptx`](presentations/Review_2_Literature_Review.pptx)
- 📊 [`presentations/Review_3_Database_Methodology.pptx`](presentations/Review_3_Database_Methodology.pptx)
- 📊 [`presentations/Review_4_Final_Implementation.pptx`](presentations/Review_4_Final_Implementation.pptx)

---

## 🗄️ Database Architecture (PostgreSQL)

- **8 Relational Tables**: `customers`, `vehicles`, `mechanics`, `service_bookings`, `service_records`, `spare_parts`, `parts_used`, `invoices`.
- **Extended Tables**: `users`, `pickup_requests`, `insurance_documents`, `notifications`.
- **Stored PL/pgSQL Function**: `get_vehicle_service_history(reg_no)`
- **Database View**: `service_history_view`
- **Database Trigger**: `trg_update_spare_part_stock`

---

## 🛠️ Installation & Setup

### 1. Database Setup
Create database `vehicle_service_db` in PostgreSQL and run:
```bash
psql -U postgres -d vehicle_service_db -f database/schema.sql
psql -U postgres -d vehicle_service_db -f database/functions.sql
psql -U postgres -d vehicle_service_db -f database/triggers.sql
psql -U postgres -d vehicle_service_db -f database/auth_schema.sql
psql -U postgres -d vehicle_service_db -f database/appointment_schema.sql
```

### 2. Backend Server
```bash
cd backend
npm install
node server.js
```
API runs on `http://localhost:5000`.

### 3. Frontend Application
```bash
cd frontend
npm install
npm run dev
```
Web application runs on `http://localhost:5173`.

---

## 🔑 Demo Login Credentials

- **Customer Login**: `rahul` / `customer123` or `priya` / `customer123`
- **Service Center Staff**: `admin` / `admin123`
