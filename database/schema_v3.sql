-- 智链工单系统数据库结构 V3.0
-- 企业级工单管理系统

-- 用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'technician', 'reporter')),
    company_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 工单表
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
    priority VARCHAR(10) DEFAULT 'mid' CHECK (priority IN ('low', 'mid', 'high', 'urgent')),
    reporter_id INTEGER REFERENCES users(id),
    technician_id INTEGER REFERENCES users(id),
    assigned_by INTEGER REFERENCES users(id),
    location VARCHAR(200) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    report_file VARCHAR(255),
    resolved_at TIMESTAMP,
    report_generated_at TIMESTAMP,
    can_delete BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 工单图片表
CREATE TABLE ticket_images (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    image_path VARCHAR(255) NOT NULL,
    image_order INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 评论表
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    comment_type VARCHAR(20) DEFAULT 'comment' CHECK (comment_type IN ('comment', 'status_change', 'assignment')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 事件表
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    actor_id INTEGER REFERENCES users(id),
    description TEXT,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 工单分配历史表
CREATE TABLE ticket_assignments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    technician_id INTEGER REFERENCES users(id),
    assigned_by INTEGER REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 工单状态历史表
CREATE TABLE ticket_status_history (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    changed_by INTEGER REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入测试数据
INSERT INTO users (username, password_hash, role, company_name, full_name, email, phone) VALUES
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '智链科技有限公司', '系统管理员', 'admin@zhilian.com', '13800138000'),
('tech1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'technician', '智链科技有限公司', '张工程师', 'zhang@zhilian.com', '13800138001'),
('tech2', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'technician', '智链科技有限公司', '李技术员', 'li@zhilian.com', '13800138002'),
('reporter1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'reporter', '深圳荣耀咨询公司', '王经理', 'wang@rongyao.com', '13800138003'),
('reporter2', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'reporter', '北京创新科技公司', '刘主管', 'liu@chuangxin.com', '13800138004'),
('reporter3', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'reporter', '上海智能设备公司', '陈主任', 'chen@zhineng.com', '13800138005');

-- 插入测试工单
INSERT INTO tickets (title, description, status, priority, reporter_id, technician_id, assigned_by, location, contact_phone) VALUES
('VPN连接不稳定', '公司VPN经常断线，影响远程办公', 'resolved', 'high', 4, 2, 1, '深圳市南山区科技园南区深南大道10000号', '13800138003'),
('网速异常缓慢', '办公网络速度很慢，影响工作效率', 'in_progress', 'mid', 5, 2, 1, '北京市海淀区中关村大街1号', '13800138004'),
('打印机无法正常工作', '办公室打印机无法打印文档', 'pending', 'low', 6, 3, 1, '上海市浦东新区陆家嘴环路1000号', '13800138005');

-- 插入测试评论
INSERT INTO comments (ticket_id, author_id, content, comment_type) VALUES
(1, 4, 'VPN连接问题已持续一周，急需解决', 'comment'),
(1, 2, '已检查网络配置，发现路由器故障', 'comment'),
(1, 2, '已更换路由器，VPN连接恢复正常', 'status_change'),
(2, 5, '网络速度确实很慢，请尽快处理', 'comment'),
(2, 2, '正在检查网络设备，预计明天完成', 'comment'),
(3, 6, '打印机突然无法工作，请安排技术人员', 'comment');

-- 插入测试事件
INSERT INTO events (ticket_id, event_type, actor_id, description) VALUES
(1, 'created', 4, '工单已创建'),
(1, 'assigned', 1, '工单已分配给张工程师'),
(1, 'status_changed', 2, '工单状态变更为已解决'),
(2, 'created', 5, '工单已创建'),
(2, 'assigned', 1, '工单已分配给张工程师'),
(3, 'created', 6, '工单已创建'),
(3, 'assigned', 1, '工单已分配给李技术员');

-- 创建索引
CREATE INDEX idx_tickets_reporter_id ON tickets(reporter_id);
CREATE INDEX idx_tickets_technician_id ON tickets(technician_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);
CREATE INDEX idx_comments_ticket_id ON comments(ticket_id);
CREATE INDEX idx_events_ticket_id ON events(ticket_id);
CREATE INDEX idx_ticket_images_ticket_id ON ticket_images(ticket_id);

-- 创建触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
