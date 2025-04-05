-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  fullName TEXT,
  profilePicture TEXT,
  gender TEXT,
  dateOfBirth TEXT,
  phoneNumber TEXT,
  address TEXT,
  registrationDate TEXT DEFAULT CURRENT_TIMESTAMP,
  lastLoginDate TEXT,
  notificationSettings TEXT,
  language TEXT DEFAULT 'en',
  userType TEXT DEFAULT 'user',
  accountStatus TEXT DEFAULT 'active',
  location TEXT,
  totalAchievements INTEGER DEFAULT 0,
  userRank INTEGER DEFAULT 0
);

-- Habits table
CREATE TABLE IF NOT EXISTS habits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  frequency TEXT NOT NULL,
  startDate TEXT DEFAULT CURRENT_TIMESTAMP,
  endDate TEXT,
  targetGoal INTEGER,
  isActive INTEGER DEFAULT 1,
  habitType TEXT,
  priorityLevel TEXT,
  currentStreak INTEGER DEFAULT 0,
  totalCompletion INTEGER DEFAULT 0,
  reminderTime TEXT,
  rewardCriteria TEXT,
  customSettings TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Habit Progress table
CREATE TABLE IF NOT EXISTS habitProgress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  habitId INTEGER NOT NULL,
  progressDate TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  timeSpent INTEGER,
  mood TEXT,
  notes TEXT,
  rewardGiven INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  streakBroken INTEGER DEFAULT 0,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (habitId) REFERENCES habits(id),
  UNIQUE(userId, habitId, progressDate)
);

-- Mood table
CREATE TABLE IF NOT EXISTS mood (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  moodDate TEXT NOT NULL,
  moodValue TEXT NOT NULL,
  moodDescription TEXT,
  moodCategory TEXT,
  duration INTEGER,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  startDate TEXT NOT NULL,
  endDate TEXT NOT NULL,
  challengeType TEXT NOT NULL,
  reward TEXT,
  challengeCriteria TEXT,
  status TEXT DEFAULT 'active',
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Challenge Participants table
CREATE TABLE IF NOT EXISTS challengeParticipants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  challengeId INTEGER NOT NULL,
  userId INTEGER NOT NULL,
  joinedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (challengeId) REFERENCES challenges(id),
  FOREIGN KEY (userId) REFERENCES users(id),
  UNIQUE(challengeId, userId)
);

-- Friends table
CREATE TABLE IF NOT EXISTS friends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  friendId INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (friendId) REFERENCES users(id),
  UNIQUE(userId, friendId)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_habits_userId ON habits(userId);
CREATE INDEX IF NOT EXISTS idx_habitProgress_userId ON habitProgress(userId);
CREATE INDEX IF NOT EXISTS idx_habitProgress_habitId ON habitProgress(habitId);
CREATE INDEX IF NOT EXISTS idx_mood_userId ON mood(userId);
CREATE INDEX IF NOT EXISTS idx_challengeParticipants_challengeId ON challengeParticipants(challengeId);
CREATE INDEX IF NOT EXISTS idx_challengeParticipants_userId ON challengeParticipants(userId);
CREATE INDEX IF NOT EXISTS idx_friends_userId ON friends(userId);
CREATE INDEX IF NOT EXISTS idx_friends_friendId ON friends(friendId);