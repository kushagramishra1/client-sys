import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import { Clock, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

interface Project {
  id: number;
  name: string;
  client: string;
  hourly_rate: number;
}

interface TimeLoggingProps {
  onTimeLogged?: () => void;
}

export function TimeLogging({ onTimeLogged }: TimeLoggingProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [timeLog, setTimeLog] = useState({
    projectId: '',
    date: new Date().toISOString().split('T')[0],
    hoursWorked: '',
    description: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsData, timesheetsData] = await Promise.all([
        apiService.getProjects(),
        apiService.getMyTimesheets()
      ]);
      setProjects(projectsData);
      setTimeEntries(timesheetsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      await apiService.logTime({
        projectId: parseInt(timeLog.projectId),
        date: timeLog.date,
        hoursWorked: parseFloat(timeLog.hoursWorked),
        description: timeLog.description
      });

      setTimeLog({
        projectId: '',
        date: new Date().toISOString().split('T')[0],
        hoursWorked: '',
        description: ''
      });

      setMessage({ type: 'success', text: 'Time logged successfully!' });
      loadData();
      onTimeLogged?.();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Logging Form */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Log Work Hours</span>
          </h3>
        </div>
        
        <div className="p-6">
          {message && (
            <div className={`mb-4 p-3 rounded-md flex items-center space-x-2 ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm ${
                message.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}>
                {message.text}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project
                </label>
                <select
                  required
                  value={timeLog.projectId}
                  onChange={(e) => setTimeLog({...timeLog, projectId: e.target.value})}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} - {project.client}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={timeLog.date}
                  onChange={(e) => setTimeLog({...timeLog, date: e.target.value})}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hours Worked
              </label>
              <input
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                required
                value={timeLog.hoursWorked}
                onChange={(e) => setTimeLog({...timeLog, hoursWorked: e.target.value})}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g., 8.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                rows={3}
                value={timeLog.description}
                onChange={(e) => setTimeLog({...timeLog, description: e.target.value})}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="What did you work on?"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Logging Time...' : 'Log Time'}
            </button>
          </form>
        </div>
      </div>

      {/* Recent Time Entries */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Recent Time Entries</span>
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {timeEntries.length > 0 ? (
            timeEntries.slice(0, 10).map((entry, index) => (
              <div key={index} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {entry.project_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {entry.client} • {new Date(entry.date).toLocaleDateString()}
                    </p>
                    {entry.description && (
                      <p className="text-sm text-gray-600 mt-1">{entry.description}</p>
                    )}
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {entry.hours_worked}h
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              No time entries yet. Start logging your work hours!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}