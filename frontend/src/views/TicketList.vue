<template>
  <div class="ticket-list">
    <div class="page-header">
      <h2 class="page-title">工单列表</h2>
      <!-- 负责人可以创建工单 -->
      <el-button
        v-if="authStore.isReporter"
        type="primary"
        @click="router.push('/tickets/create')"
      >
        <el-icon><Plus /></el-icon>
        创建工单
      </el-button>
    </div>

    <!-- 搜索和筛选 -->
    <el-card shadow="never" class="mb-4">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="搜索">
          <el-input
            v-model="filterForm.q"
            placeholder="搜索标题、描述或地点"
            clearable
            style="width: 300px"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button :icon="Search" @click="handleSearch" />
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="状态">
          <el-select
            v-model="filterForm.status"
            placeholder="选择状态"
            clearable
            @change="handleSearch"
          >
            <el-option label="全部" value="all" />
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="in_progress" />
            <el-option label="已解决" value="resolved" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </el-form-item>

        <el-form-item label="优先级">
          <el-select
            v-model="filterForm.priority"
            placeholder="选择优先级"
            clearable
            @change="handleSearch"
          >
            <el-option label="全部" value="all" />
            <el-option label="低" value="low" />
            <el-option label="中" value="mid" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 工单表格 -->
    <el-card shadow="never">
      <el-table
        v-loading="loading"
        :data="tickets"
        stripe
        style="width: 100%"
        @row-click="handleRowClick"
      >
        <el-table-column prop="id" label="ID" width="80" />
        
        <el-table-column prop="title" label="标题" min-width="200">
          <template #default="{ row }">
            <div class="ticket-title">{{ row.title }}</div>
          </template>
        </el-table-column>

        <el-table-column prop="location" label="地点" min-width="150" show-overflow-tooltip />

        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority)">
              {{ getPriorityText(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 管理员可以看到负责人公司 -->
        <el-table-column v-if="authStore.isAdmin" prop="reporter_company" label="报告公司" width="150" show-overflow-tooltip />

        <el-table-column prop="technician_name" label="技术人员" width="120">
          <template #default="{ row }">
            <span v-if="row.technician_name">{{ row.technician_full_name || row.technician_name }}</span>
            <el-tag v-else type="info" size="small">未分配</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatRelativeTime(row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              text
              type="primary"
              size="small"
              @click.stop="viewDetail(row.id)"
            >
              查看详情
            </el-button>
            
            <!-- 负责人可以删除自己待处理的工单 -->
            <el-button
              v-if="authStore.isReporter && row.status === 'pending' && row.reporter_id === authStore.user?.id"
              text
              type="danger"
              size="small"
              @click.stop="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { getTickets, deleteTicket } from '@/api/ticket'
import { formatRelativeTime, formatStatus, formatPriority } from '@/utils/format'
import type { Ticket } from '@/api/ticket'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const tickets = ref<Ticket[]>([])

// 筛选表单
const filterForm = reactive({
  q: '',
  status: 'all',
  priority: 'all',
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

// 获取工单列表
const fetchTickets = async () => {
  try {
    loading.value = true
    const { data } = await getTickets({
      page: pagination.page,
      pageSize: pagination.pageSize,
      q: filterForm.q,
      status: filterForm.status === 'all' ? undefined : filterForm.status,
      priority: filterForm.priority === 'all' ? undefined : filterForm.priority,
    })

    if (data.success) {
      tickets.value = data.data.items
      pagination.total = data.data.total
    }
  } catch (error: any) {
    console.error('获取工单列表失败:', error)
    ElMessage.error(error?.response?.data?.message || '获取工单列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchTickets()
}

// 重置
const handleReset = () => {
  filterForm.q = ''
  filterForm.status = 'all'
  filterForm.priority = 'all'
  pagination.page = 1
  fetchTickets()
}

// 分页改变
const handlePageChange = (page: number) => {
  pagination.page = page
  fetchTickets()
}

// 每页数量改变
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchTickets()
}

// 行点击
const handleRowClick = (row: Ticket) => {
  viewDetail(row.id)
}

// 查看详情
const viewDetail = (id: number) => {
  router.push(`/tickets/${id}`)
}

// 删除工单
const handleDelete = async (row: Ticket) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除工单"${row.title}"吗？此操作不可撤销。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    loading.value = true
    const { data } = await deleteTicket(row.id)

    if (data.success) {
      ElMessage.success(data.message || '删除成功')
      fetchTickets()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除工单失败:', error)
      ElMessage.error(error?.response?.data?.message || '删除工单失败')
    }
  } finally {
    loading.value = false
  }
}

// 状态类型
const getStatusType = (status: string) => {
  const map: Record<string, any> = {
    pending: 'info',
    in_progress: 'warning',
    resolved: 'success',
    closed: '',
  }
  return map[status] || ''
}

// 状态文本
const getStatusText = (status: string) => {
  return formatStatus(status)
}

// 优先级类型
const getPriorityType = (priority: string) => {
  const map: Record<string, any> = {
    low: 'info',
    mid: '',
    high: 'warning',
    urgent: 'danger',
  }
  return map[priority] || ''
}

// 优先级文本
const getPriorityText = (priority: string) => {
  return formatPriority(priority)
}

// 初始化
onMounted(() => {
  fetchTickets()
})
</script>

<style scoped>
.ticket-list {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.mb-4 {
  margin-bottom: 16px;
}

.ticket-title {
  font-weight: 500;
  cursor: pointer;
}

.ticket-title:hover {
  color: #409eff;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}
</style>
