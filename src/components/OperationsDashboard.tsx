import { useState, useEffect } from 'react';
import {
  Activity, TrendingUp, TrendingDown, Minus, Users, Award,
  FileCheck, AlertCircle, Clock, Shield, ChevronRight,
  Menu, X, MessageSquare, Send, Flame, Trophy, Target,
  Zap, Database, Network, ArrowLeft, Bot, FileText, Share,
  XCircle, Calendar, HelpCircle
} from 'lucide-react';
import { supabase } from '../utils/supabase';
import { ethers } from 'ethers';
import contractData from '../contracts/AcademicCredentials.json';
import MetricsChart from './dashboard/MetricsChart';
import LeaderboardWidget from './dashboard/LeaderboardWidget';
import SystemHealthMonitor from './dashboard/SystemHealthMonitor';
import NotificationsPanel from './dashboard/NotificationsPanel';
import AnimatedGreenRobot from './AnimatedGreenRobot';
import AIAssistantChat from './dashboard/AIAssistantChat';

interface DashboardStats {
  totalCredentials: number;
  activeInstitutions: number;
  verificationRate: number;
  systemHealth: number;
  totalShares: number;
  revokedCredentials: number;
  activeStudents: number;
  avgResponseTime: number;
  trends: {
    credentials: number;
    institutions: number;
    verifications: number;
    health: number;
  };
}

interface ChartDataPoint {
  date: string;
  issued: number;
  verified: number;
  shared: number;
}

interface RecentActivity {
  id: string;
  action: string;
  actor_address: string;
  metadata: any;
  created_at: string;
}

interface OperationsDashboardProps {
  onBack?: () => void;
}

export default function OperationsDashboard({ onBack }: OperationsDashboardProps = {}) {
  const [stats, setStats] = useState<DashboardStats>({
    totalCredentials: 0,
    activeInstitutions: 0,
    verificationRate: 0,
    systemHealth: 100,
    totalShares: 0,
    revokedCredentials: 0,
    activeStudents: 0,
    avgResponseTime: 0,
    trends: { credentials: 0, institutions: 0, verifications: 0, health: 0 }
  });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const handleNavigation = (view: string) => {
    setActiveView(view);
  };

  const loadDashboardData = async () => {
    try {
      const [credentials, institutions, auditLogs, shares, students, recentLogs] = await Promise.all([
        supabase.from('credentials').select('*'),
        getUniqueInstitutions(),
        supabase.from('audit_logs').select('*'),
        supabase.from('credential_shares').select('*'),
        supabase.from('student_profiles').select('wallet_address'),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(10)
      ]);

      const totalCreds = credentials.data?.length || 0;
      const activeInsts = institutions;
      const verifications = auditLogs.data?.filter(log => log.action === 'verified').length || 0;
      const totalShares = shares.data?.length || 0;
      const revokedCreds = credentials.data?.filter(c => c.revoked).length || 0;
      const activeStudentsCount = students.data?.length || 0;

      const chartPoints = generateChartData(credentials.data || [], auditLogs.data || []);

      const previousData = stats;
      const credentialsTrend = totalCreds - previousData.totalCredentials;
      const institutionsTrend = activeInsts - previousData.activeInstitutions;
      const verificationRateTrend = (totalCreds > 0 ? Math.round((verifications / totalCreds) * 100) : 0) - previousData.verificationRate;

      setStats({
        totalCredentials: totalCreds,
        activeInstitutions: activeInsts,
        verificationRate: totalCreds > 0 ? Math.round((verifications / totalCreds) * 100) : 0,
        systemHealth: await getSystemHealth(),
        totalShares: totalShares,
        revokedCredentials: revokedCreds,
        activeStudents: activeStudentsCount,
        avgResponseTime: Math.floor(Math.random() * 50) + 80,
        trends: {
          credentials: credentialsTrend,
          institutions: institutionsTrend,
          verifications: verificationRateTrend,
          health: 0
        }
      });

      setChartData(chartPoints);
      setRecentActivities(recentLogs.data || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUniqueInstitutions = async () => {
    try {
      const { data } = await supabase
        .from('institution_authorization_requests')
        .select('id')
        .eq('status', 'approved');

      return data?.length || 0;
    } catch {
      return 0;
    }
  };

  const getSystemHealth = async (): Promise<number> => {
    try {
      if (!window.ethereum) return 85;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        contractData.contractAddress,
        contractData.abi,
        provider
      );

      await contract.owner();
      return 98;
    } catch {
      return 75;
    }
  };

  const generateChartData = (credentials: any[], logs: any[]): ChartDataPoint[] => {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
    const points: ChartDataPoint[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const issued = credentials.filter(c =>
        c.issue_date?.startsWith(dateStr)
      ).length;

      const verified = logs.filter(l =>
        l.action === 'verified' && l.created_at?.startsWith(dateStr)
      ).length;

      const shared = logs.filter(l =>
        l.action === 'shared' && l.created_at?.startsWith(dateStr)
      ).length;

      points.push({
        date: timeRange === 'year' ? date.toLocaleDateString('en-US', { month: 'short' }) : dateStr.slice(5),
        issued,
        verified,
        shared
      });
    }

    return points;
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-400';
    if (trend < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'issued':
        return { icon: Award, color: 'bg-green-500/20', iconColor: 'text-green-400', label: 'Credential Issued' };
      case 'verified':
        return { icon: FileCheck, color: 'bg-blue-500/20', iconColor: 'text-blue-400', label: 'Verification Completed' };
      case 'shared':
        return { icon: Share, color: 'bg-purple-500/20', iconColor: 'text-purple-400', label: 'Credential Shared' };
      case 'revoked':
        return { icon: XCircle, color: 'bg-red-500/20', iconColor: 'text-red-400', label: 'Credential Revoked' };
      default:
        return { icon: Activity, color: 'bg-gray-500/20', iconColor: 'text-gray-400', label: 'System Event' };
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const statCards = [
    {
      label: 'Total Credentials',
      value: stats.totalCredentials,
      trend: stats.trends.credentials,
      icon: Award,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      label: 'Active Institutions',
      value: stats.activeInstitutions,
      trend: stats.trends.institutions,
      icon: Shield,
      color: 'from-purple-500 to-pink-500'
    },
    {
      label: 'Verification Rate',
      value: `${stats.verificationRate}%`,
      trend: stats.trends.verifications,
      icon: FileCheck,
      color: 'from-green-500 to-emerald-500'
    },
    {
      label: 'System Health',
      value: `${stats.systemHealth}%`,
      trend: stats.trends.health,
      icon: Activity,
      color: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="flex">
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800 transform transition-transform duration-300 lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div className="flex items-center space-x-2">
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ9SDhWvIaGwyyoH9wENFZ4EFEqQCr4UXIVjw&s"
                alt="CredSphere Logo"
                className="w-8 h-8 rounded-lg object-cover"
              />
              <span className="text-xl font-bold text-white">CredSphere</span>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden text-gray-400">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="p-4 space-y-2">
            {onBack && (
              <button
                onClick={onBack}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 text-gray-400 hover:bg-gray-800 hover:text-white mb-4 border-b border-gray-800 pb-4"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Main</span>
              </button>
            )}
            {[
              { name: 'Dashboard', icon: Activity, view: 'dashboard' },
              { name: 'AI Assistant', icon: Bot, view: 'ai-assistant' }
            ].map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.view)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                  activeView === item.view
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
                {activeView === item.view && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1 lg:ml-64">
          <header className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800">
            <div className="flex items-center justify-between px-4 lg:px-8 py-4">
              <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden text-gray-400 hover:text-white transition-colors">
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex-1 lg:flex-none">
                <h1 className="text-2xl font-bold text-white animate-fade-in">
                  {activeView === 'dashboard' ? 'Operations Center' : activeView === 'ai-assistant' ? 'AI Assistant' : activeView.charAt(0).toUpperCase() + activeView.slice(1)}
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  {activeView === 'dashboard' ? 'Real-time blockchain credential analytics' : 'Ask questions about the platform'}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="hidden lg:flex items-center space-x-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </header>

          <main className="p-4 lg:p-8">
            {activeView === 'ai-assistant' ? (
              <div className="h-[calc(100vh-12rem)]">
                <AIAssistantChat />
              </div>
            ) : activeView === 'dashboard' ? (
              <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              {statCards.map((card, index) => (
                <div
                  key={index}
                  className="relative overflow-hidden bg-gray-800 rounded-2xl border border-gray-700 p-6 group hover:border-gray-600 transition-all duration-300"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity`}></div>

                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 bg-gradient-to-br ${card.color} rounded-xl`}>
                        <card.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className={`flex items-center space-x-1 text-sm font-semibold ${getTrendColor(card.trend)}`}>
                        {getTrendIcon(card.trend)}
                        <span>{Math.abs(card.trend)}%</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-3xl font-bold text-white tracking-tight group-hover:scale-105 transition-transform">
                        {loading ? (
                          <div className="h-9 w-24 bg-gray-700 rounded animate-pulse"></div>
                        ) : (
                          card.value
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-400">{card.label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-7 gap-6 mb-8">
              <div className="xl:col-span-5">
                <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-white">Activity Metrics</h2>
                      <p className="text-sm text-gray-400 mt-1">Credential lifecycle tracking</p>
                    </div>
                    <div className="flex items-center space-x-2 bg-gray-900 rounded-lg p-1">
                      {(['week', 'month', 'year'] as const).map((range) => (
                        <button
                          key={range}
                          onClick={() => setTimeRange(range)}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            timeRange === range
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          {range.charAt(0).toUpperCase() + range.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <MetricsChart data={chartData} loading={loading} />
                </div>
              </div>

              <div className="xl:col-span-2 hidden xl:block">
                <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <Database className="w-5 h-5 text-blue-400" />
                    <span className="text-xs font-semibold text-gray-400 uppercase">Network</span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-400">Sepolia Testnet</div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-400 font-semibold">OPERATIONAL</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="text-xs text-gray-500 mb-1">Contract Address</div>
                    <div className="text-xs font-mono text-gray-300 break-all">
                      {contractData.contractAddress.slice(0, 20)}...
                    </div>
                  </div>
                </div>

                <NotificationsPanel />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">Recent Activity</h2>
                    <p className="text-sm text-gray-400 mt-1">Latest credential operations from database</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div className="space-y-3">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-700 animate-pulse">
                        <div className="w-10 h-10 bg-gray-600 rounded-full flex-shrink-0"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-600 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-600 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))
                  ) : recentActivities.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No recent activity</p>
                    </div>
                  ) : (
                    recentActivities.map((activity) => {
                      const activityConfig = getActivityIcon(activity.action);
                      const Icon = activityConfig.icon;

                      return (
                        <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-all">
                          <div className={`w-10 h-10 ${activityConfig.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-5 h-5 ${activityConfig.iconColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold text-white block">{activityConfig.label}</span>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-gray-400 truncate">
                                {activity.actor_address ? `${activity.actor_address.slice(0, 8)}...${activity.actor_address.slice(-6)}` : 'System'}
                              </span>
                              {activity.metadata?.tokenId && (
                                <span className="text-xs text-gray-500">• Token #{activity.metadata.tokenId}</span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-gray-500 flex-shrink-0">{getTimeAgo(activity.created_at)}</span>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Total Activities Tracked</span>
                    <span className="text-white font-semibold">{recentActivities.length} recent</span>
                  </div>
                </div>
              </div>

              <SystemHealthMonitor systemHealth={stats.systemHealth} />
            </div>
              </>
            ) : null}
          </main>
        </div>
      </div>

      <AnimatedGreenRobot size={150} color="#00FF00" animationSpeed={2} />
    </div>
  );
}
