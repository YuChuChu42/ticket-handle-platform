const { query } = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  // 通过用户名查找用户
  static async findByUsername(username) {
    const result = await query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0];
  }

  // 通过ID查找用户
  static async findById(id) {
    const result = await query(
      'SELECT id, username, role, email, full_name, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  // 创建新用户
  static async create({ username, password, role, email, fullName }) {
    const passwordHash = await bcrypt.hash(password, 10);
    
    const result = await query(
      `INSERT INTO users (username, password_hash, role, email, full_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, role, email, full_name, created_at`,
      [username, passwordHash, role, email, fullName]
    );
    
    return result.rows[0];
  }

  // 验证密码
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // 获取所有用户（不含密码）
  static async findAll() {
    const result = await query(
      'SELECT id, username, role, email, full_name, created_at FROM users ORDER BY created_at DESC'
    );
    return result.rows;
  }
}

module.exports = User;

