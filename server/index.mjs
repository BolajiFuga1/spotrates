import cookieParser from 'cookie-parser'
import crypto from 'node:crypto'
import dotenv from 'dotenv'
import express from 'express'
import { existsSync, readFileSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const envPath = path.join(ROOT, '.env')
const envLocalPath = path.join(ROOT, '.env.local')

function stripBom(s) {
  return s.length > 0 && s.charCodeAt(0) === 0xfeff ? s.slice(1) : s
}

/** Last `ADMIN_PASSWORD=` wins inside one file; `#` lines skipped. */
function parseAdminPasswordFromDotenv(raw) {
  let found = ''
  const text = stripBom(raw)
  for (const line of text.split(/\r?\n/)) {
    if (/^\s*#/.test(line)) continue
    const m = /^\s*ADMIN_PASSWORD\s*=\s*(.*)$/.exec(line)
    if (!m) continue
    let v = m[1].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    found = v
  }
  return found
}

function readPasswordFromFile(filePath) {
  try {
    return parseAdminPasswordFromDotenv(readFileSync(filePath, 'utf8'))
  } catch {
    return ''
  }
}

/** Preserve explicit `PORT=… node …` — dotenv override must not clobber it. */
const cliPort = process.env.PORT

const cwd = process.cwd()
dotenv.config({ path: path.join(cwd, '.env.local'), override: true })
dotenv.config({ path: path.join(cwd, '.env'), override: true })
dotenv.config({ path: envLocalPath, override: true })
dotenv.config({ path: envPath, override: true })

if (cliPort) process.env.PORT = cliPort

function loadAdminPassword() {
  let pw = (process.env.ADMIN_PASSWORD ?? '').trim()
  if (pw) return pw

  const dotenvCandidates = [envPath, envLocalPath, path.join(cwd, '.env'), path.join(cwd, '.env.local')]
  for (const f of dotenvCandidates) {
    pw = readPasswordFromFile(f).trim()
    if (pw) return pw
  }

  try {
    const local = path.join(__dirname, 'local-admin-password.txt')
    pw = stripBom(readFileSync(local, 'utf8'))
      .split(/\r?\n/)[0]
      .trim()
    if (pw) return pw
  } catch {
    /* optional */
  }

  return ''
}

const DATA_DIR = path.join(__dirname, 'data')
const DATA_FILE = path.join(DATA_DIR, 'rates.json')

const PORT = Number(process.env.PORT || 3001)
const ADMIN_PASSWORD = loadAdminPassword()
const SESSION_SECRET = (process.env.SESSION_SECRET || 'dev-secret-change-me').trim()
const COOKIE = 'spotrates_admin'
const cookieOpts = {
  path: '/',
  secure: process.env.COOKIE_SECURE === '1',
}

async function readStore() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    return {
      active: Boolean(parsed.active),
      rates: parsed.rates && typeof parsed.rates === 'object' ? parsed.rates : null,
      updatedAtMs: typeof parsed.updatedAtMs === 'number' ? parsed.updatedAtMs : null,
    }
  } catch {
    return { active: false, rates: null, updatedAtMs: null }
  }
}

async function writeStore(data) {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8')
}

function signSession() {
  const exp = Date.now() + 7 * 24 * 3600 * 1000
  const payload = Buffer.from(JSON.stringify({ v: 1, exp }), 'utf8')
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url')
  return `${payload.toString('base64url')}.${sig}`
}

function verifySession(token) {
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
  if (crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url') !== sig) {
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

/** Set `SPOTRATES_ADMIN_AUTH=1` in the environment to require login again (cookie session). */
const ADMIN_AUTH_ENABLED = process.env.SPOTRATES_ADMIN_AUTH === '1'

function requireAdmin(req, res, next) {
  if (!ADMIN_AUTH_ENABLED) return next()
  if (!verifySession(req.cookies?.[COOKIE])) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }
  next()
}

/** Stored USD-base: NGN per USD, GBP per USD, EUR per USD (same as open.er). */
function toUsdBase(ngnPerUsd, ngnPerGbp, ngnPerEur) {
  return {
    NGN: ngnPerUsd,
    GBP: ngnPerUsd / ngnPerGbp,
    EUR: ngnPerUsd / ngnPerEur,
  }
}

function fromUsdBase(r) {
  return {
    ngnPerUsd: r.NGN,
    ngnPerGbp: r.NGN / r.GBP,
    ngnPerEur: r.NGN / r.EUR,
  }
}

const app = express()
if (process.env.RENDER === 'true' || process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1)
}
app.use(express.json({ limit: '24kb' }))
app.use(cookieParser())

const CBN_EXCHANGE_JSON = 'https://www.cbn.gov.ng/api/GetAllExchangeRates'
const CBN_RATES_PAGE = 'https://www.cbn.gov.ng/rates/ExchRateByCurrency.html'

app.get('/api/public/cbn-official-usd', async (_req, res) => {
  try {
    const ac = new AbortController()
    const t = setTimeout(() => ac.abort(), 14_000)
    let r
    try {
      r = await fetch(CBN_EXCHANGE_JSON, {
        signal: ac.signal,
        headers: {
          accept: 'application/json',
          'user-agent': 'SpotRatesBoard/1.0 (rates display; +https://www.cbn.gov.ng)',
        },
      })
    } finally {
      clearTimeout(t)
    }
    if (!r.ok) {
      return res.status(502).json({ ok: false, error: `CBN responded ${r.status}` })
    }
    const data = await r.json()
    if (!Array.isArray(data)) {
      return res.status(502).json({ ok: false, error: 'Unexpected CBN payload' })
    }
    const usd = data.filter(
      (row) =>
        row &&
        typeof row.currency === 'string' &&
        row.currency.trim().toUpperCase() === 'US DOLLAR' &&
        typeof row.ratedate === 'string',
    )
    if (usd.length === 0) {
      return res.status(502).json({ ok: false, error: 'No US DOLLAR row from CBN' })
    }
    usd.sort((a, b) => String(b.ratedate).localeCompare(String(a.ratedate)))
    const row = usd[0]
    const buying = Number(row.buyingrate)
    const central = Number(row.centralrate)
    const selling = Number(row.sellingrate)
    if (![buying, central, selling].every((n) => Number.isFinite(n) && n > 0)) {
      return res.status(502).json({ ok: false, error: 'Invalid CBN US DOLLAR numbers' })
    }
    res.json({
      ok: true,
      ratedate: row.ratedate,
      buying,
      central,
      selling,
      sourceUrl: CBN_RATES_PAGE,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Request failed'
    res.status(502).json({ ok: false, error: msg })
  }
})

app.get('/api/public/rates', async (_req, res) => {
  const s = await readStore()
  if (!s.active || !s.rates?.NGN || !s.rates?.GBP || !s.rates?.EUR) {
    return res.json({ active: false })
  }
  res.json({
    active: true,
    base: 'USD',
    rates: {
      NGN: s.rates.NGN,
      GBP: s.rates.GBP,
      EUR: s.rates.EUR,
    },
    updatedAtMs: s.updatedAtMs ?? Date.now(),
  })
})

app.post('/api/admin/login', (req, res) => {
  if (!ADMIN_AUTH_ENABLED) {
    return res.json({ ok: true })
  }
  if (!ADMIN_PASSWORD) {
    return res.status(503).json({
      ok: false,
      error: 'Server misconfiguration: set ADMIN_PASSWORD in the API environment.',
    })
  }
  const pwd = req.body?.password
  if (typeof pwd !== 'string' || pwd.length === 0) {
    return res.status(400).json({ ok: false, error: 'Password required' })
  }
  const a = Buffer.from(pwd.trim(), 'utf8')
  const b = Buffer.from(ADMIN_PASSWORD, 'utf8')
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ ok: false, error: 'Invalid password' })
  }
  const token = signSession()
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 3600 * 1000,
    ...cookieOpts,
  })
  res.json({ ok: true })
})

app.post('/api/admin/logout', (_req, res) => {
  res.clearCookie(COOKIE, { ...cookieOpts, httpOnly: true, sameSite: 'lax' })
  res.json({ ok: true })
})

app.get('/api/admin/me', (req, res) => {
  const authed =
    !ADMIN_AUTH_ENABLED || Boolean(verifySession(req.cookies?.[COOKIE]))
  res.json({ ok: true, authenticated: authed })
})

app.get('/api/admin/rates', requireAdmin, async (_req, res) => {
  const s = await readStore()
  if (!s.rates?.NGN) {
    return res.json({
      active: s.active,
      ngnPerUsd: '',
      ngnPerGbp: '',
      ngnPerEur: '',
      updatedAtMs: s.updatedAtMs,
    })
  }
  const d = fromUsdBase(s.rates)
  res.json({
    active: s.active,
    ngnPerUsd: d.ngnPerUsd,
    ngnPerGbp: d.ngnPerGbp,
    ngnPerEur: d.ngnPerEur,
    updatedAtMs: s.updatedAtMs,
  })
})

app.put('/api/admin/rates', requireAdmin, async (req, res) => {
  const body = req.body || {}
  if (body.active === false) {
    const prev = await readStore()
    await writeStore({
      active: false,
      rates: prev.rates,
      updatedAtMs: Date.now(),
    })
    return res.json({ ok: true })
  }
  const u = Number(body.ngnPerUsd)
  const g = Number(body.ngnPerGbp)
  const e = Number(body.ngnPerEur)
  if (![u, g, e].every((n) => Number.isFinite(n) && n > 0)) {
    return res.status(400).json({
      ok: false,
      error: 'Enter positive numbers: naira per US dollar, per pound, and per euro.',
    })
  }
  const rates = toUsdBase(u, g, e)
  const updatedAtMs = Date.now()
  await writeStore({ active: true, rates, updatedAtMs })
  res.json({ ok: true, rates, updatedAtMs })
})

const DIST_DIR = path.join(ROOT, 'dist')
if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR, { index: 'index.html' }))
  console.log(`[spotrates-api] Serving static site from ${DIST_DIR}`)
}

/**
 * Express attaches this callback to both `listening` and `error` (once).
 * On EADDRINUSE it is invoked with an Error — must not treat that as success.
 */
app.listen(PORT, (err) => {
  if (err) {
    console.error(`[spotrates-api] Cannot listen on port ${PORT}: ${err.message}`)
    console.error('[spotrates-api] Another process may be using this port. Stop it or set PORT in .env.')
    process.exit(1)
  }
  console.log(`SpotRates API listening on http://localhost:${PORT}`)
  if (!ADMIN_PASSWORD) {
    console.warn(
      '[spotrates-api] ADMIN_PASSWORD missing. Add it to forex-website/.env or create server/local-admin-password.txt (see server/local-admin-password.example).',
    )
  } else {
    console.log('[spotrates-api] Admin password loaded.')
  }
})
