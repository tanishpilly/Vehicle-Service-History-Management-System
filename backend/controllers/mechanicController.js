const db = require('../db');

// Get all mechanics (with service count)
exports.getMechanics = async (req, res) => {
  try {
    const query = `
      SELECT 
        m.*, 
        COUNT(s.service_id)::int AS completed_services_count
      FROM mechanics m
      LEFT JOIN service_records s ON m.mechanic_id = s.mechanic_id
      GROUP BY m.mechanic_id
      ORDER BY m.mechanic_id ASC
    `;
    const result = await db.query(query);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Error fetching mechanics:', err);
    res.status(500).json({ success: false, message: 'Server error fetching mechanics', error: err.message });
  }
};

// Add a new mechanic
exports.createMechanic = async (req, res) => {
  try {
    const { name, phone, specialization, experience_years } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Mechanic name is required.' });
    }

    const result = await db.query(
      `INSERT INTO mechanics (name, phone, specialization, experience_years)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, phone || null, specialization || 'General Service', experience_years || 0]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: 'Mechanic added successfully.' });
  } catch (err) {
    console.error('Error adding mechanic:', err);
    res.status(500).json({ success: false, message: 'Server error adding mechanic', error: err.message });
  }
};

// Update an existing mechanic
exports.updateMechanic = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, specialization, experience_years } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Mechanic name is required.' });
    }

    const result = await db.query(
      `UPDATE mechanics
       SET name = $1, phone = $2, specialization = $3, experience_years = $4
       WHERE mechanic_id = $5 RETURNING *`,
      [name, phone || null, specialization || 'General Service', experience_years || 0, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Mechanic not found' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Mechanic updated successfully.' });
  } catch (err) {
    console.error('Error updating mechanic:', err);
    res.status(500).json({ success: false, message: 'Server error updating mechanic', error: err.message });
  }
};
