import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { habitService, moodService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  ChartBarIcon,
  HeartIcon,
  UserGroupIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    habits: [],
    todayMood: null,
    streakCount: 0
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [habitsResponse, moodsResponse] = await Promise.all([
        habitService.getHabits(),
        moodService.getMoods('week')
      ]);

      const habits = habitsResponse.data;
      const moods = moodsResponse.data;
      
      // Calculate streak count
      const streakCount = habits.reduce((max, habit) => 
        Math.max(max, habit.currentStreak || 0), 0);

      setStats({
        habits: habits.slice(0, 5), // Show only 5 most recent habits
        todayMood: moods[0], // Most recent mood
        streakCount
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 fade-in">
      {/* Welcome Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">
            سلام {user?.name}! 👋
          </h1>
          <p className="text-text-secondary">
            امروز روز خوبی برای ساختن عادت‌های جدیده!
          </p>
        </div>
        {stats.todayMood && (
          <div className="card p-4 flex items-center gap-3">
            <span className="text-2xl">
              {stats.todayMood.level === 5 ? '🤩' :
               stats.todayMood.level === 4 ? '😊' :
               stats.todayMood.level === 3 ? '😐' :
               stats.todayMood.level === 2 ? '😕' : '😢'}
            </span>
            <div>
              <div className="text-sm text-text-secondary">حال و احوال امروز</div>
              <div className="font-medium">
                {stats.todayMood.level === 5 ? 'عالی' :
                 stats.todayMood.level === 4 ? 'خوب' :
                 stats.todayMood.level === 3 ? 'معمولی' :
                 stats.todayMood.level === 2 ? 'بد' : 'خیلی بد'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="card p-6">
          <div className="text-4xl mb-4">✨</div>
          <div className="text-2xl font-bold">{stats.habits.length}</div>
          <div className="text-text-secondary">عادت فعال</div>
        </div>
        
        <div className="card p-6">
          <div className="text-4xl mb-4">🔥</div>
          <div className="text-2xl font-bold">{stats.streakCount}</div>
          <div className="text-text-secondary">بیشترین رکورد</div>
        </div>

        <div className="card p-6">
          <div className="text-4xl mb-4">📊</div>
          <div className="text-2xl font-bold">
            {Math.round(
              (stats.habits.filter(h => h.today_status === 1).length / stats.habits.length) * 100
            )}%
          </div>
          <div className="text-text-secondary">تکمیل امروز</div>
        </div>
      </div>

      {/* Recent Habits */}
      {stats.habits.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">عادت‌های اخیر</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stats.habits.map(habit => (
              <div key={habit.id} className="card p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{habit.name}</h3>
                    <p className="text-sm text-text-secondary">{habit.description}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-sm ${
                    habit.today_status === 1
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {habit.today_status === 1 ? 'انجام شده' : 'در انتظار'}
                  </div>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{ 
                      width: `${habit.total_days > 0 ? (habit.total_completion / habit.total_days) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 