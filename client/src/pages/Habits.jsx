import { useState, useEffect } from 'react';
import { habitService } from '../services/api';
import '../styles/global.css';

export default function Habits() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newHabit, setNewHabit] = useState({ name: '', description: '', frequency: 'daily' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      setLoading(true);
      const response = await habitService.getHabits();
      setHabits(response.data);
    } catch (err) {
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
      await habitService.toggleHabitComplete(habitId, completed);
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

  return (
    <div className="p-6 space-y-8 fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold gradient-text">مدیریت عادت‌ها</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="button button-primary"
        >
          {showForm ? 'انصراف' : '➕ عادت جدید'}
        </button>
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
                placeholder="مثال: مطالعه روزانه"
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
                ذخیره عادت
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="loading-spinner"></div>
        </div>
      ) : habits.length === 0 ? (
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
          {habits.map((habit) => (
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
                  className={`button ${
                    habit.today_status === 1 ? 'button-primary' : 'button-secondary'
                  }`}
                >
                  {habit.today_status === 1 ? '✅ انجام شد' : '⭕️ انجام نشده'}
                </button>
              </div>

              <div className="space-y-2">
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${habit.total_days > 0 ? (habit.total_completion / habit.total_days) * 100 : 0}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>رکورد فعلی: {habit.currentStreak} روز</span>
                  <span>تکمیل: {habit.total_days > 0 ? Math.round((habit.total_completion / habit.total_days) * 100) : 0}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 