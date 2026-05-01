const db = require('../config/db');

async function getAllOffers(req, res) {
  try {
    const [rows] = await db.query('SELECT * FROM offers ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('getAllOffers error', err);
    res.status(500).json({ error: 'Query failed' });
  }
}

async function createOffer(req, res) {
  const { offer_name, offer_type, target_id, discount_percentage, description, offer_image, active, start_date, end_date, promo_type, contact } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO offers (offer_name, offer_type, target_id, discount_percentage, description, offer_image, active, start_date, end_date, promo_type, contact)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [offer_name, offer_type, target_id, discount_percentage, description, offer_image, active !== false ? 1 : 0, start_date, end_date, promo_type, contact]
    );
    res.json({ id: result.insertId, ...req.body });
  } catch (err) {
    console.error('createOffer error', err);
    res.status(500).json({ error: 'Insert failed' });
  }
}

async function updateOffer(req, res) {
  const { id } = req.params;
  const { offer_name, offer_type, target_id, discount_percentage, description, offer_image, active, start_date, end_date, promo_type, contact } = req.body;
  try {
    await db.query(
      `UPDATE offers SET offer_name=?, offer_type=?, target_id=?, discount_percentage=?, description=?, offer_image=?, active=?, start_date=?, end_date=?, promo_type=?, contact=?
       WHERE id=?`,
      [offer_name, offer_type, target_id, discount_percentage, description, offer_image, active ? 1 : 0, start_date, end_date, promo_type, contact, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('updateOffer error', err);
    res.status(500).json({ error: 'Update failed' });
  }
}

async function deleteOffer(req, res) {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM offers WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('deleteOffer error', err);
    res.status(500).json({ error: 'Delete failed' });
  }
}

module.exports = { getAllOffers, createOffer, updateOffer, deleteOffer };
