const { verifyAccessToken } = require('../utils/jwt');

// 认证中间件
const authenticate = (req, res, next) => {
  try {
    // 从 Authorization header 获取 token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌',
      });
    }

    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀
    
    // 验证 token
    const decoded = verifyAccessToken(token);
    
    // 将用户信息附加到请求对象
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '认证失败',
      error: error.message,
    });
  }
};

// 角色授权中间件
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未认证',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足',
      });
    }

    next();
  };
};

// 检查是否是工单创建者
const isTicketOwner = async (req, res, next) => {
  try {
    const ticketId = req.params.id;
    const { query } = require('../config/database');
    
    const result = await query(
      'SELECT reporter_id FROM tickets WHERE id = $1',
      [ticketId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '工单不存在',
      });
    }

    const ticket = result.rows[0];
    
    // 管理员或创建者可以访问
    if (req.user.role === 'admin' || req.user.id === ticket.reporter_id) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: '只能操作自己的工单',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '权限验证失败',
      error: error.message,
    });
  }
};

module.exports = {
  authenticate,
  authorize,
  isTicketOwner,
};

