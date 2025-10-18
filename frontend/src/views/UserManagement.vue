<template>
  <div class="user-management">
    <div class="page-header">
      <h1>用户管理</h1>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        添加用户
      </el-button>
    </div>

    <!-- 筛选和搜索 -->
    <div class="filter-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-select v-model="filters.role" placeholder="选择角色" clearable @change="loadUsers">
            <el-option label="全部" value="" />
            <el-option label="管理员" value="admin" />
            <el-option label="技术人员" value="technician" />
            <el-option label="客户方负责人" value="reporter" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-input
            v-model="filters.search"
            placeholder="搜索用户名或姓名"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
      </el-row>
    </div>

    <!-- 用户列表 -->
    <el-table :data="users" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="full_name" label="姓名" width="120" />
      <el-table-column prop="role" label="角色" width="100">
        <template #default="{ row }">
          <el-tag :type="getRoleTagType(row.role)">
            {{ getRoleText(row.role) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="company_name" label="公司名称" min-width="200" />
      <el-table-column prop="email" label="邮箱" width="180" />
      <el-table-column prop="phone" label="电话" width="120" />
      <el-table-column prop="created_at" label="创建时间" width="160">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="editUser(row)">编辑</el-button>
          <el-button 
            size="small" 
            type="danger" 
            @click="deleteUser(row)"
            :disabled="row.id === currentUser.id"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadUsers"
        @current-change="loadUsers"
      />
    </div>

    <!-- 创建/编辑用户对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingUser ? '编辑用户' : '添加用户'"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userFormRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" />
        </el-form-item>
        
        <el-form-item label="密码" prop="password" v-if="!editingUser">
          <el-input 
            v-model="userForm.password" 
            type="password" 
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="新密码" prop="newPassword" v-if="editingUser">
          <el-input 
            v-model="userForm.newPassword" 
            type="password" 
            placeholder="留空则不修改密码"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="角色" prop="role">
          <el-select v-model="userForm.role" placeholder="请选择角色">
            <el-option label="管理员" value="admin" />
            <el-option label="技术人员" value="technician" />
            <el-option label="客户方负责人" value="reporter" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="公司名称" prop="company_name">
          <el-input v-model="userForm.company_name" placeholder="请输入公司名称" />
        </el-form-item>
        
        <el-form-item label="姓名" prop="full_name">
          <el-input v-model="userForm.full_name" placeholder="请输入姓名" />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        
        <el-form-item label="电话" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入电话" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          {{ editingUser ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { 
  getAllUsers, 
  createUser, 
  updateUser, 
  deleteUser as deleteUserApi,
  type User,
  type CreateUserRequest,
  type UpdateUserRequest
} from '@/api/user'

const authStore = useAuthStore()
const currentUser = computed(() => authStore.user)

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const showCreateDialog = ref(false)
const editingUser = ref<User | null>(null)
const users = ref<User[]>([])
const userFormRef = ref()

// 筛选条件
const filters = reactive({
  role: '',
  search: ''
})

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// 用户表单
const userForm = reactive({
  username: '',
  password: '',
  newPassword: '',
  role: 'reporter' as 'admin' | 'technician' | 'reporter',
  company_name: '',
  full_name: '',
  email: '',
  phone: ''
})

// 表单验证规则
const userFormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 个字符', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  company_name: [
    { required: true, message: '请输入公司名称', trigger: 'blur' }
  ],
  full_name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

// 搜索防抖
let searchTimer: NodeJS.Timeout
const handleSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    pagination.page = 1
    loadUsers()
  }, 500)
}

// 加载用户列表
const loadUsers = async () => {
  loading.value = true
  try {
    const response = await getAllUsers({
      role: filters.role || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    
    users.value = response.data.users
    pagination.total = response.data.pagination.total
  } catch (error) {
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

// 获取角色标签类型
const getRoleTagType = (role: string) => {
  const typeMap = {
    admin: 'danger',
    technician: 'success',
    reporter: 'info'
  }
  return typeMap[role as keyof typeof typeMap] || 'info'
}

// 获取角色文本
const getRoleText = (role: string) => {
  const textMap = {
    admin: '管理员',
    technician: '技术人员',
    reporter: '客户方负责人'
  }
  return textMap[role as keyof typeof textMap] || role
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 编辑用户
const editUser = (user: User) => {
  editingUser.value = user
  Object.assign(userForm, {
    username: user.username,
    password: '',
    newPassword: '',
    role: user.role,
    company_name: user.company_name,
    full_name: user.full_name,
    email: user.email || '',
    phone: user.phone || ''
  })
  showCreateDialog.value = true
}

// 删除用户
const deleteUser = async (user: User) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.full_name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteUserApi(user.id)
    ElMessage.success('用户删除成功')
    loadUsers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除用户失败')
    }
  }
}

// 重置表单
const resetForm = () => {
  editingUser.value = null
  Object.assign(userForm, {
    username: '',
    password: '',
    newPassword: '',
    role: 'reporter',
    company_name: '',
    full_name: '',
    email: '',
    phone: ''
  })
  userFormRef.value?.resetFields()
}

// 提交表单
const submitForm = async () => {
  if (!userFormRef.value) return
  
  try {
    await userFormRef.value.validate()
    submitting.value = true
    
    if (editingUser.value) {
      // 更新用户
      const updateData: UpdateUserRequest = {
        username: userForm.username,
        role: userForm.role,
        company_name: userForm.company_name,
        full_name: userForm.full_name,
        email: userForm.email || undefined,
        phone: userForm.phone || undefined
      }
      
      if (userForm.newPassword) {
        updateData.password = userForm.newPassword
      }
      
      await updateUser(editingUser.value.id, updateData)
      ElMessage.success('用户更新成功')
    } else {
      // 创建用户
      const createData: CreateUserRequest = {
        username: userForm.username,
        password: userForm.password,
        role: userForm.role,
        company_name: userForm.company_name,
        full_name: userForm.full_name,
        email: userForm.email || undefined,
        phone: userForm.phone || undefined
      }
      
      await createUser(createData)
      ElMessage.success('用户创建成功')
    }
    
    showCreateDialog.value = false
    loadUsers()
  } catch (error) {
    ElMessage.error(editingUser.value ? '更新用户失败' : '创建用户失败')
  } finally {
    submitting.value = false
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.user-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  color: #303133;
}

.filter-section {
  margin-bottom: 20px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.el-table {
  margin-bottom: 20px;
}
</style>
