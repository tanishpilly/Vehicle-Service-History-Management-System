const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../db');

async function setupAuthDb() {
  try {
    console.log('🔒 Initializing Authentication Database Extension...');

    // 1. Execute auth_schema.sql
    const sqlPath = path.join(__dirname, '../../database/auth_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await db.query(sql);
    console.log('✅ Auth schema verified (users table & indexes ready).');

    // 2. Seed Default Service Center Admin User if not exists
    const adminCheck = await db.query("SELECT * FROM users WHERE username = 'admin' OR role = 'service_center'");
    if (adminCheck.rows.length === 0) {
      const adminPasswordHash = await bcrypt.hash('admin123', 10);
      await db.query(
        `INSERT INTO users (username, email, password_hash, role)
         VALUES ($1, $2, $3, $4)`,
        ['admin', 'admin@servicecenter.com', adminPasswordHash, 'service_center']
      );
      console.log('👤 Default Service Center Staff Account created: (username: admin, password: admin123)');
    } else {
      console.log('ℹ️ Service Center Staff Account already exists.');
    }

    // 3. Link Existing Sample Customers to User Accounts if not linked
    const customers = await db.query('SELECT customer_id, name, phone, email FROM customers');
    for (const cust of customers.rows) {
      const userCheck = await db.query('SELECT * FROM users WHERE customer_id = $1', [cust.customer_id]);
      if (userCheck.rows.length === 0) {
        // Generate clean username from name or phone
        const cleanName = cust.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        const username = cleanName || `customer${cust.customer_id}`;
        
        // Check if username unique
        let finalUsername = username;
        const exists = await db.query('SELECT * FROM users WHERE username = $1', [finalUsername]);
        if (exists.rows.length > 0) {
          finalUsername = `${username}${cust.customer_id}`;
        }

        const customerPasswordHash = await bcrypt.hash('customer123', 10);
        const email = cust.email || `${finalUsername}@example.com`;

        await db.query(
          `INSERT INTO users (username, email, password_hash, role, customer_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [finalUsername, email, customerPasswordHash, 'customer', cust.customer_id]
        );
        console.log(`👤 Customer Account seeded for ${cust.name}: (username: ${finalUsername}, password: customer123)`);
      }
    }

    console.log('🎉 Auth Setup Complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error setting up Auth DB:', err);
    process.exit(1);
  }
}

setupAuthDb();
