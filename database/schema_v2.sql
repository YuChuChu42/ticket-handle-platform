-- 智链工单系统数据库结构 V2.0
-- 面向企业级路由器技术支持场景
-- PostgreSQL 版本

-- 删除已存在的表
DROP TABLE IF EXISTS ticket_images CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 用户表（新角色体系）
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'technician', 'reporter')),
    company_name VARCHAR(200), -- 公司名称（负责人专用）
    email VARCHAR(100),
    phone VARCHAR(20),
    full_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 工单表（扩展字段）
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    
    -- 现场信息
    location VARCHAR(300) NOT NULL, -- 发生地点
    contact_phone VARCHAR(20) NOT NULL, -- 对接电话
    
    -- 状态和优先级
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
    priority VARCHAR(20) NOT NULL DEFAULT 'mid' CHECK (priority IN ('low', 'mid', 'high', 'urgent')),
    
    -- 人员关系
    reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- 负责人（创建者）
    technician_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- 被分配的技术人员
    assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL, -- 分配人（管理员）
    
    -- 报告文件
    report_file VARCHAR(500), -- PDF报告路径
    report_generated_at TIMESTAMP, -- 报告生成时间
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP -- 解决时间
);

-- 工单图片表（最多4张）
CREATE TABLE ticket_images (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    image_path VARCHAR(500) NOT NULL, -- 图片存储路径
    image_order INTEGER NOT NULL, -- 图片顺序 1-4
    file_size INTEGER, -- 文件大小（字节）
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ticket_images_order_check CHECK (image_order >= 1 AND image_order <= 4)
);

-- 评论表
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    comment_type VARCHAR(20) DEFAULT 'comment' CHECK (comment_type IN ('comment', 'status_change', 'assignment')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 事件表（审计日志）
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('created', 'assigned', 'status_changed', 'priority_changed', 'report_generated', 'deleted')),
    actor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    old_value VARCHAR(100),
    new_value VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_reporter ON tickets(reporter_id);
CREATE INDEX idx_tickets_technician ON tickets(technician_id);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);
CREATE INDEX idx_ticket_images_ticket ON ticket_images(ticket_id);
CREATE INDEX idx_comments_ticket ON comments(ticket_id);
CREATE INDEX idx_events_ticket ON events(ticket_id);
CREATE INDEX idx_events_created_at ON events(created_at);

-- 触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 触发器：工单解决时记录时间
CREATE OR REPLACE FUNCTION update_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
        NEW.resolved_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_resolved_at BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_resolved_at();

-- 注释说明
COMMENT ON TABLE users IS '用户表：支持三种角色';
COMMENT ON TABLE tickets IS '工单表：包含现场信息和报告文件';
COMMENT ON TABLE ticket_images IS '工单图片表：每个工单最多4张图片';
COMMENT ON TABLE comments IS '评论表：工单沟通记录';
COMMENT ON TABLE events IS '事件表：审计日志';

COMMENT ON COLUMN users.role IS '用户角色：admin(管理员)、technician(技术人员)、reporter(负责人)';
COMMENT ON COLUMN tickets.status IS '工单状态：pending(待处理)、in_progress(处理中)、resolved(已解决)、closed(已关闭)';
COMMENT ON COLUMN tickets.priority IS '优先级：low(低)、mid(中)、high(高)、urgent(紧急)';
COMMENT ON COLUMN tickets.location IS '问题发生地点';
COMMENT ON COLUMN tickets.contact_phone IS '现场对接电话';
COMMENT ON COLUMN tickets.report_file IS 'PDF报告文件路径';

