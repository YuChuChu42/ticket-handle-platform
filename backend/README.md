# 智链工单系统 - 后端API

基于 Express + PostgreSQL 的工单管理系统后端。

## 技术栈

- Node.js + Express
- PostgreSQL (pg)
- JWT 认证
- bcrypt 密码加密
- Helmet 安全防护
- CORS 跨域支持
- Rate Limit 请求限流
- Compression gzip 压缩

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入数据库配置
```

### 3. 初始化数据库

```bash
# 确保已创建数据库并执行过 schema.sql
npm run init-db
```

### 4. 启动服务

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

## API 文档

### 认证相关

- `POST /api/auth/login` - 用户登录
- `POST /api/auth/refresh` - 刷新令牌
- `POST /api/auth/logout` - 退出登录

### 用户相关

- `GET /api/me` - 获取当前用户信息

### 工单相关

- `GET /api/tickets` - 获取工单列表（分页、搜索、筛选）
- `POST /api/tickets` - 创建工单
- `GET /api/tickets/:id` - 获取工单详情
- `PATCH /api/tickets/:id` - 更新工单
- `DELETE /api/tickets/:id` - 删除工单
- `POST /api/tickets/:id/comments` - 添加评论

### 统计相关

- `GET /api/metrics/summary` - 获取统计摘要
- `GET /api/metrics/trend` - 获取趋势数据

## 目录结构

```
backend/
├── src/
│   ├── config/          # 配置文件
│   ├── middleware/      # 中间件
│   ├── routes/          # 路由
│   ├── controllers/     # 控制器
│   ├── models/          # 数据模型
│   ├── utils/           # 工具函数
│   ├── scripts/         # 脚本文件
│   └── server.js        # 入口文件
├── .env                 # 环境变量
└── package.json
```

## 安全特性

- JWT 双令牌机制（访问令牌 + 刷新令牌）
- bcrypt 密码加密
- Helmet 安全头
- CORS 跨域限制
- Rate Limit 防止暴力攻击
- SQL 参数化查询防注入

## 开发说明

- 所有 API 返回格式统一为 `{ success, data, message, error }`
- 使用中间件统一处理错误
- 日志记录请求和错误信息
- 支持 gzip 压缩响应

