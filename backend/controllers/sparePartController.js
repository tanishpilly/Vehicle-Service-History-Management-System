const db = require('../db');

// Get all spare parts
exports.getSpareParts = async (req, res) => {
  try {
    const { search } = req.query;
    let query = `SELECT * FROM spare_parts`;
    const params = [];

    if (search) {
      query += ` WHERE LOWER(part_name) LIKE $1`;
      params.push(`%${search.toLowerCase()}%`);
    }

    query += ` ORDER BY part_id ASC`;

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching spare parts:', err);
    res.status(500).json({ success: false, message: 'Server error fetching spare parts', error: err.message });
  }
};

// Get low stock spare parts (stock_quantity < 20)
exports.getLowStockParts = async (req, res) => {
  try {
    const query = `
      SELECT part_id, part_name, stock_quantity, price 
      FROM spare_parts 
      WHERE stock_quantity < 20 
      ORDER BY stock_quantity ASC
    `;
    const result = await db.query(query);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching low stock parts:', err);
    res.status(500).json({ success: false, message: 'Server error fetching low stock parts', error: err.message });
  }
};

// Add a new spare part
exports.createSparePart = async (req, res) => {
  try {
    const { part_name, stock_quantity, price } = req.body;

    if (!part_name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Part name and price are required.' });
    }

    if (price < 0 || stock_quantity < 0) {
      return res.status(400).json({ success: false, message: 'Price and stock quantity cannot be negative.' });
    }

    const result = await db.query(
      `INSERT INTO spare_parts (part_name, stock_quantity, price)
       VALUES ($1, $2, $3) RETURNING *`,
      [part_name, stock_quantity || 0, price]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Spare part added successfully.' });
  } catch (err) {
    console.error('Error adding spare part:', err);
    res.status(500).json({ success: false, message: 'Server error adding spare part', error: err.message });
  }
};

// Update an existing spare part
exports.updateSparePart = async (req, res) => {
  try {
    const { id } = req.params;
    const { part_name, stock_quantity, price } = req.body;

    if (!part_name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Part name and price are required.' });
    }

    if (price < 0 || stock_quantity < 0) {
      return res.status(400).json({ success: false, message: 'Price and stock quantity cannot be negative.' });
    }

    const result = await db.query(
      `UPDATE spare_parts
       SET part_name = $1, stock_quantity = $2, price = $3
       WHERE part_id = $4 RETURNING *`,
      [part_name, stock_quantity, price, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Spare part not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Spare part updated successfully.' });
  } catch (err) {
    console.error('Error updating spare part:', err);
    res.status(500).json({ success: false, message: 'Server error updating spare part', error: err.message });
  }
};
