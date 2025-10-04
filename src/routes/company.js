const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { isAdmin } = require('../middleware/roleCheck');

// Company settings routes
router.get('/settings', isAdmin, companyController.getSettings);
router.post('/settings', isAdmin, companyController.postSettings);
router.get('/currency', isAdmin, companyController.getCurrency);
router.post('/currency', isAdmin, companyController.postCurrency);

module.exports = router;
