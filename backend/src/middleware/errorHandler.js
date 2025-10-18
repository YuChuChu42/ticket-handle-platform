// 统一错误处理中间件
const errorHandler = (err, req, res, next) => {
  console.error('错误:', err);

  // 设置默认状态码
  const statusCode = err.statusCode || 500;
  
  // 开发环境返回详细错误信息
  const isDev = process.env.NODE_ENV === 'development';
  
  res.status(statusCode).json({
    success: false,
    message: err.message || '服务器内部错误',
    error: isDev ? err.stack : undefined,
  });
};

// 404 处理中间件
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `路由不存在: ${req.originalUrl}`,
  });
};

module.exports = {
  errorHandler,
  notFound,
};

