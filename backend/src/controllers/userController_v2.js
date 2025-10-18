const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

// 获取所有用户列表
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, page = 1, pageSize = 10 } = req.query;
    
    let whereClause = '';
    let params = [];
    
    if (role) {
      whereClause = 'WHERE role = $1';
      params.push(role);
    }
    
    const offset = (page - 1) * pageSize;
    
    // 获取总数
    const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    // 获取用户列表
    const usersQuery = `
      SELECT id, username, role, company_name, full_name, email, phone, created_at, updated_at
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    const usersResult = await query(usersQuery, [...params, pageSize, offset]);
    
    res.json({
      success: true,
      data: {
        users: usersResult.rows,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取技术人员列表
exports.getTechnicians = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT id, username, full_name, email, phone, company_name, created_at
      FROM users 
      WHERE role = 'technician'
      ORDER BY full_name ASC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

// 获取客户方负责人列表
exports.getReporters = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT id, username, full_name, email, phone, company_name, created_at
      FROM users 
      WHERE role = 'reporter'
      ORDER BY company_name ASC, full_name ASC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

// 创建用户
exports.createUser = async (req, res, next) => {
  try {
    const { username, password, role, company_name, full_name, email, phone } = req.body;
    
    // 验证输入
    if (!username || !password || !role || !company_name || !full_name) {
      return res.status(400).json({
        success: false,
        message: '用户名、密码、角色、公司名称和姓名不能为空'
      });
    }
    
    // 验证角色
    if (!['admin', 'technician', 'reporter'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: '角色必须是 admin、technician 或 reporter'
      });
    }
    
    // 检查用户名是否已存在
    const existingUser = await query('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      });
    }
    
    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);
    
    // 创建用户
    const result = await query(`
      INSERT INTO users (username, password_hash, role, company_name, full_name, email, phone)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, username, role, company_name, full_name, email, phone, created_at
    `, [username, passwordHash, role, company_name, full_name, email, phone]);
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: '用户创建成功'
    });
  } catch (error) {
    next(error);
  }
};

// 更新用户
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, password, role, company_name, full_name, email, phone } = req.body;
    
    // 验证输入
    if (!username || !role || !company_name || !full_name) {
      return res.status(400).json({
        success: false,
        message: '用户名、角色、公司名称和姓名不能为空'
      });
    }
    
    // 验证角色
    if (!['admin', 'technician', 'reporter'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: '角色必须是 admin、technician 或 reporter'
      });
    }
    
    // 检查用户是否存在
    const existingUser = await query('SELECT id FROM users WHERE id = $1', [id]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 检查用户名是否被其他用户使用
    const usernameCheck = await query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, id]);
    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: '用户名已被其他用户使用'
      });
    }
    
    let updateQuery = `
      UPDATE users 
      SET username = $1, role = $2, company_name = $3, full_name = $4, email = $5, phone = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, username, role, company_name, full_name, email, phone, created_at, updated_at
    `;
    let params = [username, role, company_name, full_name, email, phone, id];
    
    // 如果提供了新密码，则更新密码
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updateQuery = `
        UPDATE users 
        SET username = $1, password_hash = $2, role = $3, company_name = $4, full_name = $5, email = $6, phone = $7, updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
        RETURNING id, username, role, company_name, full_name, email, phone, created_at, updated_at
      `;
      params = [username, passwordHash, role, company_name, full_name, email, phone, id];
    }
    
    const result = await query(updateQuery, params);
    
    res.json({
      success: true,
      data: result.rows[0],
      message: '用户更新成功'
    });
  } catch (error) {
    next(error);
  }
};

// 删除用户
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // 检查用户是否存在
    const existingUser = await query('SELECT id, role FROM users WHERE id = $1', [id]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    // 不能删除自己
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '不能删除自己的账户'
      });
    }
    
    // 检查是否有相关的工单
    const ticketCheck = await query(`
      SELECT COUNT(*) FROM tickets 
      WHERE reporter_id = $1 OR technician_id = $1 OR assigned_by = $1
    `, [id]);
    
    if (parseInt(ticketCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: '该用户有关联的工单，无法删除'
      });
    }
    
    // 删除用户
    await query('DELETE FROM users WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: '用户删除成功'
    });
  } catch (error) {
    next(error);
  }
};

// 获取用户详情
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT id, username, role, company_name, full_name, email, phone, created_at, updated_at
      FROM users 
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
