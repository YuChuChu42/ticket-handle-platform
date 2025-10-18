import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import * as authApi from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()

  // 状态
  const accessToken = ref<string>(localStorage.getItem('accessToken') || '')
  const refreshToken = ref<string>(localStorage.getItem('refreshToken') || '')
  const user = ref<any>(JSON.parse(localStorage.getItem('user') || 'null'))

  // 计算属性
  const isAuthenticated = computed(() => !!accessToken.value)
  const userRole = computed(() => user.value?.role || '')
  const isAdmin = computed(() => userRole.value === 'admin')
  const isTechnician = computed(() => userRole.value === 'technician')
  const isReporter = computed(() => userRole.value === 'reporter')
  
  // 兼容旧版（可选）
  const isAgent = computed(() => userRole.value === 'technician') // 技术人员 = 旧版客服
  const isViewer = computed(() => userRole.value === 'reporter') // 负责人 = 旧版观察者

  // 设置访问令牌
  const setAccessToken = (token: string) => {
    accessToken.value = token
    localStorage.setItem('accessToken', token)
  }

  // 设置刷新令牌
  const setRefreshToken = (token: string) => {
    refreshToken.value = token
    localStorage.setItem('refreshToken', token)
  }

  // 设置用户信息
  const setUser = (userData: any) => {
    user.value = userData
    localStorage.setItem('user', JSON.stringify(userData))
  }

  // 登录
  const login = async (username: string, password: string) => {
    try {
      const { data } = await authApi.login({ username, password })
      
      if (data.success) {
        setAccessToken(data.data.accessToken)
        setRefreshToken(data.data.refreshToken)
        setUser(data.data.user)
        return true
      }
      return false
    } catch (error) {
      console.error('登录失败:', error)
      return false
    }
  }

  // 退出登录
  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('退出登录失败:', error)
    } finally {
      // 清除本地存储
      accessToken.value = ''
      refreshToken.value = ''
      user.value = null
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      
      // 跳转到登录页
      router.push('/login')
    }
  }

  // 获取当前用户信息
  const fetchUser = async () => {
    try {
      const { data } = await authApi.getCurrentUser()
      if (data.success) {
        setUser(data.data)
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  }

  return {
    accessToken,
    refreshToken,
    user,
    isAuthenticated,
    userRole,
    isAdmin,
    isTechnician,
    isReporter,
    isAgent, // 兼容
    isViewer, // 兼容
    setAccessToken,
    setRefreshToken,
    setUser,
    login,
    logout,
    fetchUser,
  }
})

