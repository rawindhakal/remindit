# RenewIt - Shared Hosting (cPanel) & MySQL Deployment Guide

This guide explains how to host **RenewIt** on any shared hosting provider (such as **cPanel**, **Hostinger**, **Namecheap**, **Bluehost**, etc.) using **MySQL** and **Node.js**.

---

## 📦 What Has Been Prepared

1. **`renewit_mysql_dump.sql`**: A complete, 1-click importable MySQL database dump.
   - Pre-creates all 13 database tables with proper indexing and foreign keys.
   - Compatible with **MySQL 5.7+**, **MySQL 8.0+**, and **MariaDB 10.3+**.
   - **Pre-seeded**:
     - **33 Categories** with icons, colors, and default notification schedules.
     - **19 System Settings** (Email, Google Auth, Google Ads, Web Push).
     - **Super Admin Account**: `rawindhakal@gmail.com` / `Admin123!@#`.
2. **`prisma/schema.mysql.prisma`**: Prisma schema configured with `provider = "mysql"`.
3. **`server.js`**: Custom entry point for cPanel's Phusion Passenger Node.js runner.

---

## 🗄️ Step 1: Create & Import the MySQL Database

### 1.1 Create Database in cPanel
1. Log into your cPanel account.
2. Go to **MySQL® Databases** (or **MySQL Database Wizard**).
3. Create a new database, e.g., `yourcpaneluser_renewit`.
4. Create a new MySQL user, e.g., `yourcpaneluser_admin`, with a strong password.
5. Add the user to the database and check **ALL PRIVILEGES**.

### 1.2 Import the SQL Dump via phpMyAdmin
1. In cPanel, click **phpMyAdmin**.
2. Select your newly created database in the left sidebar.
3. Click the **Import** tab at the top.
4. Click **Choose File** and select `renewit_mysql_dump.sql` (found in the root of the project).
5. Click **Go** at the bottom.
6. All tables, settings, categories, and your super admin account will be created immediately!

---

## ⚙️ Step 2: Configure Environment Variables

Create a file named `.env` in your project folder (or configure them in the cPanel Node.js interface):

```env
# ─── Database (MySQL) ───────────────────────────────────────────
DATABASE_URL="mysql://yourcpaneluser_admin:YourDbPassword@localhost:3306/yourcpaneluser_renewit"

# ─── NextAuth Authentication ────────────────────────────────────
NEXTAUTH_URL="https://yourdomain.com"
AUTH_URL="https://yourdomain.com"
AUTH_SECRET="c7e4b9a8f21d3e6a5b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a"
NEXTAUTH_SECRET="c7e4b9a8f21d3e6a5b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a"
AUTH_TRUST_HOST="true"

# ─── App URL ────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NODE_ENV="production"
PORT=3000

# ─── PWA Web Push (Optional / Default keys provided) ────────────
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BPCP8QkDDz7Z1sWG9UDLLOLUfnSPaAdTjm4p6w5wlQWm3Bw_QSlnGaBAp1nvdIpxweH0FlcGwyqCm5Oy3wQ13H8"
VAPID_PRIVATE_KEY="dR0F10ONJQ9ILKcSNoKWZDl3DbTVAegKYOiPm-arteA"
VAPID_SUBJECT="mailto:support@yourdomain.com"
```

---

## 🚀 Step 3: Set Up Node.js App in cPanel

1. In cPanel, click **Setup Node.js App** (CloudLinux / Passenger).
2. Click **Create Application**.
3. Fill in the details:
   - **Node.js version**: Choose `20.x` (or `18.x`).
   - **Application mode**: `Production`.
   - **Application root**: Path to your uploaded files (e.g. `renewit` or `public_html/renewit`).
   - **Application URL**: Select your domain or subdomain (e.g. `renewit.yourdomain.com`).
   - **Application startup file**: `apps/web/server.js` (or `server.js` if uploaded directly).
4. Click **Create**.
5. Once created, copy the virtual environment command shown at the top of the page, e.g.:
   ```bash
   source /home/youruser/nodevenv/renewit/20/bin/activate && cd /home/youruser/renewit
   ```
6. Open cPanel **Terminal** (or SSH) and run that command.
7. Run the switch script to generate the MySQL Prisma client:
   ```bash
   cd apps/web
   pnpm run db:use-mysql
   pnpm run build
   ```
   *(Or if using npm: `cp prisma/schema.mysql.prisma prisma/schema.prisma && npx prisma generate && npm run build`)*
8. Go back to cPanel **Setup Node.js App** and click **Restart Application**.

---

## ⏰ Step 4: Set Up Daily Reminder Cron Job

On shared hosting, background workers (Redis/BullMQ) are typically not needed because RenewIt includes a built-in HTTP cron endpoint (`/api/scheduler`).

1. In cPanel, go to **Cron Jobs**.
2. Set the schedule to run once every day at **08:00 AM** (`0 8 * * *`).
3. Set the command:
   ```bash
   curl -s -X POST https://yourdomain.com/api/scheduler > /dev/null 2>&1
   ```
4. This will process all renewals expiring today, send email reminders, and dispatch web push notifications!

---

## 🔑 Default Login Credentials

- **URL**: `https://yourdomain.com/login`
- **Super Admin Email**: `rawindhakal@gmail.com`
- **Password**: `Admin123!@#`

You can change your password immediately after logging in from **Settings > Security** or from the **Admin Panel** at `/admin`.
