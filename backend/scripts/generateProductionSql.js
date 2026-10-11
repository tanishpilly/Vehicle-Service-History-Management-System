const fs = require('fs');
const path = require('path');
const db = require('../db');

async function generateProductionSql() {
  try {
    console.log('Generating complete database_production.sql...');

    // Load individual DDL files
    const schemaSql = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf8');
    const authSql = fs.readFileSync(path.join(__dirname, '../../database/auth_schema.sql'), 'utf8');
    const apptSql = fs.readFileSync(path.join(__dirname, '../../database/appointment_schema.sql'), 'utf8');
    const funcSql = fs.readFileSync(path.join(__dirname, '../../database/functions.sql'), 'utf8');
    const trigSql = fs.readFileSync(path.join(__dirname, '../../database/triggers.sql'), 'utf8');

    let output = `-- ============================================================
-- VEHICLE SERVICE HISTORY MANAGEMENT SYSTEM
-- Complete Consolidated Production Database Migration
-- Target: Cloud PostgreSQL (Neon / Supabase / Aiven / Railway)
-- Preserves: 8 Original Tables + Auth + Appointments + Views + Functions + Triggers + Seed Data
-- ============================================================

-- ============================================================
-- 1. DDL: CORE TABLES & CONSTRAINTS
-- ============================================================
${schemaSql}

-- ============================================================
-- 2. DDL: AUTHENTICATION USERS TABLE
-- ============================================================
${authSql}

-- ============================================================
-- 3. DDL: APPOINTMENTS, PICKUP REQUESTS & NOTIFICATIONS
-- ============================================================
${apptSql}

-- ============================================================
-- 4. VIEWS & STORED FUNCTIONS
-- ============================================================
${funcSql}

-- ============================================================
-- 5. TRIGGERS & INVENTORY STOCK MANAGEMENT
-- ============================================================
${trigSql}

-- ============================================================
-- 6. PRODUCTION SEED DATA
-- ============================================================
`;

    // Fetch seed data from tables
    const tables = [
      'customers',
      'vehicles',
      'mechanics',
      'spare_parts',
      'users',
      'service_bookings',
      'service_records',
      'parts_used',
      'invoices',
      'pickup_requests',
      'insurance_documents',
      'notifications'
    ];

    for (const table of tables) {
      const res = await db.query(`SELECT * FROM ${table}`);
      if (res.rows.length > 0) {
        output += `\n-- Seed Data: ${table}\n`;
        const firstRowKeys = Object.keys(res.rows[0]);

        for (const row of res.rows) {
          const keys = Object.keys(row);
          const values = Object.values(row).map(val => {
            if (val === null) return 'NULL';
            if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
            if (typeof val === 'number') return val;
            if (val instanceof Date) return `'${val.toISOString().split('T')[0]}'`;
            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            return `'${String(val).replace(/'/g, "''")}'`;
          });

          output += `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;\n`;
        }

        // Reset sequence if serial primary key exists
        const pkCol = firstRowKeys[0];
        if (pkCol && pkCol.endsWith('_id') && table !== 'parts_used') {
          output += `SELECT setval(pg_get_serial_sequence('${table}', '${pkCol}'), COALESCE((SELECT MAX(${pkCol}) FROM ${table}), 1), true);\n`;
        }
      }
    }

    const outputPath = path.join(__dirname, '../../database/database_production.sql');
    fs.writeFileSync(outputPath, output, 'utf8');
    console.log(`✅ Successfully generated: ${outputPath}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error generating production SQL:', err);
    process.exit(1);
  }
}

generateProductionSql();
