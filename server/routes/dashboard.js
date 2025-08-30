const express = require('express');
const { authenticateToken } = require('../auth');

function createDashboardRoutes(database) {
  const router = express.Router();

  // Admin dashboard stats
  router.get('/admin', authenticateToken, (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const stats = database.getDashboardStats();
      const projectDistribution = database.getProjectStatusDistribution();
      const billingSummary = database.getBillingSummary();

      res.json({
        stats,
        projectDistribution,
        billingSummary
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Employee dashboard stats
  router.get('/employee', authenticateToken, (req, res) => {
    try {
      const userId = req.user.id;
      
      // Get assigned projects
      const assignedProjects = database.getUserAssignments(userId);
      
      // Get this week's hours
      const today = new Date();
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
      const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
      
      const thisWeekHours = database.getUserTimesheets(
        userId,
        startOfWeek.toISOString().split('T')[0],
        endOfWeek.toISOString().split('T')[0]
      );

      // Get this month's hours
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      const thisMonthHours = database.getUserTimesheets(
        userId,
        startOfMonth.toISOString().split('T')[0],
        endOfMonth.toISOString().split('T')[0]
      );

      const weeklyTotal = thisWeekHours.reduce((sum, entry) => sum + parseFloat(entry.hours_worked), 0);
      const monthlyTotal = thisMonthHours.reduce((sum, entry) => sum + parseFloat(entry.hours_worked), 0);

      res.json({
        assignedProjects: assignedProjects.length,
        weeklyHours: weeklyTotal,
        monthlyHours: monthlyTotal,
        recentTimesheets: database.getUserTimesheets(userId).slice(0, 5)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = createDashboardRoutes;