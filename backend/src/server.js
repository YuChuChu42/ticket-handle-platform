const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const { errorHandler, notFound } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

// 导入路由
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const userRoutesV2 = require('./routes/userRoutes_v2'); // 用户管理V2版本
const ticketRoutes = require('./routes/ticket_v2'); // 使用V2版本
const metricsRoutes = require('./routes/metrics');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(helmet()); // 安全头
app.use(compression()); // gzip 压缩
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json()); // 解析 JSON
app.use(express.urlencoded({ extended: true })); // 解析 URL 编码

// 请求日志
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 静态文件服务（用于访问上传的图片和PDF）
app.use('/uploads', express.static('uploads'));

// 通用限流
app.use('/api', generalLimiter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString(),
  });
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api/users', userRoutesV2); // 用户管理V2版本
app.use('/api/tickets', ticketRoutes);
app.use('/api/metrics', metricsRoutes);

// 404 处理
app.use(notFound);

// 错误处理
app.use(errorHandler);

// 启动服务器
app.listen(PORT, () => {
  console.log('=================================');
  console.log(`🚀 服务器运行在端口 ${PORT}`);
  console.log(`📍 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 健康检查: http://localhost:${PORT}/health`);
  console.log('=================================');
});

module.exports = app;

