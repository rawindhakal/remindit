# 📱 RenewIt Flutter Mobile Application Guide (Android & iOS)

A complete, production-ready Flutter mobile application for **Android** and **iOS** that connects directly to your **RenewIt backend running on your shared VPS or cPanel server**.

---

## 🏗️ Architecture & Overview

- **Project Location**: `apps/mobile/`
- **Supported Platforms**: **Android** (Phone/Tablet) & **iOS** (iPhone/iPad) & **macOS** (Desktop testing)
- **Framework**: Flutter 3.47+ / Dart 3.13+
- **Backend API**: Connects to the same RenewIt server stored on your shared VPS (`/api/mobile/...`)
- **Authentication**: JWT Bearer Tokens (`Authorization: Bearer <token>`) with persistent session in secure storage.
- **Document Scanner**: Uses native mobile camera and photo gallery to capture bluebooks, driving licenses, and citizenship certificates, then uploads them directly to `/uploads` on your shared VPS.

---

## 📱 Features Included

1. **Multi-Platform Adaptive UI**:
   - Modern Material 3 theme in RenewIt primary blue (`#2563EB`).
   - Clean cards, dark/light contrast, and fluid transitions.
2. **Server & VPS Configuration**:
   - In-app **VPS Server URL Switcher** on the Login and Settings screens.
   - Built-in **"Test Connection" ping tool** to verify your VPS is reachable before logging in.
   - Works seamlessly with production VPS domains (`https://renewit.yourdomain.com`) or local IP (`http://10.0.2.2:3000` / `http://192.168.x.x:3000`).
3. **Authentication**:
   - Sign In & Sign Up with email & password.
   - Automatic token persistence and silent auto-login on app restart.
4. **Dashboard**:
   - Personalized greeting & date display.
   - Interactive Summary Cards: **Active**, **Due Soon**, **Expiring Today**, and **Expired**. Tapping filters the reminders list!
   - **Upcoming Renewals** and **Needs Attention** sections.
5. **Reminders Hub**:
   - Real-time search across titles, owners, providers, and policy numbers.
   - Horizontal status filter tabs: **All | Due Soon | Today | Expired | Active**.
   - Category filtering chips for all 33 document types.
   - Status badges with live countdowns (*"5 days left"*, *"Expires Today"*, *"Expired 2d ago"*).
6. **Add & Edit Reminder**:
   - Category selector with icon and group tags.
   - Date picker for expiry and start dates.
   - Owner name, reference number, issuer/provider, and notes.
   - Configurable notification schedule intervals (90d, 60d, 30d, 15d, 7d, 3d, 1d, Expiry Day).
7. **Mobile Document Scanner & Camera**:
   - **Scan with Camera**: Take real-time high-res photos of bluebooks, licenses, and passports.
   - **From Gallery**: Attach existing saved document scans.
   - Direct multipart upload to your VPS server's `/uploads` folder.
   - Fullscreen **pinch-to-zoom image viewer** with multi-document thumbnail gallery.
8. **Renewal Management**:
   - **"Mark as Renewed" modal**: Quick one-tap renewal that logs renewal history with timestamp and notes, recalculating the new expiry date.
   - Full audit trail of previous renewals.
9. **Monthly Renewal Calendar**:
   - Visual calendar grid highlighting days with expiring documents using indicator dots.
   - Select any day to see its expiration agenda.
10. **Settings & Profile**:
    - User account info & role badge.
    - Notification preferences toggles (Email notifications, Expiry day alerts, Overdue reminders, Weekly digest).
    - Sign out with confirmation.

---

## 🚀 Running the App Locally

Ensure you are inside the `apps/mobile` directory:

```bash
cd apps/mobile
```

### 1. Run on Android Device or Emulator
```bash
flutter run -d android
```

### 2. Run on iOS Simulator or Device
```bash
flutter run -d ios
```

### 3. Run on macOS Desktop (Instant Testing)
```bash
flutter run -d macos
```

---

## 🛠️ Building Release Binaries

### Android (APK & App Bundle for Google Play)

1. **Build Universal Release APK** (for direct installation / sideloading):
   ```bash
   flutter build apk --release
   ```
   *Output*: `apps/mobile/build/app/outputs/flutter-apk/app-release.apk`

2. **Build Split Per-ABI APKs** (smaller file sizes):
   ```bash
   flutter build apk --split-per-abi --release
   ```

3. **Build Google Play App Bundle (`.aab`)**:
   ```bash
   flutter build appbundle --release
   ```
   *Output*: `apps/mobile/build/app/outputs/bundle/release/app-release.aab`

---

### iOS (IPA & TestFlight / App Store)

1. Open Xcode workspace:
   ```bash
   open ios/Runner.xcworkspace
   ```
2. Select your Apple Developer Team in **Signing & Capabilities**.
3. Build the release IPA:
   ```bash
   flutter build ipa --release
   ```

---

## 🌐 Connecting the Mobile App to Your VPS Server

When opening the app for the first time:

1. On the **Sign In** screen, tap the **Server Settings** icon (top right) or bottom text.
2. Enter your shared VPS / cPanel domain:
   ```text
   https://renewit.yourdomain.com
   ```
3. Tap **Test Connection** to confirm connectivity.
4. Tap **Save**.
5. Log in with your credentials (e.g. `rawindhakal@gmail.com` / `Admin123!@#`) or tap **Create one** to register.
