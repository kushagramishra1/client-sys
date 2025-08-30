const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

class ProjectDatabase {
  constructor() {
    this.db = new Database(path.join(__dirname, 'project_tracking.db'));
    this.initializeDatabase();
    this.seedDefaultData();
  }

  initializeDatabase() {
    // Create users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create projects table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        client TEXT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        hourly_rate DECIMAL(10,2) NOT NULL,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create assignments table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(project_id, user_id)
      )
    `);

    // Create timesheets table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS timesheets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        date DATE NOT NULL,
        hours_worked DECIMAL(4,2) NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(project_id, user_id, date)
      )
    `);

    // Create billing view (calculated dynamically)
    this.db.exec(`
      CREATE VIEW IF NOT EXISTS billing_summary AS
      SELECT 
        p.id as project_id,
        p.name as project_name,
        p.client,
        p.hourly_rate,
        COALESCE(SUM(t.hours_worked), 0) as total_hours,
        COALESCE(SUM(t.hours_worked * p.hourly_rate), 0) as total_amount
      FROM projects p
      LEFT JOIN timesheets t ON p.id = t.project_id
      GROUP BY p.id, p.name, p.client, p.hourly_rate
    `);

    console.log('Database initialized successfully');
  }

  async seedDefaultData() {
    // Check if admin user exists
    const adminExists = this.db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin');
    
    if (adminExists.count === 0) {
      // Create default admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      this.db.prepare(`
        INSERT INTO users (name, email, password, role)
        VALUES (?, ?, ?, ?)
      `).run('Admin User', 'admin@company.com', hashedPassword, 'admin');

      // Create sample employee
      const empPassword = await bcrypt.hash('employee123', 10);
      this.db.prepare(`
        INSERT INTO users (name, email, password, role)
        VALUES (?, ?, ?, ?)
      `).run('John Employee', 'john@company.com', empPassword, 'employee');

      console.log('Default users created:');
      console.log('Admin: admin@company.com / admin123');
      console.log('Employee: john@company.com / employee123');
    }
  }

  // User methods
  createUser(name, email, hashedPassword, role) {
    const stmt = this.db.prepare(`
      INSERT INTO users (name, email, password, role)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(name, email, hashedPassword, role);
  }

  getUserByEmail(email) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  }

  getUserById(id) {
    const stmt = this.db.prepare('SELECT id, name, email, role FROM users WHERE id = ?');
    return stmt.get(id);
  }

  getAllEmployees() {
    const stmt = this.db.prepare('SELECT id, name, email FROM users WHERE role = ?');
    return stmt.all('employee');
  }

  // Project methods
  createProject(name, client, startDate, endDate, hourlyRate) {
    const stmt = this.db.prepare(`
      INSERT INTO projects (name, client, start_date, end_date, hourly_rate)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(name, client, startDate, endDate, hourlyRate);
  }

  getAllProjects() {
    const stmt = this.db.prepare('SELECT * FROM projects ORDER BY created_at DESC');
    return stmt.all();
  }

  getProjectById(id) {
    const stmt = this.db.prepare('SELECT * FROM projects WHERE id = ?');
    return stmt.get(id);
  }

  updateProjectStatus(id, status) {
    const stmt = this.db.prepare('UPDATE projects SET status = ? WHERE id = ?');
    return stmt.run(status, id);
  }

  // Assignment methods
  assignEmployeeToProject(projectId, userId) {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO assignments (project_id, user_id)
      VALUES (?, ?)
    `);
    return stmt.run(projectId, userId);
  }

  getProjectAssignments(projectId) {
    const stmt = this.db.prepare(`
      SELECT u.id, u.name, u.email 
      FROM users u
      JOIN assignments a ON u.id = a.user_id
      WHERE a.project_id = ?
    `);
    return stmt.all(projectId);
  }

  getUserAssignments(userId) {
    const stmt = this.db.prepare(`
      SELECT p.*, a.assigned_at
      FROM projects p
      JOIN assignments a ON p.id = a.project_id
      WHERE a.user_id = ?
    `);
    return stmt.all(userId);
  }

  // Timesheet methods
  logTime(projectId, userId, date, hoursWorked, description = '') {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO timesheets (project_id, user_id, date, hours_worked, description)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(projectId, userId, date, hoursWorked, description);
  }

  getUserTimesheets(userId, startDate = null, endDate = null) {
    let query = `
      SELECT t.*, p.name as project_name, p.client
      FROM timesheets t
      JOIN projects p ON t.project_id = p.id
      WHERE t.user_id = ?
    `;
    let params = [userId];

    if (startDate && endDate) {
      query += ' AND t.date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    query += ' ORDER BY t.date DESC';

    const stmt = this.db.prepare(query);
    return stmt.all(...params);
  }

  // Dashboard methods
  getDashboardStats() {
    const totalProjects = this.db.prepare('SELECT COUNT(*) as count FROM projects').get();
    const activeProjects = this.db.prepare('SELECT COUNT(*) as count FROM projects WHERE status = ?').get('active');
    const completedProjects = this.db.prepare('SELECT COUNT(*) as count FROM projects WHERE status = ?').get('completed');
    const totalBilled = this.db.prepare('SELECT COALESCE(SUM(total_amount), 0) as total FROM billing_summary').get();

    return {
      totalProjects: totalProjects.count,
      activeProjects: activeProjects.count,
      completedProjects: completedProjects.count,
      totalBilled: totalBilled.total
    };
  }

  getProjectStatusDistribution() {
    const stmt = this.db.prepare(`
      SELECT status, COUNT(*) as count
      FROM projects
      GROUP BY status
    `);
    return stmt.all();
  }

  getBillingSummary() {
    const stmt = this.db.prepare('SELECT * FROM billing_summary ORDER BY total_amount DESC');
    return stmt.all();
  }

  close() {
    this.db.close();
  }
}

module.exports = ProjectDatabase;