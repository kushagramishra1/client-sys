const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  }

  // Auth methods
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    this.setToken(response.token);
    return response;
  }

  async register(name, email, password, role = 'employee') {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
    
    this.setToken(response.token);
    return response;
  }

  logout() {
    this.setToken(null);
  }

  // Project methods
  async getProjects() {
    return this.request('/projects');
  }

  async createProject(projectData) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async updateProjectStatus(projectId, status) {
    return this.request(`/projects/${projectId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async assignEmployee(projectId, userId) {
    return this.request(`/projects/${projectId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async getProjectAssignments(projectId) {
    return this.request(`/projects/${projectId}/assignments`);
  }

  // Timesheet methods
  async logTime(timeData) {
    return this.request('/timesheets/log', {
      method: 'POST',
      body: JSON.stringify(timeData),
    });
  }

  async getMyTimesheets(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/timesheets/my${query}`);
  }

  async getProjectTimesheets(projectId) {
    return this.request(`/timesheets/project/${projectId}`);
  }

  // Dashboard methods
  async getAdminDashboard() {
    return this.request('/dashboard/admin');
  }

  async getEmployeeDashboard() {
    return this.request('/dashboard/employee');
  }

  // User methods
  async getEmployees() {
    return this.request('/users/employees');
  }

  async getProfile() {
    return this.request('/users/profile');
  }
}

export default new ApiService();