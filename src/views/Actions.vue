<template>
  <div class="page">
    <header class="page-header">
      <h1>动作管理</h1>
      <div class="header-actions">
        <button class="btn btn-primary" @click="openCreate">新增动作</button>
      </div>
    </header>

    <div class="search-bar">
      <input v-model="keyword" placeholder="搜索动作名称/描述..." class="search-input" />
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="filteredList.length === 0" class="empty">暂无数据</div>
    <div v-else class="action-list">
      <div v-for="item in filteredList" :key="item.hty_action_id" class="action-card">
        <div class="card-header">
          <span class="action-name">{{ item.action_name }}</span>
          <span :class="['status-badge', item.action_status === 'ACTIVE' ? 'active' : 'disabled']">{{ item.action_status }}</span>
        </div>
        <div class="card-body">
          <div class="detail"><label>描述</label><span>{{ item.action_desc || '-' }}</span></div>
          <div class="detail" v-if="item.labels?.length"><label>Label</label>
            <div class="tag-group"><span v-for="l in item.labels" :key="l.hty_label_id" class="mini-tag">{{ l.label_name }}</span></div>
          </div>
          <div class="detail" v-if="item.roles?.length"><label>角色</label>
            <div class="tag-group"><span v-for="r in item.roles" :key="r.hty_role_id" class="mini-tag role-tag">{{ r.role_key }}</span></div>
          </div>
        </div>
        <div class="card-actions">
          <button class="btn btn-sm" @click="openEdit(item)">编辑</button>
          <button v-if="item.action_status === 'ACTIVE'" class="btn btn-sm btn-danger" @click="toggle(item, 'DELETED')">禁用</button>
          <button v-if="item.action_status === 'DELETED'" class="btn btn-sm btn-success" @click="toggle(item, 'ACTIVE')">启用</button>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="dialog-overlay" @click.self="closeModal">
      <div class="dialog">
        <h3>{{ isEditing ? '编辑动作' : '新增动作' }}</h3>
        <div class="form-group">
          <label class="form-label">动作名称</label>
          <input v-model="form.action_name" class="form-input" placeholder="action_name" />
        </div>
        <div class="form-group">
          <label class="form-label">描述</label>
          <input v-model="form.action_desc" class="form-input" placeholder="描述" />
        </div>
        <div class="form-group">
          <label class="form-label">状态</label>
          <div class="radio-group">
            <label><input type="radio" v-model="form.action_status" value="ACTIVE" /> 启用</label>
            <label><input type="radio" v-model="form.action_status" value="DELETED" /> 禁用</label>
          </div>
        </div>
        <div class="dialog-actions">
          <button class="btn" @click="closeModal">取消</button>
          <button class="btn btn-primary" @click="submit" :disabled="!form.action_name?.trim()">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import request from '@/utils/request'

interface HtyAction {
  hty_action_id: string
  action_name: string
  action_desc?: string
  action_status?: string
  labels?: { hty_label_id: string; label_name: string }[]
  roles?: { hty_role_id: string; role_key: string }[]
}

const keyword = ref('')
const loading = ref(false)
const showModal = ref(false)
const isEditing = ref(false)
const list = ref<HtyAction[]>([])
const form = reactive<Partial<HtyAction>>({ action_name: '', action_desc: '', action_status: 'ACTIVE' })

const filteredList = computed(() => {
  if (!keyword.value) return list.value
  const kw = keyword.value.toLowerCase()
  return list.value.filter(x => x.action_name.toLowerCase().includes(kw) || x.action_desc?.toLowerCase().includes(kw))
})

async function fetchList() {
  loading.value = true
  const { r, d } = await request({ url: '/api/v1/uc/find_all_actions' })
  loading.value = false
  if (r && Array.isArray(d)) list.value = d
}

function openCreate() {
  isEditing.value = false
  Object.assign(form, { action_name: '', action_desc: '', action_status: 'ACTIVE' })
  showModal.value = true
}

function openEdit(item: HtyAction) {
  isEditing.value = true
  Object.assign(form, { action_name: item.action_name, action_desc: item.action_desc, action_status: item.action_status })
  showModal.value = true
}

function closeModal() { showModal.value = false }

async function submit() {
  if (!form.action_name?.trim()) return
  const { r } = await request({
    url: '/api/v1/uc/create_or_update_actions',
    method: 'POST',
    data: form,
  })
  if (r) { closeModal(); await fetchList() }
}

async function toggle(item: HtyAction, status: string) {
  const { r } = await request({
    url: '/api/v1/uc/create_or_update_actions',
    method: 'POST',
    data: { ...item, action_status: status },
  })
  if (r) await fetchList()
}

onMounted(fetchList)
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
.action-list { display: flex; flex-direction: column; gap: 8px; }
.action-card { background: white; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden; }
.card-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #fafafa; border-bottom: 1px solid #f0f0f0; }
.action-name { font-size: 15px; font-weight: 600; color: #333; font-family: monospace; }
.status-badge { padding: 2px 10px; border-radius: 10px; font-size: 12px; }
.status-badge.active { background: #e8f5e9; color: #2e7d32; }
.status-badge.disabled { background: #f5f5f5; color: #999; }
.card-body { padding: 12px 16px; }
.detail { display: flex; gap: 8px; font-size: 13px; margin-bottom: 4px; }
.detail label { color: #999; min-width: 40px; flex-shrink: 0; }
.detail span { color: #444; }
.tag-group { display: flex; gap: 4px; flex-wrap: wrap; }
.mini-tag { padding: 1px 6px; background: #e3f2fd; color: #1565c0; border-radius: 6px; font-size: 11px; }
.role-tag { background: #fff3e0; color: #e65100; }
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
.radio-group { display: flex; gap: 12px; }
.radio-group label { display: flex; align-items: center; gap: 4px; font-size: 13px; cursor: pointer; }
.dialog-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
</style>
