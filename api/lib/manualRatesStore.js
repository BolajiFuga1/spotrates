import { Redis } from '@upstash/redis'
import { createClient } from 'redis'

export const MANUAL_RATES_KEY = 'spotrates:manual_v1'

/**
 * Vercel Storage → Redis quickstart often exposes only `REDIS_URL` (TCP). This app prefers Upstash REST
 * (`UPSTASH_*` / `KV_REST_*`) but falls back to TCP when only `REDIS_URL` is set.
 * @param {string} url
 */
function createTcpRedis(url) {
  const client = createClient({ url })
  let connectPromise = null
  async function ensureConnected() {
    if (client.isOpen) return
    if (!connectPromise) connectPromise = client.connect()
    await connectPromise
  }
  return {
    async get(key) {
      await ensureConnected()
      const raw = await client.get(key)
      if (raw == null) return null
      try {
        return JSON.parse(raw)
      } catch {
        return raw
      }
    },
    async set(key, value) {
      await ensureConnected()
      const payload = typeof value === 'string' ? value : JSON.stringify(value)
      await client.set(key, payload)
    },
    async disconnect() {
      if (client.isOpen) await client.quit()
    },
  }
}

/** @returns {Redis | ReturnType<typeof createTcpRedis> | null} */
export function getRedis() {
  const restUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  if (restUrl && token) return new Redis({ url: restUrl, token })
  const redisUrl = process.env.REDIS_URL
  if (redisUrl) return createTcpRedis(redisUrl)
  return null
}

/** Close TCP Redis (no-op for Upstash REST client). */
export async function disconnectRedis(redis) {
  if (redis instanceof Redis) return
  if (redis && typeof redis.disconnect === 'function') {
    await redis.disconnect().catch(() => {})
  }
}

export function toUsdBase(ngnPerUsd, ngnPerGbp, ngnPerEur) {
  return {
    NGN: ngnPerUsd,
    GBP: ngnPerUsd / ngnPerGbp,
    EUR: ngnPerUsd / ngnPerEur,
  }
}

export function fromUsdBase(r) {
  return {
    ngnPerUsd: r.NGN,
    ngnPerGbp: r.NGN / r.GBP,
    ngnPerEur: r.NGN / r.EUR,
  }
}

/**
 * @returns {Promise<{ active: boolean, rates: Record<string, number> | null, updatedAtMs: number | null }>}
 */
export async function readManualStore(redis) {
  const r = redis ?? getRedis()
  if (!r) {
    return { active: false, rates: null, updatedAtMs: null }
  }
  try {
    let data = await r.get(MANUAL_RATES_KEY)
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
      } catch {
        data = null
      }
    }
    if (!data || typeof data !== 'object') {
      return { active: false, rates: null, updatedAtMs: null }
    }
    return {
      active: Boolean(data.active),
      rates: data.rates && typeof data.rates === 'object' ? data.rates : null,
      updatedAtMs: typeof data.updatedAtMs === 'number' ? data.updatedAtMs : null,
    }
  } catch {
    return { active: false, rates: null, updatedAtMs: null }
  }
}

/**
 * @param {Redis} redis
 * @param {{ active: boolean, rates: Record<string, number> | null, updatedAtMs: number }} payload
 */
export async function writeManualStore(redis, payload) {
  if (!redis) throw new Error('REDIS_NOT_CONFIGURED')
  await redis.set(MANUAL_RATES_KEY, payload)
}
