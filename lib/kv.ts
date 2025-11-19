// Lightweight KV with dynamic Redis import and in-memory fallback
// Supports both Upstash REST API and standard Redis protocol
// Used by API routes (e.g., auction state) via kv.get/kv.set

import { promises as fs } from 'fs'
import path from 'path'

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

class IORedisKV implements KV {
  private client: any
  constructor(client: any) {
    this.client = client
  }
  async get(key: string) {
    const val = await this.client.get(key)
    if (!val) return null
    try {
      return JSON.parse(val)
    } catch {
      return val
    }
  }
  async set(key: string, value: any) {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value)
    await this.client.set(key, serialized)
  }
}

class FileKV implements KV {
  private filePath: string
  private cache: Record<string, any> | null = null
  private loaded = false
  constructor(filePath: string) {
    this.filePath = filePath
  }
  private async ensureLoaded() {
    if (this.loaded) return
    try {
      const txt = await fs.readFile(this.filePath, 'utf8')
      this.cache = JSON.parse(txt || '{}')
    } catch {
      this.cache = {}
      await fs.mkdir(path.dirname(this.filePath), { recursive: true })
      await fs.writeFile(this.filePath, JSON.stringify(this.cache), 'utf8')
    }
    this.loaded = true
  }
  async get(key: string) {
    await this.ensureLoaded()
    return (this.cache as any)[key]
  }
  async set(key: string, value: any) {
    await this.ensureLoaded()
    ;(this.cache as any)[key] = value
    await fs.mkdir(path.dirname(this.filePath), { recursive: true })
    await fs.writeFile(this.filePath, JSON.stringify(this.cache), 'utf8')
  }
}

async function createKV(): Promise<KV> {
  // Try standard Redis URL first (redis://)
  const redisUrl = process.env.REDIS_URL
  if (redisUrl && redisUrl.startsWith('redis://')) {
    try {
      const IORedis = (await import('ioredis')).default
      const client = new IORedis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false,
      })
      // Test connection
      await client.ping()
      console.log('[KV] Using ioredis with standard Redis URL')
      return new IORedisKV(client)
    } catch (e) {
      console.log('[KV] Failed to connect to Redis via ioredis:', e)
    }
  }

  // Try Upstash REST API
  try {
    const { Redis } = await import('@upstash/redis')
    if (Redis) {
      const u1 = process.env.UPSTASH_REDIS_REST_URL
      const t1 = process.env.UPSTASH_REDIS_REST_TOKEN
      const u2 = process.env.KV_REST_API_URL
      const t2 = process.env.KV_REST_API_TOKEN
      
      if (typeof Redis.fromEnv === 'function' && u1 && t1) {
        console.log('[KV] Using Upstash Redis REST API (fromEnv)')
        return Redis.fromEnv()
      }
      const url = u1 || u2
      const token = t1 || t2
      if (url && token) {
        console.log('[KV] Using Upstash Redis REST API (manual config)')
        return new Redis({ url, token })
      }
    }
  } catch (e) {
    console.log('[KV] Failed to initialize Upstash Redis:', e)
  }

  // File-backed fallback for local/dev so data persists across hard refreshes and hot reloads
  try {
    const isServerless = Boolean(process.env.VERCEL || process.env.NETLIFY || process.env.AWS_REGION || process.env.LAMBDA_TASK_ROOT)
    const baseDir = process.env.KV_FILE_PATH
      ? path.dirname(process.env.KV_FILE_PATH)
      : (isServerless ? (process.env.TMPDIR || '/tmp') : path.join(process.cwd(), '.data'))
    const defaultPath = process.env.KV_FILE_PATH || path.join(baseDir, 'kv.json')
    console.log('[KV] Using FileKV fallback at:', defaultPath, 'isServerless:', isServerless)
    return new FileKV(defaultPath)
  } catch (e) {
    console.log('[KV] FileKV failed, using MemoryKV:', e)
    return new MemoryKV()
  }
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
