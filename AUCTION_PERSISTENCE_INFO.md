# Auction Data Persistence & Vercel Configuration

## ✅ Changes Made

### 1. Removed Group Display from Auction Player Cards
- **File**: `app/auction/page.tsx`
- **Change**: Removed the line showing `Group: {auctionGroup} • {auctionAgeCategory}`
- **Result**: Player cards now show only: Name, Age, Style, T-shirt, Contact, and 2024 Auction info

---

## 🗄️ Data Persistence Architecture

### Current KV Implementation (`lib/kv.ts`)

Your auction data **IS** persisting through a multi-tier KV (Key-Value) storage system:

#### **Tier 1: Upstash Redis (Production - Recommended)**
- If `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set in environment variables
- Provides **permanent, distributed storage** across all Vercel serverless functions
- **Survives deployments, restarts, and inactivity**
- This is the recommended production setup

#### **Tier 2: File-based Storage (Development/Fallback)**
- Falls back to file system if Upstash is not configured
- On **Vercel**: Uses `/tmp` directory (ephemeral - cleared on cold starts)
- On **local dev**: Uses `.data/kv.json` in project root (persistent across restarts)
- **Important**: On Vercel, this is NOT persistent across deployments or cold starts

#### **Tier 3: In-Memory (Last Resort)**
- Only used if both above fail
- Data lost on every restart
- Not suitable for production

### Current Storage Key
```typescript
const STATE_KEY = 'auction:state:v1'
```

All auction data (teams, sold players, retentions, unsold queue, owners) is stored under this single key.

---

## ⚠️ Vercel Serverless Function Behavior

### **Yes, Vercel DOES shut down after inactivity**

#### How Vercel Serverless Functions Work:

1. **Cold Starts**: After ~5-15 minutes of inactivity, serverless functions are shut down
2. **Warm Instances**: Active functions stay "warm" for a short period
3. **No Persistent File System**: The `/tmp` directory is cleared on cold starts
4. **Each Request May Hit a Different Instance**: Vercel scales horizontally

#### What This Means for Your Auction:

- **With Upstash Redis** ✅: Data persists indefinitely, even after weeks of inactivity
- **Without Upstash Redis** ❌: Data is lost after ~15 minutes of inactivity (when using file-based fallback on Vercel)

---

## 🔧 Recommended Setup for Production

### Option 1: Use Upstash Redis (Recommended)

1. **Create a free Upstash account**: https://upstash.com/
2. **Create a Redis database** (free tier available)
3. **Add environment variables to Vercel**:
   ```bash
   UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token-here
   ```
4. **Redeploy** your application

**Benefits**:
- ✅ Data persists forever
- ✅ Fast global access
- ✅ Free tier: 10,000 commands/day
- ✅ Automatic backups
- ✅ No cold start issues

### Option 2: Use Vercel KV (Alternative)

Vercel offers their own KV storage (powered by Upstash):

1. **Enable Vercel KV** in your project dashboard
2. Environment variables are auto-configured:
   ```bash
   KV_REST_API_URL
   KV_REST_API_TOKEN
   ```
3. Your code already supports this (see `lib/kv.ts` lines 63-64)

---

## 📊 Current Data Structure

Your auction state includes:

```typescript
{
  teams: {
    [teamName]: {
      budget: number
      players: Array<{ fullName, points, time }>
    }
  },
  sold: {
    [normalizedPlayerName]: { team, points, time }
  },
  owners: {
    [teamName]: { name, playing }
  },
  retentions: {
    [teamName]: Array<{ fullName, time }>
  },
  unsold: Array<{ fullName, time, rounds?, unassigned? }>
}
```

---

## 🚀 Vercel Deployment Limits & Quotas

### Free Tier (Hobby):
- **Function Execution**: 100 GB-hours/month
- **Function Duration**: 10 seconds max
- **Bandwidth**: 100 GB/month
- **Deployments**: Unlimited
- **Cold Start**: ~1-3 seconds

### Pro Tier:
- **Function Duration**: 60 seconds max
- **Bandwidth**: 1 TB/month
- **Priority support**

### Your Current Usage:
- Auction API calls are very lightweight (<100ms typically)
- Should easily fit within free tier limits
- Main concern: **Data persistence** (solved with Upstash/Vercel KV)

---

## 🔍 How to Verify Your Current Setup

Check which storage tier is active:

1. **Look at Vercel environment variables**:
   - If `UPSTASH_REDIS_REST_URL` exists → Using Upstash ✅
   - If `KV_REST_API_URL` exists → Using Vercel KV ✅
   - If neither → Using file-based (ephemeral on Vercel) ⚠️

2. **Test persistence**:
   - Make an auction change
   - Wait 20 minutes without any activity
   - Refresh the page
   - If data is still there → Persistent storage is working ✅

---

## 📝 Action Items

### To Ensure Data Persistence on Vercel:

1. **Set up Upstash Redis** (or enable Vercel KV)
2. **Add environment variables** to your Vercel project
3. **Redeploy** the application
4. **Test** by waiting 20+ minutes and verifying data persists

### Current Status:
- ✅ Code is ready for persistent storage
- ✅ Fallback mechanisms in place
- ⚠️ Need to verify environment variables are set on Vercel
- ✅ Group field removed from auction player cards

---

## 🛠️ Troubleshooting

### If auction data is lost after inactivity:

1. Check Vercel logs for KV initialization messages
2. Verify environment variables are set correctly
3. Ensure `@upstash/redis` package is installed (it is: v1.35.6)
4. Check if file-based fallback is being used (logs will show)

### If you see "Failed to read auction state":

1. Check Vercel function logs
2. Verify Redis credentials are correct
3. Ensure network access to Upstash is allowed

---

## 📚 Additional Resources

- [Upstash Redis Docs](https://docs.upstash.com/redis)
- [Vercel KV Docs](https://vercel.com/docs/storage/vercel-kv)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
