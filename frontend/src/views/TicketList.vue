<template>
  <div class="ticket-list">
    <h2 class="page-title">工单列表</h2>

    <!-- 搜索和筛选 -->
    <el-card shadow="never" class="mb-4">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="搜索">
          <el-input
            v-model="filterForm.q"
            placeholder="搜索标题或描述"
            clearable
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
            <el-option label="待处理" value="open" />
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
        v-loading="ticketStore.loading"
        :data="ticketStore.tickets"
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

        <el-table-column prop="assignee_name" label="处理人" width="120">
          <template #default="{ row }">
            {{ row.assignee_name || '未分配' }}
          </template>
        </el-table-column>

        <el-table-column prop="creator_name" label="创建人" width="120" />

        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatRelativeTime(row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              text
              type="primary"
              size="small"
              @click.stop="viewDetail(row.id)"
            >
              查看
            </el-button>
            <el-button
              v-if="authStore.isAdmin || authStore.isAgent"
              text
              type="warning"
              size="small"
              @click.stop="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="authStore.isAdmin"
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
          v-model:current-page="ticketStore.page"
          v-model:page-size="ticketStore.pageSize"
          :total="ticketStore.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑工单"
      width="600px"
      @close="editDialogVisible = false"
    >
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="工单标题">
          <el-input v-model="editForm.title" placeholder="请输入标题" />
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="editForm.status" placeholder="选择状态" style="width: 100%">
            <el-option label="待处理" value="open" />
            <el-option label="处理中" value="in_progress" />
            <el-option label="已解决" value="resolved" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </el-form-item>

        <el-form-item label="优先级">
          <el-select v-model="editForm.priority" placeholder="选择优先级" style="width: 100%">
            <el-option label="低" value="low" />
            <el-option label="中" value="mid" />
            <el-option label="高" value="high" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTicketStore } from '@/stores/ticket'
import { useAuthStore } from '@/stores/auth'
import {
  getStatusText,
  getStatusType,
  getPriorityText,
  getPriorityType,
  formatRelativeTime,
} from '@/utils/format'

const router = useRouter()
const ticketStore = useTicketStore()
const authStore = useAuthStore()

// 编辑对话框
const editDialogVisible = ref(false)
const editForm = reactive({
  id: 0,
  title: '',
  status: '',
  priority: '',
})

const filterForm = reactive({
  q: '',
  status: 'all',
  priority: 'all',
})

const handleSearch = () => {
  ticketStore.setSearchQuery(filterForm.q)
  ticketStore.setStatusFilter(filterForm.status)
  ticketStore.setPriorityFilter(filterForm.priority)
  ticketStore.page = 1
  ticketStore.fetchTickets()
}

const handleReset = () => {
  filterForm.q = ''
  filterForm.status = 'all'
  filterForm.priority = 'all'
  ticketStore.resetFilters()
  ticketStore.fetchTickets()
}

const handleSizeChange = () => {
  ticketStore.fetchTickets()
}

const handleCurrentChange = () => {
  ticketStore.fetchTickets()
}

const handleRowClick = (row: any) => {
  viewDetail(row.id)
}

const viewDetail = (id: number) => {
  router.push(`/tickets/${id}`)
}

const handleEdit = (row: any) => {
  editForm.id = row.id
  editForm.title = row.title
  editForm.status = row.status
  editForm.priority = row.priority
  editDialogVisible.value = true
}

const handleSaveEdit = async () => {
  try {
    const success = await ticketStore.updateTicket(editForm.id, {
      title: editForm.title,
      status: editForm.status as any,
      priority: editForm.priority as any,
    })

    if (success) {
      ElMessage.success('更新成功')
      editDialogVisible.value = false
      ticketStore.fetchTickets()
    }
  } catch (error) {
    ElMessage.error('更新失败')
  }
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除工单 "${row.title}" 吗？此操作不可恢复！`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      }
    )

    const success = await ticketStore.deleteTicket(row.id)
    if (success) {
      ElMessage.success('删除成功')
      ticketStore.fetchTickets()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  ticketStore.fetchTickets()
})
</script>

<style scoped>
.ticket-list {
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  margin: 0 0 20px 0;
  font-size: 24px;
  font-weight: 500;
  color: #303133;
}

.ticket-title {
  font-weight: 500;
  color: #303133;
  cursor: pointer;
}

.ticket-title:hover {
  color: #409eff;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}

@media (max-width: 768px) {
  .el-form--inline .el-form-item {
    display: block;
    margin-right: 0;
  }

  .pagination-container {
    justify-content: center;
  }

  :deep(.el-pagination) {
    flex-wrap: wrap;
  }
}
</style>

