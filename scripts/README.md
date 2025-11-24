# Redis Data Inspection Tools

Tools to check and inspect quiz data stored in Redis.

## Prerequisites

1. **Get your Redis URL** from Vercel:
   ```bash
   # If using Vercel CLI
   vercel env pull .env.local
   
   # Or manually from Vercel Dashboard:
   # Settings → Environment Variables → REDIS_URL or UPSTASH_REDIS_REST_URL
   ```

2. **Set the environment variable**:
   ```bash
   export REDIS_URL="redis://your-redis-url"
   # or
   export UPSTASH_REDIS_REST_URL="https://your-upstash-url"
   export UPSTASH_REDIS_REST_TOKEN="your-token"
   ```

## Methods to Check Redis Data

### Method 1: Web API (Easiest - No Setup Required)

Visit these URLs in your browser:

1. **Check KV Connection Status**:
   ```
   https://jcl-chandrapur.vercel.app/api/debug/kv
   ```

2. **Check Quiz Data**:
   ```
   https://jcl-chandrapur.vercel.app/api/debug/quiz-data?quizId=jcl-quiz-2025-wk3
   ```
   
   Change `quizId` parameter to check different quizzes:
   - `jcl-quiz-2025-wk1`
   - `jcl-quiz-2025-wk2`
   - `jcl-quiz-2025-wk3`

### Method 2: Node.js Script (Recommended)

```bash
# Check Week 3 quiz (default)
node scripts/check-redis.js

# Check specific quiz
node scripts/check-redis.js jcl-quiz-2025-wk1
node scripts/check-redis.js jcl-quiz-2025-wk2
```

**Output includes**:
- Total submissions
- List of all submissions with scores
- Quiz active status
- All Redis keys for the quiz
- Total database size

### Method 3: Shell Script (Linux/macOS)

Requires `redis-cli` to be installed:

```bash
# Install redis-cli first
brew install redis  # macOS
# or
sudo apt-get install redis-tools  # Ubuntu

# Run the script
./scripts/check-redis.sh jcl-quiz-2025-wk3
```

### Method 4: Direct Redis CLI Commands

If you have `redis-cli` installed:

```bash
# Connect to Redis
redis-cli -u "$REDIS_URL"

# Once connected, run these commands:
GET "quiz:jcl-quiz-2025-wk3:results"
GET "quiz:jcl-quiz-2025-wk3:active"
KEYS "quiz:jcl-quiz-2025-wk3:*"
DBSIZE
```

### Method 5: Upstash Console (For Upstash Redis)

If using Upstash Redis:
1. Go to https://console.upstash.com/
2. Select your database
3. Use the Data Browser to view keys
4. Search for keys starting with `quiz:`

## Redis Key Structure

Quiz data is stored with these keys:

```
quiz:{quiz-id}:active              → boolean (quiz enabled/disabled)
quiz:{quiz-id}:results             → array of all submissions
quiz:{quiz-id}:result:{phone}      → individual user result
```

Example for Week 3:
```
quiz:jcl-quiz-2025-wk3:active
quiz:jcl-quiz-2025-wk3:results
quiz:jcl-quiz-2025-wk3:result:9876543210
```

## Data Format

Each submission in `quiz:{id}:results` contains:

```json
{
  "name": "John Doe",
  "phone": "9876543210",
  "score": 8,
  "durationMs": 45000,
  "startedAt": "2025-11-23T07:45:00.000Z",
  "submittedAt": "2025-11-23T07:45:45.000Z"
}
```

## Troubleshooting

**Error: REDIS_URL not set**
- Make sure you've exported the environment variable
- Check Vercel dashboard for the correct URL

**Error: Connection refused**
- Verify the Redis URL is correct
- Check if Redis server is running
- Ensure firewall allows the connection

**Error: Module not found (ioredis)**
- Install dependencies: `npm install`
