import crypto from 'node:crypto'

const COOKIE = 'spotrates_admin'

export function parseCookies(header) {
  /** @type {Record<string, string>} */
  const out = {}
  if (!header || typeof header !== 'string') return out
  for (const part of header.split(';')) {
    const i = part.indexOf('=')
    if (i < 0) continue
    const k = part.slice(0, i).trim()
    const v = part.slice(i + 1).trim()
    try {
      out[k] = decodeURIComponent(v)
    } catch {
      out[k] = v
    }
  }
  return out
}

export function sessionSecret() {
  return (process.env.SESSION_SECRET || 'dev-secret-change-me').trim()
}

export function signSession() {
  const exp = Date.now() + 7 * 24 * 3600 * 1000
  const payload = Buffer.from(JSON.stringify({ v: 1, exp }), 'utf8')
  const sig = crypto.createHmac('sha256', sessionSecret()).update(payload).digest('base64url')
  return `${payload.toString('base64url')}.${sig}`
}

export function verifySession(token) {
  if (!token || typeof token !== 'string') return null
  const i = token.lastIndexOf('.')
  if (i < 0) return null
  const bodyB64 = token.slice(0, i)
  const sig = token.slice(i + 1)
  let payload
  try {
    payload = Buffer.from(bodyB64, 'base64url')
  } catch {
    return null
  }
  if (crypto.createHmac('sha256', sessionSecret()).update(payload).digest('base64url') !== sig) {
    return null
  }
  try {
    const data = JSON.parse(payload.toString('utf8'))
    if (typeof data.exp !== 'number' || data.exp < Date.now()) return null
    return data
  } catch {
    return null
  }
}

export function adminCookieName() {
  return COOKIE
}

export function cookieBaseOptions() {
  const secure = process.env.COOKIE_SECURE === '1' || process.env.VERCEL === '1'
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    secure,
    maxAge: 7 * 24 * 3600 * 1000,
  }
}
