require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const habitRoutes = require('./routes/habits');
const moodRoutes = require('./routes/mood');
const progressRoutes = require('./routes/progress');
const challengeRoutes = require('./routes/challenges');
const auth = require('./middleware/auth');
const db = require('./config/database');
const initDb = require('./config/init-db');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://5.34.204.73:3001', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/habits', auth, habitRoutes);
app.use('/api/mood', auth, moodRoutes);
app.use('/api/progress', auth, progressRoutes);
app.use('/api/challenges', auth, challengeRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: 'خطا در سرور',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

const PORT = process.env.PORT || 5000;

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database
    await initDb();
    console.log('Database initialized successfully');

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();