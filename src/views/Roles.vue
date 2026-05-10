<template>
  <div class="page">
    <header class="page-header">
      <h1>角色管理</h1>
      <div class="header-actions">
        <button class="btn btn-primary" @click="openCreate">新增角色</button>
      </div>
    </header>

    <div class="search-bar">
      <input v-model="keyword" placeholder="搜索角色 key / 描述..." class="search-input" />
    </div>

    <div v-if="store.loading" class="loading">加载中...</div>
    <div v-else-if="filteredList.length === 0" class="empty">暂无数据</div>
    <div v-else class="role-list">
      <div v-for="role in filteredList" :key="role.hty_role_id" class="role-card">
        <div class="card-header">
          <span class="role-key">{{ role.role_key }}</span>
          <span :class="['status-badge', role.role_status === 'ACTIVE' ? 'active' : 'disabled']">
            {{ role.role_status === 'ACTIVE' ? '已启用' : '已禁用' }}
          </span>
        </div>
        <div class="card-body">
          <div class="detail"><label>描述</label><span>{{ role.role_desc || '-' }}</span></div>
          <div class="detail" v-if="role.actions?.length"><label>操作</label><span>{{ role.actions.map(a => a.action_name).join(', ') }}</span></div>
          <div class="detail" v-if="role.labels?.length"><label>标签</label>
            <div class="tag-group">
              <span v-for="lbl in role.labels" :key="lbl.hty_label_id" class="mini-tag">{{ lbl.label_name }}</span>
            </div>
          </div>
        </div>
        <div class="card-actions">
          <button class="btn btn-sm" @click="openEdit(role)">编辑</button>
          <button v-if="role.role_status === 'ACTIVE'" class="btn btn-sm btn-danger" @click="toggleStatus(role, 'DELETED')">禁用</button>
          <button v-if="role.role_status === 'DELETED'" class="btn btn-sm btn-success" @click="toggleStatus(role, 'ACTIVE')">启用</button>
        </div>
      </div>
    </div>

    <!-- Edit modal -->
    <div v-if="showModal" class="dialog-overlay" @click.self="closeModal">
      <div class="dialog">
        <h3>{{ isEditing ? '编辑角色' : '新增角色' }}</h3>
        <div class="form-group">
          <label class="form-label">角色 Key</label>
          <input v-model="form.role_key" class="form-input" :readonly="isEditing" placeholder="如 ADMIN" />
        </div>
        <div class="form-group">
          <label class="form-label">描述</label>
          <input v-model="form.role_desc" class="form-input" placeholder="角色描述" />
        </div>
        <div class="form-group">
          <label class="form-label">状态</label>
          <div class="radio-group">
            <label><input type="radio" v-model="form.role_status" value="ACTIVE" /> 启用</label>
            <label><input type="radio" v-model="form.role_status" value="DELETED" /> 禁用</label>
          </div>
        </div>
        <div class="dialog-actions">
          <button class="btn" @click="closeModal">取消</button>
          <button class="btn btn-primary" @click="submit" :disabled="!form.role_key?.trim()">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import useRole from '@/store/role'
import request from '@/utils/request'
import type { HtyRole } from '@/types'

const { store, fetchAll } = useRole()
const keyword = ref('')
const showModal = ref(false)
const isEditing = ref(false)
const form = reactive<Partial<HtyRole>>({ role_key: '', role_desc: '', role_status: 'ACTIVE' })

const filteredList = computed(() => {
  let list = store.list
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    list = list.filter(r =>
      r.role_key?.toLowerCase().includes(kw) ||
      r.role_desc?.toLowerCase().includes(kw)
    )
  }
  return list
})

function openCreate() {
  isEditing.value = false
  Object.assign(form, { role_key: '', role_desc: '', role_status: 'ACTIVE' })
  showModal.value = true
}

function openEdit(role: HtyRole) {
  isEditing.value = true
  Object.assign(form, {
    role_key: role.role_key,
    role_desc: role.role_desc,
    role_status: role.role_status,
  })
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function submit() {
  const { r } = await request({
    url: '/api/v1/uc/create_or_update_roles',
    method: 'POST',
    data: { ...form, hty_role_id: isEditing.value ? undefined : undefined },
  })
  if (r) {
    closeModal()
    await fetchAll()
  }
}

async function toggleStatus(role: HtyRole, status: string) {
  const { r } = await request({
    url: '/api/v1/uc/create_or_update_roles',
    method: 'POST',
    data: { ...role, role_status: status },
  })
  if (r) await fetchAll()
}

onMounted(fetchAll)
</script>

<style scoped>
.page { max-width: 800px; margin: 0 auto; padding: 0 16px 24px; }
.page-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; }
.page-header h1 { font-size: 20px; }
.header-actions { display: flex; gap: 8px; }
.search-bar { margin-bottom: 16px; }
.search-input { width: 100%; padding: 10px 16px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; }
.search-input:focus { border-color: #667eea; }
.loading, .empty { text-align: center; padding: 40px; color: #999; }
.role-list { display: flex; flex-direction: column; gap: 8px; }
.role-card { background: white; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden; }
.card-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #fafafa; border-bottom: 1px solid #f0f0f0; }
.role-key { font-size: 16px; font-weight: 600; color: #333; font-family: monospace; }
.status-badge { padding: 2px 10px; border-radius: 10px; font-size: 12px; }
.status-badge.active { background: #e8f5e9; color: #2e7d32; }
.status-badge.disabled { background: #f5f5f5; color: #999; }
.card-body { padding: 12px 16px; }
.detail { display: flex; gap: 8px; font-size: 13px; margin-bottom: 4px; }
.detail label { color: #999; min-width: 40px; flex-shrink: 0; }
.detail span { color: #444; }
.tag-group { display: flex; gap: 4px; flex-wrap: wrap; }
.mini-tag { padding: 1px 6px; background: #e3f2fd; color: #1565c0; border-radius: 6px; font-size: 11px; }
.card-actions { display: flex; gap: 6px; padding: 10px 16px; border-top: 1px solid #f0f0f0; }
.btn { padding: 8px 16px; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; background: #f0f0f0; color: #333; }
.btn-sm { padding: 5px 12px; font-size: 12px; }
.btn-primary { background: #667eea; color: white; }
.btn-success { background: #e8f5e9; color: #2e7d32; }
.btn-danger { background: #fce4ec; color: #c62828; }
.dialog-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
.dialog { background: white; border-radius: 12px; padding: 24px; width: 90%; max-width: 450px; }
.dialog h3 { font-size: 16px; margin-bottom: 16px; }
.form-group { margin-bottom: 14px; }
.form-label { display: block; font-size: 13px; font-weight: 600; color: #333; margin-bottom: 4px; }
.form-input { width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; outline: none; }
.form-input:focus { border-color: #667eea; }
.form-input[readonly] { background: #f5f5f5; color: #999; }
.radio-group { display: flex; gap: 12px; }
.radio-group label { display: flex; align-items: center; gap: 4px; font-size: 13px; cursor: pointer; }
.dialog-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
</style>
