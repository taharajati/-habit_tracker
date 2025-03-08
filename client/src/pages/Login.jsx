import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/global.css';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'خطا در ورود به سیستم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="card max-w-md w-full p-8 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold gradient-text mb-2">عادت‌ساز</h1>
          <p className="text-text-secondary">به اپلیکیشن عادت‌ساز خوش آمدید</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ایمیل
            </label>
            <input
              type="email"
              required
              className="input"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              رمز عبور
            </label>
            <input
              type="password"
              required
              className="input"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="********"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="button button-primary w-full"
          >
            {loading ? (
              <div className="loading-spinner"></div>
            ) : (
              'ورود به سیستم'
            )}
          </button>
        </form>

        <div className="text-center text-sm">
          <span className="text-gray-600">حساب کاربری ندارید؟</span>{' '}
          <Link to="/register" className="text-primary hover:text-primary-light">
            ثبت‌نام کنید
          </Link>
        </div>
      </div>
    </div>
  );
} 