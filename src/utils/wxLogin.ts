/** 微信开放平台扫码登录 redirect_uri（部署侧 nginx 可配桥接路径，见 WX_LOGIN_BRIDGE_PATH） */
export function buildWxQrRedirectUri(): string {
  const adminHost = HOST
  const redirectHost = (typeof WX_REDIRECT_HOST === 'string' && WX_REDIRECT_HOST) || adminHost
  let bridgePath = typeof WX_LOGIN_BRIDGE_PATH === 'string' ? WX_LOGIN_BRIDGE_PATH.trim() : ''
  if (!bridgePath) {
    bridgePath = redirectHost === adminHost ? 'wx-login' : 'admin-wx-login'
  }
  bridgePath = bridgePath.replace(/^\//, '')
  return `https://${redirectHost}/${bridgePath}`
}

export function mountWxLoginQr(containerId: string) {
  if (!WX_APP) return false
  const container = document.getElementById(containerId)
  if (!container) return false

  const iframe = document.createElement('iframe')
  const redirectUri = buildWxQrRedirectUri()
  const url =
    'https://open.weixin.qq.com/connect/qrconnect?' +
    `appid=${WX_APP}&scope=snsapi_login&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${Math.random().toString(36).replace('.', '')}&login_type=jssdk&self_redirect=false` +
    '&style=white'

  iframe.src = url
  iframe.width = '300px'
  iframe.height = '400px'
  iframe.style.border = 'none'
  container.innerHTML = ''
  container.appendChild(iframe)
  return true
}
