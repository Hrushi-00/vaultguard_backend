const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate } = require('../middleware/auth');

// Profile update
router.put('/profile', authenticate, settingsController.updateProfile);

// Password change
router.post('/change-password', authenticate, settingsController.changePassword);

// 2FA setup
router.get('/setup-2fa', authenticate, settingsController.get2FASetup);
router.post('/enable-2fa', authenticate, settingsController.enable2FA);
router.post('/disable-2fa', authenticate, settingsController.disable2FA);

module.exports = router;
