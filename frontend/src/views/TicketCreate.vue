<template>
  <div class="ticket-create">
    <el-page-header @back="goBack">
      <template #content>
        <h2>创建工单</h2>
      </template>
    </el-page-header>

    <el-card class="form-card mt-4">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="工单标题" prop="title">
          <el-input
            v-model="form.title"
            placeholder="请输入工单标题"
            maxlength="200"
            show-word-limit
            @input="debouncedSaveDraft"
          />
        </el-form-item>

        <el-form-item label="工单描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="8"
            placeholder="请详细描述问题..."
            maxlength="2000"
            show-word-limit
            @input="debouncedSaveDraft"
          />
        </el-form-item>

        <el-form-item label="优先级" prop="priority">
          <el-radio-group v-model="form.priority" @change="debouncedSaveDraft">
            <el-radio label="low">低</el-radio>
            <el-radio label="mid">中</el-radio>
            <el-radio label="high">高</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            创建工单
          </el-button>
          <el-button @click="handleCancel">取消</el-button>
          <el-button v-if="hasDraft" text type="danger" @click="handleClearDraft">
            清除草稿
          </el-button>
        </el-form-item>

        <el-alert
          v-if="hasDraft"
          title="检测到未保存的草稿"
          type="info"
          :closable="false"
          show-icon
          class="draft-alert"
        >
          <template #default>
            草稿会自动保存，您可以随时返回继续编辑
          </template>
        </el-alert>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { useTicketStore } from '@/stores/ticket'
import { saveDraft, getDraft, deleteDraft } from '@/utils/indexedDB'
import { debounce } from '@/utils/format'

const router = useRouter()
const ticketStore = useTicketStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const hasDraft = ref(false)

const form = reactive({
  title: '',
  description: '',
  priority: 'mid' as 'low' | 'mid' | 'high',
})

const rules: FormRules = {
  title: [
    { required: true, message: '请输入工单标题', trigger: 'blur' },
    { min: 5, max: 200, message: '标题长度在 5 到 200 个字符', trigger: 'blur' },
  ],
  description: [
    { required: true, message: '请输入工单描述', trigger: 'blur' },
    { min: 10, message: '描述至少需要 10 个字符', trigger: 'blur' },
  ],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
}

// 保存草稿（防抖）
const debouncedSaveDraft = debounce(() => {
  if (form.title || form.description) {
    saveDraft({
      title: form.title,
      description: form.description,
      priority: form.priority,
    })
    hasDraft.value = true
  }
}, 3000) // 3秒自动保存

// 加载草稿
const loadDraft = async () => {
  const draft = await getDraft()
  if (draft) {
    const result = await ElMessageBox.confirm(
      '检测到未完成的草稿，是否继续编辑？',
      '恢复草稿',
      {
        confirmButtonText: '继续编辑',
        cancelButtonText: '放弃草稿',
        type: 'info',
      }
    ).catch(() => 'cancel')

    if (result === 'confirm') {
      form.title = draft.title
      form.description = draft.description
      form.priority = draft.priority as 'low' | 'mid' | 'high'
      hasDraft.value = true
      ElMessage.success('草稿已恢复')
    } else {
      await deleteDraft()
      hasDraft.value = false
    }
  }
}

// 清除草稿
const handleClearDraft = async () => {
  const result = await ElMessageBox.confirm(
    '确定要清除当前草稿吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).catch(() => 'cancel')

  if (result === 'confirm') {
    await deleteDraft()
    form.title = ''
    form.description = ''
    form.priority = 'mid'
    hasDraft.value = false
    ElMessage.success('草稿已清除')
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const success = await ticketStore.createTicket({
          title: form.title,
          description: form.description,
          priority: form.priority,
        })

        if (success) {
          // 删除草稿
          await deleteDraft()
          hasDraft.value = false
          
          ElMessage.success('工单创建成功')
          router.push('/tickets')
        }
      } catch (error) {
        ElMessage.error('创建失败，请重试')
      } finally {
        loading.value = false
      }
    }
  })
}

// 取消
const handleCancel = async () => {
  if (form.title || form.description) {
    const result = await ElMessageBox.confirm(
      '确定要取消吗？当前内容会保存为草稿',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '继续编辑',
        type: 'warning',
      }
    ).catch(() => 'cancel')

    if (result === 'confirm') {
      // 保存草稿
      if (form.title || form.description) {
        await saveDraft({
          title: form.title,
          description: form.description,
          priority: form.priority,
        })
      }
      goBack()
    }
  } else {
    goBack()
  }
}

// 返回
const goBack = () => {
  router.back()
}

// 页面离开时保存草稿
const beforeUnload = () => {
  if (form.title || form.description) {
    saveDraft({
      title: form.title,
      description: form.description,
      priority: form.priority,
    })
  }
}

onMounted(() => {
  loadDraft()
  window.addEventListener('beforeunload', beforeUnload)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', beforeUnload)
})
</script>

<style scoped>
.ticket-create {
  max-width: 900px;
  margin: 0 auto;
}

.form-card {
  margin-top: 20px;
}

.draft-alert {
  margin-top: 16px;
}

@media (max-width: 768px) {
  :deep(.el-form-item__label) {
    width: 100% !important;
    text-align: left;
  }

  :deep(.el-form-item__content) {
    margin-left: 0 !important;
  }
}
</style>

