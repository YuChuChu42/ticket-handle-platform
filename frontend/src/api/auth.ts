import http from './http'

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  user: {
    id: number
    username: string
    role: string
    email: string
    fullName: string
  }
  accessToken: string
  refreshToken: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

// 登录
export const login = (data: LoginRequest) => {
  return http.post<{ success: boolean; data: LoginResponse }>('/auth/login', data)
}

// 刷新令牌
export const refreshToken = (data: RefreshTokenRequest) => {
  return http.post('/auth/refresh', data)
}

// 退出登录
export const logout = () => {
  return http.post('/auth/logout')
}

// 获取当前用户信息
export const getCurrentUser = () => {
  return http.get('/me')
}

