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

    if (password !== confirmPassword) {
      return res.render("auth/signup", { error: "Passwords do not match", success: null });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render("auth/signup", { error: "Email already registered", success: null });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      country: country || "India",
      currency: currency || "INR"
    });
    await user.save();

    const company = new Company({
      name: `${name}'s Company`,
      admin: user._id,
      country: country || "India",
      currency: currency || "INR"
    });
    await company.save();

    user.company = company._id;
    await user.save();

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
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.render("auth/login", { error: info.message || "Invalid email or password", success: null });
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.redirect("/dashboard");
    });
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
