const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

// @desc    Landing page
// @route   GET /
router.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/auth/login');
    }
});

module.exports = router;
