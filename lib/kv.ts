// Lightweight KV with dynamic Upstash import and in-memory fallback
// Used by API routes (e.g., auction state) via kv.get/kv.set

type KV = {
  get: (key: string) => Promise<any>
  set: (key: string, value: any) => Promise<void>
}

class MemoryKV implements KV {
  private store = new Map<string, any>()
  async get(key: string) {
    return this.store.get(key)
  }
  async set(key: string, value: any) {
    this.store.set(key, value)
  }
}

async function createKV(): Promise<KV> {
  try {
    const pkg = '@upstash/redis'
    // Indirect dynamic import so TS doesn't try to resolve the module
    const dynamicImport = new Function('m', 'return import(m)') as (m: string) => Promise<any>
    const mod = await dynamicImport(pkg)
    const Redis = (mod as any).Redis
    if (Redis) {
      const u1 = process.env.UPSTASH_REDIS_REST_URL
      const t1 = process.env.UPSTASH_REDIS_REST_TOKEN
      const u2 = process.env.KV_REST_API_URL || process.env.KV_REST_API_URL
      const t2 = process.env.KV_REST_API_TOKEN || process.env.KV_REST_API_TOKEN
      if (typeof Redis.fromEnv === 'function' && u1 && t1) {
        return Redis.fromEnv()
      }
      const url = u1 || u2
      const token = t1 || t2
      if (url && token) {
        return new Redis({ url, token })
      }
    }
  } catch {
    // ignore; fall back to memory
  }
  return new MemoryKV()
}

// Reuse a singleton across hot reloads
const g = globalThis as any
export const kvPromise: Promise<KV> = g.__kvPromise || (g.__kvPromise = createKV())

// Helper to provide .get/.set directly for existing code expecting a KV instance
// This proxies to the resolved kvPromise, so callers can just use await kv.get(..)
export const kv: KV = new Proxy({} as KV, {
  get: (_t, prop: keyof KV) => async (...args: any[]) => {
    const client = await kvPromise
    // @ts-ignore
    return client[prop](...args)
  },
})
