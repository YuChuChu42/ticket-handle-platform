import http from './http'

// 用户接口类型定义
export interface User {
  id: number
  username: string
  role: 'admin' | 'technician' | 'reporter'
  company_name: string
  full_name: string
  email?: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface CreateUserRequest {
  username: string
  password: string
  role: 'admin' | 'technician' | 'reporter'
  company_name: string
  full_name: string
  email?: string
  phone?: string
}

export interface UpdateUserRequest {
  username: string
  password?: string
  role: 'admin' | 'technician' | 'reporter'
  company_name: string
  full_name: string
  email?: string
  phone?: string
}

export interface UserListResponse {
  users: User[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// 获取所有用户列表
export const getAllUsers = (params?: {
  role?: string
  page?: number
  pageSize?: number
}) => {
  return http.get<UserListResponse>('/users', { params })
}

// 获取技术人员列表
export const getTechnicians = () => {
  return http.get<User[]>('/users/technicians')
}

// 获取客户方负责人列表
export const getReporters = () => {
  return http.get<User[]>('/users/reporters')
}

// 获取用户详情
export const getUserById = (id: number) => {
  return http.get<User>(`/users/${id}`)
}

// 创建用户
export const createUser = (data: CreateUserRequest) => {
  return http.post<User>('/users', data)
}

// 更新用户
export const updateUser = (id: number, data: UpdateUserRequest) => {
  return http.put<User>(`/users/${id}`, data)
}

// 删除用户
export const deleteUser = (id: number) => {
  return http.delete(`/users/${id}`)
}
