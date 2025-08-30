const express = require('express');
const { authenticateToken, requireAdmin } = require('../auth');

function createProjectRoutes(database) {
  const router = express.Router();

  // Get all projects (admin) or assigned projects (employee)
  router.get('/', authenticateToken, (req, res) => {
    try {
      let projects;
      
      if (req.user.role === 'admin') {
        projects = database.getAllProjects();
      } else {
        projects = database.getUserAssignments(req.user.id);
      }

      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create new project (admin only)
  router.post('/', authenticateToken, requireAdmin, (req, res) => {
    try {
      const { name, client, startDate, endDate, hourlyRate } = req.body;

      if (!name || !client || !startDate || !hourlyRate) {
        return res.status(400).json({ 
          error: 'Name, client, start date, and hourly rate are required' 
        });
      }

      const result = database.createProject(name, client, startDate, endDate, hourlyRate);
      const newProject = database.getProjectById(result.lastInsertRowid);
      
      res.status(201).json(newProject);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update project status (admin only)
  router.patch('/:id/status', authenticateToken, requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['active', 'completed', 'paused'].includes(status)) {
        return res.status(400).json({ 
          error: 'Valid status (active, completed, paused) is required' 
        });
      }

      database.updateProjectStatus(id, status);
      const updatedProject = database.getProjectById(id);
      
      res.json(updatedProject);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Assign employee to project (admin only)
  router.post('/:id/assign', authenticateToken, requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      database.assignEmployeeToProject(id, userId);
      const assignments = database.getProjectAssignments(id);
      
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get project assignments
  router.get('/:id/assignments', authenticateToken, (req, res) => {
    try {
      const { id } = req.params;
      const assignments = database.getProjectAssignments(id);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = createProjectRoutes;