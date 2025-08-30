const express = require('express');
const { AuthService } = require('../auth');

function createAuthRoutes(database) {
  const router = express.Router();
  const authService = new AuthService(database);

  // Login endpoint
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const result = await authService.login(email, password);
      res.json(result);
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  });

  // Register endpoint
  router.post('/register', async (req, res) => {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
      }

      const result = await authService.register(name, email, password, role || 'employee');
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}

module.exports = createAuthRoutes;