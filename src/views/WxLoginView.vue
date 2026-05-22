<template>
  <div class="flex items-center justify-center min-h-screen text-text-muted">
    <p>{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import useUser from '@/store/user'
import { loginPath } from '@/utils/index'

const { wx_login } = useUser()
const message = ref('登录中...')

onMounted(async () => {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  if (!code) {
    message.value = '缺少微信授权 code'
    setTimeout(() => { window.location.href = loginPath() }, 1500)
    return
  }

  const result = await wx_login(code)
  if (result.ok) {
    window.location.replace(`${import.meta.env.BASE_URL || '/'}`.replace(/\/?$/, '/'))
    return
  }

  message.value = result.error || '登录失败'
  setTimeout(() => { window.location.href = loginPath() }, 2000)
})
</script>
