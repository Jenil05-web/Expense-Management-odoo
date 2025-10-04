const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isNotAuthenticated } = require('../middleware/auth');

// GET routes
router.get('/login', isNotAuthenticated, authController.getLogin);
router.get('/signup', isNotAuthenticated, authController.getSignup);
router.get('/logout', authController.logout);
router.get('/forgot-password', isNotAuthenticated, authController.getForgotPassword);

// POST routes
router.post('/login', isNotAuthenticated, authController.postLogin);
router.post('/signup', isNotAuthenticated, authController.postSignup);
router.post('/forgot-password', isNotAuthenticated, authController.postForgotPassword);

module.exports = router;