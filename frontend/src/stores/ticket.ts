import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as ticketApi from '@/api/ticket'
import type { Ticket, TicketListParams, TicketDetail } from '@/api/ticket'

export const useTicketStore = defineStore('ticket', () => {
  // 状态
  const tickets = ref<Ticket[]>([])
  const currentTicket = ref<TicketDetail | null>(null)
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(10)
  const loading = ref(false)
  
  // 搜索和筛选条件
  const searchQuery = ref('')
  const statusFilter = ref('all')
  const priorityFilter = ref('all')

  // 获取工单列表
  const fetchTickets = async (params?: TicketListParams) => {
    loading.value = true
    try {
      const queryParams = {
        page: params?.page || page.value,
        pageSize: params?.pageSize || pageSize.value,
        q: params?.q !== undefined ? params.q : searchQuery.value,
        status: params?.status !== undefined ? params.status : statusFilter.value,
        priority: params?.priority !== undefined ? params.priority : priorityFilter.value,
      }

      const { data } = await ticketApi.getTickets(queryParams)
      
      if (data.success) {
        tickets.value = data.data.items
        total.value = data.data.total
        page.value = data.data.page
        pageSize.value = data.data.pageSize
      }
    } catch (error) {
      console.error('获取工单列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 获取工单详情
  const fetchTicketById = async (id: number) => {
    loading.value = true
    try {
      const { data } = await ticketApi.getTicketById(id)
      
      if (data.success) {
        currentTicket.value = data.data
      }
    } catch (error) {
      console.error('获取工单详情失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 创建工单
  const createTicket = async (ticketData: ticketApi.CreateTicketRequest) => {
    try {
      const { data } = await ticketApi.createTicket(ticketData)
      
      if (data.success) {
        await fetchTickets() // 刷新列表
        return true
      }
      return false
    } catch (error) {
      console.error('创建工单失败:', error)
      return false
    }
  }

  // 更新工单
  const updateTicket = async (id: number, updates: ticketApi.UpdateTicketRequest) => {
    try {
      const { data } = await ticketApi.updateTicket(id, updates)
      
      if (data.success) {
        // 如果当前正在查看该工单，更新详情
        if (currentTicket.value?.id === id) {
          await fetchTicketById(id)
        }
        // 刷新列表
        await fetchTickets()
        return true
      }
      return false
    } catch (error) {
      console.error('更新工单失败:', error)
      return false
    }
  }

  // 删除工单
  const deleteTicket = async (id: number) => {
    try {
      await ticketApi.deleteTicket(id)
      await fetchTickets() // 刷新列表
      return true
    } catch (error) {
      console.error('删除工单失败:', error)
      return false
    }
  }

  // 添加评论
  const addComment = async (ticketId: number, content: string) => {
    try {
      await ticketApi.addComment(ticketId, content)
      // 刷新工单详情
      await fetchTicketById(ticketId)
      return true
    } catch (error) {
      console.error('添加评论失败:', error)
      return false
    }
  }

  // 设置搜索查询
  const setSearchQuery = (query: string) => {
    searchQuery.value = query
  }

  // 设置状态筛选
  const setStatusFilter = (status: string) => {
    statusFilter.value = status
  }

  // 设置优先级筛选
  const setPriorityFilter = (priority: string) => {
    priorityFilter.value = priority
  }

  // 重置筛选条件
  const resetFilters = () => {
    searchQuery.value = ''
    statusFilter.value = 'all'
    priorityFilter.value = 'all'
    page.value = 1
  }

  return {
    tickets,
    currentTicket,
    total,
    page,
    pageSize,
    loading,
    searchQuery,
    statusFilter,
    priorityFilter,
    fetchTickets,
    fetchTicketById,
    createTicket,
    updateTicket,
    deleteTicket,
    addComment,
    setSearchQuery,
    setStatusFilter,
    setPriorityFilter,
    resetFilters,
  }
})

