import { useState, useEffect } from 'react';
import { GraduationCap, Activity, Shield, Building2, Wallet, ShieldCheck, LogOut } from 'lucide-react';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import InstitutionDashboard from './components/InstitutionDashboard';
import StudentWallet from './components/StudentWallet';
import VerificationPortal from './components/VerificationPortal';
import AdminPanel from './components/AdminPanel';
import OperationsDashboard from './components/OperationsDashboard';
import { PageView } from './types/credential';

interface UserInfo {
  name: string;
  email: string;
  role: PageView;
}

function App() {
  const [currentView, setCurrentView] = useState<PageView>('landing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('verify')) {
      setCurrentView('verify');
    }
  }, []);

  const handleLogin = (role: PageView, user: { name: string; email: string }) => {
    setIsAuthenticated(true);
    setUserInfo({ ...user, role });
    setCurrentView(role);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserInfo(null);
    setCurrentView('landing');
  };

  if (currentView === 'landing') {
    return <LandingPage onGetStarted={() => setCurrentView('selection')} />;
  }

  if (currentView === 'selection' && !isAuthenticated) {
    return <LoginPage onLogin={handleLogin} onBack={() => setCurrentView('landing')} />;
  }

  if (currentView === 'operations') {
    return <OperationsDashboard onBack={() => isAuthenticated ? setCurrentView(userInfo?.role || 'landing') : setCurrentView('landing')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center cursor-pointer" onClick={() => setCurrentView('landing')}>
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ9SDhWvIaGwyyoH9wENFZ4EFEqQCr4UXIVjw&s"
                  alt="CredSphere Logo"
                  className="w-8 h-8 rounded-lg object-cover"
                />
                <span className="ml-2 text-xl font-bold text-gray-900">
                  Academic Credentials
                </span>
              </div>
              {isAuthenticated && userInfo && (
                <div className="flex items-center border-l border-gray-200 pl-4 ml-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {userInfo.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-2">
                    <div className="text-sm font-medium text-gray-900">{userInfo.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{userInfo.role}</div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex space-x-1 items-center">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => setCurrentView('operations')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                      currentView === 'operations'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Operations
                  </button>
                  {userInfo?.role === 'admin' && (
                    <button
                      onClick={() => setCurrentView('admin')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                        currentView === 'admin'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Admin
                    </button>
                  )}
                  {userInfo?.role === 'institution' && (
                    <button
                      onClick={() => setCurrentView('institution')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                        currentView === 'institution'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Building2 className="w-4 h-4 mr-2" />
                      Institution
                    </button>
                  )}
                  {userInfo?.role === 'student' && (
                    <button
                      onClick={() => setCurrentView('student')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                        currentView === 'student'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Wallet className="w-4 h-4 mr-2" />
                      Student
                    </button>
                  )}
                  {userInfo?.role === 'verify' && (
                    <button
                      onClick={() => setCurrentView('verify')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                        currentView === 'verify'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Verify
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center text-red-600 hover:bg-red-50 ml-2"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'admin' && isAuthenticated && userInfo?.role === 'admin' && <AdminPanel />}
        {currentView === 'institution' && isAuthenticated && userInfo?.role === 'institution' && <InstitutionDashboard />}
        {currentView === 'student' && isAuthenticated && userInfo?.role === 'student' && <StudentWallet />}
        {currentView === 'verify' && isAuthenticated && userInfo?.role === 'verify' && <VerificationPortal />}
        {!isAuthenticated && currentView !== 'operations' && currentView !== 'landing' && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">Please log in to access this section</p>
            <button
              onClick={() => setCurrentView('selection')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Go to Login
            </button>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">
              Blockchain-Based Academic Credentials Platform
            </p>
            <p className="text-xs text-gray-500">
              Powered by Ethereum Sepolia, IPFS, and Soulbound Tokens
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
