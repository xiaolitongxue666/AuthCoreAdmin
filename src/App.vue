<template>
  <div id="app-root">
    <!-- Login page: no nav -->
    <router-view v-if="isLoginPage" />

    <!-- Authenticated pages: unified nav header -->
    <template v-else>
      <header class="bg-white border-b border-border">
        <div class="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
          <div class="flex items-center gap-6">
            <span class="font-semibold text-sm text-text">AuthCore 管理后台</span>
            <nav class="flex gap-1">
              <router-link
                v-for="r in navRoutes"
                :key="r.path"
                :to="r.path"
                class="px-3 py-1.5 rounded text-sm text-text-muted hover:bg-gray-100 no-underline"
                active-class="!bg-primary !text-white"
              >{{ r.name }}</router-link>
            </nav>
          </div>
          <div class="flex items-center gap-3 text-sm">
            <span class="text-text-muted">
              v20260513
              <template v-if="store.currentUser?.real_name"> | {{ store.currentUser.real_name }}</template>
            </span>
            <button class="text-primary hover:underline bg-transparent border-0 cursor-pointer text-sm" @click="logout">退出</button>
          </div>
        </div>
      </header>
      <main class="max-w-6xl mx-auto p-4">
        <router-view />
      </main>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import useUser from '@/store/user'

const { store, read, logout, hasAdminAccess } = useUser()
const route = useRoute()
const router = useRouter()

const isLoginPage = computed(() => route.name === 'login' || route.name === 'wx-login')

const navRoutes = [
  { path: '/users', name: '用户管理' },
  { path: '/apps', name: '应用管理' },
  { path: '/roles', name: '角色管理' },
  { path: '/tags', name: '标签管理' },
  { path: '/labels', name: 'Label' },
  { path: '/actions', name: '动作管理' },
  { path: '/profile', name: '个人中心' },
]

onMounted(async () => {
  console.debug('[authcoreadmin] deploy_ver=20260522.002')
  if (!store.currentUser && route.name !== 'login' && route.name !== 'wx-login') {
    const ok = await read()
    if (!ok) {
      router.push('/login')
      return
    }
    if (!hasAdminAccess()) {
      logout()
    }
  }
})
</script>
