#!/usr/bin/env bash
# ==============================================================================
# RenewIt - Zero Downtime Production Deployment Script
# ==============================================================================

set -e

echo "🚀 Starting RenewIt deployment..."

# Pull latest code
echo "📥 Pulling latest git changes..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies with pnpm..."
pnpm install --frozen-lockfile

# Generate Prisma Client
echo "⚙️ Generating Prisma Client..."
cd apps/web
if [ -f "prisma/schema.mysql.prisma" ] && grep -q "provider = \"mysql\"" prisma/schema.prisma 2>/dev/null; then
    pnpm run db:use-mysql
else
    pnpm exec prisma generate
fi

# Build Next.js application
echo "🏗️ Building Next.js production bundle..."
pnpm run build
cd ../..

# Reload PM2 cluster gracefully
echo "🔄 Reloading PM2 with zero-downtime..."
pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js

echo "✅ RenewIt deployed successfully!"
