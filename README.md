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

### 1. 数据库设置

```bash
# 使用 pgAdmin4 或 psql 创建数据库
createdb ticket_system

# 执行初始化脚本
psql -d ticket_system -f database/schema.sql
psql -d ticket_system -f database/seed.sql
```

### 2. 后端启动

```bash
cd backend
npm install
cp .env.example .env  # 配置环境变量
npm run dev
```

### 3. 前端启动

```bash
cd frontend
npm install
cp .env.example .env  # 配置环境变量
npm run dev
```

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

## License

MIT

