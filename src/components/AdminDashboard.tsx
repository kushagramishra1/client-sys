import React, { useState, useEffect } from 'react';
import { Layout } from './Layout';
import { ProjectManagement } from './ProjectManagement';
import { TimeTrackingOverview } from './TimeTrackingOverview';
import apiService from '../services/api';
import { 
  BarChart3, 
  DollarSign, 
  FolderOpen, 
  Clock,
  TrendingUp 
} from 'lucide-react';

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalBilled: number;
}

interface ProjectDistribution {
  status: string;
  count: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projectDistribution, setProjectDistribution] = useState<ProjectDistribution[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const data = await apiService.getAdminDashboard();
      setStats(data.stats);
      setProjectDistribution(data.projectDistribution);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Admin Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 p-3 rounded-lg ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout title="Admin Dashboard">
      {/* Navigation Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'projects', label: 'Projects', icon: FolderOpen },
            { id: 'timetracking', label: 'Time Tracking', icon: Clock }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Projects"
              value={stats?.totalProjects || 0}
              icon={FolderOpen}
              color="bg-blue-500"
            />
            <StatCard
              title="Active Projects"
              value={stats?.activeProjects || 0}
              icon={TrendingUp}
              color="bg-green-500"
            />
            <StatCard
              title="Completed Projects"
              value={stats?.completedProjects || 0}
              icon={BarChart3}
              color="bg-purple-500"
            />
            <StatCard
              title="Total Billed"
              value={`$${(stats?.totalBilled || 0).toLocaleString()}`}
              icon={DollarSign}
              color="bg-yellow-500"
            />
          </div>

          {/* Project Status Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Project Status Distribution</h3>
            <div className="flex items-center justify-center">
              <canvas id="projectChart" width="300" height="300"></canvas>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'projects' && <ProjectManagement />}
      {activeTab === 'timetracking' && <TimeTrackingOverview />}
    </Layout>
  );
}