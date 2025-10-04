const User = require('../models/User');
const Company = require('../models/Company');
const bcrypt = require('bcryptjs');
const passport = require('passport');

// GET /auth/login - Show login page
exports.getLogin = (req, res) => {
  res.render('auth/login', {
    layout: 'auth-layout',
    title: 'Login',
    messages: {
      error: req.flash('error'),
      success: req.flash('success_msg')
    }
  });
};

// POST /auth/login - Handle login
exports.postLogin = (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/auth/login',
    failureFlash: true
  })(req, res, next);
};

// GET /auth/signup - Show signup page
exports.getSignup = (req, res) => {
  res.render('auth/signup', {
    layout: 'auth-layout',
    title: 'Sign Up',
    messages: {
      error: req.flash('error'),
      success: req.flash('success_msg')
    }
  });
};

// POST /auth/signup - Handle signup
exports.postSignup = async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      password2,
      companyName,
      companyEmail,
      companyPhone 
    } = req.body;

    // Validation
    const errors = [];

    if (!firstName || !lastName || !email || !password || !password2) {
      errors.push({ msg: 'Please fill in all required fields' });
    }

    if (password !== password2) {
      errors.push({ msg: 'Passwords do not match' });
    }

    if (password.length < 6) {
      errors.push({ msg: 'Password must be at least 6 characters' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push({ msg: 'Please enter a valid email address' });
    }

    if (errors.length > 0) {
      return res.render('auth/signup', {
        layout: 'auth-layout',
        title: 'Sign Up',
        errors,
        messages: {
          error: req.flash('error'),
          success: req.flash('success_msg')
        },
        formData: {
          firstName,
          lastName,
          email,
          companyName,
          companyEmail,
          companyPhone
        }
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      errors.push({ msg: 'Email is already registered. Please log in.' });
      return res.render('auth/signup', {
        layout: 'auth-layout',
        title: 'Sign Up',
        errors,
        messages: {
          error: req.flash('error'),
          success: req.flash('success_msg')
        },
        formData: {
          firstName,
          lastName,
          email,
          companyName,
          companyEmail,
          companyPhone
        }
      });
    }

    const company = new Company({
      name: companyName || `${firstName} ${lastName}'s Company`,
      email: companyEmail || email,
      phone: companyPhone || '',
      settings: {
        baseCurrency: 'USD',
        allowMultipleCurrencies: true,
        defaultApprovalFlow: null
      }
    });

    await company.save();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      company: company._id,
      role: 'admin',
      isActive: true,
      department: 'Management',
      position: 'Administrator'
    });

    await newUser.save();

    company.adminUser = newUser._id;
    await company.save();

    req.flash('success_msg', 'Registration successful! Please log in to continue.');
    res.redirect('/auth/login');

  } catch (error) {
    console.error('Signup error:', error);
    req.flash('error', 'An error occurred during registration. Please try again.');
    res.redirect('/auth/signup');
  }
};

exports.getForgotPassword = (req, res) => {
  res.render('auth/forgot-password', {
    layout: 'auth-layout',
    title: 'Forgot Password',
    messages: {
      error: req.flash('error'),
      success: req.flash('success_msg')
    }
  });
};

exports.postForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      req.flash('error', 'Please enter your email address');
      return res.redirect('/auth/forgot-password');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      req.flash('error', 'No account found with that email address');
      return res.redirect('/auth/forgot-password');
    }

    req.flash('success_msg', 'If an account exists with that email, password reset instructions have been sent');
    res.redirect('/auth/login');

  } catch (error) {
    console.error('Forgot password error:', error);
    req.flash('error', 'An error occurred. Please try again later.');
    res.redirect('/auth/forgot-password');
  }
};

exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return next(err);
    }
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
      }
      res.clearCookie('connect.sid');
      req.flash('success_msg', 'You have been logged out successfully');
      res.redirect('/auth/login');
    });
  });
};

exports.checkAuth = (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      authenticated: true,
      user: {
        id: req.user._id,
        name: `${req.user.firstName} ${req.user.lastName}`,
        email: req.user.email,
        role: req.user.role,
        company: req.user.company
      }
    });
  } else {
    res.json({ authenticated: false });
  }
};