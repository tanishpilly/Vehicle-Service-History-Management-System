const { Pool } = require('pg');
require('dotenv').config();

// Determine configuration: DATABASE_URL for Cloud/Production or discrete fields for Local
let poolConfig;

if (process.env.DATABASE_URL) {
  const isLocalDb = process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: isLocalDb ? false : { rejectUnauthorized: false },
    max: parseInt(process.env.PGMAX || '10', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
} else {
  poolConfig = {
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || (process.env.NODE_ENV === 'production' ? undefined : '12345'),
    database: process.env.PGDATABASE || 'vehicle_service_db',
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL Pool Error:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
};
