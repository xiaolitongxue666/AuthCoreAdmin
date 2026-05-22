import axios from 'axios'
import { HtyAuthToken, HtySudoToken, HtyHostHeader, getToken, clearTokens, loginPath } from './index'
import { authLog, authWarn } from './authLog'

const AUTH_API_RE = /\/api\/v1\/uc\/(wx_qr_login|sudo|find_user_with_info_by_token|find_all_users)/

const axiosInstance = axios.create({
  withCredentials: true,
})

axiosInstance.interceptors.request.use((options) => {
  const headers: any = options.headers || {}
  const token = getToken()
  if (token) {
    headers[HtyAuthToken] = token
    const sudo = window.localStorage.getItem(HtySudoToken)
    if (sudo) {
      headers[HtySudoToken] = sudo
    }
  }
  headers[HtyHostHeader] = HOST || window.location.host

  let url = options.url || ''
  if (url.startsWith('/api/v1/uc')) {
    url = UC_SERVER + url
  }

  return { ...options, url, headers }
})

axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => {
    const { response } = error
    if (response) {
      return Promise.resolve(response)
    }
    return Promise.resolve({ r: false, e: error.message })
  }
)

export default async function request({ url = '', method = 'get', data, params, skipAuthHandler = false, ...rest }: any) {
  if (method.toLowerCase() === 'get' && data && !params) {
    params = data
  }

  try {
    const response = await axiosInstance.request({ url, method, data, params, ...rest })
    const { status, data: resData } = response
    const apiPath = (url as string).replace(UC_SERVER, '')

    if (AUTH_API_RE.test(apiPath)) {
      authLog('api', {
        method,
        path: apiPath,
        status,
        r: resData?.r,
        error: resData?.e,
        skipAuthHandler,
      })
    }

    if (status === 401) {
      const apiError = typeof resData === 'object' && resData !== null
        ? (resData.e || resData.hty_err?.reason || '登录已过期')
        : '登录已过期'
      if (!skipAuthHandler) {
        authWarn('api 401 → clearTokens + redirect login', { path: apiPath, error: apiError })
        clearTokens()
        const loginUrl = loginPath()
        const onOAuthCallback = window.location.pathname.replace(/\/$/, '').endsWith('/wx-login')
        if (!onOAuthCallback && window.location.pathname !== loginUrl) {
          window.location.href = loginUrl
        }
      } else {
        authWarn('api 401 (skipAuthHandler)', { path: apiPath, error: apiError })
      }
      return { r: false, e: apiError, statusCode: status }
    }

    const r = status >= 200 && status < 300
    let result: any = { r, statusCode: status }

    if (typeof resData === 'object' && resData !== null) {
      result = { ...result, ...resData }
    } else {
      result = { ...result, d: resData }
    }

    if (!r) {
      result.e = result.e || '请求失败'
    }

    return result
  } catch (e: any) {
    return { r: false, e: e.message || '网络异常' }
  }
}
