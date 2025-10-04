const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approvalController');
const { isAdminOrManager } = require('../middleware/roleCheck');

router.get('/pending', isAdminOrManager, approvalController.getPendingApprovals);
router.get('/:id/review', isAdminOrManager, approvalController.getReviewApproval);
router.post('/:id/approve', isAdminOrManager, approvalController.approveExpense);
router.post('/:id/reject', isAdminOrManager, approvalController.rejectExpense);
router.get('/flow-setup', isAdminOrManager, approvalController.getFlowSetup);
router.post('/flow-setup', isAdminOrManager, approvalController.postFlowSetup);
router.get('/rules', isAdminOrManager, approvalController.getRules);

module.exports = router;
