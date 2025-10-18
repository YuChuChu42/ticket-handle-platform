# 智链工单管理系统

企业级工单管理平台，支持工单创建/分派/处理、多角色权限控制、实时数据看板等功能。基于Vue3 + Express + PostgreSQL构建的全栈应用。

## ✨ 核心特性

- 🔐 **JWT双Token认证** - Access Token + Refresh Token自动刷新机制
- 🎯 **RBAC权限控制** - 管理员、技术人员、客户方负责人三种角色权限
- 📊 **实时数据看板** - ECharts可视化展示工单趋势和状态分布
- 💾 **离线草稿保存** - IndexedDB + 防抖机制，避免数据丢失
- 📱 **PWA离线支持** - Service Worker缓存，弱网环境可用
- 🎨 **组件化开发** - 图片上传、表单验证等可复用组件
- ⚡ **性能优化** - 路由懒加载、代码分割、TypeScript严格模式

## 🛠️ 技术栈

### 前端
- **框架**: Vue 3 + TypeScript
- **构建**: Vite
- **状态管理**: Pinia
- **路由**: Vue Router
- **UI组件**: Element Plus
- **图表**: ECharts
- **HTTP**: Axios
- **离线存储**: IndexedDB
- **PWA**: Service Worker

### 后端
- **运行时**: Node.js
- **框架**: Express
- **数据库**: PostgreSQL
- **认证**: JWT
- **文件上传**: Multer
- **安全**: Helmet + CORS

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- PostgreSQL >= 12.0
- npm >= 8.0.0

### 1. 克隆项目
```bash
git clone https://github.com/YuChuChu42/ticket-handle-platform.git
cd ticket-handle-platform
```

### 2. 数据库设置
```bash
# 创建数据库
createdb ticket_system

# 导入数据库结构
psql -U postgres -d ticket_system -f database/schema_v3.sql
```

### 3. 后端启动
```bash
cd backend
npm install
cp .env.example .env  # 配置数据库连接
npm run dev
```

### 4. 前端启动
```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:5173 开始使用

## 👥 测试账号

| 角色 | 用户名 | 密码 | 权限说明 |
|------|--------|------|----------|
| 管理员 | admin | password | 所有权限，可分配工单、管理用户 |
| 技术人员 | tech1 | password | 处理工单、更新状态、生成报告 |
| 客户方负责人 | reporter1 | password | 创建工单、查看工单、修改优先级 |

## 📁 项目结构

```
project/
├── frontend/              # Vue3 前端项目
│   ├── src/
│   │   ├── components/    # 可复用组件
│   │   ├── views/        # 页面组件
│   │   ├── stores/      # Pinia状态管理
│   │   ├── router/      # 路由配置
│   │   ├── api/         # API接口
│   │   └── utils/       # 工具函数
├── backend/              # Express 后端项目
│   ├── src/
│   │   ├── controllers/ # 控制器
│   │   ├── models/      # 数据模型
│   │   ├── routes/      # 路由定义
│   │   ├── middleware/  # 中间件
│   │   └── config/      # 配置文件
└── database/            # 数据库脚本
    └── schema_v3.sql   # 数据库结构
```

## 🔧 核心功能

### 权限管理
- 三层权限控制：路由守卫 + API中间件 + 按钮级权限
- JWT双Token认证，自动刷新过期令牌
- 基于角色的访问控制（RBAC）

### 工单管理
- 工单创建：支持标题、描述、地点、联系方式、图片上传
- 工单分派：管理员可分配工单给技术人员
- 状态流转：待处理 → 处理中 → 已解决 → 已关闭
- 草稿保存：IndexedDB自动保存，防抖1秒

### 数据看板
- 实时统计：今日新增、待处理、处理中、已解决工单数量
- 趋势图表：近7天工单创建和解决趋势
- 角色权限：管理员和技术人员可查看，客户方负责人不可见

### 用户体验
- 响应式设计：支持PC、平板、手机多端访问
- PWA支持：离线缓存，弱网环境可用
- 组件化：图片上传、表单验证等可复用组件

## 📈 技术亮点

1. **前端架构**：Pinia状态管理 + TypeScript严格模式 + 组件化开发
2. **性能优化**：路由懒加载 + 代码分割 + 按需引入
3. **离线能力**：IndexedDB草稿保存 + Service Worker缓存
4. **权限控制**：三层权限体系 + JWT双Token认证
5. **工程化**：ESLint + Prettier + Git Hooks代码规范

## 📝 开发规范

- TypeScript严格模式开发
- ESLint + Prettier代码格式化
- Git分支管理：feature/bugfix/hotfix
- 组件命名：PascalCase
- 文件命名：kebab-case
- API接口：RESTful风格

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

- GitHub: [@YuChuChu42](https://github.com/YuChuChu42)
- 项目地址: https://github.com/YuChuChu42/ticket-handle-platform