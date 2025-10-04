const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

// @desc    Dashboard dispatcher
// @route   GET /dashboard
router.get('/', isAuthenticated, dashboardController.getDashboard);

module.exports = router;
