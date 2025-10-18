# 数据库说明

## 表结构

### users（用户表）
- `id`: 主键
- `username`: 用户名（唯一）
- `password_hash`: 密码哈希（使用 bcrypt）
- `role`: 角色（admin/agent/viewer）
- `email`: 邮箱
- `full_name`: 全名
- `created_at/updated_at`: 时间戳

### tickets（工单表）
- `id`: 主键
- `title`: 标题
- `description`: 描述
- `status`: 状态（open/in_progress/resolved/closed）
- `priority`: 优先级（low/mid/high）
- `assignee_id`: 指派人ID
- `creator_id`: 创建人ID
- `created_at/updated_at`: 时间戳

### comments（评论表）
- `id`: 主键
- `ticket_id`: 工单ID
- `author_id`: 作者ID
- `content`: 评论内容
- `created_at`: 创建时间

### events（事件表）
- `id`: 主键
- `ticket_id`: 工单ID
- `type`: 事件类型（created/assigned/status_changed等）
- `actor_id`: 操作人ID
- `old_value/new_value`: 变更前后的值
- `created_at`: 创建时间

## 初始化步骤

### 1. 创建数据库

```bash
# 使用 psql 命令行
createdb ticket_system

# 或在 pgAdmin4 中手动创建数据库
```

### 2. 执行建表脚本

```bash
psql -d ticket_system -f schema.sql
```

### 3. 插入测试数据

```bash
psql -d ticket_system -f seed.sql
```

注意：seed.sql 中的密码哈希需要在后端启动后通过 API 或脚本生成真实的 bcrypt 哈希值。

## 默认测试账号

执行 seed.sql 后会创建以下测试账号（密码均为 `password123`）：

- **admin** - 管理员角色
- **agent1** - 客服角色
- **agent2** - 客服角色  
- **viewer** - 观察者角色

## 连接配置

在后端 `.env` 文件中配置：

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ticket_system
DB_USER=your_username
DB_PASSWORD=your_password
```

