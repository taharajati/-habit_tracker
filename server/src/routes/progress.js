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

    // Get individual habit progress
    const habits = await new Promise((resolve, reject) => {
      db.all(
        `WITH habit_dates AS (
          SELECT 
            h.id as habit_id,
            h.name as habit_name,
            h.frequency,
            h.created_at,
            julianday('now') - julianday(h.created_at) as days_since_start,
            CASE h.frequency
              WHEN 'daily' THEN julianday('now') - julianday(h.created_at)
              WHEN 'weekly' THEN (
                SELECT COUNT(*) 
                FROM (
                  SELECT date(h.created_at, '+' || (n || ' days')) as week_date
                  FROM (
                    WITH RECURSIVE numbers(n) AS (
                      SELECT 0
                      UNION ALL
                      SELECT n + 7 FROM numbers WHERE n < julianday('now') - julianday(h.created_at)
                    )
                    SELECT n FROM numbers
                  )
                )
                WHERE week_date <= date('now')
              )
              WHEN 'monthly' THEN (
                SELECT COUNT(*) 
                FROM (
                  SELECT date(h.created_at, '+' || (n || ' months')) as month_date
                  FROM (
                    WITH RECURSIVE numbers(n) AS (
                      SELECT 0
                      UNION ALL
                      SELECT n + 1 FROM numbers WHERE n < (julianday('now') - julianday(h.created_at)) / 30
                    )
                    SELECT n FROM numbers
                  )
                )
                WHERE month_date <= date('now')
              )
            END as expected_completions
          FROM habits h
          WHERE h.user_id = ?
        )
        SELECT 
          hd.*,
          COUNT(DISTINCT hp.progressDate) as total_days,
          SUM(CASE WHEN hp.completed = 1 THEN 1 ELSE 0 END) as completed_days,
          ROUND(
            CAST(SUM(CASE WHEN hp.completed = 1 THEN 1 ELSE 0 END) AS FLOAT) / 
            CAST(hd.expected_completions AS FLOAT) * 100, 
            2) as completion_rate
        FROM habit_dates hd
        LEFT JOIN habitProgress hp ON hd.habit_id = hp.habitId 
        WHERE hp.progressDate >= ${dateFilter}
        GROUP BY hd.habit_id
        ORDER BY completion_rate DESC`,
        [req.user.id],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });

    // Get daily completion data for chart
    const dailyProgress = await new Promise((resolve, reject) => {
      db.all(
        `WITH RECURSIVE dates(date) AS (
          SELECT date(${dateFilter})
          UNION ALL
          SELECT date(date, '+1 day')
          FROM dates
          WHERE date < date('now')
        ),
        weekly_dates AS (
          SELECT 
            date,
            CASE 
              WHEN strftime('%w', date) = '6' THEN date  -- Saturday
              ELSE date(date, '+' || (6 - CAST(strftime('%w', date) AS INTEGER)) || ' days')
            END as week_end_date
          FROM dates
        ),
        weekly_habits AS (
          SELECT 
            h.id,
            h.created_at,
            date(h.created_at, '+' || (n || ' days')) as week_end_date
          FROM habits h
          CROSS JOIN (
            WITH RECURSIVE numbers(n) AS (
              SELECT 0
              UNION ALL
              SELECT n + 7 FROM numbers WHERE n < julianday('now') - julianday(h.created_at)
            )
            SELECT n FROM numbers
          )
          WHERE h.frequency = 'weekly'
        ),
        daily_expected AS (
          SELECT 
            d.date,
            d.week_end_date,
            COUNT(DISTINCT h.id) as total_habits,
            SUM(CASE 
              WHEN h.frequency = 'daily' THEN 1
              WHEN h.frequency = 'weekly' AND EXISTS (
                SELECT 1 FROM weekly_habits wh 
                WHERE wh.id = h.id AND wh.week_end_date = d.week_end_date
              ) THEN 1
              WHEN h.frequency = 'monthly' AND strftime('%d', d.date) = strftime('%d', h.created_at) THEN 1
              ELSE 0
            END) as expected_habits
          FROM weekly_dates d
          CROSS JOIN habits h
          WHERE h.user_id = ?
          GROUP BY d.date
        )
        SELECT 
          de.date,
          de.total_habits,
          de.expected_habits,
          SUM(CASE WHEN hp.completed = 1 THEN 1 ELSE 0 END) as completed_habits
        FROM daily_expected de
        LEFT JOIN habitProgress hp ON date(hp.progressDate) = de.date
        LEFT JOIN habits h ON hp.habitId = h.id
        WHERE h.user_id = ?
        GROUP BY de.date
        ORDER BY de.date ASC`,
        [req.user.id, req.user.id],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });

    // Process the data to calculate correct percentages
    const processedDailyProgress = dailyProgress.map(day => ({
      ...day,
      completion_rate: day.expected_habits > 0 
        ? Math.round((day.completed_habits / day.expected_habits) * 100)
        : 0
    }));

    res.json({
      habits,
      daily: processedDailyProgress
    });
  } catch (err) {
    console.error('Get progress error:', err);
    res.status(500).json({ message: 'خطا در دریافت پیشرفت' });
  }
});

module.exports = router; 