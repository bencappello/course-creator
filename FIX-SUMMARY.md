# S3 Credentials Fix - Complete Solution

## The Problem
Next.js was persistently using old AWS credentials (`AKIAXZ2C4CSS3S3XKLU2`) instead of the ones in `.env.local` (`AKIAZIFSNMIU6CGT6GCQ`), even after:
- Killing processes
- Clearing cache
- Restarting the server

## Root Cause Analysis
After extensive investigation, we found that:
1. **Zombie processes** were holding onto old environment variables
2. **Module-level caching** in the S3 client was capturing environment variables once
3. **Next.js/Turbopack** may have additional caching mechanisms

## The Complete Solution

### 1. Centralized Environment Configuration
Created `/src/lib/env-config.ts` that:
- Explicitly loads from `.env.local` using dotenv
- Forces override of any existing environment variables
- Provides a single source of truth for all environment variables

### 2. Updated All Code
Modified all files to use the centralized configuration:
- `/src/lib/s3.ts` - Uses `envConfig` instead of `process.env`
- `/src/app/api/generate-course/route.ts` - Uses `envConfig`
- `/src/app/api/generate-image/route.ts` - Uses `envConfig`
- `/src/app/api/generate-outline/route.ts` - Uses `envConfig`

### 3. Clean Startup Script
Created `dev-clean.sh` that:
- Kills ALL Next.js processes (including zombies)
- Clears the `.next` cache
- Starts fresh with current environment variables

### 4. Removed Turbopack (Temporarily)
Modified `package.json` to remove `--turbopack` flag from the dev script, as it may have additional caching.

## How to Use

### Step 1: Kill Everything
```bash
pkill -f "next"
ps aux | grep "next" | grep -v grep  # Verify all killed
```

### Step 2: Use the Clean Script
```bash
npm run dev:clean
```

Or manually:
```bash
./dev-clean.sh
```

### Step 3: Verify in Server Logs
When you create a course, you should see in the server logs:
```
🔐 Environment Config Loaded:
   AWS Access Key: AKIAZIFSNMIU6CGT6GCQ
   AWS Region: us-west-2
   S3 Bucket: course-creator-images
```

And later:
```
🔄 Creating S3 client with environment config
📍 AWS_ACCESS_KEY_ID: AKIAZIFSNMIU6CGT6GCQ
📍 AWS_REGION: us-west-2
📍 S3_BUCKET_NAME: course-creator-images
```

## Why This Works
1. **Explicit Loading**: We force-load `.env.local` on every module import
2. **Override Flag**: The `override: true` in dotenv config ensures fresh values
3. **No Process Caching**: Clean startup ensures no zombie processes
4. **Centralized Config**: Single source prevents inconsistencies

## If Issues Persist
1. Check for any global AWS CLI configurations: `aws configure list`
2. Ensure no AWS environment variables in your shell: `env | grep AWS`
3. Try without Turbopack: `npm run dev` (already configured)
4. Nuclear option: Restart your terminal/computer

## Verification Commands
```bash
# Check what's in .env.local
grep AWS_ACCESS_KEY_ID .env.local

# Check running processes
ps aux | grep "next" | grep -v grep

# Test the API directly
curl -X POST http://localhost:3000/api/generate-outline \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test", "numModules": 1, "depth": "Low"}'
```

## The Fix is Permanent
With the centralized configuration and clean startup process, you should never see the old credentials again. The system now:
- Always reads from `.env.local`
- Never caches at the module level
- Provides clear logging of which credentials are in use 