import http from './http'

export interface Ticket {
  id: number
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'mid' | 'high'
  assignee_id: number | null
  assignee_name: string | null
  creator_id: number
  creator_name: string
  created_at: string
  updated_at: string
}

export interface TicketDetail extends Ticket {
  comments: Comment[]
}

export interface Comment {
  id: number
  ticket_id: number
  author_id: number
  author_name: string
  content: string
  created_at: string
}

export interface TicketListParams {
  page?: number
  pageSize?: number
  q?: string
  status?: string
  priority?: string
}

export interface TicketListResponse {
  items: Ticket[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface CreateTicketRequest {
  title: string
  description?: string
  priority?: 'low' | 'mid' | 'high'
}

export interface UpdateTicketRequest {
  title?: string
  description?: string
  status?: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority?: 'low' | 'mid' | 'high'
  assignee_id?: number | null
}

// 获取工单列表
export const getTickets = (params: TicketListParams) => {
  return http.get<{ success: boolean; data: TicketListResponse }>('/tickets', { params })
}

// 创建工单
export const createTicket = (data: CreateTicketRequest) => {
  return http.post<{ success: boolean; data: Ticket }>('/tickets', data)
}

// 获取工单详情
export const getTicketById = (id: number) => {
  return http.get<{ success: boolean; data: TicketDetail }>(`/tickets/${id}`)
}

// 更新工单
export const updateTicket = (id: number, data: UpdateTicketRequest) => {
  return http.patch<{ success: boolean; data: Ticket }>(`/tickets/${id}`, data)
}

// 删除工单
export const deleteTicket = (id: number) => {
  return http.delete(`/tickets/${id}`)
}

// 添加评论
export const addComment = (ticketId: number, content: string) => {
  return http.post(`/tickets/${ticketId}/comments`, { content })
}

