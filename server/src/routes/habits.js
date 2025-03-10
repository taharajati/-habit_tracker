const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all habits for the current user
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const habits = await new Promise((resolve, reject) => {
      db.all(
        `SELECT h.*, 
          (SELECT COUNT(*) FROM habitProgress 
           WHERE habitId = h.id AND userId = h.user_id AND completed = 1) as total_completion,
          (SELECT COUNT(*) FROM habitProgress 
           WHERE habitId = h.id AND userId = h.user_id) as total_days,
          (SELECT completed FROM habitProgress 
           WHERE habitId = h.id AND userId = h.user_id AND progressDate = ?
           LIMIT 1) as today_status,
          (SELECT GROUP_CONCAT(progressDate || ':' || completed) 
           FROM habitProgress 
           WHERE habitId = h.id AND userId = h.user_id 
           AND progressDate >= date(?, '-30 days')
           ORDER BY progressDate DESC) as recent_progress,
          (SELECT COUNT(*) FROM (
            SELECT progressDate, completed,
                   ROW_NUMBER() OVER (ORDER BY progressDate DESC) as rn,
                   ROW_NUMBER() OVER (ORDER BY progressDate DESC) - 
                   ROW_NUMBER() OVER (PARTITION BY completed ORDER BY progressDate DESC) as grp
            FROM habitProgress
            WHERE habitId = h.id AND userId = h.user_id
            ORDER BY progressDate DESC
          ) WHERE completed = 1 AND grp = 1) as current_streak
        FROM habits h 
        WHERE h.user_id = ?
        ORDER BY h.created_at DESC`,
        [targetDate, targetDate, req.user.id],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });

    // Process the habits to format recent progress
    const processedHabits = habits.map(habit => {
      let recentProgress = {};
      if (habit.recent_progress) {
        habit.recent_progress.split(',').forEach(progress => {
          const [date, completed] = progress.split(':');
          recentProgress[date] = completed === '1';
        });
      }

      // Calculate completion rate based on frequency
      let completionRate = 0;
      const today = new Date(targetDate);
      const startDate = new Date(habit.startDate);
      const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

      switch (habit.frequency) {
        case 'daily':
          completionRate = (habit.total_completion / daysSinceStart) * 100;
          break;
        case 'weekly':
          const weeksSinceStart = Math.ceil(daysSinceStart / 7);
          completionRate = (habit.total_completion / weeksSinceStart) * 100;
          break;
        case 'monthly':
          const monthsSinceStart = Math.ceil(daysSinceStart / 30);
          completionRate = (habit.total_completion / monthsSinceStart) * 100;
          break;
      }

      return {
        ...habit,
        recentProgress,
        completionRate: Math.min(Math.round(completionRate), 100),
        currentStreak: habit.current_streak || 0
      };
    });

    res.json(processedHabits);
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
      db.run('DELETE FROM habitProgress WHERE habitId = ?', [id], (err) => {
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
    const { completed, date } = req.body;

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

    const targetDate = date || new Date().toISOString().split('T')[0];

    // Check if the habit should be completed on this date based on frequency
    const today = new Date(targetDate);
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayOfMonth = today.getDate();

    let shouldComplete = false;
    switch (habit.frequency) {
      case 'daily':
        shouldComplete = true;
        break;
      case 'weekly':
        // For weekly habits, only allow completion on the same day of the week as the start date
        const startDate = new Date(habit.startDate);
        shouldComplete = startDate.getDay() === dayOfWeek;
        break;
      case 'monthly':
        // For monthly habits, only allow completion on the same day of the month as the start date
        const startDay = new Date(habit.startDate).getDate();
        shouldComplete = startDay === dayOfMonth;
        break;
    }

    if (!shouldComplete) {
      return res.status(400).json({ 
        message: `این عادت ${habit.frequency === 'weekly' ? 'هفتگی' : 'ماهانه'} است و فقط در روزهای مشخص شده قابل انجام است.` 
      });
    }

    await new Promise((resolve, reject) => {
      db.run(
        'INSERT OR REPLACE INTO habitProgress (habitId, userId, completed, progressDate) VALUES (?, ?, ?, ?)',
        [id, req.user.id, completed ? 1 : 0, targetDate],
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
        `SELECT progressDate as date, completed
         FROM habitProgress
         WHERE habitId = ? AND progressDate >= ${dateFilter}
         ORDER BY progressDate ASC`,
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