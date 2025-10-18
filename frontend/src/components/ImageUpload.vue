<template>
  <div class="image-upload">
    <div class="upload-tip">
      <el-icon><Picture /></el-icon>
      <span>上传现场图片（最多4张，单张不超过5MB）</span>
    </div>

    <div class="image-list">
      <div
        v-for="(image, index) in imageList"
        :key="index"
        class="image-item"
      >
        <el-image
          :src="image.url"
          :preview-src-list="previewList"
          :initial-index="index"
          fit="cover"
          class="image-preview"
        />
        <div class="image-actions">
          <el-button
            type="danger"
            size="small"
            circle
            @click="removeImage(index)"
          >
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
        <div class="image-info">
          {{ formatFileSize(image.size) }}
        </div>
      </div>

      <!-- 上传按钮 -->
      <div
        v-if="imageList.length < maxCount"
        class="upload-trigger"
      >
        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :show-file-list="false"
          :accept="accept"
          :on-change="handleChange"
          :before-upload="beforeUpload"
        >
          <div class="upload-box">
            <el-icon class="upload-icon"><Plus /></el-icon>
            <div class="upload-text">添加图片</div>
          </div>
        </el-upload>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Picture, Delete, Plus } from '@element-plus/icons-vue'
import type { UploadFile } from 'element-plus'

interface ImageItem {
  file: File
  url: string
  size: number
}

interface Props {
  modelValue: File[]
  maxCount?: number
  maxSize?: number // MB
}

const props = withDefaults(defineProps<Props>(), {
  maxCount: 4,
  maxSize: 5,
})

const emit = defineEmits<{
  (e: 'update:modelValue', files: File[]): void
}>()

const imageList = ref<ImageItem[]>([])
const accept = 'image/jpeg,image/jpg,image/png,image/gif'

// 预览列表
const previewList = computed(() => imageList.value.map((item) => item.url))

// 监听外部值变化
watch(
  () => props.modelValue,
  (newFiles) => {
    if (newFiles.length === 0 && imageList.value.length > 0) {
      // 外部清空，清空内部
      imageList.value = []
    }
  }
)

// 文件变化
const handleChange = (uploadFile: UploadFile) => {
  const file = uploadFile.raw
  if (!file) return

  // 验证文件类型
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return
  }

  // 验证文件大小
  const isLtMaxSize = file.size / 1024 / 1024 < props.maxSize
  if (!isLtMaxSize) {
    ElMessage.error(`图片大小不能超过 ${props.maxSize}MB`)
    return
  }

  // 验证数量
  if (imageList.value.length >= props.maxCount) {
    ElMessage.error(`最多只能上传 ${props.maxCount} 张图片`)
    return
  }

  // 创建预览URL
  const url = URL.createObjectURL(file)

  imageList.value.push({
    file,
    url,
    size: file.size,
  })

  // 触发更新
  updateFiles()
}

// 上传前验证
const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLtMaxSize = file.size / 1024 / 1024 < props.maxSize

  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }

  if (!isLtMaxSize) {
    ElMessage.error(`图片大小不能超过 ${props.maxSize}MB`)
    return false
  }

  return true
}

// 移除图片
const removeImage = (index: number) => {
  // 释放URL
  URL.revokeObjectURL(imageList.value[index].url)
  imageList.value.splice(index, 1)
  updateFiles()
}

// 更新文件列表
const updateFiles = () => {
  const files = imageList.value.map((item) => item.file)
  emit('update:modelValue', files)
}

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// 清空图片
const clear = () => {
  imageList.value.forEach((item) => {
    URL.revokeObjectURL(item.url)
  })
  imageList.value = []
  updateFiles()
}

// 暴露方法
defineExpose({
  clear,
})
</script>

<style scoped>
.image-upload {
  width: 100%;
}

.upload-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #606266;
}

.upload-tip .el-icon {
  font-size: 16px;
}

.image-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.image-item {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #dcdfe6;
}

.image-preview {
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.image-actions {
  position: absolute;
  top: 4px;
  right: 4px;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-item:hover .image-actions {
  opacity: 1;
}

.image-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 4px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 12px;
  text-align: center;
}

.upload-trigger {
  width: 120px;
  height: 120px;
}

.upload-box {
  width: 100%;
  height: 100%;
  border: 2px dashed #dcdfe6;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-box:hover {
  border-color: #409eff;
  background-color: #f5f7fa;
}

.upload-icon {
  font-size: 28px;
  color: #8c939d;
  margin-bottom: 4px;
}

.upload-text {
  font-size: 12px;
  color: #8c939d;
}
</style>

