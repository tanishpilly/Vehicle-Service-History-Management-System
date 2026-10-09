const db = require('../db');

// Real-time Dashboard Statistics from PostgreSQL Database
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Total Customers
    const custRes = await db.query('SELECT COUNT(*) AS total FROM customers');
    const totalCustomers = parseInt(custRes.rows[0].total, 10);

    // 2. Total Vehicles
    const vehRes = await db.query('SELECT COUNT(*) AS total FROM vehicles');
    const totalVehicles = parseInt(vehRes.rows[0].total, 10);

    // 3. Service Bookings Breakdown (Pending, In Progress, Completed)
    const bookingRes = await db.query(`
      SELECT status, COUNT(*) AS count 
      FROM service_bookings 
      GROUP BY status
    `);
    const statusCounts = { Pending: 0, 'In Progress': 0, Completed: 0, Cancelled: 0 };
    bookingRes.rows.forEach(row => {
      statusCounts[row.status] = parseInt(row.count, 10);
    });

    // 4. Total Mechanics
    const mechRes = await db.query('SELECT COUNT(*) AS total FROM mechanics');
    const totalMechanics = parseInt(mechRes.rows[0].total, 10);

    // 5. Total Spare Parts & Low Stock Parts Count (< 20)
    const partRes = await db.query(`
      SELECT 
        COUNT(*) AS total_parts,
        COUNT(CASE WHEN stock_quantity < 20 THEN 1 END) AS low_stock_count
      FROM spare_parts
    `);
    const totalParts = parseInt(partRes.rows[0].total_parts, 10);
    const lowStockCount = parseInt(partRes.rows[0].low_stock_count, 10);

    // 6. Total Revenue (SUM of service records labour + parts cost)
    const revRes = await db.query(`
      SELECT 
        COALESCE(SUM(total_cost), 0) AS total_revenue,
        COALESCE(ROUND(AVG(total_cost), 2), 0) AS avg_cost,
        COALESCE(MIN(total_cost), 0) AS min_cost,
        COALESCE(MAX(total_cost), 0) AS max_cost
      FROM service_records
    `);
    const revenueStats = {
      total_revenue: parseFloat(revRes.rows[0].total_revenue),
      avg_cost: parseFloat(revRes.rows[0].avg_cost),
      min_cost: parseFloat(revRes.rows[0].min_cost),
      max_cost: parseFloat(revRes.rows[0].max_cost)
    };

    // 7. Recent Service Bookings (Last 5)
    const recentBookingsRes = await db.query(`
      SELECT 
        b.booking_id, b.booking_date, b.service_type, b.status,
        v.registration_no, v.brand, v.model,
        c.name AS customer_name
      FROM service_bookings b
      JOIN vehicles v ON b.vehicle_id = v.vehicle_id
      JOIN customers c ON v.customer_id = c.customer_id
      ORDER BY b.booking_id DESC
      LIMIT 5
    `);

    // 8. Low Stock Parts List (Top 5 lowest stock)
    const lowStockAlertsRes = await db.query(`
      SELECT part_id, part_name, stock_quantity, price
      FROM spare_parts
      WHERE stock_quantity < 20
      ORDER BY stock_quantity ASC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        totalCustomers,
        totalVehicles,
        totalMechanics,
        totalParts,
        lowStockCount,
        bookings: statusCounts,
        revenue: revenueStats,
        recentBookings: recentBookingsRes.rows,
        lowStockAlerts: lowStockAlertsRes.rows
      }
    });

  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ success: false, message: 'Server error fetching dashboard stats', error: err.message });
  }
};
