const express = require('express');
const router = express.Router();
const passport = require('passport');

// @desc    Show login page
// @route   GET /auth/login
router.get('/login', (req, res) => {
    res.render('auth/login', { title: 'Login' });
});

// @desc    Authenticate user
// @route   POST /auth/login
router.post('/login', passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/auth/login',
    failureFlash: true
}));

// @desc    Logout user
// @route   GET /auth/logout
router.get('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        req.flash('success_msg', 'You are logged out');
        res.redirect('/auth/login');
    });
});

// IMPORTANT: This line exports the router and makes it usable in server.js
module.exports = router;
