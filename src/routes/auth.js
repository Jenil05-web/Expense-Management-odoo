const express = require("express");
const router = express.Router();
const passport = require("passport");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Company = require("../models/Company");
const { isAuthenticated, isNotAuthenticated } = require("../middleware/auth");

// =====================
// GET Signup page
// =====================
router.get("/signup", isNotAuthenticated, (req, res) => {
  res.render("auth/signup", { error: null, success: null });
});

// =====================
// POST Signup
// =====================
router.post("/signup", isNotAuthenticated, async (req, res) => {
  try {
    const { name, email, password, confirmPassword, country, currency } = req.body;

    // Password match check
    if (password !== confirmPassword) {
      return res.render("auth/signup", { error: "Passwords do not match", success: null });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render("auth/signup", { error: "Email already registered", success: null });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (admin role)
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: "admin"
    });
    await user.save();

    // Create company linked to admin
    const company = new Company({
      name: `${name}'s Company`,
      admin: user._id,
      country: country || "India",
      currency: currency || "INR"
    });
    await company.save();

    // Link user to company
    user.company = company._id;
    await user.save();

    // Auto-login
    req.login(user, (err) => {
      if (err) throw err;
      return res.redirect("/dashboard");
    });

  } catch (err) {
    console.error("Signup error:", err);
    return res.render("auth/signup", { error: "Signup failed. Please try again.", success: null });
  }
});

// =====================
// GET Login page
// =====================
router.get("/login", isNotAuthenticated, (req, res) => {
  res.render("auth/login", { error: null, success: null });
});

// =====================
// POST Login
// =====================
router.post("/login", isNotAuthenticated, (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/auth/login",
    failureFlash: true,
  })(req, res, next);
});

// =====================
// Logout
// =====================
router.get("/logout", isAuthenticated, (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success_msg", "You are logged out");
    res.redirect("/auth/login");
  });
});

module.exports = router;
