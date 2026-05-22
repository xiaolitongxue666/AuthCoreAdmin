import { reactive } from 'vue'
import request from '@/utils/request'
import { saveToken, clearTokens, HtySudoToken, loginPath } from '@/utils/index'
import type { HtyUser, HtyRole, HtyApp } from '@/types'

interface UserState {
  currentUser: HtyUser | null
  currentRole?: string
  roles: HtyRole[]
  loading: boolean
  users: HtyUser[]
}

export type LoginResult = { ok: boolean; error?: string }

const store = reactive<UserState>({
  currentUser: null,
  roles: [],
  loading: false,
  users: [],
})

function adminRoleKeys(): string[] {
  const raw = typeof ADMIN_ALLOWED_ROLE_KEYS === 'string' ? ADMIN_ALLOWED_ROLE_KEYS : 'ADMIN'
  return raw.split(',').map((k) => k.trim()).filter(Boolean)
}

function hasAdminAccess(): boolean {
  const allowed = adminRoleKeys()
  return store.roles.some((r) => allowed.includes(r.role_key))
}

async function finalizeAdminLogin(): Promise<LoginResult> {
  const sudoOk = await sudo()
  if (!sudoOk) {
    clearTokens()
    return { ok: false, error: '无法获取管理员权限（sudo 失败）' }
  }
  const readOk = await read()
  if (!readOk) {
    clearTokens()
    return { ok: false, error: '无法读取用户信息' }
  }
  if (!hasAdminAccess()) {
    clearTokens()
    return { ok: false, error: `需要以下角色之一才可进入管理后台：${adminRoleKeys().join('、')}` }
  }
  return { ok: true }
}

export default function useUser() {
  async function loginWithPassword(username: string, password: string): Promise<LoginResult> {
    store.loading = true
    const { r, d } = await request({
      url: '/api/v1/uc/login_with_password',
      method: 'POST',
      data: { username, password },
    })
    store.loading = false
    if (r && d) {
      saveToken(d)
      return finalizeAdminLogin()
    }
    return { ok: false, error: '用户名或密码错误' }
  }

  async function login(unionid: string): Promise<LoginResult> {
    store.loading = true
    const { r, d } = await request({
      url: '/api/v1/uc/login2_with_unionid',
      headers: { Unionid: unionid },
    })
    store.loading = false
    if (r && d) {
      saveToken(d)
      return finalizeAdminLogin()
    }
    return { ok: false, error: 'union_id 登录失败' }
  }

  async function wx_login(code: string): Promise<LoginResult> {
    store.loading = true
    const { r, d } = await request({
      url: '/api/v1/uc/wx_qr_login',
      method: 'POST',
      data: { code },
    })
    store.loading = false
    if (r && d) {
      saveToken(d)
      return finalizeAdminLogin()
    }
    return { ok: false, error: '微信登录失败，请确认账号已注册且具备管理员角色' }
  }

  async function sudo() {
    store.loading = true
    const { r, d, e } = await request({
      url: '/api/v1/uc/sudo',
      method: 'POST',
    })
    store.loading = false
    if (r && d) {
      window.localStorage.setItem(HtySudoToken, d)
      return true
    }
    return false
  }

  async function read() {
    store.loading = true
    const { r, d, e } = await request({
      url: '/api/v1/uc/find_user_with_info_by_token',
    })
    store.loading = false
    if (r && d) {
      store.currentUser = d as HtyUser
      const userApp = d.infos?.[0]
      if (userApp?.roles) {
        store.roles = userApp.roles
      }
      return true
    }
    return false
  }

  async function getAllUsers() {
    const { r, d, e } = await request({
      url: '/api/v1/uc/find_all_users',
    })
    if (r && Array.isArray(d)) {
      store.users = d.map((u: HtyUser) => ({
        ...u,
        ...(u.infos?.[0] || {}),
      }))
    } else {
      store.users = []
    }
  }

  async function getAppByDomain(): Promise<HtyApp | undefined> {
    const { r, d, e } = await request({ url: '/api/v1/uc/find_app_by_domain' })
    if (r && d) return d as HtyApp
    return undefined
  }

  async function verify(userId: string, validate: boolean, rejectReason?: string) {
    const app = await getAppByDomain()
    if (!app) return false
    const { r, d, e } = await request({
      url: '/api/v1/uc/register/verify',
      method: 'POST',
      data: { hty_id: userId, app_id: app.app_id, validate, reject_reason: rejectReason },
    })
    return r
  }

  async function approveUser(userId: string) {
    const ok = await verify(userId, true)
    if (ok) await getAllUsers()
    return ok
  }

  async function rejectUser(userId: string, reason: string) {
    const ok = await verify(userId, false, reason)
    if (ok) await getAllUsers()
    return ok
  }

  function checkRole(roleKey: string): boolean {
    return store.roles.some((r) => r.role_key === roleKey)
  }

  function logout() {
    store.currentUser = null
    store.roles = []
    store.users = []
    clearTokens()
    window.location.href = loginPath()
  }

  return {
    store,
    loginWithPassword,
    login,
    wx_login,
    sudo,
    read,
    getAllUsers,
    approveUser,
    rejectUser,
    checkRole,
    hasAdminAccess,
    logout,
  }
}
