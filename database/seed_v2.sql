-- 智链工单系统种子数据 V2.0
-- 用于开发和测试

-- 插入测试用户（三种角色）
-- 密码均为 'password123'（将通过 init-db 脚本生成真实的 bcrypt 哈希）
INSERT INTO users (username, password_hash, role, company_name, email, phone, full_name) VALUES
('admin', '$2b$10$YourHashHere1', 'admin', NULL, 'admin@router-tech.com', '13800138000', '系统管理员'),
('tech1', '$2b$10$YourHashHere2', 'technician', NULL, 'tech1@router-tech.com', '13800138001', '技术员张工'),
('tech2', '$2b$10$YourHashHere3', 'technician', NULL, 'tech2@router-tech.com', '13800138002', '技术员李工'),
('reporter1', '$2b$10$YourHashHere4', 'reporter', '北京分公司', 'beijing@company.com', '13800138003', '北京负责人王明'),
('reporter2', '$2b$10$YourHashHere5', 'reporter', '上海分公司', 'shanghai@company.com', '13800138004', '上海负责人李华'),
('reporter3', '$2b$10$YourHashHere6', 'reporter', '深圳分公司', 'shenzhen@company.com', '13800138005', '深圳负责人陈杰');

-- 插入测试工单
INSERT INTO tickets (title, description, location, contact_phone, status, priority, reporter_id, technician_id, assigned_by) VALUES
-- 待处理工单
('路由器频繁断网问题', '办公室路由器每隔2小时自动断网重启，影响正常办公', '北京市朝阳区建国路88号', '13912345678', 'pending', 'urgent', 4, NULL, NULL),
('无线信号覆盖不足', '三楼会议室无线信号很弱，经常掉线', '上海市浦东新区世纪大道100号', '13987654321', 'pending', 'high', 5, NULL, NULL),

-- 进行中工单
('VPN连接不稳定', 'VPN连接经常中断，需要重新连接', '深圳市南山区科技园', '13611112222', 'in_progress', 'mid', 6, 2, 1),
('网速异常缓慢', '下载速度只有10Mbps，远低于500Mbps带宽', '北京市海淀区中关村', '13633334444', 'in_progress', 'high', 4, 2, 1),

-- 已解决工单
('固件升级失败', '路由器固件升级到一半卡住不动', '上海市徐汇区漕河泾', '13655556666', 'resolved', 'mid', 5, 3, 1),
('端口映射配置问题', '无法正确配置端口映射，外网无法访问内网服务', '深圳市福田区华强北', '13677778888', 'resolved', 'low', 6, 3, 1);

-- 插入评论
INSERT INTO comments (ticket_id, author_id, content, comment_type) VALUES
(3, 1, '已将此工单分配给技术员李工处理', 'assignment'),
(3, 3, '正在远程诊断问题，请保持路由器在线', 'comment'),
(4, 1, '已将此工单分配给技术员李工处理', 'assignment'),
(4, 3, '已到达现场，正在检查网络配置', 'comment'),
(5, 1, '已将此工单分配给技术员张工处理', 'assignment'),
(5, 2, '问题已定位，是固件版本不兼容导致', 'comment'),
(5, 2, '已重新刷写固件，问题解决', 'status_change'),
(6, 1, '已将此工单分配给技术员张工处理', 'assignment'),
(6, 2, '端口映射已正确配置，请测试', 'comment'),
(6, 5, '测试通过，问题已解决，感谢！', 'comment');

-- 插入事件记录
INSERT INTO events (ticket_id, event_type, actor_id, description) VALUES
(1, 'created', 4, '创建工单'),
(2, 'created', 5, '创建工单'),
(3, 'created', 6, '创建工单'),
(3, 'assigned', 1, '分配给技术员李工'),
(3, 'status_changed', 3, '状态从 pending 变更为 in_progress'),
(4, 'created', 4, '创建工单'),
(4, 'assigned', 1, '分配给技术员李工'),
(4, 'status_changed', 3, '状态从 pending 变更为 in_progress'),
(5, 'created', 5, '创建工单'),
(5, 'assigned', 1, '分配给技术员张工'),
(5, 'status_changed', 2, '状态从 pending 变更为 in_progress'),
(5, 'status_changed', 2, '状态从 in_progress 变更为 resolved'),
(6, 'created', 6, '创建工单'),
(6, 'assigned', 1, '分配给技术员张工'),
(6, 'status_changed', 2, '状态从 pending 变更为 in_progress'),
(6, 'status_changed', 2, '状态从 in_progress 变更为 resolved');

-- 查询验证数据
SELECT '=== 用户数据（三种角色）===' as info;
SELECT id, username, role, company_name, full_name FROM users;

SELECT '=== 工单数据 ===' as info;
SELECT id, title, status, priority, location, 
       (SELECT username FROM users WHERE id = reporter_id) as reporter,
       (SELECT username FROM users WHERE id = technician_id) as technician
FROM tickets;

SELECT '=== 评论数据 ===' as info;
SELECT COUNT(*) as comment_count FROM comments;

SELECT '=== 事件数据 ===' as info;
SELECT COUNT(*) as event_count FROM events;

