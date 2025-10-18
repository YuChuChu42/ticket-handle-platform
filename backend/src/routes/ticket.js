const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authenticate, authorize } = require('../middleware/auth');

// 获取工单列表（所有认证用户）
router.get('/', authenticate, ticketController.getTickets);

// 创建工单（admin 和 agent）
router.post('/', authenticate, authorize('admin', 'agent'), ticketController.createTicket);

// 获取工单详情（所有认证用户）
router.get('/:id', authenticate, ticketController.getTicketById);

// 更新工单（admin 和 agent）
router.patch('/:id', authenticate, authorize('admin', 'agent'), ticketController.updateTicket);

// 删除工单（仅 admin）
router.delete('/:id', authenticate, authorize('admin'), ticketController.deleteTicket);

// 添加评论（所有认证用户）
router.post('/:id/comments', authenticate, ticketController.addComment);

module.exports = router;

