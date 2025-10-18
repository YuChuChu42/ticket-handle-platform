const rateLimit = require('express-rate-limit');

// 通用限流器
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制100个请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 登录限流器（更严格）
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 限制5次登录尝试
  message: {
    success: false,
    message: '登录尝试次数过多，请15分钟后再试',
  },
  skipSuccessfulRequests: true, // 成功的请求不计数
});

module.exports = {
  generalLimiter,
  loginLimiter,
};

