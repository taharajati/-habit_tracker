import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/global.css';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      return setError('رمز عبور و تکرار آن باید یکسان باشند');
    }

    try {
      setError('');
      setLoading(true);
      await register(formData.name, formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'خطا در ثبت‌نام');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="card max-w-md w-full p-8 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold gradient-text mb-2">عادت‌ساز</h1>
          <p className="text-text-secondary">ایجاد حساب کاربری جدید</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نام و نام خانوادگی
            </label>
            <input
              type="text"
              required
              className="input"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="نام و نام خانوادگی خود را وارد کنید"
            />
          </div>

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تکرار رمز عبور
            </label>
            <input
              type="password"
              required
              className="input"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
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
              'ثبت‌نام'
            )}
          </button>
        </form>

        <div className="text-center text-sm">
          <span className="text-gray-600">قبلاً ثبت‌نام کرده‌اید؟</span>{' '}
          <Link to="/login" className="text-primary hover:text-primary-light">
            وارد شوید
          </Link>
        </div>
      </div>
    </div>
  );
}