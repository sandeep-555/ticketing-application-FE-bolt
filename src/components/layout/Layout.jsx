import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectCurrentUser } from '@/store/slices/authSlice';
import { toggleTheme, selectThemeMode } from '@/store/slices/themeSlice';
import { socketService } from '@/services/socket/socket';
import { setUser } from '../../store/slices/authSlice';
import { authAPI } from '../../services/api/auth.api';
import { useEffect } from 'react';


export default function Layout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const themeMode = useSelector(selectThemeMode);
  const handleLogout = async () => {
    socketService.disconnect();
    dispatch(logout());
    navigate('/login');
  };

  useEffect(() => {
  const loadUser = async () => {
    const token = localStorage.getItem('access_token');
 console.log("Loading user with token:", token);  
    if (!token) return;

    try {
      const res = await authAPI.me();

      console.log("User data loaded:", res.data);
      dispatch(setUser(res.data.user));
    } catch (err) {
      dispatch(logout());
    }
  };

  loadUser();
}, []);


  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <nav className="glass-container sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/dashboard" className="text-2xl font-bold text-primary">
                TMS
              </Link>
              <div className="hidden md:flex space-x-4">
                <Link
                  to="/dashboard"
                  className="text-gray-700 dark:text-gray-300 hover:text-primary px-3 py-2"
                >
                  Dashboard
                </Link>
                <Link
                  to="/projects"
                  className="text-gray-700 dark:text-gray-300 hover:text-primary px-3 py-2"
                >
                  Projects
                </Link>
                 <Link
                  to="/tickets"
                  className="text-gray-700 dark:text-gray-300 hover:text-primary px-3 py-2"
                >
                  Tickets
                </Link>
                <Link
                  to="/board"
                  className="text-gray-700 dark:text-gray-300 hover:text-primary px-3 py-2"
                >
                  Board
                </Link>
                <Link
                  to="/reports"
                  className="text-gray-700 dark:text-gray-300 hover:text-primary px-3 py-2"
                >
                  Reports
                </Link>
                {user?.role === 'CUSTOMER' && (
                  <Link
                    to="/client"
                    className="text-gray-700 dark:text-gray-300 hover:text-primary px-3 py-2"
                  >
                    My Tickets
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => dispatch(toggleTheme())}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {themeMode === 'dark' ? '🌞' : '🌙'}
              </button>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">{user?.name}</span>
                <span className="text-xs px-2 py-1 bg-primary text-white rounded-full">
                  {user?.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-danger hover:bg-danger-50 dark:hover:bg-danger-900 rounded-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
