interface Window {
  count: number
  resetAt: number
}

const store = new Map<string, Window>()

const LIMITS = {
  writes: { max: 60, windowMs: 60_000 },
  ai: { max: 30, windowMs: 3_600_000 },
  uploads: { max: 30, windowMs: 86_400_000 },
} as const

type LimitKey = keyof typeof LIMITS

export function checkRateLimit(key: string, type: LimitKey = 'writes'): { ok: boolean; retryAfter?: number } {
  const limit = LIMITS[type]
  const storeKey = `${type}:${key}`
  const now = Date.now()

  let win = store.get(storeKey)
  if (!win || now > win.resetAt) {
    win = { count: 0, resetAt: now + limit.windowMs }
    store.set(storeKey, win)
  }

  win.count++

  if (win.count > limit.max) {
    return { ok: false, retryAfter: Math.ceil((win.resetAt - now) / 1000) }
  }
  return { ok: true }
}
