# 智链工单系统 - 完整部署指南

本文档将指导您从零开始部署智链工单系统（前端 + 后端 + 数据库）。

## 前置要求

### 软件环境
- **Node.js**: v18+ 
- **PostgreSQL**: v14+ (已安装 pgAdmin4)
- **npm**: v9+
- **Git**: 最新版本

### 开发工具
- VSCode (推荐) / WebStorm
- pgAdmin 4 (用于数据库管理)
- Postman/Insomnia (API 测试，可选)

---

## 第一步：数据库设置

### 1.1 创建数据库

打开 pgAdmin4 或使用命令行：

```bash
# 使用 psql 命令行
createdb ticket_system

# 或在 pgAdmin4 中：
# 右键 Databases -> Create -> Database -> 输入名称 "ticket_system"
```

### 1.2 执行建表脚本

```bash
# 进入项目根目录
cd /Users/natalieyu/project

# 执行建表脚本
psql -U postgres -d ticket_system -f database/schema.sql

# 插入测试数据
psql -U postgres -d ticket_system -f database/seed.sql
```

**注意**: 请将 `postgres` 替换为您的 PostgreSQL 用户名。

### 1.3 验证数据库

```bash
# 登录数据库
psql -U postgres -d ticket_system

# 查看表
\dt

# 查看用户数据
SELECT id, username, role FROM users;

# 退出
\q
```

---

## 第二步：后端设置

### 2.1 安装依赖

```bash
cd backend
npm install
```

### 2.2 配置环境变量

```bash
# 复制环境变量模板
cp env.example .env

# 编辑 .env 文件
nano .env
# 或使用您喜欢的编辑器
```

**修改 .env 文件内容**：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置（修改为您的实际配置）
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ticket_system
DB_USER=postgres         # 您的数据库用户名
DB_PASSWORD=your_password # 您的数据库密码

# JWT 配置（建议生产环境更换为更安全的密钥）
JWT_ACCESS_SECRET=your_jwt_access_secret_key_here_change_in_production
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here_change_in_production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS 配置
CORS_ORIGIN=http://localhost:5173
```

### 2.3 初始化数据库密码

由于测试数据中的密码是占位符，需要运行脚本生成真实的 bcrypt 哈希：

```bash
npm run init-db
```

**输出示例**：
```
生成密码哈希完成
✓ 用户密码更新成功

数据库初始化完成！
=================================
用户数量: 4
工单数量: 8
评论数量: 8
=================================

测试账号（密码均为 password123）：
- admin (管理员)
- agent1 (客服)
- agent2 (客服)
- viewer (观察者)
```

### 2.4 启动后端服务

```bash
# 开发模式（自动重启）
npm run dev

# 或生产模式
npm start
```

**成功输出**：
```
=================================
🚀 服务器运行在端口 3000
📍 环境: development
🔗 健康检查: http://localhost:3000/health
=================================
✓ 数据库连接成功
```

### 2.5 测试后端 API

打开浏览器访问：http://localhost:3000/health

或使用 curl：
```bash
curl http://localhost:3000/health
```

**应返回**：
```json
{
  "success": true,
  "message": "服务运行正常",
  "timestamp": "2025-10-18T..."
}
```

---

## 第三步：前端设置

**打开新的终端窗口**，保持后端运行。

### 3.1 安装依赖

```bash
cd frontend
npm install
```

### 3.2 配置环境变量

```bash
# 复制环境变量模板
cp env.example .env

# 编辑 .env 文件
nano .env
```

**修改 .env 文件**：

```env
# API 基础地址
VITE_API_BASE=http://localhost:3000/api
```

### 3.3 启动前端服务

```bash
npm run dev
```

**成功输出**：
```
VITE v5.0.11  ready in 1234 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

## 第四步：访问系统

### 4.1 打开浏览器

访问：http://localhost:5173

### 4.2 登录测试

使用以下测试账号登录：

| 角色 | 用户名 | 密码 | 权限说明 |
|------|--------|------|----------|
| 管理员 | admin | password123 | 所有权限（查看、创建、编辑、删除） |
| 客服 | agent1 | password123 | 创建和编辑工单 |
| 客服 | agent2 | password123 | 创建和编辑工单 |
| 观察者 | viewer | password123 | 仅查看权限 |

### 4.3 功能测试

1. **数据看板** - 查看统计数据和趋势图
2. **工单列表** - 搜索、筛选、分页
3. **创建工单** - 填写表单，测试草稿自动保存（输入后等待3秒，刷新页面看是否恢复）
4. **工单详情** - 查看详情、添加评论、编辑状态
5. **权限测试** - 用 viewer 账号登录，尝试创建工单（应被禁止）

---

## 常见问题

### Q1: 数据库连接失败

**错误信息**：
```
✗ 数据库连接错误: password authentication failed
```

**解决方案**：
1. 检查 `backend/.env` 中的数据库配置是否正确
2. 确认 PostgreSQL 服务是否运行
3. 验证用户名和密码是否正确

### Q2: 前端无法连接后端

**错误信息**：浏览器控制台显示 `Network Error` 或 CORS 错误

**解决方案**：
1. 确认后端服务是否正常运行（访问 http://localhost:3000/health）
2. 检查 `backend/.env` 中的 `CORS_ORIGIN` 是否为 `http://localhost:5173`
3. 检查 `frontend/.env` 中的 `VITE_API_BASE` 是否为 `http://localhost:3000/api`

### Q3: 登录后立即退出

**可能原因**：
1. JWT 令牌配置问题
2. 浏览器本地存储被禁用

**解决方案**：
1. 检查 `backend/.env` 中 JWT 配置
2. 清除浏览器缓存和 LocalStorage
3. 使用隐私模式测试

### Q4: 端口被占用

**错误信息**：
```
Error: listen EADDRINUSE: address already in use :::3000
```

**解决方案**：

```bash
# macOS/Linux 查找并终止占用端口的进程
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# 或修改端口
# backend/.env: PORT=3001
# frontend 会自动使用下一个可用端口
```

---

## 开发工具

### 推荐的 VSCode 插件

- Vue Language Features (Volar)
- TypeScript Vue Plugin (Volar)
- ESLint
- Prettier
- PostgreSQL (by Chris Kolkman)

### 数据库管理

推荐使用 pgAdmin 4 查看和管理数据：

1. 打开 pgAdmin 4
2. 连接到本地服务器
3. 展开 Databases -> ticket_system
4. 可以查看表结构、执行 SQL、查看数据等

---

## 生产部署建议

### 安全配置

1. **更换 JWT 密钥**：
   ```bash
   # 生成随机密钥
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **使用环境变量**：
   - 不要将 `.env` 文件提交到 Git
   - 使用服务器的环境变量管理工具

3. **启用 HTTPS**：
   - 使用 Nginx 作为反向代理
   - 配置 SSL 证书（Let's Encrypt）

### 性能优化

1. **前端构建**：
   ```bash
   cd frontend
   npm run build
   ```

2. **后端优化**：
   - 启用 Node.js cluster 模式
   - 使用 PM2 进程管理器
   - 配置数据库连接池

3. **数据库优化**：
   - 创建适当的索引
   - 定期清理旧数据
   - 配置数据库备份

---

## 下一步

- 📖 查看 [README.md](./README.md) 了解项目详情
- 🔧 查看 [backend/README.md](./backend/README.md) 了解后端 API
- 🎨 查看 [frontend/README.md](./frontend/README.md) 了解前端架构
- 🗄️ 查看 [database/README.md](./database/README.md) 了解数据库设计

---

## 技术支持

如遇到问题，请：

1. 查看本文档的"常见问题"部分
2. 检查 GitHub Issues
3. 查看控制台日志获取详细错误信息

**祝您使用愉快！** 🎉

