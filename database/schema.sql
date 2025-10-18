-- 智链工单系统数据库结构
-- PostgreSQL 版本

-- 删除已存在的表（开发环境使用）
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'agent', 'viewer')),
    email VARCHAR(100),
    full_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 工单表
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority VARCHAR(20) NOT NULL DEFAULT 'mid' CHECK (priority IN ('low', 'mid', 'high')),
    assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 评论表
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 事件表（用于统计和审计）
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('created', 'assigned', 'status_changed', 'priority_changed', 'commented')),
    actor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    old_value VARCHAR(100),
    new_value VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引优化查询性能
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_assignee ON tickets(assignee_id);
CREATE INDEX idx_tickets_creator ON tickets(creator_id);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);
CREATE INDEX idx_comments_ticket ON comments(ticket_id);
CREATE INDEX idx_events_ticket ON events(ticket_id);
CREATE INDEX idx_events_created_at ON events(created_at);

-- 创建触发器：自动更新 updated_at
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

-- 注释说明
COMMENT ON TABLE users IS '用户表：存储系统用户信息';
COMMENT ON TABLE tickets IS '工单表：存储工单核心信息';
COMMENT ON TABLE comments IS '评论表：工单评论记录';
COMMENT ON TABLE events IS '事件表：记录工单变更历史，用于统计和审计';

COMMENT ON COLUMN users.role IS '用户角色：admin(管理员)、agent(客服)、viewer(只读)';
COMMENT ON COLUMN tickets.status IS '工单状态：open(待处理)、in_progress(处理中)、resolved(已解决)、closed(已关闭)';
COMMENT ON COLUMN tickets.priority IS '优先级：low(低)、mid(中)、high(高)';

