import React, { useState, useEffect } from 'react';
import { Layout } from './Layout';
import { TimeLogging } from './TimeLogging';
import apiService from '../services/api';
import { Calendar, Clock, FolderOpen, Plus } from 'lucide-react';

interface EmployeeStats {
  assignedProjects: number;
  weeklyHours: number;
  monthlyHours: number;
  recentTimesheets: any[];
}

export function EmployeeDashboard() {
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const data = await apiService.getEmployeeDashboard();
      setStats(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Employee Dashboard">
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
    <Layout title="Employee Dashboard">
      {/* Navigation Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Calendar },
            { id: 'timelogging', label: 'Log Time', icon: Plus }
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <StatCard
              title="Assigned Projects"
              value={stats?.assignedProjects || 0}
              icon={FolderOpen}
              color="bg-blue-500"
            />
            <StatCard
              title="This Week"
              value={`${stats?.weeklyHours || 0}h`}
              icon={Clock}
              color="bg-green-500"
            />
            <StatCard
              title="This Month"
              value={`${stats?.monthlyHours || 0}h`}
              icon={Calendar}
              color="bg-purple-500"
            />
          </div>

          {/* Recent Time Entries */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Time Entries</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {stats?.recentTimesheets && stats.recentTimesheets.length > 0 ? (
                stats.recentTimesheets.map((entry, index) => (
                  <div key={index} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {entry.project_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {entry.client} • {new Date(entry.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {entry.hours_worked}h
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center text-gray-500">
                  No time entries yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timelogging' && <TimeLogging onTimeLogged={loadDashboardData} />}
    </Layout>
  );
}