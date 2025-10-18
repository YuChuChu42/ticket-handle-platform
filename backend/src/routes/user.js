const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// 获取当前用户信息
router.get('/me', authenticate, authController.me);

module.exports = router;

