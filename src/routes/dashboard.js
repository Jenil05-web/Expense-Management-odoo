const express = require('express');
const router = express.Router();

// @desc    Dashboard dispatcher
// @route   GET /dashboard
router.get('/', (req, res) => {
    // This logic determines which dashboard to show based on the user's role
    const userRole = req.user.role;

    if (userRole === 'admin') {
        res.render('dashboard/admin', { title: 'Admin Dashboard' });
    } else if (userRole === 'manager') {
        res.render('dashboard/manager', { title: 'Manager Dashboard' });
    } else {
        res.render('dashboard/employee', { title: 'Employee Dashboard' });
    }
});

module.exports = router;
