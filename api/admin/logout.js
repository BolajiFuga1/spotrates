import { adminCookieName, cookieBaseOptions } from '../lib/adminSession.js'

function buildClearCookie(name, opts) {
  const sec = opts.secure ? '; Secure' : ''
  return `${name}=; Path=${opts.path}; HttpOnly; SameSite=${opts.sameSite}; Max-Age=0${sec}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }
  const opts = cookieBaseOptions()
  res.setHeader('Set-Cookie', buildClearCookie(adminCookieName(), opts))
  return res.status(200).json({ ok: true })
}
