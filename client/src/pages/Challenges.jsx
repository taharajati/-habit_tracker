import { useState, useEffect } from 'react';
import { challengeService } from '../services/api';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

export default function Challenges() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    target: '',
    participants: [],
  });

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const response = await challengeService.getChallenges();
      setChallenges(response.data);
    } catch (err) {
      setError('خطا در دریافت چالش‌ها');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedChallenge) {
        await challengeService.updateChallenge(selectedChallenge.id, formData);
      } else {
        await challengeService.createChallenge(formData);
      }
      fetchChallenges();
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedChallenge(null);
      setFormData({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        target: '',
        participants: [],
      });
    } catch (err) {
      setError(err.response?.data?.message || 'خطا در ذخیره چالش');
    }
  };

  const handleEdit = (challenge) => {
    setSelectedChallenge(challenge);
    setFormData({
      name: challenge.name,
      description: challenge.description,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
      target: challenge.target,
      participants: challenge.participants,
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('آیا از حذف این چالش اطمینان دارید؟')) {
      try {
        await challengeService.deleteChallenge(id);
        fetchChallenges();
      } catch (err) {
        setError('خطا در حذف چالش');
      }
    }
  };

  const handleJoinChallenge = async (id) => {
    try {
      await challengeService.joinChallenge(id);
      fetchChallenges();
    } catch (err) {
      setError('خطا در پیوستن به چالش');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold gradient-text">چالش‌های گروهی</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="button button-primary"
        >
          {showAddModal ? 'انصراف' : '➕ چالش جدید'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          {error}
        </div>
      )}

      {showAddModal && (
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نام چالش
              </label>
              <input
                type="text"
                required
                className="input"
                value={formData.name}
                onChange={handleChange}
                placeholder="مثال: ورزش روزانه"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                توضیحات
              </label>
              <textarea
                className="input min-h-[100px]"
                value={formData.description}
                onChange={handleChange}
                placeholder="توضیحات چالش را وارد کنید..."
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تاریخ شروع
                </label>
                <input
                  type="date"
                  required
                  className="input"
                  value={formData.startDate}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تاریخ پایان
                </label>
                <input
                  type="date"
                  required
                  className="input"
                  value={formData.endDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                هدف چالش
              </label>
              <input
                type="text"
                required
                className="input"
                value={formData.target}
                onChange={handleChange}
                placeholder="مثال: 30 روز ورزش متوالی"
              />
            </div>

            <div className="flex justify-end">
              <button type="submit" className="button button-primary">
                ایجاد چالش
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="loading-spinner"></div>
        </div>
      ) : challenges.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-lg text-gray-600">هنوز هیچ چالشی ایجاد نشده است.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="button button-secondary mt-4"
          >
            ایجاد اولین چالش
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {challenges.map((challenge) => (
            <div key={challenge.id} className="card p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {challenge.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {challenge.description}
                </p>
              </div>

              <div className="flex justify-between text-sm text-gray-500">
                <span>شروع: {new Date(challenge.startDate).toLocaleDateString('fa-IR')}</span>
                <span>پایان: {new Date(challenge.endDate).toLocaleDateString('fa-IR')}</span>
              </div>

              <div className="space-y-2">
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${(challenge.currentParticipants / challenge.maxParticipants) * 100}%`
                    }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    {challenge.currentParticipants} شرکت‌کننده
                  </span>
                  <span className="text-gray-500">
                    {challenge.maxParticipants} نفر ظرفیت
                  </span>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => handleEdit(challenge)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(challenge.id)}
                  className="text-red-400 hover:text-red-500"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>

              <button
                onClick={() => handleJoinChallenge(challenge.id)}
                disabled={challenge.hasJoined}
                className={`button w-full ${
                  challenge.hasJoined ? 'button-secondary' : 'button-primary'
                }`}
              >
                {challenge.hasJoined ? '✅ عضو شده‌اید' : 'پیوستن به چالش'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 