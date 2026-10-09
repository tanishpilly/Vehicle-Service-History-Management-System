const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '12345',
  database: process.env.PGDATABASE || 'vehicle_service_db',
});

pool.on('connect', () => {
  // Connected
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL Pool Error:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
};
