const express = require('express');
const { authenticateToken, requireAdmin } = require('../auth');

function createUserRoutes(database) {
  const router = express.Router();

  // Get all employees (admin only)
  router.get('/employees', authenticateToken, requireAdmin, (req, res) => {
    try {
      const employees = database.getAllEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get current user profile
  router.get('/profile', authenticateToken, (req, res) => {
    try {
      const user = database.getUserById(req.user.id);
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = createUserRoutes;