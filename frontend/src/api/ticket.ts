import http from './http'

// 工单接口（V2）
export interface Ticket {
  id: number
  title: string
  description: string
  location: string // 发生地点
  contact_phone: string // 对接电话
  status: 'pending' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'mid' | 'high' | 'urgent'
  reporter_id: number
  reporter_name: string
  reporter_company: string | null
  reporter_full_name: string | null
  technician_id: number | null
  technician_name: string | null
  technician_full_name: string | null
  assigned_by: number | null
  assigned_by_name: string | null
  report_file: string | null // PDF报告路径
  report_generated_at: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
}

// 工单详情
export interface TicketDetail extends Ticket {
  reporter_email: string | null
  reporter_phone: string | null
  technician_email: string | null
  technician_phone: string | null
  images: TicketImage[]
  comments: Comment[]
}

// 工单图片
export interface TicketImage {
  id: number
  ticket_id: number
  image_path: string
  image_order: number
  file_size: number
  uploaded_at: string
}

// 评论
export interface Comment {
  id: number
  ticket_id: number
  author_id: number
  author_name: string
  author_full_name: string | null
  content: string
  comment_type: 'comment' | 'status_change' | 'assignment'
  created_at: string
}

// 技术人员
export interface Technician {
  id: number
  username: string
  full_name: string
  email: string | null
  phone: string | null
}

// 查询参数
export interface TicketListParams {
  page?: number
  pageSize?: number
  q?: string
  status?: string
  priority?: string
}

// 列表响应
export interface TicketListResponse {
  items: Ticket[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 创建工单请求
export interface CreateTicketRequest {
  title: string
  description: string
  location: string
  contactPhone: string
  priority?: 'low' | 'mid' | 'high' | 'urgent'
  images?: File[] // 图片文件（最多4张）
}

// 更新工单请求
export interface UpdateTicketRequest {
  title?: string
  description?: string
  location?: string
  contact_phone?: string
  status?: 'pending' | 'in_progress' | 'resolved' | 'closed'
  priority?: 'low' | 'mid' | 'high' | 'urgent'
}

// 分配工单请求
export interface AssignTicketRequest {
  technicianId: number
}

// 获取工单列表
export const getTickets = (params: TicketListParams) => {
  return http.get<{ success: boolean; data: TicketListResponse }>('/tickets', { params })
}

// 创建工单（带图片上传）
export const createTicket = (data: CreateTicketRequest) => {
  const formData = new FormData()
  formData.append('title', data.title)
  formData.append('description', data.description)
  formData.append('location', data.location)
  formData.append('contactPhone', data.contactPhone)
  if (data.priority) {
    formData.append('priority', data.priority)
  }

  // 添加图片
  if (data.images && data.images.length > 0) {
    data.images.forEach((image) => {
      formData.append('images', image)
    })
  }

  return http.post<{ success: boolean; data: Ticket; message: string }>('/tickets', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

// 获取工单详情
export const getTicketById = (id: number) => {
  return http.get<{ success: boolean; data: TicketDetail }>(`/tickets/${id}`)
}

// 更新工单
export const updateTicket = (id: number, data: UpdateTicketRequest) => {
  return http.patch<{ success: boolean; data: Ticket; message: string }>(`/tickets/${id}`, data)
}

// 分配工单（管理员）
export const assignTicket = (id: number, data: AssignTicketRequest) => {
  return http.post<{ success: boolean; data: Ticket; message: string }>(
    `/tickets/${id}/assign`,
    data
  )
}

// 删除工单
export const deleteTicket = (id: number) => {
  return http.delete<{ success: boolean; message: string }>(`/tickets/${id}`)
}

// 添加评论
export const addComment = (ticketId: number, content: string) => {
  return http.post<{ success: boolean; data: Comment; message: string }>(
    `/tickets/${ticketId}/comments`,
    { content }
  )
}

// 生成报告（技术人员）
export const generateReport = (ticketId: number) => {
  return http.post<{ success: boolean; data: { reportPath: string; downloadUrl: string }; message: string }>(
    `/tickets/${ticketId}/generate-report`
  )
}

// 下载报告（支持HTML和PDF）
export const downloadReport = (ticketId: number) => {
  return http.get(`/tickets/${ticketId}/download-report`, {
    responseType: 'blob',
  })
}

// 查看HTML报告（在新窗口中打开）
export const viewReport = (ticketId: number) => {
  const token = localStorage.getItem('accessToken')
  const baseUrl = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api'
  const url = `${baseUrl}/tickets/${ticketId}/download-report`
  
  // 在新窗口中打开报告
  const newWindow = window.open('', '_blank')
  if (newWindow) {
    // 使用fetch获取报告内容，然后在新窗口中显示
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/html; charset=utf-8'
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.text()
    })
    .then(html => {
      // 设置新窗口的文档类型和编码
      newWindow.document.open('text/html', 'utf-8')
      newWindow.document.write(html)
      newWindow.document.close()
    })
    .catch(error => {
      console.error('加载报告失败:', error)
      newWindow.document.write(`
        <html>
          <head>
            <meta charset="utf-8">
            <title>加载失败</title>
          </head>
          <body>
            <h1>报告加载失败</h1>
            <p>错误信息: ${error.message}</p>
            <p>请尝试下载报告文件</p>
          </body>
        </html>
      `)
    })
  }
}

// 获取技术人员列表（管理员）
export const getTechnicians = () => {
  return http.get<{ success: boolean; data: Technician[] }>('/tickets/technicians')
}
