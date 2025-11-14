import { useState } from 'react';
import { Lock, Mail, User, GraduationCap, AlertCircle, Shield, Building2, Briefcase, ArrowLeft } from 'lucide-react';
import { PageView } from '../types/credential';

interface LoginPageProps {
  onLogin: (role: PageView, userInfo: { name: string; email: string }) => void;
  onBack: () => void;
}

const mockUsers = {
  admin: {
    email: 'admin@acadchain.com',
    password: 'admin123',
    name: 'System Administrator',
    role: 'admin' as PageView
  },
  institution: {
    email: 'institution@university.edu',
    password: 'inst123',
    name: 'University Registrar',
    role: 'institution' as PageView
  },
  student: {
    email: 'student@university.edu',
    password: 'student123',
    name: 'John Doe',
    role: 'student' as PageView
  },
  verify: {
    email: 'verifier@employer.com',
    password: 'verify123',
    name: 'HR Manager',
    role: 'verify' as PageView
  }
};

export default function LoginPage({ onLogin, onBack }: LoginPageProps) {
  const [selectedRole, setSelectedRole] = useState<PageView | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedRole) {
      setError('Please select a role first');
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }

    onLogin(selectedRole, { name: email, email });
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedRole) {
      setError('Please select a role first');
      return;
    }

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    onLogin(selectedRole, { name, email });
  };

  const handleQuickLogin = (userType: keyof typeof mockUsers) => {
    const user = mockUsers[userType];
    onLogin(user.role, { name: user.name, email: user.email });
  };

  const roleOptions = [
    {
      role: 'admin' as PageView,
      title: 'Admin',
      description: 'Platform administrator',
      icon: Shield,
      color: 'from-red-500 to-pink-600'
    },
    {
      role: 'student' as PageView,
      title: 'Student',
      description: 'View and share credentials',
      icon: GraduationCap,
      color: 'from-blue-500 to-cyan-600'
    },
    {
      role: 'institution' as PageView,
      title: 'Institution',
      description: 'Issue credentials',
      icon: Building2,
      color: 'from-green-500 to-emerald-600'
    },
    {
      role: 'verify' as PageView,
      title: 'Employer',
      description: 'Verify credentials',
      icon: Briefcase,
      color: 'from-orange-500 to-amber-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 bg-white rounded-xl border-2 border-blue-600">
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ9SDhWvIaGwyyoH9wENFZ4EFEqQCr4UXIVjw&s"
                alt="CredSphere Logo"
                className="w-8 h-8 rounded-lg object-cover"
              />
            </div>
          </div>

          {!selectedRole ? (
            <>
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-2">
                Select Your Role
              </h2>
              <p className="text-gray-600 text-center mb-8">
                Choose your role to continue
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {roleOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.role}
                      onClick={() => setSelectedRole(option.role)}
                      className="group relative overflow-hidden bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-500 transition-all duration-300 hover:shadow-lg"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${option.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                      <div className="relative">
                        <div className={`w-12 h-12 bg-gradient-to-br ${option.color} rounded-lg flex items-center justify-center mb-3 mx-auto`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{option.title}</h3>
                        <p className="text-sm text-gray-600">{option.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={onBack}
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                >
                  Back to Home
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => {
                    setSelectedRole(null);
                    setEmail('');
                    setPassword('');
                    setName('');
                    setError('');
                  }}
                  className="flex items-center text-gray-600 hover:text-gray-900 text-sm font-medium"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Change Role
                </button>
                <div className="flex items-center space-x-2">
                  {(() => {
                    const selected = roleOptions.find(r => r.role === selectedRole);
                    if (!selected) return null;
                    const Icon = selected.icon;
                    return (
                      <>
                        <div className={`w-8 h-8 bg-gradient-to-br ${selected.color} rounded-lg flex items-center justify-center`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-700">{selected.title}</span>
                      </>
                    );
                  })()}
                </div>
              </div>

              <h2 className="text-3xl font-bold text-gray-900 text-center mb-2">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-gray-600 text-center mb-8">
                {isSignUp ? 'Sign up to access your credentials' : 'Sign in to access the platform'}
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-5">
                {isSignUp && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              </div>

              <div className="mt-8 relative overflow-hidden rounded-xl">
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-transparent z-10 pointer-events-none"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white z-10 pointer-events-none"></div>
                <img
                  src="https://cdn.dribbble.com/userupload/20150771/file/original-099d5c05820e70d0f6427072b6be7580.gif"
                  alt="Security Animation"
                  className="w-full h-auto object-cover opacity-90 mix-blend-multiply"
                />
              </div>
            </>
          )}
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-6">Demo Credentials</h3>
          <p className="text-blue-100 mb-6">
            Use these credentials to explore different roles in the platform
          </p>

          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-lg">Administrator</h4>
                <button
                  onClick={() => handleQuickLogin('admin')}
                  className="px-3 py-1 bg-white text-blue-600 rounded text-sm font-medium hover:bg-blue-50 transition-colors"
                >
                  Quick Login
                </button>
              </div>
              <p className="text-sm text-blue-100 mb-2">
                Email: <span className="font-mono bg-white/10 px-2 py-1 rounded">admin@acadchain.com</span>
              </p>
              <p className="text-sm text-blue-100">
                Password: <span className="font-mono bg-white/10 px-2 py-1 rounded">admin123</span>
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-lg">Institution</h4>
                <button
                  onClick={() => handleQuickLogin('institution')}
                  className="px-3 py-1 bg-white text-blue-600 rounded text-sm font-medium hover:bg-blue-50 transition-colors"
                >
                  Quick Login
                </button>
              </div>
              <p className="text-sm text-blue-100 mb-2">
                Email: <span className="font-mono bg-white/10 px-2 py-1 rounded">institution@university.edu</span>
              </p>
              <p className="text-sm text-blue-100">
                Password: <span className="font-mono bg-white/10 px-2 py-1 rounded">inst123</span>
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-lg">Student</h4>
                <button
                  onClick={() => handleQuickLogin('student')}
                  className="px-3 py-1 bg-white text-blue-600 rounded text-sm font-medium hover:bg-blue-50 transition-colors"
                >
                  Quick Login
                </button>
              </div>
              <p className="text-sm text-blue-100 mb-2">
                Email: <span className="font-mono bg-white/10 px-2 py-1 rounded">student@university.edu</span>
              </p>
              <p className="text-sm text-blue-100">
                Password: <span className="font-mono bg-white/10 px-2 py-1 rounded">student123</span>
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-lg">Employer</h4>
                <button
                  onClick={() => handleQuickLogin('verify')}
                  className="px-3 py-1 bg-white text-blue-600 rounded text-sm font-medium hover:bg-blue-50 transition-colors"
                >
                  Quick Login
                </button>
              </div>
              <p className="text-sm text-blue-100 mb-2">
                Email: <span className="font-mono bg-white/10 px-2 py-1 rounded">verifier@employer.com</span>
              </p>
              <p className="text-sm text-blue-100">
                Password: <span className="font-mono bg-white/10 px-2 py-1 rounded">verify123</span>
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-lg">
            <p className="text-sm text-blue-100">
              <strong>Note:</strong> This is a demo system. You can also sign up with any email to explore the student portal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
