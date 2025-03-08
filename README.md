# Habit Tracker

A full-stack application for tracking and managing daily habits, built with React.js, Node.js, Express.js, and SQLite.

## Features

- User authentication (register/login)
- Create and manage daily habits
- Track habit progress and streaks
- Record daily mood
- Participate in group challenges
- Social features (friends, leaderboards)
- Progress analytics and reporting

## Tech Stack

- Frontend: React.js with Tailwind CSS
- Backend: Node.js with Express.js
- Database: SQLite
- Authentication: JWT

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd habit_tracker
```

2. Install dependencies for both client and server:
```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

3. Set up environment variables:
- Copy `.env.example` to `.env` in the server directory
- Update the JWT_SECRET in the .env file

4. Initialize the database:
```bash
cd server
npm run init-db
```

5. Start the development servers:

In one terminal (backend):
```bash
cd server
npm run dev
```

In another terminal (frontend):
```bash
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Project Structure

```
habit_tracker/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/        # Page components
│   │   ├── context/      # React context
│   │   ├── hooks/        # Custom hooks
│   │   ├── services/     # API services
│   │   └── utils/        # Utility functions
│   └── public/           # Static files
│
└── server/               # Node.js backend
    ├── src/
    │   ├── config/      # Configuration files
    │   ├── controllers/ # Route controllers
    │   ├── middleware/  # Custom middleware
    │   ├── models/      # Data models
    │   └── routes/      # API routes
    └── database.sqlite  # SQLite database file
```

## API Endpoints

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user

### Habits
- GET /api/habits - Get all habits for the user
- POST /api/habits - Create a new habit
- PUT /api/habits/:id - Update a habit
- DELETE /api/habits/:id - Delete a habit

### Progress
- GET /api/progress/habit/:habitId - Get progress for a specific habit
- POST /api/progress - Record progress for a habit
- GET /api/progress/summary - Get progress summary for all habits

### Mood
- GET /api/mood/history - Get mood history
- POST /api/mood - Record mood
- GET /api/mood/analysis - Get mood analysis

### Challenges
- GET /api/challenges - Get all challenges
- POST /api/challenges - Create a new challenge
- POST /api/challenges/:id/join - Join a challenge
- GET /api/challenges/:id/leaderboard - Get challenge leaderboard

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 