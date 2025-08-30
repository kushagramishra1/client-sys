const express = require('express');
const cors = require('cors');
const path = require('path');
const ProjectDatabase = require('./database');
const createAuthRoutes = require('./routes/auth');
const createProjectRoutes = require('./routes/projects');
const createTimesheetRoutes = require('./routes/timesheets');
const createDashboardRoutes = require('./routes/dashboard');
const createUserRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
const database = new ProjectDatabase();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// API Routes
app.use('/api/auth', createAuthRoutes(database));
app.use('/api/projects', createProjectRoutes(database));
app.use('/api/timesheets', createTimesheetRoutes(database));
app.use('/api/dashboard', createDashboardRoutes(database));
app.use('/api/users', createUserRoutes(database));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  database.close();
  process.exit(0);
});