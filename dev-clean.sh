#!/bin/bash

# Clean development server startup script
# Ensures no zombie processes with old environment variables

echo "🧹 Clean Dev Server Startup"
echo "=========================="
echo ""

# 1. Kill any existing Next.js processes
echo "→ Killing any existing Next.js processes..."
pkill -f "next" 2>/dev/null || true
sleep 1

# 2. Double-check for stubborn processes
ZOMBIES=$(ps aux | grep -E "next-server|next dev" | grep -v grep)
if [ ! -z "$ZOMBIES" ]; then
  echo "⚠️  Found stubborn Next.js processes:"
  echo "$ZOMBIES"
  echo "→ Force killing..."
  ps aux | grep -E "next-server|next dev" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null || true
  sleep 1
fi

# 3. Verify all processes are gone
if ps aux | grep -E "next-server|next dev" | grep -v grep > /dev/null; then
  echo "❌ ERROR: Failed to kill all Next.js processes!"
  exit 1
else
  echo "✅ All Next.js processes cleared"
fi

# 4. Clear cache (optional but recommended)
echo "→ Clearing Next.js cache..."
rm -rf .next
echo "✅ Cache cleared"

# 5. Start the development server
echo ""
echo "🚀 Starting clean development server..."
echo "📍 Environment: .env.local"
echo ""
npm run dev 