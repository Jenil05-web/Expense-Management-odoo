const express = require('express');
const router = express.Router();

// This is a placeholder for expense-related routes

// @desc    Show all expenses for the current user or all users (if admin)
// @route   GET /expenses
router.get('/', (req, res) => {
    res.send('<h1>All Expenses</h1><p>A list of expenses will be displayed here.</p>');
});

// @desc    Show form to create a new expense
// @route   GET /expenses/new
router.get('/new', (req, res) => {
    res.send('<h1>Submit New Expense Form</h1>');
});

module.exports = router;
