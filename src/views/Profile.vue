<template>
  <div>
    <div class="flex items-center justify-between px-4 py-4" style="max-width: 800px; margin: 0 auto;">
      <button class="bg-transparent border-0 text-primary cursor-pointer text-sm hover:underline px-2 py-1" @click="goBack">← 返回</button>
      <h1 class="text-xl font-semibold">个人中心</h1>
      <button class="bg-transparent border-0 text-primary cursor-pointer text-sm hover:underline px-2 py-1" @click="logout">退出</button>
    </div>

    <div v-if="store.currentUser" class="bg-surface rounded-xl p-8 text-center shadow-sm" style="max-width: 800px; margin: 0 auto 16px;">
      <div class="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-semibold mx-auto mb-3">{{ (store.currentUser.real_name || '?')[0] }}</div>
      <h2 class="text-xl mb-1">{{ store.currentUser.real_name }}</h2>
      <p class="text-text-muted text-sm mb-1">ID: {{ store.currentUser.hty_id }}</p>
      <p class="text-text-muted text-sm mb-1" v-if="store.currentUser.union_id">union_id: {{ store.currentUser.union_id }}</p>

      <div class="text-left mt-6 pt-4 border-t border-border">
        <h3 class="text-sm text-text-muted mb-2 font-semibold">角色</h3>
        <div class="flex gap-1.5 flex-wrap">
          <span v-for="role in store.roles" :key="role.role_key" class="px-2.5 py-1 rounded-full text-xs bg-blue-50 text-blue-700">
            {{ role.role_name || role.role_key }}
          </span>
          <span v-if="store.roles.length === 0" class="text-gray-300 text-xs">无角色</span>
        </div>
      </div>

      <div class="text-left mt-6 pt-4 border-t border-border">
        <h3 class="text-sm text-text-muted mb-2 font-semibold">标签</h3>
        <div class="flex gap-1.5 flex-wrap">
          <span v-for="tag in store.currentUser.tags || []" :key="tag.tag_id" class="px-2.5 py-1 rounded-full text-xs bg-purple-50 text-purple-700">
            {{ tag.tag_name }}
          </span>
          <span v-if="!store.currentUser.tags?.length" class="text-gray-300 text-xs">无标签</span>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-10 text-text-muted">加载中...</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import useUser from '@/store/user'

const { store, read, logout } = useUser()
const router = useRouter()

function goBack() {
  router.push('/')
}

onMounted(async () => {
  if (!store.currentUser) {
    const ok = await read()
    if (!ok) {
      router.push('/login')
    }
  }
})
</script>
