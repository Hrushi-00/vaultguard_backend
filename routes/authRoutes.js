const express = require('express');
const router = express.Router();
const { login, signup, forgotPassword, changePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Auth routes
router.post('/login', login);
router.post('/signup', signup);
router.post('/forgot-password', forgotPassword);

// Settings routes (protected)
router.post('/change-password', authenticate, changePassword);
router.get('/profile', authenticate, require('../controllers/settingsController').getProfile);
router.put('/profile', authenticate, require('../controllers/settingsController').updateProfile);
router.get('/setup-2fa', authenticate, require('../controllers/settingsController').get2FASetup);
router.post('/enable-2fa', authenticate, require('../controllers/settingsController').enable2FA);
router.post('/disable-2fa', authenticate, require('../controllers/settingsController').disable2FA);

module.exports = router;
