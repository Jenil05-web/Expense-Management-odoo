const express = require("express");
const router = express.Router();
const passport = require("passport");
const authController = require("../controllers/authController");
const { isNotAuthenticated } = require("../middleware/auth");

// @desc    Show login page
// @route   GET /auth/login
router.get("/login", isNotAuthenticated, authController.getLogin);

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
});

// IMPORTANT: This line exports the router and makes it usable in server.js
module.exports = router;
