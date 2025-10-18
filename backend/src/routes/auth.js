const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');

// 登录（带限流）
router.post('/login', loginLimiter, authController.login);

// 刷新令牌
router.post('/refresh', authController.refresh);

// 退出登录
router.post('/logout', authenticate, authController.logout);

module.exports = router;

