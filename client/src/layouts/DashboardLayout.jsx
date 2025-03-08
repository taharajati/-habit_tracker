import { useNavigate, Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/global.css';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', label: 'داشبورد', icon: '📊' },
    { path: '/habits', label: 'عادت‌ها', icon: '✨' },
    { path: '/progress', label: 'پیشرفت', icon: '📈' },
    { path: '/mood', label: 'ثبت حالات', icon: '🌟' },
    { path: '/challenges', label: 'چالش‌ها', icon: '🎯' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed top-0 right-0 h-full w-64 bg-card-bg shadow-lg p-6">
        <div className="flex flex-col h-full">
          {/* Logo and User Info */}
          <div className="space-y-6 mb-8">
            <h1 className="text-2xl font-bold gradient-text">عادت‌ساز</h1>
            <div className="card p-4">
              <div className="text-lg font-medium">{user?.name}</div>
              <div className="text-sm text-text-secondary">{user?.email}</div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link flex items-center gap-3 ${
                  location.pathname === item.path ? 'active' : ''
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="button button-secondary w-full flex items-center justify-center gap-2"
          >
            <span>خروج</span>
            <span>🚪</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="mr-64 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
} 