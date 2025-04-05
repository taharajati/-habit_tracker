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

  const createChartData = (data, title) => ({
    labels: data?.map(d => d.date) || [],
    datasets: [
      {
        label: title,
        data: data?.map(d => d.completed_habits) || [],
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
  });

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
          text: 'تعداد عادت‌ها',
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
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">پیشرفت عادت‌ها</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setTimeRange('week')}
              className={`button ${timeRange === 'week' ? 'button-primary' : 'button-secondary'}`}
            >
              هفتگی
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`button ${timeRange === 'month' ? 'button-primary' : 'button-secondary'}`}
            >
              ماهانه
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="loading-spinner"></div>
        </div>
      ) : error ? (
        <div className="toast bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Daily Habits Chart */}
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-4">عادت‌های روزانه</h2>
            <Line 
              data={createChartData(progressData?.daily, 'تعداد عادت‌های انجام شده')}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  title: {
                    ...chartOptions.plugins.title,
                    text: 'پیشرفت عادت‌های روزانه'
                  }
                }
              }}
            />
          </div>

          {/* Weekly Habits Chart */}
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-4">عادت‌های هفتگی</h2>
            <Line 
              data={createChartData(progressData?.weekly, 'تعداد عادت‌های انجام شده')}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  title: {
                    ...chartOptions.plugins.title,
                    text: 'پیشرفت عادت‌های هفتگی'
                  }
                }
              }}
            />
          </div>

          {/* Monthly Habits Chart */}
          <div className="card p-6">
            <h2 className="text-xl font-bold mb-4">عادت‌های ماهانه</h2>
            <Line 
              data={createChartData(progressData?.monthly, 'تعداد عادت‌های انجام شده')}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  title: {
                    ...chartOptions.plugins.title,
                    text: 'پیشرفت عادت‌های ماهانه'
                  }
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
} 