const db = require('./database');
const bcrypt = require('bcryptjs');

const initDb = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Enable foreign keys
      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) {
          console.error('Error enabling foreign keys:', err);
          reject(err);
          return;
        }

        // Create users table
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, async (err) => {
          if (err) {
            console.error('Error creating users table:', err);
            reject(err);
            return;
          }
          console.log('Users table created successfully');
          
          // Add default user if not exists
          const defaultUser = {
            name: 'تها رجاتی',
            email: 'silent.taha.rjt@gmail.com',
            password: await bcrypt.hash('taha123', 10)
          };

          db.get('SELECT * FROM users WHERE email = ?', [defaultUser.email], async (err, user) => {
            if (err) {
              console.error('Error checking default user:', err);
              reject(err);
              return;
            }

            if (!user) {
              db.run(
                'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
                [defaultUser.name, defaultUser.email, defaultUser.password],
                (err) => {
                  if (err) {
                    console.error('Error creating default user:', err);
                  } else {
                    console.log('Default user created successfully');
                  }
                  createOtherTables();
                }
              );
            } else {
              console.log('Default user already exists');
              createOtherTables();
            }
          });
        });
      });
    });

    const createOtherTables = () => {
      // Create habits table
      db.run(`
        CREATE TABLE IF NOT EXISTS habits (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          frequency TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating habits table:', err);
        } else {
          console.log('Habits table created successfully');
        }
        createHabitProgressTable();
      });
    };

    const createHabitProgressTable = () => {
      // Create habit_progress table
      db.run(`
        CREATE TABLE IF NOT EXISTS habit_progress (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          habit_id INTEGER NOT NULL,
          completed BOOLEAN DEFAULT 0,
          date DATE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (habit_id) REFERENCES habits (id),
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating habit_progress table:', err);
        } else {
          console.log('Habit progress table created successfully');
        }
        createMoodsTable();
      });
    };

    const createMoodsTable = () => {
      // Create moods table
      db.run(`
        CREATE TABLE IF NOT EXISTS moods (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          mood_value INTEGER NOT NULL,
          notes TEXT,
          date DATE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating moods table:', err);
        } else {
          console.log('Moods table created successfully');
        }
        createChallengesTable();
      });
    };

    const createChallengesTable = () => {
      // Create challenges table
      db.run(`
        CREATE TABLE IF NOT EXISTS challenges (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          startDate DATE NOT NULL,
          endDate DATE NOT NULL,
          challengeType TEXT NOT NULL,
          reward TEXT,
          challengeCriteria TEXT,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating challenges table:', err);
        } else {
          console.log('Challenges table created successfully');
        }
        createChallengeParticipantsTable();
      });
    };

    const createChallengeParticipantsTable = () => {
      // Create challenge_participants table
      db.run(`
        CREATE TABLE IF NOT EXISTS challenge_participants (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          challenge_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (challenge_id) REFERENCES challenges (id),
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating challenge_participants table:', err);
        } else {
          console.log('Challenge participants table created successfully');
        }
        resolve();
      });
    };
  });
};

module.exports = initDb;