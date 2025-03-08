const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Get all challenges
router.get('/', async (req, res) => {
  try {
    const challenges = await new Promise((resolve, reject) => {
      db.all(
        `SELECT c.*, 
          (SELECT COUNT(*) FROM challenge_participants WHERE challenge_id = c.id) as participant_count,
          EXISTS(
            SELECT 1 FROM challenge_participants 
            WHERE challenge_id = c.id AND user_id = ?
          ) as is_joined
         FROM challenges c
         WHERE c.status = 'active'
         ORDER BY c.created_at DESC`,
        [req.user.id],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });

    res.json(challenges);
  } catch (err) {
    console.error('Get challenges error:', err);
    res.status(500).json({ message: 'خطا در دریافت چالش‌ها' });
  }
});

// Create a new challenge
router.post('/', async (req, res) => {
  try {
    const { name, description, startDate, endDate, challengeType, reward, challengeCriteria } = req.body;

    if (!name || !startDate || !endDate || !challengeType) {
      return res.status(400).json({ message: 'لطفاً تمام فیلدهای ضروری را پر کنید' });
    }

    const result = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO challenges (
          name, description, startDate, endDate, 
          challengeType, reward, challengeCriteria
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, description, startDate, endDate, challengeType, reward, challengeCriteria],
        function(err) {
          if (err) reject(err);
          resolve(this.lastID);
        }
      );
    });

    // Automatically join the creator to the challenge
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO challenge_participants (challenge_id, user_id) VALUES (?, ?)',
        [result, req.user.id],
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });

    const challenge = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM challenges WHERE id = ?', [result], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    res.status(201).json(challenge);
  } catch (err) {
    console.error('Create challenge error:', err);
    res.status(500).json({ message: 'خطا در ایجاد چالش' });
  }
});

// Join a challenge
router.post('/:id/join', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if challenge exists and is active
    const challenge = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM challenges WHERE id = ? AND status = ?',
        [id, 'active'],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    if (!challenge) {
      return res.status(404).json({ message: 'چالش مورد نظر یافت نشد یا فعال نیست' });
    }

    // Check if user is already participating
    const isParticipating = await new Promise((resolve, reject) => {
      db.get(
        'SELECT 1 FROM challenge_participants WHERE challenge_id = ? AND user_id = ?',
        [id, req.user.id],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });

    if (isParticipating) {
      return res.status(400).json({ message: 'شما قبلاً در این چالش شرکت کرده‌اید' });
    }

    // Join the challenge
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO challenge_participants (challenge_id, user_id) VALUES (?, ?)',
        [id, req.user.id],
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });

    res.json({ message: 'با موفقیت به چالش پیوستید' });
  } catch (err) {
    console.error('Join challenge error:', err);
    res.status(500).json({ message: 'خطا در پیوستن به چالش' });
  }
});

// Get challenge participants
router.get('/:id/participants', async (req, res) => {
  try {
    const { id } = req.params;

    const participants = await new Promise((resolve, reject) => {
      db.all(
        `SELECT u.id, u.name, cp.joined_at
         FROM challenge_participants cp
         JOIN users u ON cp.user_id = u.id
         WHERE cp.challenge_id = ?
         ORDER BY cp.joined_at ASC`,
        [id],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });

    res.json(participants);
  } catch (err) {
    console.error('Get challenge participants error:', err);
    res.status(500).json({ message: 'خطا در دریافت شرکت‌کنندگان چالش' });
  }
});

// Get user's challenges
router.get('/my', async (req, res) => {
  try {
    const challenges = await new Promise((resolve, reject) => {
      db.all(
        `SELECT c.*, 
          (SELECT COUNT(*) FROM challenge_participants WHERE challenge_id = c.id) as participant_count
         FROM challenges c
         JOIN challenge_participants cp ON c.id = cp.challenge_id
         WHERE cp.user_id = ?
         ORDER BY c.created_at DESC`,
        [req.user.id],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });

    res.json(challenges);
  } catch (err) {
    console.error('Get user challenges error:', err);
    res.status(500).json({ message: 'خطا در دریافت چالش‌های شما' });
  }
});

// Get challenge leaderboard
router.get('/:id/leaderboard', auth, (req, res) => {
  db.all(
    `SELECT u.username, 
            COUNT(DISTINCT hp.id) as totalProgress,
            SUM(CASE WHEN hp.completed = 1 THEN 1 ELSE 0 END) as completedCount
     FROM challengeParticipants cp
     JOIN users u ON cp.userId = u.id
     LEFT JOIN habitProgress hp ON cp.userId = hp.userId AND hp.progressDate BETWEEN 
       (SELECT startDate FROM challenges WHERE id = ?) AND 
       (SELECT endDate FROM challenges WHERE id = ?)
     WHERE cp.challengeId = ?
     GROUP BY cp.userId
     ORDER BY completedCount DESC`,
    [req.params.id, req.params.id, req.params.id],
    (err, leaderboard) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }
      res.json(leaderboard);
    }
  );
});

module.exports = router; 