const express = require("express");
const router = express.Router();

// This is a placeholder for company settings routes

// @desc    Show company settings page
// @route   GET /company
router.get("/", (req, res) => {
  res.send(
    "<h1>Company Settings</h1><p>Here you can manage company details.</p>"
  );
});

module.exports = router;
