import { Redis } from '@upstash/redis'

export const MANUAL_RATES_KEY = 'spotrates:manual_v1'

/** @returns {Redis | null} */
export function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
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
