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
import api from '../services/api';
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

export default function Progress() {
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progressData, setProgressData] = useState(null);

  useEffect(() => {
    fetchProgress();
  }, [timeRange]);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/progress?timeRange=${timeRange}`);
      setProgressData(response.data);
    } catch (err) {
      console.error('Error fetching progress:', err);
      setError(err.response?.data?.message || 'خطا در دریافت اطلاعات پیشرفت');
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: progressData?.daily.map(d => d.date) || [],
    datasets: [
      {
        label: 'درصد تکمیل عادت‌ها',
        data: progressData?.daily.map(d => (d.completed_habits / d.total_habits) * 100) || [],
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(79, 70, 229)',
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
        text: 'پیشرفت روزانه',
        font: {
          family: 'Vazirmatn',
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            family: 'Vazirmatn'
          }
        },
        title: {
          display: true,
          text: 'درصد تکمیل',
          font: {
            family: 'Vazirmatn',
            size: 14
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
        <h1 className="text-3xl font-bold gradient-text">پیشرفت عادت‌ها</h1>
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

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="loading-spinner"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          {error}
        </div>
      ) : (
        <>
          <div className="card p-6">
            <Line data={chartData} options={chartOptions} />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {progressData?.habits.map((habit) => (
              <div
                key={habit.habit_id}
                className="card p-6 space-y-4"
              >
                <h3 className="text-lg font-semibold text-gray-900">{habit.habit_name}</h3>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>تکمیل شده: {habit.completed_days} روز</span>
                  <span>کل روزها: {habit.total_days} روز</span>
                </div>
                <div className="space-y-2">
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${habit.completion_rate}%` }}
                    ></div>
                  </div>
                  <div className="text-left text-sm font-medium text-primary">
                    {habit.completion_rate}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 