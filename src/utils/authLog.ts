const PREFIX = '[authcoreadmin|auth]'

export function authLog(step: string, detail?: unknown) {
  if (detail !== undefined) {
    console.log(PREFIX, step, detail)
  } else {
    console.log(PREFIX, step)
  }
}

export function authWarn(step: string, detail?: unknown) {
  if (detail !== undefined) {
    console.warn(PREFIX, step, detail)
  } else {
    console.warn(PREFIX, step)
  }
}

export function tokenSnapshot() {
  const auth = window.localStorage.getItem('Authorization')
  const sudo = window.localStorage.getItem('HtySudoerToken')
  return {
    hasAuth: !!auth,
    authLen: auth?.length ?? 0,
    hasSudo: !!sudo,
    sudoLen: sudo?.length ?? 0,
  }
}
