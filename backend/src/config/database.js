const { Pool } = require('pg');
require('dotenv').config();

// 创建数据库连接池
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ticket_system',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 测试数据库连接
pool.on('connect', () => {
  console.log('✓ 数据库连接成功');
});

pool.on('error', (err) => {
  console.error('✗ 数据库连接错误:', err);
  process.exit(-1);
});

// 查询辅助函数
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('执行查询:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('查询错误:', error);
    throw error;
  }
};

module.exports = {
  pool,
  query,
};

