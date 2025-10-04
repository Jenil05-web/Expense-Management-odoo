const express = require("express");
const router = express.Router();
const passport = require("passport");
const authController = require("../controllers/authController");
const { isNotAuthenticated } = require("../middleware/auth");

// @desc    Show login page
// @route   GET /auth/login
router.get("/login", isNotAuthenticated, authController.getLogin);
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

// @desc    Authenticate user
// @route   POST /auth/login
router.post(
  "/login",
  isNotAuthenticated,
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/auth/login",
    failureFlash: true,
  })
);

// @desc    Show Signup page
// @route   GET /auth/signup
router.get("/signup", isNotAuthenticated, authController.getSignup);

// @desc    Process registration form
// @route   POST /auth/signup
router.post("/signup", isNotAuthenticated, authController.postSignup);

// @desc    Logout user
// @route   GET /auth/logout
router.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.flash("success_msg", "You are logged out");
    res.redirect("/auth/login");
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
