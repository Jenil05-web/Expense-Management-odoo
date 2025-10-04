const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/auth");

// @desc    Landing page / Redirect logic
// @route   GET /
router.get("/", (req, res) => {
  // If the user is logged in, redirect them to their dashboard
  if (req.isAuthenticated()) {
    return res.redirect("/dashboard");
  }
  // Otherwise, send them to the login page
  res.redirect("/auth/login");
});
    
// VERY IMPORTANT: Make sure this line is at the end of every route file.
module.exports = router;
