const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

// @desc    Dashboard dispatcher
// @route   GET /dashboard
router.get('/', isAuthenticated, (req, res) => {
    // This logic determines which dashboard to show based on the user's role
    const userRole = req.user.role;

    if (userRole === 'Admin') {
        res.render('dashboard/admin', { title: 'Admin Dashboard', user: req.user });
    } else if (userRole === 'Manager') {
        res.render('dashboard/manager', { title: 'Manager Dashboard', user: req.user });
    } else {
        res.render('dashboard/employee', { title: 'Employee Dashboard', user: req.user });
    }
});

module.exports = router;
