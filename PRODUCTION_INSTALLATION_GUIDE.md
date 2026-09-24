# RenewIt — Complete Step-by-Step Production Server Installation Guide

This guide provides an end-to-end walkthrough for deploying **RenewIt** on an **Ubuntu / Debian Linux production server** (VPS or Dedicated Server from DigitalOcean, AWS EC2, Hetzner, Linode, Vultr, etc.) using **Node.js 20**, **PM2**, **Nginx**, **MySQL / PostgreSQL**, and **Let's Encrypt SSL**.

---

## 📋 System Requirements

- **Operating System**: Ubuntu 22.04 LTS / 24.04 LTS or Debian 12
- **Memory (RAM)**: Minimum 1 GB (2 GB+ recommended for builds)
- **CPU**: 1 vCPU or more
- **Disk Space**: 10 GB+ SSD
- **A Domain Name**: Pointing your domain DNS `A` record to your server's public IP address (e.g. `yourdomain.com` -> `123.45.67.89`)

---

## 🛠️ Step 1: Update Server & Install Prerequisites

Connect to your server via SSH:

```bash
ssh root@your_server_ip
```

Update package lists and install essential build tools:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential ufw software-properties-common
```

---

## 🟢 Step 2: Install Node.js 20 LTS and pnpm

Install Node.js 20 LTS using the official NodeSource repository:

```bash
# Download and setup NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation (should show v20.x.x and npm 10.x.x)
node -v
npm -v

# Install pnpm and PM2 globally
sudo npm install -g pnpm pm2
```

---

## 🗄️ Step 3: Install and Configure Database

Choose either **Option A (MySQL / MariaDB)** or **Option B (PostgreSQL)**:

### Option A: MySQL 8 (Recommended if using MySQL)

1. **Install MySQL Server**:
   ```bash
   sudo apt install -y mysql-server
   sudo systemctl enable --now mysql
   ```

2. **Secure Installation & Create Database**:
   Log in to MySQL as root:
   ```bash
   sudo mysql
   ```

   Execute the following SQL commands (replace `YourStrongPasswordHere` with a secure password):
   ```sql
   CREATE DATABASE renewit_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'renewit_user'@'localhost' IDENTIFIED BY 'YourStrongPasswordHere';
   GRANT ALL PRIVILEGES ON renewit_prod.* TO 'renewit_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

3. **Import Database Structure & Seed Data**:
   The repository includes a ready-to-run SQL dump pre-loaded with **33 categories**, **19 system settings**, and your **Super Admin** account:
   *(We will import this in Step 5 after cloning the repo).*

---

### Option B: PostgreSQL (Alternative)

If you prefer PostgreSQL:
```bash
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres psql -c "CREATE DATABASE renewit_prod;"
sudo -u postgres psql -c "CREATE USER renewit_user WITH ENCRYPTED PASSWORD 'YourStrongPasswordHere';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE renewit_prod TO renewit_user;"
sudo -u postgres psql -d renewit_prod -c "GRANT ALL ON SCHEMA public TO renewit_user;"
```

---

## 📥 Step 4: Clone the Repository & Configure Environment

Create an application directory (e.g. `/var/www/renewit`):

```bash
sudo mkdir -p /var/www/renewit
sudo chown -R $USER:$USER /var/www/renewit
cd /var/www/renewit

# Clone the repository
git clone https://github.com/rawindhakal/remindit.git .
```

### Create the Production `.env` File

Copy the template and edit it:

```bash
cp .env.example .env
nano .env
```

Paste and adjust the following production values:

```env
# ─── Database (Choose MySQL or PostgreSQL) ───────────────────────
# For MySQL (Option A):
DATABASE_URL="mysql://renewit_user:YourStrongPasswordHere@localhost:3306/renewit_prod"

# Or For PostgreSQL (Option B):
# DATABASE_URL="postgresql://renewit_user:YourStrongPasswordHere@localhost:5432/renewit_prod?sslmode=disable"

# ─── Authentication (NextAuth / Auth.js) ─────────────────────────
NEXTAUTH_URL="https://yourdomain.com"
AUTH_URL="https://yourdomain.com"
AUTH_SECRET="c7e4b9a8f21d3e6a5b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a"
NEXTAUTH_SECRET="c7e4b9a8f21d3e6a5b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a"
AUTH_TRUST_HOST="true"

# ─── Application Configuration ───────────────────────────────────
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NODE_ENV="production"
PORT=3000

# ─── PWA Web Push (Pre-configured) ──────────────────────────────
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BPCP8QkDDz7Z1sWG9UDLLOLUfnSPaAdTjm4p6w5wlQWm3Bw_QSlnGaBAp1nvdIpxweH0FlcGwyqCm5Oy3wQ13H8"
VAPID_PRIVATE_KEY="dR0F10ONJQ9ILKcSNoKWZDl3DbTVAegKYOiPm-arteA"
VAPID_SUBJECT="mailto:support@yourdomain.com"
```

Save and exit in nano (`Ctrl + O`, `Enter`, then `Ctrl + X`).

---

## 🏗️ Step 5: Install Dependencies, Prepare Database & Build

1. **Install Dependencies**:
   ```bash
   pnpm install
   ```

2. **Initialize Database**:
   - **If using MySQL**:
     Import the pre-seeded dump file directly:
     ```bash
     mysql -u renewit_user -p renewit_prod < renewit_mysql_dump.sql
     ```
     *(Enter `YourStrongPasswordHere` when prompted).*

     Then switch Prisma to MySQL:
     ```bash
     cd apps/web
     pnpm run db:use-mysql
     cd ../..
     ```

   - **If using PostgreSQL**:
     Push schema and seed database:
     ```bash
     cd apps/web
     pnpm exec prisma db push
     cd ../..
     pnpm run db:seed
     ```

3. **Build the Next.js Production Bundle**:
   ```bash
   cd apps/web
   pnpm run build
   cd ../..
   ```

---

## 🚀 Step 6: Start Application with PM2

We use **PM2** to run RenewIt in cluster mode across CPU cores, restart on crash, and start automatically when the server boots.

The pre-configured `ecosystem.config.js` is already in the root folder.

1. **Start the app with PM2**:
   ```bash
   pm2 start ecosystem.config.js
   ```

2. **Verify status**:
   ```bash
   pm2 status
   pm2 logs renewit --lines 20
   ```

3. **Configure PM2 to automatically restart on system boot**:
   ```bash
   pm2 startup
   ```
   *(Copy and run the `sudo env PATH=...` command that PM2 prints).*

   Then save the current PM2 state:
   ```bash
   pm2 save
   ```

---

## 🌐 Step 7: Configure Nginx as Reverse Proxy

1. **Install Nginx**:
   ```bash
   sudo apt install -y nginx
   sudo systemctl enable --now nginx
   ```

2. **Create Nginx Configuration**:
   ```bash
   sudo nano /etc/nginx/sites-available/renewit
   ```

   Paste the following configuration (replace `yourdomain.com` with your actual domain):

   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;

       client_max_body_size 25M;

       # Cache static Next.js assets aggressively
       location /_next/static/ {
           proxy_pass http://127.0.0.1:3000;
           proxy_cache_valid 200 365d;
           proxy_set_header Host $host;
           add_header Cache-Control "public, max-age=31536000, immutable";
       }

       # Static public files (icons, manifest, etc.)
       location ~* \.(ico|css|js|gif|jpe?g|png|svg|woff2?|json)$ {
           proxy_pass http://127.0.0.1:3000;
           proxy_set_header Host $host;
           add_header Cache-Control "public, max-age=86400";
       }

       # Pass all dynamic requests to Next.js
       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
           proxy_read_timeout 60s;
           proxy_connect_timeout 60s;
       }
   }
   ```

3. **Enable Site & Test Configuration**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/renewit /etc/nginx/sites-enabled/
   # Remove default Nginx welcome page
   sudo rm -f /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

## 🔒 Step 8: Secure with Free SSL Certificate (Let's Encrypt)

Install **Certbot** for automatic HTTPS and SSL renewals:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Obtain and apply SSL certificate automatically:

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

- Enter your email address for renewal notices.
- Agree to terms (`Y`).
- Choose redirect HTTP to HTTPS (`Yes`).

Certbot will automatically install the certificate and set up an auto-renewal timer. Verify with:
```bash
sudo systemctl status certbot.timer
```

---

## ⏰ Step 9: Configure Automated Daily Reminder Cron

RenewIt has a built-in scheduler endpoint (`/api/scheduler`) that checks expiring reminders and dispatches emails and push notifications.

Open the system crontab:

```bash
crontab -e
```

Add this line to run daily at **8:00 AM**:

```cron
0 8 * * * curl -s -X POST https://yourdomain.com/api/scheduler > /dev/null 2>&1
```

Save and exit.

---

## 🛡️ Step 10: Configure Firewall (UFW)

Secure your server by allowing only SSH, HTTP, and HTTPS:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo ufw status
```

---

## 🔄 Step 11: How to Deploy Future Updates (Zero Downtime)

When you make changes to your GitHub repository, update your production server seamlessly using the included deployment script:

```bash
cd /var/www/renewit
./scripts/deploy-production.sh
```

This single command will:
1. Pull latest git commits from `main`.
2. Install new dependencies.
3. Re-generate Prisma Client.
4. Build the Next.js production app.
5. Reload PM2 worker processes with **zero downtime**.

---

## 🔑 Super Admin Credentials

After completing the installation, log into your new site:

- **Login URL**: `https://yourdomain.com/login`
- **Super Admin Email**: `rawindhakal@gmail.com`
- **Password**: `Admin123!@#`

Navigate to:
- **Dashboard**: `https://yourdomain.com/dashboard`
- **Super Admin Suite**: `https://yourdomain.com/admin` (to configure SMTP emails, Google Login, Google Ads, and Push Notifications).
