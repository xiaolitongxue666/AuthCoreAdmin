<template>
  <div class="page">
    <header class="page-header">
      <h1>用户管理</h1>
      <div class="header-actions">
        <nav class="nav-links">
          <router-link to="/users" class="nav-link" active-class="active">用户</router-link>
          <router-link to="/apps" class="nav-link" active-class="active">应用</router-link>
          <router-link to="/roles" class="nav-link" active-class="active">角色</router-link>
          <router-link to="/tags" class="nav-link" active-class="active">标签</router-link>
          <router-link to="/labels" class="nav-link" active-class="active">Label</router-link>
          <router-link to="/actions" class="nav-link" active-class="active">动作</router-link>
        </nav>
        <span v-if="store.currentUser" class="user-name">{{ store.currentUser.real_name }}</span>
        <button class="btn btn-text" @click="goProfile">个人</button>
        <button class="btn btn-text" @click="logout">退出</button>
      </div>
    </header>

    <div class="tab-bar">
      <button :class="['tab', { active: activeTab === 'Approved' }]" @click="activeTab = 'Approved'">
        已认证 <span class="tab-count">{{ approvedList.length }}</span>
      </button>
      <button :class="['tab', { active: activeTab === 'Waiting' }]" @click="activeTab = 'Waiting'">
        待审核 <span class="tab-count">{{ waitingList.length }}</span>
      </button>
      <button :class="['tab', { active: activeTab === 'Rejected' }]" @click="activeTab = 'Rejected'">
        已驳回 <span class="tab-count">{{ rejectedList.length }}</span>
      </button>
    </div>

    <div class="search-bar" v-if="activeTab === 'Approved'">
      <input v-model="keyword" placeholder="搜索用户姓名..." class="search-input" />
    </div>

    <div class="list">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="filteredList.length === 0" class="empty">暂无数据</div>
      <template v-for="item in filteredList" :key="item.hty_id">
        <div class="card" :class="{ expanded: openRows.has(item.hty_id) }">
          <div class="card-toggle" @click="toggleRow(item.hty_id)">
            <span class="toggle-icon">{{ openRows.has(item.hty_id) ? '−' : '+' }}</span>
          </div>
          <div class="card-left">
            <div class="avatar">{{ (item.real_name || '?')[0] }}</div>
          </div>
          <div class="card-body">
            <div class="card-name">{{ item.real_name }}<span v-if="item.meta?.nickName" class="nickname"> ({{ item.meta.nickName }})</span></div>
            <div class="card-meta">
              <span class="tag" :class="item.enabled ? 'tag-active' : 'tag-disabled'">
                {{ item.enabled ? '已启用' : '未启用' }}
              </span>
              <span v-if="item.union_id" class="tag tag-unionid">unionid</span>
            </div>
          </div>
          <div class="card-actions">
            <button v-if="!item.enabled" class="btn btn-sm btn-success" @click="toggleEnabled(item, true)">启用</button>
            <button v-if="item.enabled" class="btn btn-sm btn-danger" @click="toggleEnabled(item, false)">禁用</button>
            <template v-if="activeTab === 'Waiting'">
              <button class="btn btn-sm btn-approve" :disabled="!item.enabled" @click="approve(item.hty_id)">通过</button>
              <button class="btn btn-sm btn-reject" :disabled="!item.enabled" @click="startReject(item.hty_id)">驳回</button>
            </template>
          </div>
        </div>
        <!-- Expandable detail: user app infos -->
        <div v-if="openRows.has(item.hty_id)" class="user-detail">
          <div v-if="!item.infos?.length" class="detail-empty">无关联应用</div>
          <div v-for="info in item.infos" :key="info.id" class="app-info-card">
            <div class="app-info-header">
              <span class="app-domain">{{ info.app_id }}</span>
              <span :class="['status-badge', info.is_registered ? 'registered' : 'pending']">
                {{ info.is_registered ? '已认证' : '未认证' }}
              </span>
            </div>
            <div class="app-info-body">
              <div class="info-row"><label>用户名</label><span>{{ info.username || '-' }}</span></div>
              <div class="info-row"><label>角色</label>
                <div class="role-list">
                  <span v-for="r in info.roles" :key="r.hty_role_id" class="mini-tag">{{ r.role_key }}</span>
                  <span v-if="!info.roles?.length" class="text-muted">-</span>
                </div>
              </div>
              <div class="info-row" style="margin-top:4px">
                <button class="btn btn-sm btn-outline" @click="openEditApp(item, info)">编辑角色</button>
                <button class="btn btn-sm btn-outline" @click="resetPwd(item, info)">重置密码</button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Edit app detail modal -->
    <div v-if="showEditApp" class="dialog-overlay" @click.self="closeEditApp">
      <div class="dialog">
        <h3>编辑角色 | {{ editForm.app_id }}</h3>
        <div class="form-group">
          <label class="form-label">认证状态</label>
          <div class="radio-group">
            <label><input type="radio" v-model="editForm.is_registered" :value="true" /> 已认证</label>
            <label><input type="radio" v-model="editForm.is_registered" :value="false" /> 未认证</label>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">角色</label>
          <div class="checkbox-group">
            <label v-for="role in allRoles" :key="role.hty_role_id" class="checkbox-label">
              <input type="checkbox" :value="role.hty_role_id"
                :checked="editRoleIds.has(role.hty_role_id)"
                @change="toggleEditRole(role.hty_role_id)" />
              {{ role.role_key }}
            </label>
          </div>
        </div>
        <div class="dialog-actions">
          <button class="btn" @click="closeEditApp">取消</button>
          <button class="btn btn-primary" @click="submitEditApp">保存</button>
        </div>
      </div>
    </div>

    <!-- Reject dialog -->
    <div v-if="showRejectDialog" class="dialog-overlay" @click.self="cancelReject">
      <div class="dialog">
        <h3>请输入驳回原因</h3>
        <textarea v-model="rejectReason" rows="3" placeholder="驳回原因..." class="dialog-textarea"></textarea>
        <div class="dialog-actions">
          <button class="btn" @click="cancelReject">取消</button>
          <button class="btn btn-primary" @click="confirmReject" :disabled="!rejectReason.trim()">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import useUser from '@/store/user'

const { store, read, getAllUsers, approveUser, rejectUser, logout } = useUser()
const router = useRouter()
import request from '@/utils/request'
import useRole from '@/store/role'

const { store: roleStore, fetchAll: fetchRoles } = useRole()
const allRoles = computed(() => roleStore.list)

const showEditApp = ref(false)
const editForm = reactive<{ hty_id: string; user_app_info_id: string; app_id: string; is_registered: boolean }>({
  hty_id: '', user_app_info_id: '', app_id: '', is_registered: true,
})
const editRoleIds = ref(new Set<string>())

function openEditApp(user: HtyUser, info: HtyUserApp) {
  editForm.hty_id = user.hty_id
  editForm.user_app_info_id = info.id
  editForm.app_id = info.app_id || ''
  editForm.is_registered = info.is_registered || false
  editRoleIds.value = new Set((info.roles || []).map(r => r.hty_role_id))
  fetchRoles()
  showEditApp.value = true
}
function closeEditApp() {
  showEditApp.value = false
}
function toggleEditRole(roleId: string) {
  const s = editRoleIds.value
  if (s.has(roleId)) s.delete(roleId)
  else s.add(roleId)
  editRoleIds.value = new Set(s)
}
async function submitEditApp() {
  const selectedRoles = roleStore.list.filter(r => editRoleIds.value.has(r.hty_role_id))
  // Convert to the format create_or_update_userinfo_with_roles expects
  const payload = {
    id: editForm.user_app_info_id,
    hty_id: editForm.hty_id,
    app_id: editForm.app_id,
    is_registered: editForm.is_registered,
    roles: selectedRoles.map(r => ({ hty_role_id: r.hty_role_id, role_key: r.role_key })),
  }
  const { r } = await request({
    url: '/api/v1/uc/create_or_update_userinfo_with_roles',
    method: 'POST',
    data: payload,
  })
  if (r) {
    showEditApp.value = false
    await fetchData()
  }
}

async function toggleEnabled(user: HtyUser, enabled: boolean) {
  const { r } = await request({
    url: '/api/v1/uc/create_or_update_user_with_info',
    method: 'POST',
    data: { hty_id: user.hty_id, enabled },
  })
  if (r) await fetchData()
}

async function resetPwd(user: HtyUser, info: HtyUserApp) {
  if (!confirm(`确认重置 ${user.real_name} 在 ${info.app_id} 的密码为 123456？`)) return
  const payload = { id: info.id, hty_id: user.hty_id, app_id: info.app_id, password: '123456' }
  const { r } = await request({
    url: '/api/v1/uc/create_or_update_userinfo_with_roles',
    method: 'POST',
    data: payload,
  })
  if (r) await fetchData()
}
const activeTab = ref('Approved')
const keyword = ref('')
const loading = ref(false)
const showRejectDialog = ref(false)
const rejectReason = ref('')
const rejectTargetId = ref('')
const openRows = ref(new Set<string>())

function toggleRow(id: string) {
  const s = openRows.value
  if (s.has(id)) s.delete(id)
  else s.add(id)
  // Trigger reactivity by replacing the Set
  openRows.value = new Set(s)
}

const approvedList = computed(() => store.users.filter(x => x.is_registered))
const waitingList = computed(() => store.users.filter(x => !x.is_registered && !x.reject_reason))
const rejectedList = computed(() => store.users.filter(x => !x.is_registered && !!x.reject_reason))

const filteredList = computed(() => {
  let list = activeTab.value === 'Approved' ? approvedList.value
    : activeTab.value === 'Waiting' ? waitingList.value
    : rejectedList.value
  if (keyword.value && activeTab.value === 'Approved') {
    list = list.filter(x => x.real_name?.includes(keyword.value))
  }
  return list
})

async function fetchData() {
  loading.value = true
  await getAllUsers()
  loading.value = false
}

async function approve(id: string) {
  await approveUser(id)
}

function startReject(id: string) {
  rejectTargetId.value = id
  rejectReason.value = ''
  showRejectDialog.value = true
}

function cancelReject() {
  showRejectDialog.value = false
  rejectTargetId.value = ''
  rejectReason.value = ''
}

async function confirmReject() {
  if (!rejectReason.value.trim()) return
  await rejectUser(rejectTargetId.value, rejectReason.value.trim())
  cancelReject()
}

function goProfile() {
  router.push('/profile')
}

onMounted(async () => {
  if (!store.currentUser) {
    // Try to load from saved token first
    const ok = await read()
    if (!ok) {
      router.push('/login')
      return
    }
  }
  fetchData()
})
</script>

<style scoped>
.page { max-width: 800px; margin: 0 auto; padding: 0 16px; }
.page-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; }
.page-header h1 { font-size: 20px; }
.header-actions { display: flex; align-items: center; gap: 8px; }
.user-name { color: #666; font-size: 14px; }
.btn-text { background: none; border: none; color: #1a73e8; cursor: pointer; font-size: 14px; padding: 4px 8px; }
.nav-links { display: flex; gap: 4px; margin-right: 12px; }
.nav-link { padding: 6px 14px; border-radius: 6px; font-size: 13px; color: #666; text-decoration: none; }
.nav-link.active { background: #667eea; color: white; }
.tab-bar { display: flex; gap: 8px; margin-bottom: 12px; }
.tab { padding: 8px 20px; border: 1px solid #ddd; border-radius: 20px; background: white; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 6px; }
.tab.active { background: #667eea; color: white; border-color: #667eea; }
.tab-count { font-size: 12px; opacity: 0.8; }
.search-bar { margin-bottom: 12px; }
.search-input { width: 100%; padding: 10px 16px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; }
.search-input:focus { border-color: #667eea; }
.list { display: flex; flex-direction: column; gap: 8px; padding-bottom: 20px; }
.card { background: white; border-radius: 10px; padding: 14px; display: flex; align-items: center; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.card-left { flex-shrink: 0; }
.avatar { width: 44px; height: 44px; border-radius: 50%; background: #667eea; color: white; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 600; }
.card-body { flex: 1; min-width: 0; }
.card-name { font-size: 15px; font-weight: 500; }
.nickname { color: #999; font-size: 13px; }
.card-meta { margin-top: 4px; }
.tag { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 12px; }
.tag-active { background: #e8f5e9; color: #2e7d32; }
.tag-disabled { background: #f5f5f5; color: #999; }
.card-actions { display: flex; gap: 6px; flex-shrink: 0; }
.btn { padding: 8px 16px; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; }
.btn-sm { padding: 6px 14px; font-size: 12px; }
.btn-primary { background: #667eea; color: white; }
.btn-approve { background: #e8f5e9; color: #2e7d32; }
.btn-reject { background: #fce4ec; color: #c62828; }
.loading, .empty { text-align: center; padding: 40px; color: #999; }

.dialog-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
.dialog { background: white; border-radius: 12px; padding: 24px; width: 90%; max-width: 400px; }
.dialog h3 { font-size: 16px; margin-bottom: 12px; }
.dialog-textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; resize: vertical; font-family: inherit; outline: none; }
.dialog-textarea:focus { border-color: #667eea; }
.dialog-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }

/* Expandable user detail */
.card-toggle { flex-shrink: 0; cursor: pointer; width: 24px; text-align: center; color: #999; font-size: 18px; font-weight: 600; user-select: none; }
.card-toggle:hover { color: #667eea; }
.card.expanded { border-bottom-left-radius: 0; border-bottom-right-radius: 0; }
.user-detail { background: #fafafa; border: 1px solid #eee; border-top: none; border-radius: 0 0 10px 10px; padding: 12px 16px; margin-top: -8px; margin-bottom: 8px; }
.detail-empty { text-align: center; padding: 16px; color: #999; font-size: 13px; }
.app-info-card { background: white; border-radius: 8px; padding: 10px 14px; margin-bottom: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
.app-info-card:last-child { margin-bottom: 0; }
.app-info-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.app-domain { font-size: 13px; font-weight: 600; color: #333; font-family: monospace; }
.status-badge { padding: 1px 8px; border-radius: 8px; font-size: 11px; }
.status-badge.registered { background: #e8f5e9; color: #2e7d32; }
.status-badge.pending { background: #fff3e0; color: #e65100; }
.app-info-body { }
.info-row { display: flex; gap: 8px; font-size: 12px; margin-bottom: 4px; }
.info-row label { color: #999; min-width: 40px; flex-shrink: 0; }
.role-list { display: flex; gap: 3px; flex-wrap: wrap; }
.mini-tag { padding: 1px 6px; background: #e3f2fd; color: #1565c0; border-radius: 6px; font-size: 11px; }
.tag-unionid { background: #f3e5f5; color: #7b1fa2; }
.btn-outline { background: white; border: 1px solid #ddd; padding: 4px 10px; font-size: 11px; border-radius: 4px; cursor: pointer; color: #666; }
.btn-outline:hover { background: #f5f5f5; }
.checkbox-group { display: flex; gap: 8px; flex-wrap: wrap; }
.checkbox-label { display: flex; align-items: center; gap: 3px; font-size: 12px; cursor: pointer; }
.form-group { margin-bottom: 12px; }
.form-label { display: block; font-size: 12px; font-weight: 600; color: #333; margin-bottom: 4px; }
.radio-group { display: flex; gap: 12px; }
.radio-group label { display: flex; align-items: center; gap: 4px; font-size: 12px; cursor: pointer; }
.text-muted { color: #999; }
</style>
