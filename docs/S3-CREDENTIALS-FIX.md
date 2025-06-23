# S3 Credentials Caching Issue - Fixed

## Problem
The application was persistently using old AWS credentials (`AKIAXZ2C4CSS3S3XKLU2`) instead of the updated ones in `.env.local` (`AKIAZIFSNMIU6CGT6GCQ`), even after:
- Updating `.env.local`
- Restarting the Next.js development server
- Clearing the `.next` cache

## Root Causes

### 1. Module-Level S3 Client Initialization (Fixed)
The S3 client was being initialized at the module level in `src/lib/s3.ts`:

```typescript
// OLD CODE - PROBLEMATIC
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});
```

This caused the S3 client to be created **once** when the module was first imported, capturing whatever environment variables were available at that time.

### 2. Zombie Next.js Processes (THE MAIN ISSUE)
The real culprit was **zombie Next.js server processes** that were still running in the background with old environment variables cached. Even after "restarting" the server, these zombie processes would handle requests with the old credentials.

Found processes like:
```
Ben  99961 118.1  5.7 437870896 480000   ??  R    11:39AM 419:46.86 next-server (v15.3.4)
```

## Solution

### 1. Dynamic S3 Client Creation
Modified `src/lib/s3.ts` to create a new S3 client for each operation:

```typescript
// NEW CODE - FIXED
function createS3Client(): S3Client {
  console.log('🔄 Creating S3 client with current environment variables');
  console.log('📍 AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID);
  console.log('📍 AWS_REGION:', process.env.AWS_REGION);
  console.log('📍 S3_BUCKET_NAME:', process.env.S3_BUCKET_NAME);
  
  return new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });
}
```

### 2. Kill ALL Next.js Processes
Before restarting the server, ensure all Next.js processes are killed:

```bash
# Kill all Next.js processes
pkill -f "next"

# If processes persist, use stronger signal
ps aux | grep "next-server" | grep -v grep
kill -9 <PID>

# Verify all processes are gone
ps aux | grep "next" | grep -v grep
```

## How to Update Credentials (Correct Process)

1. Edit `.env.local` with new AWS credentials
2. **Kill ALL Next.js processes**: `pkill -f "next"`
3. Verify no zombie processes: `ps aux | grep "next" | grep -v grep`
4. Clear cache (optional): `rm -rf .next`
5. Start the server: `npm run dev`
6. The new credentials will be used immediately

## Why This Happened

1. **Process Management**: When you think you're "restarting" the server with Ctrl+C, sometimes the process doesn't fully terminate
2. **Background Processes**: Next.js can spawn multiple processes, and some may persist in the background
3. **Port Binding**: New server instances might fail to bind to port 3000 if a zombie process is using it, but the zombie process continues handling requests
4. **Environment Caching**: Next.js caches environment variables when the process starts, so zombie processes retain old values

## Prevention

To prevent this issue:
1. Always use `pkill -f "next"` instead of just Ctrl+C
2. Check for zombie processes before starting the server
3. Consider using a process manager like `nodemon` with proper cleanup
4. Add a startup script that kills existing processes

## Verification

Created a test endpoint that confirms which credentials are being used:
- ✅ Correct: `AKIAZIFSNMIU6CGT6GCQ`
- ❌ Old/Wrong: `AKIAXZ2C4CSS3S3XKLU2`

The debug logs in `createS3Client()` will show which credentials are being used for each S3 operation.

## Benefits
1. **No more credential caching**: Always uses the latest values from `.env.local`
2. **Better debugging**: Logs show which credentials are being used
3. **Immediate updates**: Changes to `.env.local` take effect after server restart
4. **No manual cache clearing needed**: No need to delete `.next` directory

## Performance Impact
Creating a new S3 client for each operation has minimal performance impact because:
- The S3 client is lightweight
- Operations are infrequent (only during course generation)
- Network latency dominates the total operation time

## Verification
The fix has been tested and verified to:
- ✅ Load correct credentials from `.env.local`
- ✅ Use fresh credentials after server restart
- ✅ Successfully upload images to S3
- ✅ Show debug logs with current credentials being used 