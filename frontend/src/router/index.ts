import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    meta: { requiresAuth: true },
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '数据看板' },
      },
      {
        path: 'tickets',
        name: 'TicketList',
        component: () => import('@/views/TicketList.vue'),
        meta: { title: '工单列表' },
      },
      {
        path: 'tickets/create',
        name: 'TicketCreate',
        component: () => import('@/views/TicketCreate.vue'),
        meta: { title: '创建工单', roles: ['admin', 'agent'] },
      },
      {
        path: 'tickets/:id',
        name: 'TicketDetail',
        component: () => import('@/views/TicketDetail.vue'),
        meta: { title: '工单详情' },
      },
      {
        path: 'users',
        name: 'UserManagement',
        component: () => import('@/views/UserManagement.vue'),
        meta: { title: '用户管理', roles: ['admin'] },
      },
    ],
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/403.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/404.vue'),
    meta: { requiresAuth: false },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 智链工单系统`
  } else {
    document.title = '智链工单系统'
  }

  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      // 未登录，跳转到登录页
      ElMessage.warning('请先登录')
      next({
        name: 'Login',
        query: { redirect: to.fullPath },
      })
      return
    }

    // 检查角色权限
    if (to.meta.roles) {
      const roles = to.meta.roles as string[]
      if (!roles.includes(authStore.userRole)) {
        ElMessage.error('权限不足')
        next({ name: 'Forbidden' })
        return
      }
    }
  }

  // 已登录用户访问登录页，重定向到首页
  if (to.name === 'Login' && authStore.isAuthenticated) {
    next({ name: 'Dashboard' })
    return
  }

  next()
})

export default router

