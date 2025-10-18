# 智链工单 & 轻量运营看板

面向中小团队的轻量工单平台：支持登录与基础 RBAC、工单的创建/分派/状态流转、简单统计看板。

## 技术栈

### 前端
- Vue 3 + TypeScript
- Vite 构建工具
- Pinia 状态管理
- Vue Router 路由
- Axios HTTP 客户端
- Element Plus UI 组件库
- ECharts 数据可视化
- IndexedDB 离线草稿
- Service Worker (PWA)
- ESLint/Prettier 代码规范
- Vitest 单元测试

### 后端
- Node.js + Express
- PostgreSQL 数据库
- JWT 认证
- CORS 跨域支持

## 项目结构

```
project/
├── frontend/         # Vue3 前端项目
├── backend/          # Express 后端项目
└── database/         # 数据库脚本
```

## 快速开始

> 📖 **详细部署指南**：请查看 [SETUP.md](./SETUP.md) 获取完整的分步部署说明

### 1. 数据库设置

```bash
# 使用 pgAdmin4 或 psql 创建数据库
createdb ticket_system

# 执行初始化脚本
psql -U postgres -d ticket_system -f database/schema.sql
psql -U postgres -d ticket_system -f database/seed.sql
```

### 2. 后端启动

```bash
cd backend
npm install
cp env.example .env  # 配置环境变量（修改数据库配置）
npm run init-db      # 初始化数据库密码
npm run dev          # 启动开发服务器
```

**验证后端**：访问 http://localhost:3000/health

### 3. 前端启动

```bash
cd frontend
npm install
cp env.example .env  # 配置API地址
npm run dev          # 启动开发服务器
```

**访问系统**：http://localhost:5173

### 4. 测试账号

| 角色 | 用户名 | 密码 | 权限 |
|------|--------|------|------|
| 管理员 | admin | password123 | 所有权限 |
| 客服 | agent1 | password123 | 创建/编辑工单 |
| 观察者 | viewer | password123 | 只读 |

## 功能特性

- ✅ JWT 登录与自动令牌刷新
- ✅ 基于角色的访问控制 (RBAC)
- ✅ 工单增删改查与状态流转
- ✅ 工单分派与评论
- ✅ ECharts 数据可视化看板
- ✅ PWA 离线支持
- ✅ IndexedDB 草稿自动保存
- ✅ 移动端响应式适配
- ✅ 代码分割与懒加载

## 核心亮点

1. **请求层与权限** - Axios 拦截器、401 自动刷新、路由守卫
2. **性能优化** - 路由懒加载、骨架屏、gzip 压缩
3. **数据可视化** - 实时趋势图与统计卡片
4. **离线友好** - PWA 缓存与 IndexedDB 草稿
5. **代码质量** - ESLint/Prettier 规范、Vitest 测试

## 项目截图

### 登录页面
- 支持多角色登录
- 表单验证
- 响应式设计

### 数据看板
- 统计卡片（今日新增、待处理、处理中、已解决）
- ECharts 趋势图（近7天数据）
- 实时数据刷新

### 工单列表
- 搜索功能（标题/描述）
- 状态筛选（待处理/处理中/已解决/已关闭）
- 优先级筛选（低/中/高）
- 分页显示

### 工单详情
- 完整工单信息
- 评论功能
- 状态更新（权限控制）
- 实时刷新

### 工单创建
- 表单验证
- IndexedDB 草稿自动保存（3秒防抖）
- 草稿恢复提示

## 技术亮点

### 前端

1. **Axios 拦截器** - 401 自动刷新 Token，无感知续期
2. **路由守卫** - 基于角色的权限控制（admin/agent/viewer）
3. **状态管理** - Pinia 模块化管理（auth/ticket/metrics）
4. **PWA 支持** - Service Worker 缓存，离线可用
5. **IndexedDB** - 工单草稿自动保存，防止数据丢失
6. **代码分割** - 路由懒加载 + vendor/echarts 分包
7. **性能优化** - Gzip 压缩，首屏 JS < 650KB

### 后端

1. **JWT 双令牌** - Access Token (15分钟) + Refresh Token (7天)
2. **请求限流** - Express Rate Limit 防止暴力攻击
3. **安全防护** - Helmet 安全头 + CORS 跨域限制
4. **数据库优化** - 连接池 + 索引优化 + 参数化查询
5. **错误处理** - 统一错误中间件
6. **日志记录** - 请求日志 + 查询日志

### 数据库

1. **表结构设计** - 4张表（users/tickets/comments/events）
2. **外键约束** - 级联删除保证数据一致性
3. **触发器** - 自动更新 updated_at 时间戳
4. **索引优化** - 查询字段建立索引
5. **审计日志** - events 表记录所有变更

## 性能指标

- ✅ 首屏加载：< 1.2s (本地环境)
- ✅ 首屏 JS：< 650KB (gzip 后)
- ✅ API 响应：< 100ms (本地数据库)
- ✅ 路由切换：< 300ms
- ✅ Token 刷新：自动无感知

## 开发规范

- ✅ TypeScript 严格模式
- ✅ ESLint + Prettier 代码规范
- ✅ Vitest 单元测试
- ✅ Git Commit 规范
- ✅ RESTful API 设计

## 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## 项目文档

- 📖 [完整部署指南](./SETUP.md) - 从零开始的详细步骤
- 🔧 [后端 API 文档](./backend/README.md) - 接口说明
- 🎨 [前端架构说明](./frontend/README.md) - 技术栈详解
- 🗄️ [数据库设计](./database/README.md) - 表结构说明

## GitHub 仓库

🔗 https://github.com/YuChuChu42/ticket-handle-platform

## License

MIT

