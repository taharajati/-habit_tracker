const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Get all moods for the current user
router.get('/', async (req, res) => {
  try {
    const { timeRange } = req.query; // 'week', 'month', 'year'
    let dateFilter;
    
    switch (timeRange) {
      case 'week':
        dateFilter = "date('now', '-7 days')";
        break;
      case 'month':
        dateFilter = "date('now', '-1 month')";
        break;
      case 'year':
        dateFilter = "date('now', '-1 year')";
        break;
      default:
        dateFilter = "date('now', '-30 days')"; // default to last 30 days
    }

    const moods = await new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM moods 
         WHERE user_id = ? AND date >= ${dateFilter}
         ORDER BY date DESC`,
        [req.user.id],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });

    res.json(moods);
  } catch (err) {
    console.error('Get moods error:', err);
    res.status(500).json({ message: 'خطا در دریافت حالت‌ها' });
  }
});

// Create a new mood entry
router.post('/', async (req, res) => {
  try {
    const { level, note } = req.body;

    if (typeof level !== 'number' || level < 1 || level > 5) {
      return res.status(400).json({ message: 'لطفاً یک عدد بین ۱ تا ۵ وارد کنید' });
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if mood already exists for today
    const existingMood = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM moods WHERE user_id = ? AND date = ?',
        [req.user.id, today],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    if (existingMood) {
      // Update existing mood
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE moods SET mood_value = ?, notes = ? WHERE id = ?',
          [level, note, existingMood.id],
          (err) => {
            if (err) reject(err);
            resolve();
          }
        );
      });
    } else {
      // Create new mood
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO moods (user_id, mood_value, notes, date) VALUES (?, ?, ?, ?)',
          [req.user.id, level, note, today],
          (err) => {
            if (err) reject(err);
            resolve();
          }
        );
      });
    }

    res.status(201).json({ message: 'حالت با موفقیت ثبت شد' });
  } catch (err) {
    console.error('Create mood error:', err);
    res.status(500).json({ message: 'خطا در ثبت حالت' });
  }
});

// Get mood statistics
router.get('/stats', async (req, res) => {
  try {
    const { timeRange } = req.query; // 'week', 'month', 'year'
    let dateFilter;
    
    switch (timeRange) {
      case 'week':
        dateFilter = "date('now', '-7 days')";
        break;
      case 'month':
        dateFilter = "date('now', '-1 month')";
        break;
      case 'year':
        dateFilter = "date('now', '-1 year')";
        break;
      default:
        dateFilter = "date('now', '-30 days')"; // default to last 30 days
    }

    const stats = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          AVG(mood_value) as average_mood,
          MIN(mood_value) as lowest_mood,
          MAX(mood_value) as highest_mood,
          COUNT(*) as total_entries
         FROM moods 
         WHERE user_id = ? AND date >= ${dateFilter}`,
        [req.user.id],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows[0]);
        }
      );
    });

    res.json(stats);
  } catch (err) {
    console.error('Get mood stats error:', err);
    res.status(500).json({ message: 'خطا در دریافت آمار حالت‌ها' });
  }
});

module.exports = router; 