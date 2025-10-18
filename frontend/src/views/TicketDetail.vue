<template>
  <div v-loading="ticketStore.loading" class="ticket-detail">
    <el-page-header @back="goBack">
      <template #content>
        <h2>工单详情</h2>
      </template>
    </el-page-header>

    <div v-if="ticket" class="detail-content mt-4">
      <!-- 基本信息 -->
      <el-card shadow="never" class="mb-4">
        <template #header>
          <div class="flex-between">
            <span class="card-title">基本信息</span>
            <div v-if="canEdit">
              <el-button
                v-if="!isEditing"
                text
                type="primary"
                :icon="Edit"
                @click="startEdit"
              >
                编辑
              </el-button>
              <template v-else>
                <el-button
                  text
                  type="success"
                  :icon="Check"
                  :loading="updating"
                  @click="saveEdit"
                >
                  保存
                </el-button>
                <el-button text :icon="Close" @click="cancelEdit">
                  取消
                </el-button>
              </template>
            </div>
          </div>
        </template>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="工单ID">
            #{{ ticket.id }}
          </el-descriptions-item>

          <el-descriptions-item label="状态">
            <el-tag v-if="!isEditing" :type="getStatusType(ticket.status)">
              {{ getStatusText(ticket.status) }}
            </el-tag>
            <el-select v-else v-model="editForm.status" size="small">
              <el-option label="待处理" value="open" />
              <el-option label="处理中" value="in_progress" />
              <el-option label="已解决" value="resolved" />
              <el-option label="已关闭" value="closed" />
            </el-select>
          </el-descriptions-item>

          <el-descriptions-item label="优先级">
            <el-tag v-if="!isEditing" :type="getPriorityType(ticket.priority)">
              {{ getPriorityText(ticket.priority) }}
            </el-tag>
            <el-select v-else v-model="editForm.priority" size="small">
              <el-option label="低" value="low" />
              <el-option label="中" value="mid" />
              <el-option label="高" value="high" />
            </el-select>
          </el-descriptions-item>

          <el-descriptions-item label="处理人">
            {{ ticket.assignee_name || '未分配' }}
          </el-descriptions-item>

          <el-descriptions-item label="创建人">
            {{ ticket.creator_name }}
            <span v-if="ticket.creator_email" class="text-muted">
              ({{ ticket.creator_email }})
            </span>
          </el-descriptions-item>

          <el-descriptions-item label="创建时间">
            {{ formatDateTime(ticket.created_at) }}
          </el-descriptions-item>

          <el-descriptions-item label="更新时间">
            {{ formatDateTime(ticket.updated_at) }}
          </el-descriptions-item>

          <el-descriptions-item label="标题" :span="2">
            <template v-if="!isEditing">
              <strong>{{ ticket.title }}</strong>
            </template>
            <el-input v-else v-model="editForm.title" />
          </el-descriptions-item>

          <el-descriptions-item label="描述" :span="2">
            <template v-if="!isEditing">
              <div class="description">{{ ticket.description || '无' }}</div>
            </template>
            <el-input
              v-else
              v-model="editForm.description"
              type="textarea"
              :rows="4"
            />
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 评论区 -->
      <el-card shadow="never">
        <template #header>
          <span class="card-title">
            评论 ({{ ticket.comments?.length || 0 }})
          </span>
        </template>

        <!-- 评论列表 -->
        <div v-if="ticket.comments && ticket.comments.length > 0" class="comments-list">
          <div
            v-for="comment in ticket.comments"
            :key="comment.id"
            class="comment-item"
          >
            <div class="comment-header">
              <span class="comment-author">{{ comment.author_name }}</span>
              <span class="comment-time">
                {{ formatRelativeTime(comment.created_at) }}
              </span>
            </div>
            <div class="comment-content">{{ comment.content }}</div>
          </div>
        </div>
        <el-empty v-else description="暂无评论" />

        <!-- 添加评论 -->
        <div class="add-comment mt-4">
          <el-input
            v-model="commentContent"
            type="textarea"
            :rows="3"
            placeholder="输入评论..."
            maxlength="500"
            show-word-limit
          />
          <el-button
            type="primary"
            class="mt-2"
            :disabled="!commentContent.trim()"
            :loading="commenting"
            @click="handleAddComment"
          >
            发表评论
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Edit, Check, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useTicketStore } from '@/stores/ticket'
import { useAuthStore } from '@/stores/auth'
import {
  formatDateTime,
  formatRelativeTime,
  getStatusText,
  getStatusType,
  getPriorityText,
  getPriorityType,
} from '@/utils/format'

const route = useRoute()
const router = useRouter()
const ticketStore = useTicketStore()
const authStore = useAuthStore()

const isEditing = ref(false)
const updating = ref(false)
const commenting = ref(false)
const commentContent = ref('')

const ticket = computed(() => ticketStore.currentTicket)
const canEdit = computed(() => authStore.isAdmin || authStore.isAgent)

const editForm = reactive({
  title: '',
  description: '',
  status: '',
  priority: '',
})

const startEdit = () => {
  if (ticket.value) {
    editForm.title = ticket.value.title
    editForm.description = ticket.value.description || ''
    editForm.status = ticket.value.status
    editForm.priority = ticket.value.priority
    isEditing.value = true
  }
}

const cancelEdit = () => {
  isEditing.value = false
}

const saveEdit = async () => {
  if (!ticket.value) return

  updating.value = true
  try {
    const success = await ticketStore.updateTicket(ticket.value.id, {
      title: editForm.title,
      description: editForm.description,
      status: editForm.status as any,
      priority: editForm.priority as any,
    })

    if (success) {
      ElMessage.success('更新成功')
      isEditing.value = false
    }
  } catch (error) {
    ElMessage.error('更新失败')
  } finally {
    updating.value = false
  }
}

const handleAddComment = async () => {
  if (!ticket.value || !commentContent.value.trim()) return

  commenting.value = true
  try {
    const success = await ticketStore.addComment(
      ticket.value.id,
      commentContent.value.trim()
    )

    if (success) {
      ElMessage.success('评论发表成功')
      commentContent.value = ''
    }
  } catch (error) {
    ElMessage.error('评论发表失败')
  } finally {
    commenting.value = false
  }
}

const goBack = () => {
  router.back()
}

onMounted(async () => {
  const id = parseInt(route.params.id as string)
  if (id) {
    await ticketStore.fetchTicketById(id)
  }
})
</script>

<style scoped>
.ticket-detail {
  max-width: 1200px;
  margin: 0 auto;
}

.detail-content {
  margin-top: 20px;
}

.card-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.text-muted {
  color: #909399;
  font-size: 13px;
}

.description {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
}

.comments-list {
  max-height: 600px;
  overflow-y: auto;
}

.comment-item {
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.comment-author {
  font-weight: 500;
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
  word-break: break-word;
}

.add-comment {
  border-top: 1px solid #ebeef5;
  padding-top: 16px;
}

@media (max-width: 768px) {
  :deep(.el-descriptions__label) {
    width: 100px;
  }
}
</style>

