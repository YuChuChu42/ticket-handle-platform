const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController_v2');
const { authenticate, authorize, isTicketOwner } = require('../middleware/auth');
const { uploadImages } = require('../config/upload');

// 获取技术人员列表（管理员）
router.get('/technicians', authenticate, authorize('admin'), ticketController.getTechnicians);

// 获取工单列表（所有认证用户，按角色过滤）
router.get('/', authenticate, ticketController.getTickets);

// 创建工单（负责人）- 带图片上传
router.post('/', 
  authenticate, 
  authorize('reporter'), 
  (req, res, next) => {
    uploadImages(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || '图片上传失败',
        });
      }
      next();
    });
  },
  ticketController.createTicket
);

// 获取工单详情（所有认证用户）
router.get('/:id', authenticate, ticketController.getTicketById);

// 更新工单（管理员、技术人员、负责人有不同权限）
router.patch('/:id', authenticate, ticketController.updateTicket);

// 分配工单（仅管理员）
router.post('/:id/assign', authenticate, authorize('admin'), ticketController.assignTicket);

// 删除工单（仅待处理状态，且是创建者）
router.delete('/:id', authenticate, authorize('reporter', 'admin'), ticketController.deleteTicket);

// 添加评论（所有认证用户）
router.post('/:id/comments', authenticate, ticketController.addComment);

// 生成PDF报告（技术人员）
router.post('/:id/generate-report', authenticate, authorize('technician', 'admin'), ticketController.generateReport);

// 下载PDF报告（所有认证用户）
router.get('/:id/download-report', authenticate, ticketController.downloadReport);

module.exports = router;

