const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Company = require('../models/Company');
const passport = require('passport');
const bcrypt = require('bcryptjs');

// GET signup page
router.get('/signup', (req, res) => {
  res.render('auth/signup', { error: null, success: null });
});

// POST signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, confirmPassword, country, currency } = req.body;

    // Basic password match check
    if (password !== confirmPassword) {
      return res.render('auth/signup', { error: 'Passwords do not match', success: null });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('auth/signup', { error: 'Email already registered', success: null });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Create the admin user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'admin' // make first user admin
    });

    await user.save();

    // 2. Create company linked to this admin user
    const company = new Company({
      name: `${name}'s Company`,
      admin: user._id,       // required by schema
      country: country || 'India',  // fallback if country missing
      currency: currency || 'INR'   // fallback if currency missing
    });

    await company.save();

    // 3. Link user to company
    user.company = company._id;
    await user.save();

    // 4. Auto-login the user
    req.login(user, function(err) {
      if (err) throw err;
      return res.redirect('/dashboard');
    });

  } catch (err) {
    console.error('Signup error:', err);
    return res.render('auth/signup', { error: 'Signup failed. Please try again.', success: null });
  }
});

// GET login page
router.get('/login', (req, res) => {
  res.render('auth/login', { error: null, success: null });
});

// POST login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/auth/login',
    failureFlash: true
  })(req, res, next);
});

module.exports = router;
