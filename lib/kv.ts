import { Redis } from '@upstash/redis'

// Creates a Redis client from environment variables provided by Vercel/Upstash
// Requires: KV_REST_API_URL and KV_REST_API_TOKEN (or KV_URL/REDIS_URL for direct)
export const kv = Redis.fromEnv()
