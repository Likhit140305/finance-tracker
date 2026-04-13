const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/authMiddleware');

router.post('/register',    authController.register);
router.post('/login',       authController.login);
router.post('/verify-otp',  authController.verifyOtp);
router.post('/resend-otp',  authController.resendOtp);
router.get('/me',  auth,    authController.getMe);

module.exports = router;
