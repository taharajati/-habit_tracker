const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all habits for the current user
router.get('/', async (req, res) => {
  try {
    const habits = await new Promise((resolve, reject) => {
      db.all(
        `SELECT h.*, 
          (SELECT COUNT(*) FROM habit_progress 
           WHERE habit_id = h.id AND user_id = h.user_id AND completed = 1) as total_completion,
          (SELECT COUNT(*) FROM habit_progress 
           WHERE habit_id = h.id AND user_id = h.user_id) as total_days,
          (SELECT completed FROM habit_progress 
           WHERE habit_id = h.id AND user_id = h.user_id AND date = date('now', 'localtime')
           LIMIT 1) as today_status
        FROM habits h 
        WHERE h.user_id = ?
        ORDER BY h.created_at DESC`,
        [req.user.id],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });

    res.json(habits);
  } catch (err) {
    console.error('Get habits error:', err);
    res.status(500).json({ message: 'خطا در دریافت عادت‌ها' });
  }
});

// Create a new habit
router.post('/', async (req, res) => {
  try {
    const { name, description, frequency } = req.body;

    if (!name || !frequency) {
      return res.status(400).json({ message: 'لطفاً نام و تناوب عادت را وارد کنید' });
    }

    const result = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO habits (user_id, name, description, frequency) VALUES (?, ?, ?, ?)',
        [req.user.id, name, description, frequency],
        function(err) {
          if (err) reject(err);
          resolve(this.lastID);
        }
      );
    });

    const habit = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM habits WHERE id = ?', [result], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    res.status(201).json(habit);
  } catch (err) {
    console.error('Create habit error:', err);
    res.status(500).json({ message: 'خطا در ایجاد عادت' });
  }
});

// Update a habit
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, frequency } = req.body;

    if (!name || !frequency) {
      return res.status(400).json({ message: 'لطفاً نام و تناوب عادت را وارد کنید' });
    }

    // Check if habit exists and belongs to user
    const habit = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM habits WHERE id = ? AND user_id = ?',
        [id, req.user.id],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    if (!habit) {
      return res.status(404).json({ message: 'عادت مورد نظر یافت نشد' });
    }

    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE habits SET name = ?, description = ?, frequency = ? WHERE id = ?',
        [name, description, frequency, id],
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });

    const updatedHabit = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM habits WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    res.json(updatedHabit);
  } catch (err) {
    console.error('Update habit error:', err);
    res.status(500).json({ message: 'خطا در بروزرسانی عادت' });
  }
});

// Delete a habit
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if habit exists and belongs to user
    const habit = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM habits WHERE id = ? AND user_id = ?',
        [id, req.user.id],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    if (!habit) {
      return res.status(404).json({ message: 'عادت مورد نظر یافت نشد' });
    }

    // Delete habit progress first
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM habit_progress WHERE habit_id = ?', [id], (err) => {
        if (err) reject(err);
        resolve();
      });
    });

    // Then delete the habit
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM habits WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        resolve();
      });
    });

    res.json({ message: 'عادت با موفقیت حذف شد' });
  } catch (err) {
    console.error('Delete habit error:', err);
    res.status(500).json({ message: 'خطا در حذف عادت' });
  }
});

// Toggle habit completion
router.patch('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;

    if (typeof completed !== 'boolean') {
      return res.status(400).json({ message: 'وضعیت تکمیل نامعتبر است' });
    }

    // Check if habit exists and belongs to user
    const habit = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM habits WHERE id = ? AND user_id = ?',
        [id, req.user.id],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    if (!habit) {
      return res.status(404).json({ message: 'عادت مورد نظر یافت نشد' });
    }

    const today = new Date().toISOString().split('T')[0];

    await new Promise((resolve, reject) => {
      db.run(
        'INSERT OR REPLACE INTO habit_progress (habit_id, user_id, completed, date) VALUES (?, ?, ?, ?)',
        [id, req.user.id, completed ? 1 : 0, today],
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });

    res.json({ message: 'وضعیت عادت با موفقیت بروزرسانی شد' });
  } catch (err) {
    console.error('Toggle habit completion error:', err);
    res.status(500).json({ message: 'خطا در بروزرسانی وضعیت عادت' });
  }
});

// Get habit statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const { period } = req.query; // 'week', 'month', 'year'

    // Check if habit exists and belongs to user
    const habit = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM habits WHERE id = ? AND user_id = ?',
        [id, req.user.id],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    if (!habit) {
      return res.status(404).json({ message: 'عادت مورد نظر یافت نشد' });
    }

    let dateFilter;
    switch (period) {
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
        `SELECT date, completed
         FROM habit_progress
         WHERE habit_id = ? AND date >= ${dateFilter}
         ORDER BY date ASC`,
        [id],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });

    res.json(stats);
  } catch (err) {
    console.error('Get habit stats error:', err);
    res.status(500).json({ message: 'خطا در دریافت آمار عادت' });
  }
});

module.exports = router; 