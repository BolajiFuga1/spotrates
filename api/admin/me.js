import { adminCookieName, parseCookies, verifySession } from '../lib/adminSession.js'

const ADMIN_AUTH_ENABLED = process.env.SPOTRATES_ADMIN_AUTH === '1'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }
  const authed =
    !ADMIN_AUTH_ENABLED || Boolean(verifySession(parseCookies(req.headers.cookie)[adminCookieName()]))
  return res.status(200).json({ ok: true, authenticated: authed })
}
