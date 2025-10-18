import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

// 创建 axios 实例
const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 是否正在刷新token
let isRefreshing = false
// 失败请求队列
let failedQueue: any[] = []

// 处理队列
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// 请求拦截器
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authStore = useAuthStore()
    
    // 添加 token 到请求头
    if (authStore.accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${authStore.accessToken}`
    }
    
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
http.interceptors.response.use(
  (response) => {
    return response
  },
  async (error: AxiosError) => {
    const originalRequest: any = error.config
    const authStore = useAuthStore()

    // 401 错误处理（token 过期）
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 正在刷新token，将请求加入队列
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return http(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      // 尝试刷新token
      if (authStore.refreshToken) {
        try {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_BASE || '/api'}/auth/refresh`,
            { refreshToken: authStore.refreshToken }
          )

          const newAccessToken = data.data.accessToken
          authStore.setAccessToken(newAccessToken)

          // 更新原请求的token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          }

          // 处理队列中的请求
          processQueue(null, newAccessToken)

          return http(originalRequest)
        } catch (refreshError) {
          // 刷新token失败，清除认证信息并跳转登录
          processQueue(refreshError, null)
          authStore.logout()
          ElMessage.error('登录已过期，请重新登录')
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      } else {
        // 没有refreshToken，直接登出
        authStore.logout()
        ElMessage.error('请先登录')
        return Promise.reject(error)
      }
    }

    // 其他错误处理
    const message = (error.response?.data as any)?.message || error.message || '请求失败'
    ElMessage.error(message)

    return Promise.reject(error)
  }
)

export default http

