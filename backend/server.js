const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./db');

const authRoutes = require('./routes/authRoutes');
const customerPortalRoutes = require('./routes/customerPortalRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const serviceCenterExtraRoutes = require('./routes/serviceCenterExtraRoutes');
const customerRoutes = require('./routes/customerRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const serviceRecordRoutes = require('./routes/serviceRecordRoutes');
const mechanicRoutes = require('./routes/mechanicRoutes');
const sparePartRoutes = require('./routes/sparePartRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const historyRoutes = require('./routes/historyRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({
      status: 'OK',
      message: 'Vehicle Service History API is running smoothly',
      db_time: result.rows[0].now,
      database: process.env.PGDATABASE || 'vehicle_service_db'
    });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', message: 'Database connection failure', error: err.message });
  }
});

// Network Info endpoint to return local Wi-Fi LAN IP address for QR codes
const os = require('os');
app.get('/api/network-info', (req, res) => {
  const interfaces = os.networkInterfaces();
  let lanIp = 'localhost';

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      // Skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      if (net.family === 'IPv4' && !net.internal) {
        lanIp = net.address;
        break;
      }
    }
  }

  res.json({
    success: true,
    lanIp,
    localhostUrl: `http://localhost:${PORT}`,
    lanUrl: `http://${lanIp}:${PORT}`
  });
});

// Mount Auth & Customer Portal Routes
app.use('/api/auth', authRoutes);
app.use('/api/customer-portal', customerPortalRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/service-center-extra', serviceCenterExtraRoutes);

// Mount Service Center Admin API Routes
app.use('/api/customers', customerRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/service-records', serviceRecordRoutes);
app.use('/api/mechanics', mechanicRoutes);
app.use('/api/spare-parts', sparePartRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/service-history', historyRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

// Global 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `API route '${req.originalUrl}' not found.` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

// Start Express Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 Vehicle Service REST API Server running on port ${PORT}`);
  console.log(`📊 Connected to PostgreSQL: ${process.env.PGDATABASE || 'vehicle_service_db'}`);
  console.log(`=======================================================`);
});
