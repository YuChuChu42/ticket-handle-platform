# 智链工单系统 - 前端

基于 Vue 3 + TypeScript + Vite 的现代化工单管理系统前端。

## 技术栈

- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **语言**: TypeScript
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **UI 组件**: Element Plus
- **HTTP 客户端**: Axios
- **数据可视化**: ECharts + Vue-ECharts
- **离线存储**: IndexedDB (idb)
- **PWA**: Vite-Plugin-PWA + Workbox
- **代码规范**: ESLint + Prettier
- **单元测试**: Vitest + Vue Test Utils

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp env.example .env
# 编辑 .env 文件
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 4. 构建生产版本

```bash
npm run build
```

### 5. 预览生产构建

```bash
npm run preview
```

## 项目结构

```
frontend/
├── src/
│   ├── api/              # API 接口
│   ├── assets/           # 静态资源
│   ├── components/       # 公共组件
│   ├── router/           # 路由配置
│   ├── stores/           # Pinia 状态管理
│   ├── views/            # 页面视图
│   ├── utils/            # 工具函数
│   ├── styles/           # 全局样式
│   ├── App.vue           # 根组件
│   └── main.ts           # 入口文件
├── public/               # 公共资源
├── index.html            # HTML 模板
├── vite.config.ts        # Vite 配置
└── package.json
```

## 功能特性

- ✅ JWT 认证与自动令牌刷新
- ✅ 基于角色的权限控制（路由守卫 + 按钮权限）
- ✅ 工单 CRUD 与状态流转
- ✅ 实时数据可视化看板
- ✅ PWA 离线支持
- ✅ IndexedDB 草稿自动保存
- ✅ 响应式设计（移动端适配）
- ✅ 路由懒加载与代码分割
- ✅ Gzip 压缩

## 开发指南

### 代码规范

```bash
# ESLint 检查
npm run lint

# Prettier 格式化
npm run format
```

### 测试

```bash
# 运行单元测试
npm run test

# 测试覆盖率
npm run test -- --coverage
```

## 性能优化

- 路由懒加载
- 代码分割（vendor/element-plus/echarts）
- Gzip 压缩
- 骨架屏加载
- 图片懒加载
- 防抖节流

## 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## License

MIT


