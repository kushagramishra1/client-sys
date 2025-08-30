const express = require('express');
const { authenticateToken } = require('../auth');

function createTimesheetRoutes(database) {
  const router = express.Router();

  // Log work hours
  router.post('/log', authenticateToken, (req, res) => {
    try {
      const { projectId, date, hoursWorked, description } = req.body;
      const userId = req.user.id;

      if (!projectId || !date || !hoursWorked) {
        return res.status(400).json({ 
          error: 'Project ID, date, and hours worked are required' 
        });
      }

      if (hoursWorked <= 0 || hoursWorked > 24) {
        return res.status(400).json({ 
          error: 'Hours worked must be between 0 and 24' 
        });
      }

      // Verify user is assigned to project
      const assignments = database.getUserAssignments(userId);
      const isAssigned = assignments.some(assignment => assignment.id == projectId);

      if (!isAssigned) {
        return res.status(403).json({ error: 'You are not assigned to this project' });
      }

      database.logTime(projectId, userId, date, hoursWorked, description || '');
      
      res.status(201).json({ message: 'Time logged successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get user's timesheets
  router.get('/my', authenticateToken, (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const timesheets = database.getUserTimesheets(req.user.id, startDate, endDate);
      res.json(timesheets);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all timesheets for a project (admin only)
  router.get('/project/:id', authenticateToken, (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { id } = req.params;
      const stmt = database.db.prepare(`
        SELECT t.*, u.name as user_name, p.name as project_name
        FROM timesheets t
        JOIN users u ON t.user_id = u.id
        JOIN projects p ON t.project_id = p.id
        WHERE t.project_id = ?
        ORDER BY t.date DESC
      `);
      const timesheets = stmt.all(id);
      
      res.json(timesheets);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = createTimesheetRoutes;