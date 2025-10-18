<template>
  <div class="ticket-create">
    <el-page-header @back="goBack">
      <template #content>
        <h2>创建技术支持工单</h2>
      </template>
    </el-page-header>

    <el-card class="form-card mt-4">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        @submit.prevent="handleSubmit"
      >
        <el-divider content-position="left">基本信息</el-divider>

        <el-form-item label="工单标题" prop="title">
          <el-input
            v-model="form.title"
            placeholder="请简要描述问题，如：路由器频繁断网"
            maxlength="200"
            show-word-limit
            @input="debouncedSaveDraft"
          />
        </el-form-item>

        <el-form-item label="问题描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="6"
            placeholder="请详细描述问题现象、影响范围、发生频率等..."
            maxlength="2000"
            show-word-limit
            @input="debouncedSaveDraft"
          />
        </el-form-item>

        <el-divider content-position="left">现场信息</el-divider>

        <el-form-item label="问题发生地点" prop="location">
          <el-input
            v-model="form.location"
            placeholder="请输入详细地址，如：北京市朝阳区建国路88号3楼会议室"
            maxlength="300"
            show-word-limit
            @input="debouncedSaveDraft"
          />
        </el-form-item>

        <el-form-item label="对接电话" prop="contactPhone">
          <el-input
            v-model="form.contactPhone"
            placeholder="请输入现场联系电话"
            maxlength="20"
            @input="debouncedSaveDraft"
          />
        </el-form-item>

        <el-form-item label="现场图片" prop="images">
          <ImageUpload
            ref="imageUploadRef"
            v-model="form.images"
            :max-count="4"
            :max-size="5"
          />
        </el-form-item>

        <el-divider content-position="left">其他设置</el-divider>

        <el-form-item label="优先级" prop="priority">
          <el-radio-group v-model="form.priority" @change="debouncedSaveDraft">
            <el-radio label="low">低</el-radio>
            <el-radio label="mid">中</el-radio>
            <el-radio label="high">高</el-radio>
            <el-radio label="urgent">紧急</el-radio>
          </el-radio-group>
          <div class="form-tip">
            请根据问题的紧急程度选择优先级。紧急问题将优先处理。
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            <el-icon><Plus /></el-icon>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { createTicket } from '@/api/ticket'
import { saveDraft, getDraft, deleteDraft } from '@/utils/indexedDB'
import ImageUpload from '@/components/ImageUpload.vue'
import type { FormInstance, FormRules } from 'element-plus'

const router = useRouter()
const formRef = ref<FormInstance>()
const imageUploadRef = ref<InstanceType<typeof ImageUpload>>()
const loading = ref(false)
const hasDraft = ref(false)

// 表单数据
const form = reactive({
  title: '',
  description: '',
  location: '',
  contactPhone: '',
  images: [] as File[],
  priority: 'mid' as 'low' | 'mid' | 'high' | 'urgent',
})

// 表单验证规则
const rules: FormRules = {
  title: [
    { required: true, message: '请输入工单标题', trigger: 'blur' },
    { min: 5, max: 200, message: '标题长度在 5 到 200 个字符', trigger: 'blur' },
  ],
  description: [
    { required: true, message: '请输入问题描述', trigger: 'blur' },
    { min: 10, max: 2000, message: '描述长度在 10 到 2000 个字符', trigger: 'blur' },
  ],
  location: [
    { required: true, message: '请输入问题发生地点', trigger: 'blur' },
    { min: 5, max: 300, message: '地点长度在 5 到 300 个字符', trigger: 'blur' },
  ],
  contactPhone: [
    { required: true, message: '请输入对接电话', trigger: 'blur' },
    { 
      pattern: /^1[3-9]\d{9}$|^0\d{2,3}-?\d{7,8}$/,
      message: '请输入有效的手机号或固定电话',
      trigger: 'blur',
    },
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' },
  ],
}

// 防抖保存草稿
let saveTimer: any = null
const debouncedSaveDraft = () => {
  if (saveTimer) {
    clearTimeout(saveTimer)
  }
  saveTimer = setTimeout(() => {
    saveDraftToIndexedDB()
  }, 1000)
}

// 保存草稿到 IndexedDB
const saveDraftToIndexedDB = async () => {
  try {
    // 只保存文本字段，不保存图片
    const draftData = {
      title: form.title,
      description: form.description,
      location: form.location,
      contactPhone: form.contactPhone,
      priority: form.priority,
    }

    // 只有至少一个字段有值才保存
    const hasValue = Object.values(draftData).some((value) => {
      return typeof value === 'string' ? value.trim() !== '' : !!value
    })

    if (hasValue) {
      await saveDraft('ticketCreate', draftData)
      hasDraft.value = true
    }
  } catch (error) {
    console.error('保存草稿失败:', error)
  }
}

// 加载草稿
const loadDraft = async () => {
  try {
    const draft = await getDraft('ticketCreate')
    if (draft) {
      Object.assign(form, draft)
      hasDraft.value = true
      ElMessage.info('已加载草稿')
    }
  } catch (error) {
    console.error('加载草稿失败:', error)
  }
}

// 清除草稿
const handleClearDraft = async () => {
  try {
    await ElMessageBox.confirm('确定要清除草稿吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await deleteDraft('ticketCreate')
    
    // 清空表单
    form.title = ''
    form.description = ''
    form.location = ''
    form.contactPhone = ''
    form.priority = 'mid'
    form.images = []
    imageUploadRef.value?.clear()
    
    hasDraft.value = false
    ElMessage.success('草稿已清除')
  } catch (error) {
    // 用户取消
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    // 验证表单
    await formRef.value.validate()

    loading.value = true

    // 创建工单
    const { data } = await createTicket({
      title: form.title,
      description: form.description,
      location: form.location,
      contactPhone: form.contactPhone,
      priority: form.priority,
      images: form.images,
    })

    if (data.success) {
      ElMessage.success(data.message || '工单创建成功')
      
      // 清除草稿
      await deleteDraft('ticketCreate')
      hasDraft.value = false

      // 跳转到工单详情
      router.push(`/tickets/${data.data.id}`)
    } else {
      ElMessage.error('创建工单失败')
    }
  } catch (error: any) {
    console.error('创建工单失败:', error)
    ElMessage.error(error?.response?.data?.message || '创建工单失败')
  } finally {
    loading.value = false
  }
}

// 取消
const handleCancel = async () => {
  // 检查是否有未保存的内容
  const hasContent =
    form.title.trim() ||
    form.description.trim() ||
    form.location.trim() ||
    form.contactPhone.trim() ||
    form.images.length > 0

  if (hasContent) {
    try {
      await ElMessageBox.confirm('确定要放弃当前编辑吗？草稿将保留。', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
      goBack()
    } catch (error) {
      // 用户取消
    }
  } else {
    goBack()
  }
}

// 返回
const goBack = () => {
  router.push('/tickets')
}

// 组件挂载时加载草稿
onMounted(() => {
  loadDraft()
})

// 组件卸载时清理定时器
onUnmounted(() => {
  if (saveTimer) {
    clearTimeout(saveTimer)
  }
})
</script>

<style scoped>
.ticket-create {
  padding: 20px;
}

.form-card {
  max-width: 900px;
  margin: 0 auto;
}

.mt-4 {
  margin-top: 16px;
}

.form-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.draft-alert {
  margin-top: 16px;
}

:deep(.el-divider__text) {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}
</style>
