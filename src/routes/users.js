const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAdmin, isAdminOrManager } = require('../middleware/roleCheck');

router.get('/', isAdminOrManager, userController.getUsers);
router.get('/create', isAdmin, userController.getCreateUser);
router.post('/create', isAdmin, userController.postCreateUser);
router.get('/:id/edit', isAdmin, userController.getEditUser);
router.post('/:id/edit', isAdmin, userController.postEditUser);
router.post('/:id/delete', isAdmin, userController.deleteUser);
router.get('/:id/profile', userController.getUserProfile);
router.post('/:id/toggle-status', isAdmin, userController.toggleUserStatus);

module.exports = router;
