import crypto from 'node:crypto'
import {
  adminCookieName,
  cookieBaseOptions,
  signSession,
} from '../lib/adminSession.js'

const ADMIN_AUTH_ENABLED = process.env.SPOTRATES_ADMIN_AUTH === '1'
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || '').trim()

function readJsonBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }
  return {}
}

function buildSetCookie(name, value, opts) {
  const sec = opts.secure ? '; Secure' : ''
  const maxAgeSec = Math.floor(opts.maxAge / 1000)
  return `${name}=${value}; Path=${opts.path}; HttpOnly; SameSite=${opts.sameSite}; Max-Age=${maxAgeSec}${sec}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  if (!ADMIN_AUTH_ENABLED) {
    return res.status(200).json({ ok: true })
  }
  if (!ADMIN_PASSWORD) {
    return res.status(503).json({
      ok: false,
      error: 'Server misconfiguration: set ADMIN_PASSWORD in the project environment.',
    })
  }

  const body = readJsonBody(req)
  const pwd = body?.password
  if (typeof pwd !== 'string' || pwd.length === 0) {
    return res.status(400).json({ ok: false, error: 'Password required' })
  }

  const a = Buffer.from(pwd.trim(), 'utf8')
  const b = Buffer.from(ADMIN_PASSWORD, 'utf8')
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ ok: false, error: 'Invalid password' })
  }

  const token = signSession()
  const opts = cookieBaseOptions()
  res.setHeader('Set-Cookie', buildSetCookie(adminCookieName(), token, opts))
  return res.status(200).json({ ok: true })
}
