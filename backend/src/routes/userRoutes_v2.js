const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController_v2');
const authMiddleware = require('../middleware/auth');

// 所有路由都需要管理员权限
router.use(authMiddleware);
router.use((req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '需要管理员权限'
    });
  }
  next();
});

// 获取所有用户列表
router.get('/', userController.getAllUsers);

// 获取技术人员列表
router.get('/technicians', userController.getTechnicians);

// 获取客户方负责人列表
router.get('/reporters', userController.getReporters);

// 获取用户详情
router.get('/:id', userController.getUserById);

// 创建用户
router.post('/', userController.createUser);

// 更新用户
router.put('/:id', userController.updateUser);

// 删除用户
router.delete('/:id', userController.deleteUser);

module.exports = router;
