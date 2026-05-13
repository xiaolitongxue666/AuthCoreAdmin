<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-xl font-semibold">用户管理</h1>
    </div>

    <div class="flex gap-2 mb-3">
      <button :class="['px-4 py-1.5 rounded-full text-sm border border-border bg-surface cursor-pointer flex items-center gap-1.5',
        activeTab === 'Approved' ? '!bg-primary !text-white !border-primary' : '']"
        @click="activeTab = 'Approved'">
        已认证 <span class="opacity-80 text-xs">{{ approvedList.length }}</span>
      </button>
      <button :class="['px-4 py-1.5 rounded-full text-sm border border-border bg-surface cursor-pointer flex items-center gap-1.5',
        activeTab === 'Waiting' ? '!bg-primary !text-white !border-primary' : '']"
        @click="activeTab = 'Waiting'">
        待审核 <span class="opacity-80 text-xs">{{ waitingList.length }}</span>
      </button>
      <button :class="['px-4 py-1.5 rounded-full text-sm border border-border bg-surface cursor-pointer flex items-center gap-1.5',
        activeTab === 'Rejected' ? '!bg-primary !text-white !border-primary' : '']"
        @click="activeTab = 'Rejected'">
        已驳回 <span class="opacity-80 text-xs">{{ rejectedList.length }}</span>
      </button>
    </div>

    <div v-if="activeTab === 'Approved'" class="mb-3">
      <input v-model="keyword" placeholder="搜索用户姓名..."
        class="w-full border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary" />
    </div>

    <div class="flex gap-2 mb-3">
      <span class="text-xs font-semibold text-text-muted self-center">排序:</span>
      <button :class="['px-3 py-1 rounded text-xs border border-border bg-surface cursor-pointer',
        sortBy === 'name' ? '!bg-primary !text-white !border-primary' : '']"
        @click="toggleSort('name')">
        姓名 {{ sortBy === 'name' ? (sortAsc ? '↑' : '↓') : '' }}
      </button>
      <button :class="['px-3 py-1 rounded text-xs border border-border bg-surface cursor-pointer',
        sortBy === 'created_at' ? '!bg-primary !text-white !border-primary' : '']"
        @click="toggleSort('created_at')">
        创建时间 {{ sortBy === 'created_at' ? (sortAsc ? '↑' : '↓') : '' }}
      </button>
      <button :class="['px-3 py-1 rounded text-xs border border-border bg-surface cursor-pointer',
        sortBy === 'status' ? '!bg-primary !text-white !border-primary' : '']"
        @click="toggleSort('status')">
        审核状态 {{ sortBy === 'status' ? (sortAsc ? '↑' : '↓') : '' }}
      </button>
    </div>

    <div class="flex flex-col gap-2 pb-4">
      <div v-if="loading" class="text-center py-10 text-text-muted">加载中...</div>
      <div v-else-if="filteredList.length === 0" class="text-center py-10 text-text-muted">暂无数据</div>
      <template v-for="item in filteredList" :key="item.hty_id">
        <div :class="['bg-surface rounded-lg shadow-sm p-3.5 flex items-center gap-3',
          openRows.has(item.hty_id) ? '!rounded-b-none' : '']">
          <span class="flex-shrink-0 w-6 text-center cursor-pointer text-text-muted text-lg font-semibold select-none hover:text-primary"
            @click="toggleRow(item.hty_id)">{{ openRows.has(item.hty_id) ? '−' : '+' }}</span>
          <div class="flex-shrink-0 w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center text-lg font-semibold">
            {{ (item.real_name || '?')[0] }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium">{{ item.real_name }}<span v-if="item.meta?.nickName" class="text-text-muted text-xs"> ({{ item.meta.nickName }})</span></div>
            <div class="mt-1 flex gap-1.5">
              <span :class="['inline-block px-2 py-0.5 rounded-full text-xs',
                item.enabled ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500']">
                {{ item.enabled ? '已启用' : '未启用' }}
              </span>
              <span v-if="item.union_id" class="inline-block px-2 py-0.5 rounded-full text-xs bg-purple-50 text-purple-700">unionid</span>
            </div>
          </div>
          <div class="flex-shrink-0 flex gap-1.5">
            <button v-if="!item.enabled" class="bg-green-50 text-green-700 px-3 py-1.5 rounded text-xs cursor-pointer border-0" @click="toggleEnabled(item, true)">启用</button>
            <button v-if="item.enabled" class="bg-red-50 text-red-600 px-3 py-1.5 rounded text-xs cursor-pointer border-0" @click="toggleEnabled(item, false)">禁用</button>
            <template v-if="activeTab === 'Waiting'">
              <button class="bg-green-50 text-green-700 px-3 py-1.5 rounded text-xs cursor-pointer border-0" :disabled="!item.enabled" @click="approve(item.hty_id)">通过</button>
              <button class="bg-red-50 text-red-600 px-3 py-1.5 rounded text-xs cursor-pointer border-0" :disabled="!item.enabled" @click="startReject(item.hty_id)">驳回</button>
            </template>
          </div>
        </div>
        <!-- Expandable detail -->
        <div v-if="openRows.has(item.hty_id)" class="bg-gray-50 border border-border border-t-0 rounded-b-lg px-4 py-3 -mt-1.5 mb-1.5">
          <div v-if="!item.infos?.length" class="text-center py-4 text-text-muted text-xs">无关联应用</div>
          <div v-for="info in item.infos" :key="info.id" class="bg-surface rounded-lg p-2.5 mb-2 shadow-sm last:mb-0">
            <div class="flex justify-between items-center mb-1.5">
              <span class="text-xs font-semibold text-text font-mono">{{ appNameMap[info.app_id] || info.app_id }}</span>
              <span :class="['px-2 py-0.5 rounded-full text-xs',
                info.is_registered ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-800']">
                {{ info.is_registered ? '已认证' : '未认证' }}
              </span>
            </div>
            <div class="flex gap-2 text-xs mb-1">
              <span class="text-text-muted flex-shrink-0">用户名</span>
              <span>{{ info.username || '-' }}</span>
            </div>
            <div class="flex gap-2 text-xs mb-1.5">
              <span class="text-text-muted flex-shrink-0">角色</span>
              <div class="flex gap-1 flex-wrap">
                <span v-for="r in info.roles" :key="r.hty_role_id" class="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{{ r.role_key }}</span>
                <span v-if="!info.roles?.length" class="text-text-muted">-</span>
              </div>
            </div>
            <div class="flex gap-1.5 mt-1">
              <button class="bg-white border border-border px-2.5 py-1 text-xs rounded cursor-pointer text-text-muted hover:bg-gray-50" @click="openEditApp(item, info)">编辑角色</button>
              <button class="bg-white border border-border px-2.5 py-1 text-xs rounded cursor-pointer text-text-muted hover:bg-gray-50" @click="resetPwd(item, info)">重置密码</button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Edit app detail modal -->
    <div v-if="showEditApp" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="closeEditApp">
      <div class="bg-surface rounded-xl p-6 w-[90%] max-w-md">
        <h3 class="text-base font-semibold mb-3">编辑角色 | {{ appNameMap[editForm.app_id] || editForm.app_id }}</h3>
        <div class="mb-3">
          <label class="block text-xs font-semibold text-text mb-1">认证状态</label>
          <div class="flex gap-3 text-xs">
            <label class="flex items-center gap-1 cursor-pointer"><input type="radio" v-model="editForm.is_registered" :value="true" /> 已认证</label>
            <label class="flex items-center gap-1 cursor-pointer"><input type="radio" v-model="editForm.is_registered" :value="false" /> 未认证</label>
          </div>
        </div>
        <div class="mb-3">
          <label class="block text-xs font-semibold text-text mb-1">角色</label>
          <div class="flex gap-2 flex-wrap text-xs">
            <label v-for="role in allRoles" :key="role.hty_role_id" class="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" :value="role.hty_role_id"
                :checked="editRoleIds.has(role.hty_role_id)"
                @change="toggleEditRole(role.hty_role_id)" />
              {{ role.role_key }}
            </label>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-3">
          <button class="bg-gray-100 text-text px-4 py-2 rounded text-xs cursor-pointer border-0" @click="closeEditApp">取消</button>
          <button class="bg-primary text-white px-4 py-2 rounded text-xs cursor-pointer border-0" @click="submitEditApp">保存</button>
        </div>
      </div>
    </div>

    <!-- Reject dialog -->
    <div v-if="showRejectDialog" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="cancelReject">
      <div class="bg-surface rounded-xl p-6 w-[90%] max-w-sm">
        <h3 class="text-base font-semibold mb-3">请输入驳回原因</h3>
        <textarea v-model="rejectReason" rows="3" placeholder="驳回原因..."
          class="w-full border border-border rounded-lg p-2.5 text-sm resize-y outline-none focus:border-primary font-inherit"></textarea>
        <div class="flex justify-end gap-2 mt-3">
          <button class="bg-gray-100 text-text px-4 py-2 rounded text-xs cursor-pointer border-0" @click="cancelReject">取消</button>
          <button class="bg-primary text-white px-4 py-2 rounded text-xs cursor-pointer border-0" :disabled="!rejectReason.trim()" @click="confirmReject">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import useUser from '@/store/user'

const { store, read, getAllUsers, approveUser, rejectUser } = useUser()
const router = useRouter()
import request from '@/utils/request'
import useRole from '@/store/role'
import useApp from '@/store/app'

const { store: roleStore, fetchAll: fetchRoles } = useRole()
const allRoles = computed(() => roleStore.list)
const { store: appStore, fetchAll: fetchApps } = useApp()

const appNameMap = computed(() => {
  const map: Record<string, string> = {}
  for (const app of appStore.list) {
    map[app.app_id] = app.app_desc || app.domain || app.app_id
  }
  return map
})

const showEditApp = ref(false)
const editForm = reactive<{ hty_id: string; user_app_info_id: string; app_id: string; is_registered: boolean }>({
  hty_id: '', user_app_info_id: '', app_id: '', is_registered: true,
})
const editRoleIds = ref(new Set<string>())

function openEditApp(user: any, info: any) {
  editForm.hty_id = user.hty_id
  editForm.user_app_info_id = info.id
  editForm.app_id = info.app_id || ''
  editForm.is_registered = info.is_registered || false
  editRoleIds.value = new Set((info.roles || []).map((r: any) => r.hty_role_id))
  fetchRoles()
  showEditApp.value = true
}
function closeEditApp() { showEditApp.value = false }
function toggleEditRole(roleId: string) {
  const s = editRoleIds.value
  if (s.has(roleId)) s.delete(roleId)
  else s.add(roleId)
  editRoleIds.value = new Set(s)
}
async function submitEditApp() {
  const selectedRoles = roleStore.list.filter(r => editRoleIds.value.has(r.hty_role_id))
  const payload = {
    id: editForm.user_app_info_id, hty_id: editForm.hty_id,
    app_id: editForm.app_id, is_registered: editForm.is_registered,
    roles: selectedRoles.map(r => ({ hty_role_id: r.hty_role_id, role_key: r.role_key })),
  }
  const { r } = await request({ url: '/api/v1/uc/create_or_update_userinfo_with_roles', method: 'POST', data: payload })
  if (r) { showEditApp.value = false; await fetchData() }
}

async function toggleEnabled(user: any, enabled: boolean) {
  const { r } = await request({
    url: '/api/v1/uc/create_or_update_user_with_info', method: 'POST',
    data: { hty_id: user.hty_id, enabled },
  })
  if (r) await fetchData()
}

async function resetPwd(user: any, info: any) {
  if (!confirm(`确认重置 ${user.real_name} 在 ${info.app_id} 的密码为 123456？`)) return
  const payload = { id: info.id, hty_id: user.hty_id, app_id: info.app_id, password: '123456' }
  const { r } = await request({ url: '/api/v1/uc/create_or_update_userinfo_with_roles', method: 'POST', data: payload })
  if (r) await fetchData()
}

const activeTab = ref('Approved')
const keyword = ref('')
const loading = ref(false)
const showRejectDialog = ref(false)
const rejectReason = ref('')
const rejectTargetId = ref('')
const openRows = ref(new Set<string>())
const sortBy = ref<'name' | 'created_at' | 'status'>('name')
const sortAsc = ref(true)

function toggleSort(field: 'name' | 'created_at' | 'status') {
  if (sortBy.value === field) {
    sortAsc.value = !sortAsc.value
  } else {
    sortBy.value = field
    sortAsc.value = true
  }
}

function toggleRow(id: string) {
  const s = openRows.value
  if (s.has(id)) s.delete(id)
  else s.add(id)
  openRows.value = new Set(s)
}

const approvedList = computed(() => store.users.filter((x: any) => x.is_registered))
const waitingList = computed(() => store.users.filter((x: any) => !x.is_registered && !x.reject_reason))
const rejectedList = computed(() => store.users.filter((x: any) => !x.is_registered && !!x.reject_reason))

const filteredList = computed(() => {
  let list = activeTab.value === 'Approved' ? approvedList.value
    : activeTab.value === 'Waiting' ? waitingList.value : rejectedList.value
  if (keyword.value && activeTab.value === 'Approved') {
    list = list.filter((x: any) => x.real_name?.includes(keyword.value))
  }
  // apply sorting
  const sorted = [...list]
  const dir = sortAsc.value ? 1 : -1
  switch (sortBy.value) {
    case 'name':
      sorted.sort((a, b) => dir * (a.real_name || '').localeCompare(b.real_name || '', 'zh-CN'))
      break
    case 'created_at':
      sorted.sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0
        return dir * (ta - tb)
      })
      break
    case 'status':
      sorted.sort((a, b) => {
        const scoreA = (a.enabled ? 2 : 0) + (a.is_registered ? 1 : 0)
        const scoreB = (b.enabled ? 2 : 0) + (b.is_registered ? 1 : 0)
        return dir * (scoreB - scoreA)
      })
      break
  }
  return sorted
})

async function fetchData() {
  loading.value = true
  await Promise.all([getAllUsers(), fetchApps()])
  loading.value = false
}

async function approve(id: string) { await approveUser(id) }
function startReject(id: string) { rejectTargetId.value = id; rejectReason.value = ''; showRejectDialog.value = true }
function cancelReject() { showRejectDialog.value = false; rejectTargetId.value = ''; rejectReason.value = '' }
async function confirmReject() {
  if (!rejectReason.value.trim()) return
  await rejectUser(rejectTargetId.value, rejectReason.value.trim())
  cancelReject()
}

onMounted(async () => {
  if (!store.currentUser) {
    const ok = await read()
    if (!ok) { router.push('/login'); return }
  }
  fetchData()
})
</script>
