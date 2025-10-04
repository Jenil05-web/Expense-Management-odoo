const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');

// IMPORTANT: Put /history BEFORE /:id to avoid route conflict
router.get('/history', expenseController.getExpenseHistory);
router.get('/create', expenseController.getCreateExpense);
router.post('/create', expenseController.postCreateExpense);
router.get('/:id', expenseController.getExpenseDetails);
router.get('/:id/edit', expenseController.getEditExpense);
router.post('/:id/edit', expenseController.postEditExpense);
router.post('/:id/delete', expenseController.deleteExpense);
router.post('/:id/submit', expenseController.submitExpense);

module.exports = router;
