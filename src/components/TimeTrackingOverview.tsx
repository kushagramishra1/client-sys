import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import { Calendar, Clock, User, DollarSign } from 'lucide-react';

interface TimeEntry {
  id: number;
  project_id: number;
  user_id: number;
  date: string;
  hours_worked: number;
  description: string;
  user_name: string;
  project_name: string;
}

export function TimeTrackingOverview() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadTimeEntries();
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const data = await apiService.getProjects();
      setProjects(data);
      if (data.length > 0) {
        setSelectedProject(data[0].id);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeEntries = async () => {
    if (!selectedProject) return;
    
    try {
      const data = await apiService.getProjectTimesheets(selectedProject);
      setTimeEntries(data);
    } catch (error) {
      console.error('Error loading time entries:', error);
    }
  };

  const calculateProjectTotal = () => {
    return timeEntries.reduce((total, entry) => total + parseFloat(entry.hours_worked.toString()), 0);
  };

  const calculateProjectBilling = () => {
    const project = projects.find(p => p.id === selectedProject);
    if (!project) return 0;
    return calculateProjectTotal() * project.hourly_rate;
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
      {/* Project Selection */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Select Project</h3>
        </div>
        
        <div className="p-6">
          <select
            value={selectedProject || ''}
            onChange={(e) => setSelectedProject(parseInt(e.target.value))}
            className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Choose a project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} - {project.client}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedProject && (
        <>
          {/* Project Summary */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 rounded-lg bg-blue-500">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Hours</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {calculateProjectTotal().toFixed(2)}h
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 rounded-lg bg-green-500">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Billing</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      ${calculateProjectBilling().toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 rounded-lg bg-purple-500">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Time Entries</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {timeEntries.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Time Entries Table */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Time Entries</span>
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {timeEntries.map((entry, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {entry.user_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.hours_worked}h
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {entry.description || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {timeEntries.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500">
                  No time entries found for this project
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}