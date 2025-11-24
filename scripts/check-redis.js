#!/usr/bin/env node

/**
 * Script to check Redis data for JCL quizzes
 * Usage: node scripts/check-redis.js [quiz-id]
 * 
 * Requires REDIS_URL environment variable to be set
 */

const quizId = process.argv[2] || 'jcl-quiz-2025-wk3'

async function checkRedis() {
  console.log(`\n=== Checking Redis Data for Quiz: ${quizId} ===\n`)

  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) {
    console.error('❌ REDIS_URL environment variable is not set')
    console.log('Set it with: export REDIS_URL="your-redis-url"')
    process.exit(1)
  }

  console.log('✅ REDIS_URL is set')
  console.log(`📍 Connecting to Redis...\n`)

  try {
    // Import ioredis
    const Redis = (await import('ioredis')).default
    const redis = new Redis(redisUrl)

    // Test connection
    await redis.ping()
    console.log('✅ Connected to Redis successfully\n')

    // Get quiz results
    const resultsKey = `quiz:${quizId}:results`
    const resultsRaw = await redis.get(resultsKey)
    const results = resultsRaw ? JSON.parse(resultsRaw) : null

    console.log('=== Quiz Results ===')
    console.log(`Key: ${resultsKey}`)
    console.log(`Total Submissions: ${Array.isArray(results) ? results.length : 0}`)
    if (results && results.length > 0) {
      console.log('\nSubmissions:')
      results.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.name} (${r.phone}) - Score: ${r.score}, Duration: ${Math.round(r.durationMs / 1000)}s`)
      })
    } else {
      console.log('No submissions yet.')
    }

    // Get active status
    console.log('\n=== Quiz Active Status ===')
    const activeKey = `quiz:${quizId}:active`
    const isActive = await redis.get(activeKey)
    console.log(`Key: ${activeKey}`)
    console.log(`Active: ${isActive === 'true' ? '✅ Yes' : '❌ No'}`)

    // Get all quiz keys
    console.log('\n=== All Keys for this Quiz ===')
    const keys = await redis.keys(`quiz:${quizId}:*`)
    console.log(`Found ${keys.length} keys:`)
    keys.forEach(key => console.log(`  - ${key}`))

    // Get database size
    console.log('\n=== Redis Database Info ===')
    const dbSize = await redis.dbsize()
    console.log(`Total keys in database: ${dbSize}`)

    await redis.quit()
    console.log('\n✅ Done\n')
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

checkRedis()
