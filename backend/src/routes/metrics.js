const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authenticate } = require('../middleware/auth');

// 获取统计摘要
router.get('/summary', authenticate, ticketController.getSummary);

// 获取趋势数据
router.get('/trend', authenticate, ticketController.getTrend);

module.exports = router;

