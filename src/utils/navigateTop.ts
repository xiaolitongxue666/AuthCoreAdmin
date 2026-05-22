/** 微信 OAuth 回调可能在 iframe 内，需提升到顶层窗口导航 */
export function navigateTop(url: string) {
  const target = url
  authLogNavigate('navigateTop', { target, inIframe: window.top !== window.self })
  if (window.top && window.top !== window.self) {
    window.top.location.replace(target)
    return
  }
  window.location.replace(target)
}

export function navigateTopHref(url: string) {
  if (window.top && window.top !== window.self) {
    window.top.location.href = url
    return
  }
  window.location.href = url
}

/** 若当前页在 iframe 中，提升到顶层（用于 wx-login 回调） */
export function breakoutIframeIfNeeded(): boolean {
  if (window.top && window.top !== window.self) {
    authLogNavigate('breakoutIframeIfNeeded', { href: window.location.href })
    window.top.location.replace(window.location.href)
    return true
  }
  return false
}

function authLogNavigate(step: string, detail: unknown) {
  console.log('[authcoreadmin|auth]', step, detail)
}
