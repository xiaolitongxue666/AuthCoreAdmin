<template>
  <div class="flex items-center justify-center min-h-screen" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
    <div class="bg-surface rounded-2xl p-10 shadow-xl text-center w-[400px]">
      <h1 class="text-2xl mb-2 text-text font-semibold">AuthCore 管理后台</h1>
      <p v-if="showWxQr" class="text-text-muted mb-6 text-sm">请使用微信扫码登录（需管理员角色）</p>
      <p v-else class="text-text-muted mb-6 text-sm">用户名密码登录</p>

      <div v-if="showWxQr" id="login-qr" class="flex justify-center my-4 min-h-[400px]"></div>

      <template v-if="showPasswordLogin">
        <div v-if="showWxQr" class="flex items-center gap-3 text-xs text-gray-300 my-4">
          <span class="flex-1 border-t border-gray-200"></span>
          <span>或</span>
          <span class="flex-1 border-t border-gray-200"></span>
        </div>
        <div class="flex flex-col gap-3">
          <input v-if="showDevUnionId" v-model="unionid" placeholder="union_id（开发模式）"
            class="border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary" />
          <div v-if="showDevUnionId" class="flex items-center gap-3 text-xs text-gray-300">
            <span class="flex-1 border-t border-gray-200"></span>
            <span>或</span>
            <span class="flex-1 border-t border-gray-200"></span>
          </div>
          <input v-model="username" placeholder="用户名"
            class="border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary" />
          <input v-model="password" type="password" placeholder="密码"
            class="border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary" />
          <button @click="submit" :disabled="!canLogin"
            class="bg-primary text-white rounded-lg px-6 py-2.5 text-sm cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-primary-dark">登录</button>
        </div>
      </template>

      <p v-if="error" class="text-danger mt-3 text-sm">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import useUser from '@/store/user'
import { mountWxLoginQr } from '@/utils/wxLogin'

const { loginWithPassword, login } = useUser()
const router = useRouter()
const unionid = ref('')
const username = ref('')
const password = ref('')
const error = ref('')

const showWxQr = ref(!!WX_APP)
const showPasswordLogin = ref(typeof ENABLE_PASSWORD_LOGIN === 'undefined' || ENABLE_PASSWORD_LOGIN !== 'false')
const showDevUnionId = ref(typeof ENABLE_DEV_UNIONID_LOGIN === 'undefined' || ENABLE_DEV_UNIONID_LOGIN !== 'false')

const canLogin = computed(() =>
  unionid.value.trim() || (username.value.trim() && password.value.trim()),
)

onMounted(() => {
  if (showWxQr.value) {
    nextTick(() => mountWxLoginQr('login-qr'))
  }
})

async function submit() {
  error.value = ''
  let result = { ok: false, error: '登录失败，请检查用户名和密码' }
  try {
    if (unionid.value.trim()) {
      result = await login(unionid.value.trim())
    } else {
      result = await loginWithPassword(username.value, password.value)
    }
    if (result.ok) {
      await router.push('/')
    } else {
      error.value = result.error || '登录失败，请检查用户名和密码'
    }
  } catch (e: any) {
    error.value = '登录异常: ' + (e?.message || e)
  }
}
</script>
