const User = require('../models/User');
const { generateTokenPair, verifyRefreshToken } = require('../utils/jwt');

// 用户登录
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空',
      });
    }

    // 查找用户
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误',
      });
    }

    // 验证密码
    const isPasswordValid = await User.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误',
      });
    }

    // 生成令牌
    const tokens = generateTokenPair(user);

    // 返回用户信息和令牌
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          email: user.email,
          fullName: user.full_name,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      message: '登录成功',
    });
  } catch (error) {
    next(error);
  }
};

// 刷新令牌
exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: '刷新令牌不能为空',
      });
    }

    // 验证刷新令牌
    const decoded = verifyRefreshToken(refreshToken);

    // 查找用户（确保用户仍然存在）
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在',
      });
    }

    // 生成新的令牌对
    const tokens = generateTokenPair(user);

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      message: '令牌刷新成功',
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: '刷新令牌无效或已过期',
      error: error.message,
    });
  }
};

// 退出登录
exports.logout = async (req, res, next) => {
  try {
    // 前端需要删除本地存储的令牌
    res.json({
      success: true,
      message: '退出登录成功',
    });
  } catch (error) {
    next(error);
  }
};

// 获取当前用户信息
exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

