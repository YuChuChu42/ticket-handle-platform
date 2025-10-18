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

        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button
              text
              type="primary"
              size="small"
              @click.stop="viewDetail(row.id)"
            >
              查看
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
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { useTicketStore } from '@/stores/ticket'
import {
  getStatusText,
  getStatusType,
  getPriorityText,
  getPriorityType,
  formatRelativeTime,
} from '@/utils/format'

const router = useRouter()
const ticketStore = useTicketStore()

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

