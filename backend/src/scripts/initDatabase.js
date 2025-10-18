const bcrypt = require('bcrypt');
const { query } = require('../config/database');

async function initDatabase() {
  console.log('开始初始化数据库...');

  try {
    // 生成真实的 bcrypt 密码哈希
    const password = 'password123';
    const hash1 = await bcrypt.hash(password, 10);
    const hash2 = await bcrypt.hash(password, 10);
    const hash3 = await bcrypt.hash(password, 10);
    const hash4 = await bcrypt.hash(password, 10);

    console.log('生成密码哈希完成');

    // 更新用户密码
    await query('UPDATE users SET password_hash = $1 WHERE username = $2', [hash1, 'admin']);
    await query('UPDATE users SET password_hash = $1 WHERE username = $2', [hash2, 'agent1']);
    await query('UPDATE users SET password_hash = $1 WHERE username = $2', [hash3, 'agent2']);
    await query('UPDATE users SET password_hash = $1 WHERE username = $2', [hash4, 'viewer']);

    console.log('✓ 用户密码更新成功');

    // 验证数据
    const userCount = await query('SELECT COUNT(*) FROM users');
    const ticketCount = await query('SELECT COUNT(*) FROM tickets');
    const commentCount = await query('SELECT COUNT(*) FROM comments');

    console.log('\n数据库初始化完成！');
    console.log('=================================');
    console.log(`用户数量: ${userCount.rows[0].count}`);
    console.log(`工单数量: ${ticketCount.rows[0].count}`);
    console.log(`评论数量: ${commentCount.rows[0].count}`);
    console.log('=================================');
    console.log('\n测试账号（密码均为 password123）：');
    console.log('- admin (管理员)');
    console.log('- agent1 (客服)');
    console.log('- agent2 (客服)');
    console.log('- viewer (观察者)');
    console.log('=================================\n');

    process.exit(0);
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
}

initDatabase();

