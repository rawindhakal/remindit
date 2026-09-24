# cPanel Managed Hosting (No SSH) — Complete Installation Guide

This guide is specifically designed for **cPanel Managed Shared Hosting** where you **do not have SSH or root terminal access**. 

Everything is completed **100% through the cPanel web interface** (File Manager, phpMyAdmin, MySQL Databases, and Setup Node.js App).

---

## 🎁 What Is Already Prepared For You

To avoid shared hosting memory errors (`npm install` or `next build` crashing due to low RAM on cPanel), the entire application has been **pre-compiled and packaged into a single ready-to-upload zip file**:

- **`cpanel-deploy.zip`** (located in your project root)
- **`renewit_mysql_dump.sql`** (pre-seeded with 33 categories, 19 system settings, and your Super Admin account)

You do **NOT** need to run any build commands or install dependencies on cPanel!

---

## 🗄️ Step 1: Create MySQL Database in cPanel

1. Log into your **cPanel**.
2. Under the **Databases** section, click **MySQL® Databases** (or **MySQL Database Wizard**).
3. **Create New Database**:
   - Example name: `renewit` (Full name will look like: `yourcpaneluser_renewit`).
   - Click **Create Database**.
4. **Create New User**:
   - Scroll down to **MySQL Users** -> **Add New User**.
   - Username: `dbadmin` (Full username will look like: `yourcpaneluser_dbadmin`).
   - Password: Click **Password Generator** or enter a strong password (copy this down!).
   - Click **Create User**.
5. **Add User To Database**:
   - Scroll down to **Add User to Database**.
   - Select your user (`yourcpaneluser_dbadmin`) and your database (`yourcpaneluser_renewit`).
   - Click **Add**.
   - In the next screen, check the box **ALL PRIVILEGES** and click **Make Changes**.

---

## 📥 Step 2: Import Database via phpMyAdmin

1. Return to the main cPanel dashboard and click **phpMyAdmin**.
2. In the left sidebar, click your database (`yourcpaneluser_renewit`).
3. Click the **Import** tab on the top navigation bar.
4. Under **File to import**, click **Choose File** and select **`renewit_mysql_dump.sql`** from your computer.
5. Scroll to the bottom and click **Go**.
6. ✅ You will see green success checkmarks: All 13 tables are created, 33 renewal categories seeded, 19 system settings loaded, and your Super Admin account initialized!

---

## 📁 Step 3: Upload Application via cPanel File Manager

1. In cPanel, click **File Manager**.
2. Decide where your app will live:
   - If hosting on your **primary domain** (`yourdomain.com`), navigate into `public_html`.
   - If hosting on a **subdomain** or dedicated directory (`renewit.yourdomain.com`), create a folder (e.g. `renewit`) in your home root.
3. Click the **Upload** button at the top of File Manager.
4. Select **`cpanel-deploy.zip`** from your computer.
5. Wait for the upload bar to reach **100% and turn green**.
6. Return to File Manager, right-click **`cpanel-deploy.zip`**, and click **Extract**.
7. Confirm extraction. You will see:
   - `server.js`
   - `.next/`
   - `public/`
   - `node_modules/`
   - `.env`
8. Delete `cpanel-deploy.zip` to save disk space.

---

## ⚙️ Step 4: Configure Database in `.env` File

1. In File Manager, click the **Settings** button in the top right corner and check **"Show Hidden Files (dotfiles)"**, then click **Save**.
2. Locate the **`.env`** file that was extracted.
3. Right-click **`.env`** and click **Edit**.
4. Update `DATABASE_URL` with the database name, username, and password you created in Step 1:
   ```env
   DATABASE_URL="mysql://yourcpaneluser_dbadmin:YourDbPassword@localhost:3306/yourcpaneluser_renewit"
   NEXTAUTH_URL="https://yourdomain.com"
   AUTH_URL="https://yourdomain.com"
   NEXT_PUBLIC_APP_URL="https://yourdomain.com"
   ```
   *(Keep `AUTH_SECRET`, `NEXTAUTH_SECRET`, and `AUTH_TRUST_HOST="true"` as they are).*
5. Click **Save Changes** and close the editor.

---

## 🚀 Step 5: Configure "Setup Node.js App" in cPanel

1. Return to the main cPanel dashboard and search for **Setup Node.js App** (in the *Software* section).
2. Click **Create Application**.
3. Fill in the form fields:
   - **Node.js version**: Choose `20.x` (or `18.x`).
   - **Application mode**: Select `Production`.
   - **Application root**: Enter the folder path where you extracted the files:
     - If in `public_html`, enter `public_html`.
     - If in a dedicated folder, enter `renewit`.
   - **Application URL**: Select your domain or subdomain from the dropdown.
   - **Application startup file**: Enter `server.js`.
4. Click **Create** in the top right corner.
5. Once created, click the **Restart** button at the top of the page.

---

## ⏰ Step 6: Set Up Automated Reminder Cron Job

RenewIt automatically handles reminder checks and dispatches emails and push notifications via its built-in API endpoint (`/api/scheduler`).

1. In cPanel, search for and click **Cron Jobs**.
2. Under **Add New Cron Job**:
   - **Common Settings**: Select **"Once Per Day (0 0 * * *)"** or set it to **8:00 AM** (`0 8 * * *`).
   - **Minute**: `0`
   - **Hour**: `8`
   - **Day**: `*`
   - **Month**: `*`
   - **Weekday**: `*`
3. In the **Command** field, enter:
   ```bash
   curl -s -X POST https://yourdomain.com/api/scheduler > /dev/null 2>&1
   ```
   *(Replace `https://yourdomain.com` with your actual website URL).*
4. Click **Add New Cron Job**.

---

## 🔒 Step 7: Enable HTTPS / SSL (Let's Encrypt in cPanel)

1. In cPanel, click **SSL/TLS Status** (or **Let's Encrypt SSL** / **AutoSSL**).
2. Check the box next to your domain.
3. Click **Run AutoSSL** (or Issue Free Certificate).
4. In cPanel **Domains**, toggle **Force HTTPS Redirect** to **ON**.

---

## 🔑 Step 8: Log In as Super Admin

Open your browser and navigate to:
👉 **`https://yourdomain.com/login`**

- **Email**: `rawindhakal@gmail.com`
- **Password**: `Admin123!@#`

Once logged in:
- Access your user dashboard: `/dashboard`
- Access your **Super Admin Panel**: `/admin` (to configure SMTP email settings, Google Login, Google Ads, and Push Notifications).

---

## 💡 How to Update in the Future (No SSH)

Whenever you have updates or code changes:
1. On your computer, run:
   ```bash
   ./scripts/package-cpanel.sh
   ```
2. Open cPanel **File Manager** and upload the new `cpanel-deploy.zip`.
3. Right-click and **Extract** (overwrite files).
4. In cPanel **Setup Node.js App**, click **Restart**.
