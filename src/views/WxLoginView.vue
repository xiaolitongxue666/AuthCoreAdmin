<template>
  <div class="flex flex-col items-center justify-center min-h-screen text-text-muted gap-4 px-6 text-center">
    <p>{{ message }}</p>
    <p v-if="debugHint" class="text-xs text-gray-400">{{ debugHint }}</p>
    <button
      v-if="showBack"
      class="text-primary hover:underline bg-transparent border-0 cursor-pointer text-sm"
      @click="goLogin"
    >返回登录页</button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import useUser, { type LoginResult } from '@/store/user'
import { loginPath, getToken } from '@/utils/index'
import { authLog, authWarn, tokenSnapshot } from '@/utils/authLog'
import { navigateTop, navigateTopHref, breakoutIframeIfNeeded } from '@/utils/navigateTop'

const { wx_login } = useUser()
const message = ref('登录中...')
const debugHint = ref('')
const showBack = ref(false)

const homePath = `${import.meta.env.BASE_URL || '/'}`.replace(/\/?$/, '/')

/** 同一 code 并发/重复 mount 时共享 Promise，避免第二次 mount 抢跑跳首页 */
const inflightByCode = new Map<string, Promise<LoginResult>>()

function goLogin() {
  navigateTopHref(loginPath())
}

function runWxLogin(code: string): Promise<LoginResult> {
  let pending = inflightByCode.get(code)
  if (!pending) {
    authLog('wx-login: start wx_login', { codePrefix: code.slice(0, 8) + '…', ...tokenSnapshot() })
    pending = wx_login(code).finally(() => {
      inflightByCode.delete(code)
    })
    inflightByCode.set(code, pending)
  } else {
    authLog('wx-login: reuse inflight wx_login', { codePrefix: code.slice(0, 8) + '…' })
  }
  return pending
}

onMounted(async () => {
  authLog('wx-login: mounted', {
    href: window.location.href,
    inIframe: window.top !== window.self,
    ...tokenSnapshot(),
  })

  // 微信扫码回调常在 iframe 内，302 后仍嵌套 → 必须在顶层窗口处理 OAuth
  if (breakoutIframeIfNeeded()) {
    message.value = '正在跳转到管理后台…'
    return
  }

  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  if (!code) {
    authWarn('wx-login: missing code')
    message.value = '缺少微信授权 code'
    showBack.value = true
    return
  }

  const dedupeKey = `wx_oauth_code:${code}`
  const dedupeStatus = sessionStorage.getItem(dedupeKey)

  if (dedupeStatus === 'ok' && getToken()) {
    authLog('wx-login: dedupe ok + token present → home')
    navigateTop(homePath)
    return
  }

  if (dedupeStatus === 'fail') {
    const prevErr = sessionStorage.getItem(`${dedupeKey}:err`) || '登录失败（授权码已使用）'
    authWarn('wx-login: dedupe fail', { error: prevErr, ...tokenSnapshot() })
    message.value = prevErr
    debugHint.value = '同一授权码不可重复使用，请返回登录页重新扫码'
    showBack.value = true
    return
  }

  if (dedupeStatus === 'pending') {
    authLog('wx-login: dedupe pending, wait inflight')
    message.value = '登录处理中，请稍候…'
  }

  sessionStorage.setItem(dedupeKey, 'pending')

  const result = await runWxLogin(code)
  authLog('wx-login: wx_login result', { ok: result.ok, error: result.error, ...tokenSnapshot() })

  if (result.ok) {
    sessionStorage.setItem(dedupeKey, 'ok')
    sessionStorage.removeItem(`${dedupeKey}:err`)
    authLog('wx-login: success → top navigate /')
    navigateTop(homePath)
    return
  }

  sessionStorage.setItem(dedupeKey, 'fail')
  sessionStorage.setItem(`${dedupeKey}:err`, result.error || '登录失败')
  authWarn('wx-login: failed', result.error)
  message.value = result.error || '登录失败'
  debugHint.value = '请打开控制台筛选 authcoreadmin|auth 查看详细日志'
  showBack.value = true
})
</script>
