# 🚀 Production Deployment Guide: Vehicle Service History Management System

This guide outlines the step-by-step instructions to deploy the **Vehicle Service History Management System** to production on **Vercel** with a **Cloud PostgreSQL** database (Neon / Supabase) and **Cloudinary** for persistent insurance document storage.

---

## 🏗️ Deployment Architecture

```
                       ┌────────────────────────┐
                       │  Vercel Edge Network   │
                       └───────────┬────────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              ▼                                         ▼
   ┌──────────────────────┐                  ┌──────────────────────┐
   │  React + Vite SPA    │                  │ Express Serverless   │
   │  Static Frontend     │                  │ API (/api/*)         │
   │  (CDN Distributed)   │                  │ (Node.js Runtime)    │
   └──────────────────────┘                  └──────────┬───────────┘
                                                        │
                         ┌──────────────────────────────┼──────────────────────────────┐
                         ▼                              ▼                              ▼
              ┌──────────────────────┐       ┌──────────────────────┐       ┌──────────────────────┐
              │   Cloud PostgreSQL   │       │      Cloudinary      │       │     JWT Security     │
              │  (Neon / Supabase)   │       │  (Insurance Storage) │       │   (Bcrypt Hashing)   │
              └──────────────────────┘       └──────────────────────┘       └──────────────────────┘
```

- **Frontend**: React 18, Tailwind CSS, Lucide Icons, Vite (served globally via Vercel CDN).
- **Backend**: Express.js REST API bundled as a Vercel Serverless Function (`api/index.js`).
- **Database**: Cloud PostgreSQL with SSL (`ssl: { rejectUnauthorized: false }`), connection pooling, triggers, views, and stored functions.
- **File Storage**: Cloudinary (memory buffer upload directly to cloud; falls back to local disk during local dev).

---

## 📋 Prerequisites

Before starting, ensure you have free accounts on:
1. **[GitHub](https://github.com/)** (Your repository: `https://github.com/tanishpilly/Vehicle-Service-History-Management-System`)
2. **[Vercel](https://vercel.com/)** (Sign up with GitHub)
3. **[Neon](https://neon.tech/)** or **[Supabase](https://supabase.com/)** (Free managed PostgreSQL)
4. **[Cloudinary](https://cloudinary.com/)** (Free cloud asset storage for insurance documents)

---

## Step 1: Setup Cloud PostgreSQL Database

You can use either **Neon** (Recommended - fastest setup) or **Supabase**.

### Option A: Using Neon (Recommended)
1. Go to [Neon Console](https://console.neon.tech/) and click **"Create Project"**.
2. Name your project (e.g., `vehicle-service-db`) and select a region close to your users.
3. Once created, copy the **Connection String** from the dashboard. It looks like:
   ```
   postgresql://username:password@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. In the Neon sidebar, open the **SQL Editor**.
5. Open [`database/database_production.sql`](database/database_production.sql) from this repository, copy its entire contents, paste it into the Neon SQL Editor, and click **Run**.
6. The script will execute all DDL and DML statements:
   - Creates all 8 core DBMS tables (`customers`, `vehicles`, `mechanics`, `service_bookings`, `service_records`, `spare_parts`, `parts_used`, `invoices`)
   - Creates authentication (`users`), appointments, pickup requests (`pickup_requests`), insurance documents (`insurance_documents`), and `notifications`
   - Creates foreign keys, constraints, and indexes
   - Creates `service_history_view` (7-table JOIN view)
   - Creates `get_vehicle_service_history()` stored function
   - Creates `trg_update_spare_part_stock` trigger with stock validation
   - Inserts production seed data and synchronizes PostgreSQL sequences

### Option B: Using Supabase
1. Go to [Supabase](https://supabase.com/) and click **"New Project"**.
2. Give your database a password and select a region.
3. Navigate to **Project Settings** → **Database** → **Connection String** → **URI**.
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
   ```
4. Navigate to the **SQL Editor** in Supabase, paste the contents of [`database/database_production.sql`](database/database_production.sql), and click **Run**.

---

## Step 2: Setup Cloudinary for Document Uploads (Optional but Recommended)

Because Vercel serverless functions have a read-only, ephemeral filesystem, uploaded insurance files are uploaded directly to Cloudinary in production.

1. Create a free account at [Cloudinary](https://cloudinary.com/).
2. From the Cloudinary Dashboard, copy your:
   - **Cloud Name** (`CLOUDINARY_CLOUD_NAME`)
   - **API Key** (`CLOUDINARY_API_KEY`)
   - **API Secret** (`CLOUDINARY_API_SECRET`)

> *Note: If Cloudinary keys are omitted, the system falls back to temporary `/tmp` storage, but files won't persist across serverless restarts.*

---

## Step 3: Deploy to Vercel (Unified Fullstack Deployment)

This repository includes [`vercel.json`](vercel.json) and [`api/index.js`](api/index.js) configured for single-click deployment.

### 1. Import Repository into Vercel
1. Log into your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **"Add New..."** → **"Project"**.
3. Select your repository `Vehicle-Service-History-Management-System`.
4. Ensure the branch selected is **`vercel-deployment`** (or merge to `main` when ready).

### 2. Configure Build & Framework Settings
Vercel automatically detects settings via `vercel.json`:
- **Framework Preset**: `Vite` (or `Other`)
- **Root Directory**: `./` (Leave as root)
- **Build Command**: `cd frontend && npm install --include=dev && npm run build` (Handled by `vercel.json`)
- **Output Directory**: `frontend/dist` (Handled by `vercel.json`)

### 3. Add Environment Variables in Vercel
Under the **Environment Variables** section, add the following key-value pairs:

| Variable Name | Example / Value | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:pass@ep-sample.us-east-2.aws.neon.tech/neondb?sslmode=require` | Connection string to your Cloud PostgreSQL database |
| `JWT_SECRET` | `prod_jwt_super_secret_key_vehicle_mgmt_2026_xyz` | Secret key for signing customer and staff JWT tokens |
| `NODE_ENV` | `production` | Production environment flag |
| `CLOUDINARY_CLOUD_NAME` | `your_cloud_name` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | `your_api_key` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | `your_api_secret` | Cloudinary API secret |
| `VITE_API_URL` | `/api` | Base API URL (relative `/api` uses Vercel serverless proxy) |
| `VITE_APP_URL` | `https://your-project.vercel.app` | Your deployed Vercel domain (used for QR code scanning tags) |

### 4. Click "Deploy"
1. Click **Deploy**.
2. Vercel will install dependencies, build the React frontend, package the serverless backend function, and provision edge routing in ~1-2 minutes.
3. You will receive a live URL: `https://your-project.vercel.app`.

---

## Step 4: Verification and Smoke Testing

Once deployment completes, verify all key features using these tests:

### 1. API Health Check
Open your browser and navigate to:
```
https://your-project.vercel.app/api/health
```
**Expected Response:**
```json
{
  "status": "OK",
  "message": "Vehicle Service History API is running smoothly",
  "db_time": "2026-10-11T...",
  "database": "neondb"
}
```

### 2. Customer Portal Test
1. Visit `https://your-project.vercel.app/login`
2. Select **[ CUSTOMER ]**
3. Log in with pre-seeded demo customer credentials:
   - **Username**: `rahul`
   - **Password**: `12345`
4. Verify Customer Dashboard features:
   - View registered vehicles (e.g., `TS09AB1234` Honda City)
   - View and print service invoices with 18% GST calculation
   - View Vehicle QR Code Tag
   - Test "Book Service" with pickup request and optional insurance document upload
   - Check real-time status progression (`Pending` → `In Progress` → `Completed`)

### 3. Service Center Admin Test
1. Open an Incognito window and visit `https://your-project.vercel.app/login`
2. Select **[ SERVICE CENTER ]**
3. Log in with admin credentials:
   - **Username**: `admin`
   - **Password**: `admin123`
4. Verify Service Center modules:
   - **Dashboard**: Live DBMS KPIs, low stock alerts, recent services
   - **Pickup Requests**: Review customer pickup addresses and accept/complete requests
   - **Spare Parts & Trigger**: View spare part quantities; add a part to a service record and confirm automatic stock deduction
   - **Vehicles & QR Generation**: Generate printable QR codes for customer vehicles
   - **Reports & Analytics**: Aggregate SQL breakdown with revenue and service metrics

### 4. Vehicle QR Code Direct Lookup Test
1. Scan a vehicle QR code with your mobile camera or navigate to:
   ```
   https://your-project.vercel.app/?reg=TS09AB1234
   ```
2. Confirm the complete service history for `TS09AB1234` is displayed without requiring staff login.

---

## ⚙️ Alternative: Separate Frontend & Backend Deployment

If you prefer to host the backend separately on **Render** or **Railway** and the frontend on **Vercel**:

### Deploy Backend to Render / Railway:
1. Root directory in Render: `backend`
2. Build command: `npm install`
3. Start command: `node server.js`
4. Set environment variables (`DATABASE_URL`, `JWT_SECRET`, `CLOUDINARY_*`, `PORT=5000`).
5. Render URL: `https://vehicle-api.onrender.com`

### Deploy Frontend to Vercel:
1. Root directory in Vercel: `frontend`
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set environment variable:
   - `VITE_API_URL` = `https://vehicle-api.onrender.com/api`
   - `VITE_APP_URL` = `https://your-frontend.vercel.app`

---

## 🛠️ Common Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| **Database connection error / SSL reject** | Cloud PostgreSQL requires SSL | Ensure connection string has `?sslmode=require`. The codebase includes `ssl: { rejectUnauthorized: false }` by default. |
| **Login fails with 401 Unauthorized** | Password mismatch or un-migrated database | Ensure [`database_production.sql`](database/database_production.sql) was run in full. Test credentials: `admin` / `admin123` or `rahul` / `12345`. |
| **Insurance documents fail to upload** | Cloudinary credentials missing or invalid | Check `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in Vercel settings. |
| **Vercel 404 on API requests** | Route rewrites not applied | Confirm [`vercel.json`](vercel.json) is in the root directory and contains the `/api/(.*)` rewrite to `/api/index.js`. |
| **QR code shows localhost URL** | `VITE_APP_URL` not configured | In Vercel Environment Variables, set `VITE_APP_URL` = `https://your-deployment.vercel.app` and redeploy. |

---

## 🔒 Security Best Practices
- **Do not commit `.env` files** to GitHub.
- Rotate `JWT_SECRET` before final submission or demonstration.
- Use PostgreSQL role with limited permissions if sharing connection strings.
- In Cloudinary, restrict uploads to permitted image and document MIME types.
