import { useState, useEffect } from 'react';
import { habitService } from '../services/api';
import '../styles/global.css';

export default function Habits() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newHabit, setNewHabit] = useState({ name: '', description: '', frequency: 'daily' });
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchHabits();
  }, [selectedDate]);

  const fetchHabits = async () => {
    try {
      setLoading(true);
      const response = await habitService.getHabits(selectedDate);
      console.log('Received habits:', response.data);
      setHabits(response.data);
    } catch (err) {
      console.error('Error fetching habits:', err);
      setError(err.response?.data?.message || 'خطا در دریافت عادت‌ها');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await habitService.createHabit(newHabit);
      setNewHabit({ name: '', description: '', frequency: 'daily' });
      setShowForm(false);
      fetchHabits();
    } catch (err) {
      setError(err.response?.data?.message || 'خطا در ایجاد عادت جدید');
    }
  };

  const handleToggleComplete = async (habitId, completed) => {
    try {
      await habitService.toggleHabitComplete(habitId, completed, selectedDate);
      fetchHabits();
    } catch (err) {
      setError(err.response?.data?.message || 'خطا در بروزرسانی وضعیت عادت');
    }
  };

  const handleDelete = async (habitId) => {
    if (window.confirm('آیا از حذف این عادت مطمئن هستید؟')) {
      try {
        await habitService.deleteHabit(habitId);
        fetchHabits();
      } catch (err) {
        setError(err.response?.data?.message || 'خطا در حذف عادت');
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fa-IR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getProgressDays = (habit) => {
    if (!habit.recentProgress) return [];
    
    const today = new Date(selectedDate);
    const days = [];
    
    switch (habit.frequency) {
      case 'daily':
        return Object.entries(habit.recentProgress)
          .filter(([_, completed]) => completed)
          .map(([date]) => date);
      
      case 'weekly': {
        // Get all completed dates
        const completedDates = Object.entries(habit.recentProgress)
          .filter(([_, completed]) => completed)
          .map(([date]) => new Date(date));

        // For each completed date, mark its entire week (Saturday to Friday)
        completedDates.forEach(date => {
          const weekStart = new Date(date);
          // Set to Saturday (6)
          weekStart.setDate(date.getDate() - ((date.getDay() + 1) % 7));
          
          // Mark all 7 days of the week (Saturday to Friday)
          for (let i = 0; i < 7; i++) {
            const currentDate = new Date(weekStart);
            currentDate.setDate(weekStart.getDate() + i);
            const dateStr = currentDate.toISOString().split('T')[0];
            days.push(dateStr);
          }
        });
        
        return days;
      }
      
      case 'monthly': {
        // Get all completed dates
        const completedDates = Object.entries(habit.recentProgress)
          .filter(([_, completed]) => completed)
          .map(([date]) => new Date(date));

        // For each completed date, mark its entire month (1st to last day)
        completedDates.forEach(date => {
          const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          
          // Mark all days of the month from 1st to last day
          for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            days.push(dateStr);
          }
        });
        
        return days;
      }
      
      default:
        return [];
    }
  };

  const getProgressColor = (date, habit) => {
    try {
      const progressDays = getProgressDays(habit);
      const isCompleted = progressDays.includes(date);
      const isToday = date === selectedDate;
      const dateObj = new Date(date);
      
      // Check if this day should have been completed based on frequency
      let shouldBeCompleted = false;
      switch (habit.frequency) {
        case 'daily':
          shouldBeCompleted = true;
          break;
        case 'weekly': {
          const startDate = new Date(habit.startDate);
          const dayOfWeek = startDate.getDay();
          shouldBeCompleted = dateObj.getDay() === dayOfWeek;
          break;
        }
        case 'monthly': {
          const startDate = new Date(habit.startDate);
          shouldBeCompleted = dateObj.getDate() === startDate.getDate();
          break;
        }
      }
      
      if (isCompleted) {
        return isToday 
          ? 'bg-green-500 text-white ring-2 ring-primary' 
          : 'bg-green-100 text-green-700';
      } else if (shouldBeCompleted && dateObj < new Date(selectedDate)) {
        return isToday 
          ? 'bg-red-500 text-white ring-2 ring-primary' 
          : 'bg-red-100 text-red-700';
      }
      return isToday 
        ? 'bg-gray-100 text-gray-400 ring-2 ring-primary' 
        : 'bg-gray-100 text-gray-400';
    } catch (error) {
      console.error('Error in getProgressColor:', error);
      return 'bg-gray-100 text-gray-400';
    }
  };

  const canCompleteToday = (habit) => {
    const today = new Date(selectedDate);
    const dayOfWeek = today.getDay();
    const dayOfMonth = today.getDate();
    const startDate = new Date(habit.startDate);

    switch (habit.frequency) {
      case 'daily':
        return true;
      case 'weekly':
        return startDate.getDay() === dayOfWeek;
      case 'monthly':
        return startDate.getDate() === dayOfMonth;
      default:
        return true;
    }
  };

  // Calculate overall progress statistics
  const getProgressStats = () => {
    const stats = {
      daily: { total: 0, completed: 0 },
      weekly: { total: 0, completed: 0 },
      monthly: { total: 0, completed: 0 }
    };

    habits.forEach(habit => {
      stats[habit.frequency].total++;
      if (habit.today_status === 1) {
        stats[habit.frequency].completed++;
      }
    });

    return stats;
  };

  // Calculate individual habit progress
  const getHabitProgress = (habit) => {
    if (!habit.recentProgress) return { total: 0, completed: 0, percentage: 0 };
    
    const startDate = new Date(habit.startDate);
    const today = new Date(selectedDate);
    const completedDates = Object.entries(habit.recentProgress)
      .filter(([_, completed]) => completed)
      .map(([date]) => new Date(date));

    // Calculate how many times this habit should have been completed
    let expectedCompletions = 0;
    switch (habit.frequency) {
      case 'daily':
        // For daily habits, count all days from start date to today
        const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
        expectedCompletions = daysDiff + 1;
        break;
      
      case 'weekly': {
        // For weekly habits, count how many weeks have passed
        const weeksDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24 * 7));
        expectedCompletions = weeksDiff + 1;
        break;
      }
      
      case 'monthly': {
        // For monthly habits, count how many months have passed
        const monthsDiff = (today.getFullYear() - startDate.getFullYear()) * 12 + 
                          (today.getMonth() - startDate.getMonth());
        expectedCompletions = monthsDiff + 1;
        break;
      }
    }

    return {
      total: expectedCompletions,
      completed: completedDates.length,
      percentage: expectedCompletions > 0 ? Math.round((completedDates.length / expectedCompletions) * 100) : 0
    };
  };

  return (
    <div className="p-6 space-y-8 fade-in">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold gradient-text">عادت‌های روزانه</h1>
          <div className="flex items-center space-x-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input"
            />
            <span className="text-gray-600">{formatDate(selectedDate)}</span>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="button button-primary"
        >
          {showForm ? 'انصراف' : '➕ عادت جدید'}
        </button>
      </div>

      {/* Overall Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(getProgressStats()).map(([frequency, stats]) => (
          <div key={frequency} className="card p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {frequency === 'daily' ? 'عادت‌های روزانه' : 
               frequency === 'weekly' ? 'عادت‌های هفتگی' : 
               'عادت‌های ماهانه'}
            </h3>
            <div className="space-y-2">
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>تکمیل شده: {stats.completed}</span>
                <span>کل: {stats.total}</span>
                <span>{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          {error}
        </div>
      )}

      {showForm && (
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نام عادت
              </label>
              <input
                type="text"
                required
                className="input"
                value={newHabit.name}
                onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                placeholder="مثال: ورزش روزانه"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                توضیحات
              </label>
              <textarea
                className="input min-h-[100px]"
                value={newHabit.description}
                onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                placeholder="توضیحات عادت را وارد کنید..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تناوب
              </label>
              <select
                className="input"
                value={newHabit.frequency}
                onChange={(e) => setNewHabit({ ...newHabit, frequency: e.target.value })}
              >
                <option value="daily">روزانه</option>
                <option value="weekly">هفتگی</option>
                <option value="monthly">ماهانه</option>
              </select>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="button button-primary">
                ایجاد عادت
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="loading-spinner"></div>
        </div>
      ) : !habits || habits.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-lg text-gray-600">هنوز هیچ عادتی ثبت نشده است.</p>
          <button
            onClick={() => setShowForm(true)}
            className="button button-secondary mt-4"
          >
            ایجاد اولین عادت
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {habits.map((habit) => {
            const progress = getHabitProgress(habit);
            return (
              <div key={habit.id} className="card p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {habit.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{habit.description}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(habit.id)}
                    className="p-1.5 bg-white hover:bg-[var(--danger-light)] rounded-lg transition-all duration-200 group"
                    title="حذف عادت"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 text-gray-400 group-hover:text-[var(--danger)] transition-colors duration-200"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                      />
                    </svg>
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {habit.frequency === 'daily'
                      ? 'روزانه'
                      : habit.frequency === 'weekly'
                      ? 'هفتگی'
                      : 'ماهانه'}
                  </span>
                  <button
                    onClick={() => handleToggleComplete(habit.id, habit.today_status !== 1)}
                    disabled={!canCompleteToday(habit)}
                    className={`button ${
                      habit.today_status === 1 ? 'button-primary' : 'button-secondary'
                    } ${!canCompleteToday(habit) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {habit.today_status === 1 ? '✅ انجام شد' : '⭕️ انجام نشده'}
                  </button>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">پیشرفت این عادت:</h4>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${progress.percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>تکمیل شده: {progress.completed}</span>
                    <span>کل: {progress.total}</span>
                    <span>{progress.percentage}%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${habit.completionRate}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>رکورد فعلی: {habit.currentStreak} {habit.frequency === 'daily' ? 'روز' : habit.frequency === 'weekly' ? 'هفته' : 'ماه'}</span>
                    <span>تکمیل: {habit.completionRate}%</span>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">تاریخچه 30 روز اخیر:</h4>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 30 }, (_, i) => {
                      const date = new Date();
                      date.setDate(date.getDate() - i);
                      const dateStr = date.toISOString().split('T')[0];
                      
                      return (
                        <div
                          key={dateStr}
                          className={`aspect-square rounded-full flex items-center justify-center text-xs ${getProgressColor(dateStr, habit)}`}
                          title={formatDate(dateStr)}
                        >
                          {date.getDate()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 