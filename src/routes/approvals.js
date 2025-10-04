const express = require("express");
const router = express.Router();

// This is a placeholder for approval-related routes

// @desc    Show expenses pending approval for the current manager/admin
// @route   GET /approvals
router.get("/", (req, res) => {
  res.send(
    "<h1>Pending Approvals</h1><p>Expenses waiting for your approval will be listed here.</p>"
  );
});

// @desc    Show approval rule configuration page (for admins)
// @route   GET /approvals/rules
router.get("/rules", (req, res) => {
  res.send("<h1>Configure Approval Rules</h1>");
});

module.exports = router;
