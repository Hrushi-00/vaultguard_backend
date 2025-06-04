const express = require('express');
const router = express.Router();
const { login, signup, forgotPassword } = require('../controllers/authController');

router.post('/login', login);
router.post('/signup', signup);
router.post('/forgot-password', forgotPassword);

module.exports = router;
