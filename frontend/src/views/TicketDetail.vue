<template>
  <div class="ticket-detail">
    <el-page-header @back="goBack">
      <template #content>
        <h2>工单详情 #{{ ticketId }}</h2>
      </template>
    </el-page-header>

    <div v-loading="loading" class="detail-container mt-4">
      <el-row :gutter="20">
        <!-- 左侧：工单详情 -->
        <el-col :span="16">
          <el-card shadow="never" class="mb-4">
            <template #header>
              <div class="card-header">
                <span>工单信息</span>
                <div class="ticket-badges">
                  <el-tag :type="getStatusType(ticket.status)">
                    {{ formatStatus(ticket.status) }}
                  </el-tag>
                  <el-tag :type="getPriorityType(ticket.priority)">
                    {{ formatPriority(ticket.priority) }}
                  </el-tag>
                </div>
              </div>
            </template>

            <div class="ticket-info">
              <div class="info-row">
                <label>标题：</label>
                <div class="info-value">{{ ticket.title }}</div>
              </div>

              <div class="info-row">
                <label>问题描述：</label>
                <div class="info-value description">{{ ticket.description }}</div>
              </div>

              <el-divider />

              <div class="info-row">
                <label>问题地点：</label>
                <div class="info-value">
                  <el-icon><Location /></el-icon>
                  {{ ticket.location }}
                </div>
              </div>

              <div class="info-row">
                <label>对接电话：</label>
                <div class="info-value">
                  <el-icon><Phone /></el-icon>
                  {{ ticket.contact_phone }}
                </div>
              </div>

              <el-divider />

              <div class="info-row">
                <label>报告单位：</label>
                <div class="info-value">{{ ticket.reporter_company || '未填写' }}</div>
              </div>

              <div class="info-row">
                <label>负责人：</label>
                <div class="info-value">
                  {{ ticket.reporter_full_name || ticket.reporter_name }}
                  <span v-if="ticket.reporter_phone" class="text-muted">
                    ({{ ticket.reporter_phone }})
                  </span>
                </div>
              </div>

              <div class="info-row">
                <label>技术人员：</label>
                <div class="info-value">
                  <span v-if="ticket.technician_id">
                    {{ ticket.technician_full_name || ticket.technician_name }}
                    <span v-if="ticket.technician_phone" class="text-muted">
                      ({{ ticket.technician_phone }})
                    </span>
                  </span>
                  <el-tag v-else type="info" size="small">未分配</el-tag>
                </div>
              </div>

              <el-divider />

              <div class="info-row">
                <label>创建时间：</label>
                <div class="info-value">{{ formatDateTime(ticket.created_at) }}</div>
              </div>

              <div v-if="ticket.resolved_at" class="info-row">
                <label>解决时间：</label>
                <div class="info-value">{{ formatDateTime(ticket.resolved_at) }}</div>
              </div>

              <!-- 现场图片 -->
              <el-divider v-if="ticket.images && ticket.images.length > 0" />

              <div v-if="ticket.images && ticket.images.length > 0" class="info-row">
                <label>现场图片：</label>
                <div class="info-value">
                  <div class="image-gallery">
                    <el-image
                      v-for="image in ticket.images"
                      :key="image.id"
                      :src="getImageUrl(image.image_path)"
                      :preview-src-list="previewImageList"
                      fit="cover"
                      class="gallery-image"
                    />
                  </div>
                </div>
              </div>

              <!-- PDF报告 -->
              <el-divider v-if="ticket.report_file" />

              <div v-if="ticket.report_file" class="info-row">
                <label>技术报告：</label>
                <div class="info-value">
                  <el-button type="primary" size="small" @click="handleDownloadReport">
                    <el-icon><Document /></el-icon>
                    下载PDF报告
                  </el-button>
                  <span class="text-muted ml-2">
                    生成时间：{{ formatDateTime(ticket.report_generated_at) }}
                  </span>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 评论区 -->
          <el-card shadow="never">
            <template #header>
              <span>沟通记录</span>
            </template>

            <div class="comments-section">
              <div
                v-for="comment in ticket.comments"
                :key="comment.id"
                class="comment-item"
                :class="`comment-type-${comment.comment_type}`"
              >
                <div class="comment-header">
                  <span class="comment-author">
                    {{ comment.author_full_name || comment.author_name }}
                  </span>
                  <span class="comment-time">
                    {{ formatRelativeTime(comment.created_at) }}
                  </span>
                </div>
                <div class="comment-content">{{ comment.content }}</div>
              </div>

              <div v-if="!ticket.comments || ticket.comments.length === 0" class="empty-comments">
                暂无沟通记录
              </div>
            </div>

            <!-- 添加评论 -->
            <div class="add-comment">
              <el-input
                v-model="commentContent"
                type="textarea"
                :rows="3"
                placeholder="添加评论..."
                maxlength="500"
                show-word-limit
              />
              <el-button
                type="primary"
                :loading="commentLoading"
                :disabled="!commentContent.trim()"
                class="mt-2"
                @click="handleAddComment"
              >
                发表评论
              </el-button>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：操作面板 -->
        <el-col :span="8">
          <!-- 管理员：分配工单 -->
          <el-card v-if="authStore.isAdmin" shadow="never" class="mb-4">
            <template #header>
              <span>工单分配</span>
            </template>
            <div class="action-panel">
              <el-select
                v-model="assignTechnicianId"
                placeholder="选择技术人员"
                style="width: 100%"
                class="mb-2"
              >
                <el-option
                  v-for="tech in technicians"
                  :key="tech.id"
                  :label="tech.full_name"
                  :value="tech.id"
                />
              </el-select>
              <el-button
                type="primary"
                style="width: 100%"
                :loading="assignLoading"
                :disabled="!assignTechnicianId"
                @click="handleAssignTicket"
              >
                分配工单
              </el-button>
            </div>
          </el-card>

          <!-- 技术人员：修改状态 -->
          <el-card v-if="authStore.isTechnician" shadow="never" class="mb-4">
            <template #header>
              <span>状态管理</span>
            </template>
            <div class="action-panel">
              <el-select
                v-model="newStatus"
                placeholder="选择状态"
                style="width: 100%"
                class="mb-2"
              >
                <el-option label="待处理" value="pending" />
                <el-option label="处理中" value="in_progress" />
                <el-option label="已解决" value="resolved" />
                <el-option label="已关闭" value="closed" />
              </el-select>
              <el-button
                type="primary"
                style="width: 100%"
                :loading="statusLoading"
                :disabled="!newStatus || newStatus === ticket.status"
                @click="handleUpdateStatus"
              >
                更新状态
              </el-button>
            </div>
          </el-card>

          <!-- 技术人员：生成报告 -->
          <el-card
            v-if="authStore.isTechnician && ticket.status === 'resolved' && !ticket.report_file"
            shadow="never"
            class="mb-4"
          >
            <template #header>
              <span>生成报告</span>
            </template>
            <div class="action-panel">
              <el-alert
                title="工单已解决"
                type="success"
                :closable="false"
                show-icon
                class="mb-2"
              >
                <template #default>
                  可以生成技术报告PDF文件
                </template>
              </el-alert>
              <el-button
                type="success"
                style="width: 100%"
                :loading="reportLoading"
                @click="handleGenerateReport"
              >
                <el-icon><Document /></el-icon>
                生成PDF报告
              </el-button>
            </div>
          </el-card>

          <!-- 负责人：修改优先级 -->
          <el-card v-if="authStore.isReporter && ticket.reporter_id === authStore.user?.id" shadow="never" class="mb-4">
            <template #header>
              <span>优先级设置</span>
            </template>
            <div class="action-panel">
              <el-select
                v-model="newPriority"
                placeholder="选择优先级"
                style="width: 100%"
                class="mb-2"
              >
                <el-option label="低" value="low" />
                <el-option label="中" value="mid" />
                <el-option label="高" value="high" />
                <el-option label="紧急" value="urgent" />
              </el-select>
              <el-button
                type="primary"
                style="width: 100%"
                :loading="priorityLoading"
                :disabled="!newPriority || newPriority === ticket.priority"
                @click="handleUpdatePriority"
              >
                更新优先级
              </el-button>
            </div>
          </el-card>

          <!-- 操作提示 -->
          <el-card shadow="never">
            <template #header>
              <span>操作提示</span>
            </template>
            <div class="tips">
              <el-alert
                v-if="authStore.isAdmin"
                title="管理员"
                type="info"
                :closable="false"
              >
                <template #default>
                  您可以分配工单给技术人员
                </template>
              </el-alert>
              <el-alert
                v-if="authStore.isTechnician"
                title="技术人员"
                type="info"
                :closable="false"
              >
                <template #default>
                  您可以修改工单状态并生成报告
                </template>
              </el-alert>
              <el-alert
                v-if="authStore.isReporter"
                title="负责人"
                type="info"
                :closable="false"
              >
                <template #default>
                  您可以修改优先级并查看处理进度
                </template>
              </el-alert>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Location, Phone, Document } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import {
  getTicketById,
  addComment,
  updateTicket,
  assignTicket,
  generateReport,
  getTechnicians,
} from '@/api/ticket'
import {
  formatDateTime,
  formatRelativeTime,
  formatStatus,
  formatPriority,
  getStatusType,
  getPriorityType,
} from '@/utils/format'
import type { TicketDetail, Technician } from '@/api/ticket'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const ticketId = Number(route.params.id)
const loading = ref(false)
const ticket = ref<TicketDetail>({} as TicketDetail)

// 评论
const commentContent = ref('')
const commentLoading = ref(false)

// 分配
const assignTechnicianId = ref<number>()
const assignLoading = ref(false)
const technicians = ref<Technician[]>([])

// 状态更新
const newStatus = ref('')
const statusLoading = ref(false)

// 优先级更新
const newPriority = ref('')
const priorityLoading = ref(false)

// 报告生成
const reportLoading = ref(false)

// API基础URL
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

// 图片预览列表
const previewImageList = computed(() => {
  if (!ticket.value.images) return []
  return ticket.value.images.map((image) => getImageUrl(image.image_path))
})

// 获取图片URL
const getImageUrl = (path: string) => {
  return `${API_BASE}/${path}`
}

// 获取工单详情
const fetchTicketDetail = async () => {
  try {
    loading.value = true
    const { data } = await getTicketById(ticketId)

    if (data.success) {
      ticket.value = data.data
      newStatus.value = ticket.value.status
      newPriority.value = ticket.value.priority
      assignTechnicianId.value = ticket.value.technician_id || undefined
    }
  } catch (error: any) {
    console.error('获取工单详情失败:', error)
    ElMessage.error(error?.response?.data?.message || '获取工单详情失败')
  } finally {
    loading.value = false
  }
}

// 获取技术人员列表
const fetchTechnicians = async () => {
  if (!authStore.isAdmin) return

  try {
    const { data } = await getTechnicians()
    if (data.success) {
      technicians.value = data.data
    }
  } catch (error) {
    console.error('获取技术人员列表失败:', error)
  }
}

// 添加评论
const handleAddComment = async () => {
  if (!commentContent.value.trim()) return

  try {
    commentLoading.value = true
    const { data } = await addComment(ticketId, commentContent.value.trim())

    if (data.success) {
      ElMessage.success(data.message || '评论成功')
      commentContent.value = ''
      fetchTicketDetail()
    }
  } catch (error: any) {
    console.error('添加评论失败:', error)
    ElMessage.error(error?.response?.data?.message || '添加评论失败')
  } finally {
    commentLoading.value = false
  }
}

// 分配工单
const handleAssignTicket = async () => {
  if (!assignTechnicianId.value) return

  try {
    assignLoading.value = true
    const { data } = await assignTicket(ticketId, {
      technicianId: assignTechnicianId.value,
    })

    if (data.success) {
      ElMessage.success(data.message || '分配成功')
      fetchTicketDetail()
    }
  } catch (error: any) {
    console.error('分配工单失败:', error)
    ElMessage.error(error?.response?.data?.message || '分配工单失败')
  } finally {
    assignLoading.value = false
  }
}

// 更新状态
const handleUpdateStatus = async () => {
  if (!newStatus.value || newStatus.value === ticket.value.status) return

  try {
    statusLoading.value = true
    const { data } = await updateTicket(ticketId, {
      status: newStatus.value as any,
    })

    if (data.success) {
      ElMessage.success(data.message || '状态更新成功')
      fetchTicketDetail()
    }
  } catch (error: any) {
    console.error('更新状态失败:', error)
    ElMessage.error(error?.response?.data?.message || '更新状态失败')
  } finally {
    statusLoading.value = false
  }
}

// 更新优先级
const handleUpdatePriority = async () => {
  if (!newPriority.value || newPriority.value === ticket.value.priority) return

  try {
    priorityLoading.value = true
    const { data } = await updateTicket(ticketId, {
      priority: newPriority.value as any,
    })

    if (data.success) {
      ElMessage.success(data.message || '优先级更新成功')
      fetchTicketDetail()
    }
  } catch (error: any) {
    console.error('更新优先级失败:', error)
    ElMessage.error(error?.response?.data?.message || '更新优先级失败')
  } finally {
    priorityLoading.value = false
  }
}

// 生成报告
const handleGenerateReport = async () => {
  try {
    reportLoading.value = true
    const { data } = await generateReport(ticketId)

    if (data.success) {
      ElMessage.success(data.message || 'PDF报告生成成功')
      fetchTicketDetail()
    }
  } catch (error: any) {
    console.error('生成报告失败:', error)
    ElMessage.error(error?.response?.data?.message || '生成报告失败')
  } finally {
    reportLoading.value = false
  }
}

// 下载报告
const handleDownloadReport = () => {
  const downloadUrl = `${API_BASE}/api/tickets/${ticketId}/download-report`
  window.open(downloadUrl, '_blank')
}

// 返回
const goBack = () => {
  router.push('/tickets')
}

// 初始化
onMounted(() => {
  fetchTicketDetail()
  fetchTechnicians()
})
</script>

<style scoped>
.ticket-detail {
  padding: 20px;
}

.detail-container {
  margin-top: 16px;
}

.mt-4 {
  margin-top: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-2 {
  margin-top: 8px;
}

.mb-2 {
  margin-bottom: 8px;
}

.ml-2 {
  margin-left: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ticket-badges {
  display: flex;
  gap: 8px;
}

.ticket-info {
  line-height: 1.8;
}

.info-row {
  display: flex;
  margin-bottom: 16px;
}

.info-row label {
  flex-shrink: 0;
  width: 120px;
  font-weight: 600;
  color: #606266;
}

.info-value {
  flex: 1;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 4px;
}

.info-value.description {
  white-space: pre-wrap;
  line-height: 1.6;
  display: block;
}

.text-muted {
  color: #909399;
  font-size: 14px;
}

.image-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.gallery-image {
  width: 120px;
  height: 120px;
  border-radius: 6px;
  cursor: pointer;
}

.comments-section {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.comment-item {
  padding: 12px;
  margin-bottom: 12px;
  background-color: #f5f7fa;
  border-radius: 6px;
  border-left: 3px solid #dcdfe6;
}

.comment-type-assignment {
  background-color: #ecf5ff;
  border-left-color: #409eff;
}

.comment-type-status_change {
  background-color: #fdf6ec;
  border-left-color: #e6a23c;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.comment-author {
  font-weight: 600;
  color: #303133;
}

.comment-time {
  font-size: 12px;
  color: #909399;
}

.comment-content {
  color: #606266;
  line-height: 1.6;
  white-space: pre-wrap;
}

.empty-comments {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.add-comment {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #dcdfe6;
}

.action-panel {
  padding: 8px 0;
}

.tips :deep(.el-alert) {
  margin-bottom: 0;
}
</style>
