-- 智链工单系统种子数据
-- 用于开发和测试

-- 插入测试用户
-- 密码均为 'password123'（实际使用时会通过 bcrypt 加密，这里先使用占位符）
INSERT INTO users (username, password_hash, role, email, full_name) VALUES
('admin', '$2b$10$YourHashHere1', 'admin', 'admin@example.com', '系统管理员'),
('agent1', '$2b$10$YourHashHere2', 'agent', 'agent1@example.com', '客服张三'),
('agent2', '$2b$10$YourHashHere3', 'agent', 'agent2@example.com', '客服李四'),
('viewer', '$2b$10$YourHashHere4', 'viewer', 'viewer@example.com', '观察者王五');

-- 插入测试工单
INSERT INTO tickets (title, description, status, priority, assignee_id, creator_id) VALUES
('系统登录异常', '用户反馈无法登录系统，提示密码错误', 'open', 'high', 2, 1),
('界面显示问题', '首页图表显示不正常，数据未加载', 'in_progress', 'mid', 2, 1),
('功能优化建议', '希望增加批量导出功能', 'open', 'low', NULL, 3),
('性能优化', '列表页面加载速度较慢', 'resolved', 'mid', 3, 1),
('新功能需求', '需要添加移动端支持', 'in_progress', 'high', 2, 1),
('Bug修复', '删除工单后评论未删除', 'resolved', 'high', 3, 1),
('用户反馈', '搜索功能不够精确', 'open', 'mid', NULL, 2),
('数据统计', '需要增加月度报表', 'closed', 'low', 2, 1);

-- 插入测试评论
INSERT INTO comments (ticket_id, author_id, content) VALUES
(1, 2, '已收到反馈，正在调查原因'),
(1, 1, '请优先处理，影响用户登录'),
(2, 2, '已定位问题，是缓存导致的'),
(2, 2, '问题已修复，请验证'),
(4, 3, '已优化数据库查询，性能提升30%'),
(4, 1, '验证通过，可以关闭'),
(5, 2, '移动端适配需要2周时间'),
(6, 3, '已添加级联删除，问题解决');

-- 插入事件记录
INSERT INTO events (ticket_id, type, actor_id, old_value, new_value) VALUES
(1, 'created', 1, NULL, NULL),
(1, 'assigned', 1, NULL, '2'),
(2, 'created', 1, NULL, NULL),
(2, 'assigned', 1, NULL, '2'),
(2, 'status_changed', 2, 'open', 'in_progress'),
(3, 'created', 3, NULL, NULL),
(4, 'created', 1, NULL, NULL),
(4, 'assigned', 1, NULL, '3'),
(4, 'status_changed', 3, 'open', 'in_progress'),
(4, 'status_changed', 3, 'in_progress', 'resolved'),
(5, 'created', 1, NULL, NULL),
(5, 'assigned', 1, NULL, '2'),
(5, 'priority_changed', 1, 'mid', 'high'),
(5, 'status_changed', 2, 'open', 'in_progress'),
(6, 'created', 1, NULL, NULL),
(6, 'assigned', 1, NULL, '3'),
(6, 'status_changed', 3, 'open', 'resolved'),
(7, 'created', 2, NULL, NULL),
(8, 'created', 1, NULL, NULL),
(8, 'assigned', 1, NULL, '2'),
(8, 'status_changed', 2, 'open', 'in_progress'),
(8, 'status_changed', 2, 'in_progress', 'resolved'),
(8, 'status_changed', 1, 'resolved', 'closed');

-- 查询验证数据
SELECT '=== 用户数据 ===' as info;
SELECT id, username, role, email FROM users;

SELECT '=== 工单数据 ===' as info;
SELECT id, title, status, priority, assignee_id, creator_id FROM tickets;

SELECT '=== 评论数据 ===' as info;
SELECT COUNT(*) as comment_count FROM comments;

SELECT '=== 事件数据 ===' as info;
SELECT COUNT(*) as event_count FROM events;

