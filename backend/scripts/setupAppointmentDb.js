const fs = require('fs');
const path = require('path');
const db = require('../db');

async function setupAppointmentDb() {
  try {
    console.log('📦 Executing Appointment & Pickup Database Schema Migration...');
    const sqlPath = path.join(__dirname, '../../database/appointment_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await db.query(sql);
    console.log('✅ Appointment, Pickup, Insurance & Notification Schema applied successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error executing appointment schema migration:', err);
    process.exit(1);
  }
}

setupAppointmentDb();
