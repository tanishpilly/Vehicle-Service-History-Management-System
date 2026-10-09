const db = require('../db');

// Reports & Analytics Controller - Demonstrates PostgreSQL Aggregate Queries, GROUP BY, and JOINs
exports.getAnalytics = async (req, res) => {
  try {
    // 1. Overall Service Revenue Metrics (COUNT, SUM, AVG, MIN, MAX)
    const metricsRes = await db.query(`
      SELECT 
        COUNT(*) AS total_services,
        COALESCE(SUM(total_cost), 0) AS total_revenue,
        COALESCE(ROUND(AVG(total_cost), 2), 0) AS avg_service_cost,
        COALESCE(MIN(total_cost), 0) AS min_service_cost,
        COALESCE(MAX(total_cost), 0) AS max_service_cost,
        COALESCE(SUM(labour_cost), 0) AS total_labour_revenue,
        COALESCE(SUM(parts_cost), 0) AS total_parts_revenue
      FROM service_records
    `);

    // 2. Service Type Breakdown (GROUP BY service_type + COUNT + SUM + AVG)
    const serviceTypeRes = await db.query(`
      SELECT 
        b.service_type,
        COUNT(s.service_id)::int AS service_count,
        COALESCE(SUM(s.total_cost), 0) AS total_revenue,
        COALESCE(ROUND(AVG(s.total_cost), 2), 0) AS avg_cost
      FROM service_bookings b
      LEFT JOIN service_records s ON b.booking_id = s.booking_id
      GROUP BY b.service_type
      ORDER BY total_revenue DESC
    `);

    // 3. Spare Parts Usage Analysis (JOIN + SUM + GROUP BY)
    const partUsageRes = await db.query(`
      SELECT 
        sp.part_id,
        sp.part_name,
        sp.price,
        sp.stock_quantity AS current_stock,
        COALESCE(SUM(pu.quantity), 0)::int AS total_quantity_used,
        COALESCE(SUM(pu.quantity * sp.price), 0) AS total_part_revenue
      FROM spare_parts sp
      LEFT JOIN parts_used pu ON sp.part_id = pu.part_id
      GROUP BY sp.part_id, sp.part_name, sp.price, sp.stock_quantity
      ORDER BY total_quantity_used DESC
    `);

    // 4. Low Stock Inventory Report (Threshold < 20)
    const lowStockRes = await db.query(`
      SELECT part_id, part_name, stock_quantity, price
      FROM spare_parts
      WHERE stock_quantity < 20
      ORDER BY stock_quantity ASC
    `);

    // 5. Booking Status Distribution
    const bookingStatusRes = await db.query(`
      SELECT status, COUNT(*)::int AS count
      FROM service_bookings
      GROUP BY status
    `);

    res.json({
      success: true,
      data: {
        metrics: metricsRes.rows[0],
        serviceTypes: serviceTypeRes.rows,
        partUsage: partUsageRes.rows,
        lowStock: lowStockRes.rows,
        bookingStatus: bookingStatusRes.rows
      }
    });

  } catch (err) {
    console.error('Error fetching analytics report:', err);
    res.status(500).json({ success: false, message: 'Server error generating analytics report', error: err.message });
  }
};
