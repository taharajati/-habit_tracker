import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { moodService } from '../services/api';
import '../styles/global.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const moodEmojis = {
  5: '🤩',
  4: '😊',
  3: '😐',
  2: '😕',
  1: '😢'
};

const moodLabels = {
  5: 'عالی',
  4: 'خوب',
  3: 'معمولی',
  2: 'بد',
  1: 'خیلی بد'
};

export default function Mood() {
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMood, setNewMood] = useState({
    level: 3,
    note: ''
  });
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    fetchMoods();
  }, [timeRange]);

  const fetchMoods = async () => {
    try {
      setLoading(true);
      const response = await moodService.getMoods(timeRange);
      setMoods(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'خطا در دریافت حالات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await moodService.createMood({
        level: Number(newMood.level),
        note: newMood.note
      });
      setNewMood({ level: 3, note: '' });
      fetchMoods();
    } catch (err) {
      setError(err.response?.data?.message || 'خطا در ثبت حالت');
    }
  };

  const chartData = {
    labels: moods.map(m => m.date),
    datasets: [
      {
        label: 'سطح حال و احوال',
        data: moods.map(m => m.level),
        borderColor: 'rgb(236, 72, 153)',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(236, 72, 153)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            family: 'Vazirmatn',
            size: 14
          }
        }
      },
      title: {
        display: true,
        text: 'نمودار حال و احوال',
        font: {
          family: 'Vazirmatn',
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: {
      y: {
        min: 1,
        max: 5,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          stepSize: 1,
          callback: value => moodLabels[value],
          font: {
            family: 'Vazirmatn'
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            family: 'Vazirmatn'
          }
        }
      }
    }
  };

  return (
    <div className="p-6 space-y-8 fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold gradient-text">ثبت حال و احوال</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setTimeRange('week')}
            className={`button ${
              timeRange === 'week' ? 'button-primary' : 'button-secondary'
            }`}
          >
            هفتگی
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`button ${
              timeRange === 'month' ? 'button-primary' : 'button-secondary'
            }`}
          >
            ماهانه
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">ثبت حالت جدید</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                حال و احوال امروز شما چطور است؟
              </label>
              <div className="flex justify-between items-center">
                {Object.entries(moodEmojis).map(([level, emoji]) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setNewMood({ ...newMood, level: Number(level) })}
                    className={`text-4xl p-3 rounded-full transition-transform hover:scale-110 ${
                      newMood.level === Number(level)
                        ? 'bg-pink-100 scale-110'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <div className="text-center mt-2 text-sm text-gray-600">
                {moodLabels[newMood.level]}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                یادداشت (اختیاری)
              </label>
              <textarea
                className="input min-h-[100px]"
                value={newMood.note}
                onChange={(e) => setNewMood({ ...newMood, note: e.target.value })}
                placeholder="چه چیزی باعث این حال و احوال شد؟"
              />
            </div>
            <div className="flex justify-end">
              <button type="submit" className="button button-primary">
                ثبت حالت
              </button>
            </div>
          </form>
        </div>

        <div className="card p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="loading-spinner"></div>
            </div>
          ) : moods.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              هنوز هیچ حالتی ثبت نشده است
            </div>
          ) : (
            <Line data={chartData} options={chartOptions} />
          )}
        </div>

        {moods.length > 0 && (
          <div className="md:col-span-2">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {moods.map((mood) => (
                <div key={mood.id} className="card p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-3xl">{moodEmojis[mood.level]}</span>
                    <span className="text-sm text-gray-500">{mood.date}</span>
                  </div>
                  {mood.note && (
                    <p className="text-sm text-gray-600 mt-2">{mood.note}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 