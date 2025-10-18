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

module.exports = {
  authenticate,
  authorize,
};

