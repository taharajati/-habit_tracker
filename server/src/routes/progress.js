const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Get progress for a specific habit
router.get('/habit/:habitId', auth, (req, res) => {
  db.all(
    'SELECT * FROM habitProgress WHERE habitId = ? AND userId = ? ORDER BY progressDate DESC',
    [req.params.habitId, req.user.id],
    (err, progress) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }
      res.json(progress);
    }
  );
});

// Record progress for a habit
router.post('/', auth, (req, res) => {
  const { habitId, completed, timeSpent, mood, notes } = req.body;

  db.run(
    `INSERT INTO habitProgress (userId, habitId, completed, timeSpent, mood, notes, progressDate)
     VALUES (?, ?, ?, ?, ?, ?, date('now'))`,
    [req.user.id, habitId, completed, timeSpent, mood, notes],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }

      // Update habit streak and completion
      if (completed) {
        db.run(
          `UPDATE habits 
           SET currentStreak = currentStreak + 1,
               totalCompletion = totalCompletion + 1
           WHERE id = ? AND userId = ?`,
          [habitId, req.user.id]
        );
      } else {
        db.run(
          `UPDATE habits 
           SET currentStreak = 0
           WHERE id = ? AND userId = ?`,
          [habitId, req.user.id]
        );
      }

      db.get('SELECT * FROM habitProgress WHERE id = ?', [this.lastID], (err, progress) => {
        if (err) {
          return res.status(500).json({ message: 'Server error' });
        }
        res.status(201).json(progress);
      });
    }
  );
});

// Get progress summary for all habits
router.get('/summary', auth, (req, res) => {
  db.all(
    `SELECT h.name, h.category, h.currentStreak, h.totalCompletion,
            COUNT(hp.id) as totalProgress,
            SUM(CASE WHEN hp.completed = 1 THEN 1 ELSE 0 END) as completedCount
     FROM habits h
     LEFT JOIN habitProgress hp ON h.id = hp.habitId
     WHERE h.userId = ?
     GROUP BY h.id`,
    [req.user.id],
    (err, summary) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }
      res.json(summary);
    }
  );
});

// Get progress data for the progress page
router.get('/', auth, async (req, res) => {
  try {
    const { timeRange } = req.query; // 'week' or 'month'
    let dateFilter;
    
    switch (timeRange) {
      case 'week':
        dateFilter = "date('now', '-7 days')";
        break;
      case 'month':
        dateFilter = "date('now', '-30 days')";
        break;
      default:
        dateFilter = "date('now', '-7 days')"; // default to week
    }

    // Get daily completion data for chart
    const dailyProgress = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          date(hp.progressDate) as date,
          COUNT(DISTINCT h.id) as total_habits,
          SUM(CASE WHEN hp.completed = 1 THEN 1 ELSE 0 END) as completed_habits
         FROM habits h
         LEFT JOIN habitProgress hp ON h.id = hp.habitId
         WHERE h.user_id = ? AND hp.progressDate >= ${dateFilter}
         GROUP BY date(hp.progressDate)
         ORDER BY date(hp.progressDate) ASC`,
        [req.user.id],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });

    // Get individual habit progress
    const habits = await new Promise((resolve, reject) => {
      db.all(
        `SELECT 
          h.id as habit_id,
          h.name as habit_name,
          h.frequency,
          COUNT(DISTINCT hp.progressDate) as total_days,
          SUM(CASE WHEN hp.completed = 1 THEN 1 ELSE 0 END) as completed_days,
          ROUND(
            CAST(SUM(CASE WHEN hp.completed = 1 THEN 1 ELSE 0 END) AS FLOAT) / 
            CAST(
              CASE h.frequency
                WHEN 'daily' THEN julianday('now') - julianday(h.created_at)
                WHEN 'weekly' THEN (julianday('now') - julianday(h.created_at)) / 7
                WHEN 'monthly' THEN (julianday('now') - julianday(h.created_at)) / 30
              END
            AS FLOAT) * 100, 
          2) as completion_rate
         FROM habits h
         LEFT JOIN habitProgress hp ON h.id = hp.habitId 
         WHERE h.user_id = ? AND hp.progressDate >= ${dateFilter}
         GROUP BY h.id
         ORDER BY completion_rate DESC`,
        [req.user.id],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });

    res.json({
      habits,
      daily: dailyProgress
    });
  } catch (err) {
    console.error('Get progress error:', err);
    res.status(500).json({ message: 'خطا در دریافت پیشرفت' });
  }
});

module.exports = router; 