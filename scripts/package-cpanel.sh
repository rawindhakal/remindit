#!/usr/bin/env bash
# ==============================================================================
# RenewIt - Build & Package for cPanel Managed Hosting (No SSH Required)
# ==============================================================================

set -e

echo "📦 Preparing RenewIt for cPanel Managed Hosting (No SSH)..."

# Step 1: Switch Prisma schema to MySQL
echo "⚙️ Switching database schema to MySQL..."
cp apps/web/prisma/schema.mysql.prisma apps/web/prisma/schema.prisma

# Step 2: Generate Prisma Client for MySQL
echo "🔨 Generating Prisma client for MySQL..."
cd apps/web
DATABASE_URL="mysql://user:pass@localhost:3306/db" pnpm exec prisma generate

# Step 3: Build Next.js with standalone output
echo "🏗️ Building Next.js standalone production bundle..."
NEXT_STANDALONE=true pnpm run build
cd ../..

# Step 4: Assemble the deployment package
echo "📁 Assembling standalone deployment package..."
rm -rf dist-cpanel cpanel-deploy.zip
mkdir -p dist-cpanel

# Copy standalone build
cp -R apps/web/.next/standalone/apps/web/* dist-cpanel/
if [ -d "apps/web/.next/standalone/node_modules" ]; then
    cp -R apps/web/.next/standalone/node_modules dist-cpanel/
fi

# Copy static assets (required by Next.js standalone)
mkdir -p dist-cpanel/.next/static
cp -R apps/web/.next/static/* dist-cpanel/.next/static/

# Copy public folder (icons, manifest, sw.js)
mkdir -p dist-cpanel/public
cp -R apps/web/public/* dist-cpanel/public/

# Copy MySQL database dump and cPanel env template
cp renewit_mysql_dump.sql dist-cpanel/
cp apps/web/prisma/schema.mysql.prisma dist-cpanel/schema.prisma

# Create the .env template inside the package
cat << 'EOF' > dist-cpanel/.env
# Replace with your cPanel MySQL database credentials:
DATABASE_URL="mysql://YOUR_CPANEL_USER_dbuser:YOUR_PASSWORD@localhost:3306/YOUR_CPANEL_USER_dbname"

# Replace with your actual domain name (https://yourdomain.com):
NEXTAUTH_URL="https://yourdomain.com"
AUTH_URL="https://yourdomain.com"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# Keep these security secrets:
AUTH_SECRET="c7e4b9a8f21d3e6a5b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a"
NEXTAUTH_SECRET="c7e4b9a8f21d3e6a5b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a"
AUTH_TRUST_HOST="true"
NODE_ENV="production"
PORT=3000

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BPCP8QkDDz7Z1sWG9UDLLOLUfnSPaAdTjm4p6w5wlQWm3Bw_QSlnGaBAp1nvdIpxweH0FlcGwyqCm5Oy3wQ13H8"
VAPID_PRIVATE_KEY="dR0F10ONJQ9ILKcSNoKWZDl3DbTVAegKYOiPm-arteA"
VAPID_SUBJECT="mailto:support@yourdomain.com"
EOF

# Step 5: Zip into ready-to-upload archive
echo "🗜️ Creating cpanel-deploy.zip..."
cd dist-cpanel
zip -q -r ../cpanel-deploy.zip . -x "*.DS_Store"
cd ..
rm -rf dist-cpanel

# Restore PostgreSQL schema for local dev
git checkout apps/web/prisma/schema.prisma

echo ""
echo "🎉 SUCCESS: cpanel-deploy.zip is ready!"
echo "📍 Location: $(pwd)/cpanel-deploy.zip"
echo "📏 Size: $(du -sh cpanel-deploy.zip | awk '{print $1}')"
echo ""
echo "👉 You can now upload cpanel-deploy.zip directly via cPanel File Manager!"
