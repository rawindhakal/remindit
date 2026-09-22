# Renewal Reminder System — Full System Design

## 1. Product Overview

**Product name:** Renewal Reminder System  
**Purpose:** A simple, secure web/mobile-friendly application where users store all important renewal and expiry dates in one place and automatically receive reminders before documents, policies, subscriptions, warranties, and other recurring obligations expire.

### Primary examples in Nepal

- Driving License
- Bluebook / Vehicle Tax
- Vehicle Insurance
- Passport
- Citizenship-related document reminders
- National ID-related reminders
- PAN / business renewal reminders
- Company registration / license renewals
- Health / life / travel insurance
- Bank card expiry
- Domain and hosting renewal
- Software subscriptions
- OTT subscriptions
- Mobile/internet plans
- Product warranties
- AMC/service contracts
- Memberships
- School/college-related renewals
- Custom user-defined reminders

The system should not attempt to determine whether a document is legally valid. It stores dates supplied by the user and reminds them according to their configured schedule.

---

# 2. Product Goals

## 2.1 Core goals

1. Store every renewal/expiry date in one dashboard.
2. Make adding a reminder extremely fast.
3. Automatically calculate remaining days.
4. Send email reminders before expiry.
5. Allow different reminder schedules per item.
6. Support recurring renewals.
7. Support multiple people, vehicles, assets, and categories.
8. Store optional document attachments.
9. Provide clear status:
   - Active
   - Due Soon
   - Expiring Today
   - Expired
   - Renewed
10. Preserve renewal history.
11. Work well on mobile.
12. Keep the interface understandable for non-technical users.

## 2.2 Non-goals

The MVP does not need:

- Government portal automation
- Automatic legal verification
- Automatic payment of taxes
- Automatic renewal on government websites
- OCR as a mandatory feature
- Complex accounting
- Social networking
- Public sharing of private documents

These can be added later.

---

# 3. Target Users

## Individual users

People managing:

- Personal documents
- Family documents
- Vehicles
- Insurance
- Subscriptions
- Warranties

## Family users

One account can manage reminders for:

- Self
- Spouse
- Children
- Parents
- Other family members

## Business users

Businesses can track:

- Company licenses
- Vehicle documents
- Insurance
- Domain renewals
- Software subscriptions
- Contracts
- Employee-related expiries
- Equipment warranties

---

# 4. Product Principles

### Principle 1 — Add in seconds

The user should be able to create a reminder with:

> Category → Name → Expiry Date → Save

Everything else is optional.

### Principle 2 — Never overwhelm

The dashboard should immediately answer:

- What is expiring?
- When?
- What needs attention?

### Principle 3 — Email-first reliability

Email should be a first-class notification channel.

### Principle 4 — User-controlled reminders

Users choose:

- Reminder dates
- Email on/off
- Recurrence
- Notification preferences

### Principle 5 — Privacy by default

Private documents and sensitive information should never be publicly accessible.

---

# 5. Suggested Technology Stack

## Frontend

Recommended:

- Next.js
- React
- JavaScript
- Tailwind CSS
- shadcn/ui or equivalent accessible component system
- React Hook Form
- Zod
- TanStack Query

A Progressive Web App (PWA) should be supported.

## Backend

Recommended:

- Node.js
- NestJS or Express
- REST API
- JavaScript

Alternative:

- Laravel + PHP

For a new SaaS product, Node.js/NestJS is recommended if the team prefers a JavaScript full-stack architecture.

## Database

- PostgreSQL

Why PostgreSQL:

- Strong relational model
- Date/time support
- Reliable transactions
- JSON support
- Good indexing
- Suitable for SaaS growth

## Cache / Queue

- Redis
- BullMQ

Used for:

- Reminder jobs
- Email queues
- Retry handling
- Scheduled processing

## Email

Use a transactional email provider such as:

- Amazon SES
- Resend
- SendGrid
- Postmark

The application should implement an email-provider abstraction so the provider can be changed later.

## File storage

- AWS S3
- Cloudflare R2
- Supabase Storage

Documents should never be stored directly inside PostgreSQL.

## Authentication

Recommended:

- Email/password
- Google login
- Email verification
- Password reset
- Optional passkey later
- Optional 2FA later

## Deployment

Suggested:

- Frontend: Vercel
- API: AWS / Railway / Render / Fly.io
- PostgreSQL: managed PostgreSQL
- Redis: managed Redis
- Storage: S3/R2
- Email: SES/Resend

---

# 6. High-Level Architecture

```text
                    ┌─────────────────────┐
                    │      User           │
                    │ Web / Mobile / PWA  │
                    └──────────┬──────────┘
                               │ HTTPS
                               ▼
                    ┌─────────────────────┐
                    │    Next.js App      │
                    │ UI + PWA            │
                    └──────────┬──────────┘
                               │ REST API
                               ▼
                    ┌─────────────────────┐
                    │   Backend API       │
                    │ Node.js / NestJS    │
                    └──────┬──────┬───────┘
                           │      │
              ┌────────────┘      └─────────────┐
              ▼                                  ▼
       ┌───────────────┐                 ┌──────────────┐
       │ PostgreSQL    │                 │ Redis        │
       │ Main Database │                 │ Queue/Cache  │
       └───────────────┘                 └──────┬───────┘
                                                │
                                                ▼
                                       ┌────────────────┐
                                       │ Reminder Worker│
                                       └───────┬────────┘
                                               │
                                               ▼
                                       ┌────────────────┐
                                       │ Email Provider │
                                       └───────┬────────┘
                                               │
                                               ▼
                                         User's Email
```

---

# 7. Core Modules

## 7.1 Authentication

Features:

- Registration
- Login
- Logout
- Email verification
- Forgot password
- Reset password
- Google OAuth
- Session management
- Account deletion

---

# 8. Dashboard

The dashboard is the most important screen.

## Top section

```text
Good morning, Rabin

You have 3 renewals coming up.

[ + Add Reminder ]
```

## Summary cards

```text
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│     12     │ │      3     │ │      1     │ │      2     │
│   Active   │ │  Due Soon  │ │  Today     │ │  Expired   │
└────────────┘ └────────────┘ └────────────┘ └────────────┘
```

## Upcoming section

```text
UPCOMING

🚗 Vehicle Insurance
   BA 01 PA 1234
   Expires in 7 days
   Sep 25, 2026

🪪 Driving License
   Rabin Dhakal
   Expires in 24 days
   Oct 12, 2026

📘 Passport
   Rabin Dhakal
   Expires in 63 days
   Nov 20, 2026
```

---

# 9. Status Logic

The system calculates status from the expiry date.

## Active

More than 30 days remaining.

## Due Soon

1–30 days remaining.

## Today

Expiry date equals today's date.

## Expired

Expiry date is before today.

The exact thresholds should be configurable in the future.

### Example

```text
Expiry: 2026-09-25
Today:   2026-09-18

Remaining: 7 days
Status: Due Soon
```

---

# 10. Reminder Creation Flow

Click:

> + Add Reminder

Open a simple form.

## Step 1 — Select category

```text
What do you want to track?

[ Driving License ]
[ Vehicle / Bluebook ]
[ Insurance ]
[ Passport ]
[ Warranty ]
[ Subscription ]
[ Other ]
```

## Step 2 — Basic details

```text
Name
Driving License

For
Rabin Dhakal

Expiry Date
[ 25 / 10 / 2026 ]

Notes
[ Optional ]
```

## Step 3 — Reminder settings

```text
Email reminders

☑ 90 days before
☑ 60 days before
☑ 30 days before
☑ 15 days before
☑ 7 days before
☑ 3 days before
☑ 1 day before
☑ On expiry date
```

## Step 4 — Save

```text
[ Save Reminder ]
```

The user should not be required to configure advanced settings.

---

# 11. Category System

Each category has an icon, color token, and optional default fields.

## Documents

- Driving License
- Passport
- National ID
- Citizenship
- Visa
- Work Permit
- Other Document

## Vehicle

- Bluebook
- Vehicle Tax
- Vehicle Insurance
- Pollution/Emission-related reminder
- Fitness/inspection reminder
- Service reminder

## Insurance

- Vehicle Insurance
- Health Insurance
- Life Insurance
- Travel Insurance
- Property Insurance
- Other

## Subscription

- Internet
- Mobile
- Netflix/OTT
- Software
- Domain
- Hosting
- Membership
- Other

## Warranty

- Phone
- Laptop
- Vehicle
- Appliance
- Electronics
- Equipment
- Other

## Business

- Company registration
- Business license
- PAN/VAT-related reminder
- Contract expiry
- Domain
- Software license
- Employee certificate
- Other

---

# 12. Custom Fields

Some categories need additional information.

Example:

## Vehicle

```text
Vehicle Name
Toyota Hilux

Registration Number
BA 2 CHA 1234

Owner
Rabin Dhakal

Expiry Date
25 Oct 2026

Provider
Insurance Company

Policy Number
Optional
```

## Insurance

```text
Policy Name
Vehicle Insurance

Insured Person / Asset
Toyota Hilux

Provider
ABC Insurance

Policy Number
123456

Start Date
25 Oct 2025

Expiry Date
25 Oct 2026
```

The backend should support flexible metadata using JSONB while preserving important searchable fields relationally.

---

# 13. Recurring Renewals

Many items renew repeatedly.

Examples:

- Vehicle tax
- Insurance
- Software subscriptions
- Domain
- Hosting
- Membership

After marking an item as renewed, show:

```text
Renewal completed?

New expiry date:
[ 25 Oct 2027 ]

[ Save Renewal ]
```

The system creates a renewal-history record and updates the active reminder.

---

# 14. Renewal History

Every renewal should be recorded.

Example:

```text
Vehicle Insurance

Current expiry
25 Oct 2027

Renewal History

25 Oct 2026
Renewed
Expiry → 25 Oct 2027

25 Oct 2025
Renewed
Expiry → 25 Oct 2026
```

This creates an audit trail.

---

# 15. Email Reminder System

Email is a core system component.

## Default schedule

When creating a reminder, default to:

- 90 days before
- 60 days before
- 30 days before
- 15 days before
- 7 days before
- 3 days before
- 1 day before
- Expiry day

Users can disable individual intervals.

## Email example

Subject:

```text
Reminder: Your Vehicle Insurance expires in 7 days
```

Body:

```text
Hi Rabin,

Your Vehicle Insurance is expiring soon.

Vehicle:
Toyota Hilux
Registration:
BA 2 CHA 1234

Expiry date:
25 October 2026

Time remaining:
7 days

Please renew it before the expiry date.

[View Reminder]

Renewal Reminder System
```

## Expiry email

Subject:

```text
Expired: Your Vehicle Insurance expired today
```

## Overdue email

Optional:

```text
Your Vehicle Insurance expired 3 days ago
```

Users can configure whether overdue emails are enabled.

---

# 16. Email Preferences

Settings:

```text
Email notifications
[ ON ]

Reminder emails
[ ON ]

Expiry-day emails
[ ON ]

Overdue emails
[ OFF ]

Weekly summary
[ ON ]
```

## Weekly summary

Example:

```text
Your Renewal Summary

3 items need attention this week.

Due Soon
• Vehicle Insurance — 7 days
• Driving License — 12 days
• Domain — 18 days

Nothing else is due this week.
```

---

# 17. Email Reliability

The email system must not depend on the user's browser being open.

Use:

```text
Scheduler
   ↓
Reminder Processor
   ↓
Redis Queue
   ↓
Email Worker
   ↓
Email Provider
```

Each email should have:

- Unique reminder event ID
- Delivery status
- Attempt count
- Last attempt
- Provider message ID
- Sent timestamp
- Failure reason

## Retry

Recommended:

```text
Attempt 1 → immediate
Attempt 2 → 5 minutes
Attempt 3 → 30 minutes
Attempt 4 → 2 hours
Attempt 5 → 12 hours
```

After repeated failures, mark as failed and expose the error in the admin dashboard.

---

# 18. Duplicate Prevention

A reminder must never send the same scheduled notification twice.

Create a unique constraint:

```text
(reminder_id, notification_type, scheduled_for)
```

Before sending:

```text
Check notification_log

If already sent:
    skip

If not sent:
    queue email
```

This is critical when workers restart or jobs are retried.

---

# 19. Timezone

Nepal users should default to:

```text
Asia/Kathmandu
```

The user's timezone should be stored in their profile.

Email scheduling should use the user's timezone.

Example:

```text
User timezone:
Asia/Kathmandu

Reminder:
7 days before

Send:
08:00 Nepal Time
```

Allow users to change their timezone.

---

# 20. Database Design

## users

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT,
    timezone VARCHAR(100) DEFAULT 'Asia/Kathmandu',
    email_verified_at TIMESTAMP NULL,
    status VARCHAR(30) DEFAULT 'active',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

## categories

```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(100),
    is_system BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL
);
```

## reminders

```sql
CREATE TABLE reminders (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    category_id UUID REFERENCES categories(id),

    title VARCHAR(255) NOT NULL,
    description TEXT,

    owner_name VARCHAR(150),
    reference_number VARCHAR(150),
    provider_name VARCHAR(255),

    start_date DATE,
    expiry_date DATE NOT NULL,

    status VARCHAR(30) DEFAULT 'active',

    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_type VARCHAR(30),

    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
```

## reminder_schedules

```sql
CREATE TABLE reminder_schedules (
    id UUID PRIMARY KEY,
    reminder_id UUID NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,

    days_before INTEGER NOT NULL,

    channel VARCHAR(30) DEFAULT 'email',

    enabled BOOLEAN DEFAULT TRUE,

    send_time TIME DEFAULT '08:00:00',

    created_at TIMESTAMP NOT NULL
);
```

## notification_logs

```sql
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY,

    user_id UUID NOT NULL REFERENCES users(id),
    reminder_id UUID NOT NULL REFERENCES reminders(id),

    notification_type VARCHAR(50) NOT NULL,
    channel VARCHAR(30) NOT NULL,

    scheduled_for TIMESTAMP NOT NULL,
    sent_at TIMESTAMP NULL,

    status VARCHAR(30) DEFAULT 'pending',

    provider_message_id VARCHAR(255),
    attempt_count INTEGER DEFAULT 0,

    error_message TEXT,

    created_at TIMESTAMP NOT NULL
);
```

## renewal_history

```sql
CREATE TABLE renewal_history (
    id UUID PRIMARY KEY,

    reminder_id UUID NOT NULL REFERENCES reminders(id),
    previous_expiry_date DATE NOT NULL,
    new_expiry_date DATE NOT NULL,

    renewed_at TIMESTAMP NOT NULL,

    notes TEXT
);
```

## attachments

```sql
CREATE TABLE attachments (
    id UUID PRIMARY KEY,

    reminder_id UUID NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,

    file_name VARCHAR(255) NOT NULL,
    storage_key TEXT NOT NULL,
    mime_type VARCHAR(100),
    file_size BIGINT,

    created_at TIMESTAMP NOT NULL
);
```

## notification_preferences

```sql
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL REFERENCES users(id),

    email_enabled BOOLEAN DEFAULT TRUE,
    expiry_day_enabled BOOLEAN DEFAULT TRUE,
    overdue_enabled BOOLEAN DEFAULT FALSE,
    weekly_summary_enabled BOOLEAN DEFAULT TRUE,

    summary_day INTEGER DEFAULT 1,
    summary_time TIME DEFAULT '08:00:00'
);
```

---

# 21. Entity Relationship

```text
USERS
  │
  ├────< REMINDERS >──── CATEGORIES
  │            │
  │            ├────< REMINDER_SCHEDULES
  │            │
  │            ├────< NOTIFICATION_LOGS
  │            │
  │            ├────< RENEWAL_HISTORY
  │            │
  │            └────< ATTACHMENTS
  │
  └──── NOTIFICATION_PREFERENCES
```

---

# 22. API Design

Base URL:

```text
/api/v1
```

## Authentication

```http
POST /auth/register
POST /auth/login
POST /auth/logout
POST /auth/verify-email
POST /auth/forgot-password
POST /auth/reset-password
GET  /auth/me
```

## User

```http
GET   /users/me
PATCH /users/me
DELETE /users/me
```

## Categories

```http
GET /categories
GET /categories/:id
```

## Reminders

```http
GET    /reminders
POST   /reminders
GET    /reminders/:id
PATCH  /reminders/:id
DELETE /reminders/:id
```

## Status filtering

```http
GET /reminders?status=due_soon
GET /reminders?status=expired
GET /reminders?category=vehicle
```

## Renewal

```http
POST /reminders/:id/renew
GET  /reminders/:id/history
```

## Notification settings

```http
GET   /notification-preferences
PATCH /notification-preferences
```

## Attachments

```http
POST   /reminders/:id/attachments
GET    /reminders/:id/attachments
DELETE /attachments/:id
```

---

# 23. Create Reminder API Example

Request:

```json
{
  "categoryId": "vehicle-insurance",
  "title": "Toyota Hilux Insurance",
  "ownerName": "Rabin Dhakal",
  "referenceNumber": "BA 2 CHA 1234",
  "providerName": "ABC Insurance",
  "expiryDate": "2026-10-25",
  "isRecurring": true,
  "metadata": {
    "vehicleNumber": "BA 2 CHA 1234"
  },
  "reminders": [
    90,
    60,
    30,
    15,
    7,
    3,
    1,
    0
  ]
}
```

Response:

```json
{
  "id": "uuid",
  "status": "active",
  "daysRemaining": 37,
  "expiryDate": "2026-10-25"
}
```

---

# 24. Reminder Engine

The reminder engine runs independently of the frontend.

## Daily scheduler

Every day:

```text
00:05
  ↓
Find active reminders
  ↓
Calculate each user's local date
  ↓
Calculate days remaining
  ↓
Find matching reminder schedules
  ↓
Create notification jobs
  ↓
Push jobs to Redis
  ↓
Email worker sends messages
```

## Pseudocode

```javascript
for (const reminder of activeReminders) {

    const today = getUserLocalDate(reminder.user.timezone);

    const daysRemaining =
        differenceInDays(reminder.expiryDate, today);

    const schedules =
        getEnabledSchedules(reminder.id);

    for (const schedule of schedules) {

        if (schedule.daysBefore === daysRemaining) {

            const alreadySent =
                await notificationExists(
                    reminder.id,
                    schedule.daysBefore,
                    today
                );

            if (!alreadySent) {

                await queueEmail({
                    reminderId: reminder.id,
                    userId: reminder.userId,
                    daysRemaining
                });
            }
        }
    }
}
```

---

# 25. Expired Reminder Logic

If:

```text
expiryDate < today
```

then:

```text
status = expired
```

Do not delete the reminder.

Show:

```text
Expired 3 days ago
```

Action:

```text
[ Renewed ]
```

---

# 26. Renewal Flow

User clicks:

> Mark as Renewed

Modal:

```text
Renewal completed

Previous expiry:
25 Oct 2026

New expiry:
[ 25 Oct 2027 ]

Notes:
[ Optional ]

[ Confirm Renewal ]
```

Backend transaction:

```text
1. Save renewal history
2. Update expiry date
3. Reset notification schedule
4. Recalculate status
5. Cancel future pending notification jobs
6. Create new notification schedule
```

---

# 27. Calendar View

Provide:

```text
September 2026

Mon Tue Wed Thu Fri Sat Sun
      1   2   3   4   5   6
 7   8   9  10  11  12  13
14  15  16  17  18  19  20
21  22  23  24  25  26  27
28  29  30
```

Days with expiries should have a small indicator.

Clicking a date displays:

```text
25 September

Vehicle Insurance
Internet Subscription
```

---

# 28. Search and Filters

Search:

```text
[ Search reminders... ]
```

Search fields:

- Title
- Owner
- Reference number
- Provider
- Category

Filters:

```text
All
Due Soon
Today
Expired
Active
```

Category filter:

```text
Documents
Vehicle
Insurance
Subscription
Warranty
Business
Other
```

Sort:

- Expiry date
- Recently added
- Alphabetical
- Category

---

# 29. Reminder Detail Page

Example:

```text
← Back

🚗 Toyota Hilux Insurance

ACTIVE

Expires in
37 DAYS

25 October 2026

Registration
BA 2 CHA 1234

Provider
ABC Insurance

Policy Number
POL12345

EMAIL REMINDERS

90 days     ✓
60 days     ✓
30 days     ✓
15 days     ✓
7 days      ✓
3 days      ✓
1 day       ✓
Expiry day  ✓

[ Edit ]
[ Mark as Renewed ]
```

---

# 30. Attachment Management

Users can optionally upload:

- PDF
- JPG
- PNG
- WEBP

Examples:

- Photo of Bluebook
- Insurance policy
- Passport scan
- Warranty card

Security requirements:

- Private storage
- Signed URLs
- File type validation
- File size limit
- Malware scanning where available
- No public bucket
- Access only to authorized user

Recommended MVP maximum:

```text
10 MB per file
```

---

# 31. UI/UX Design

## Visual direction

Simple, clean, trustworthy.

Avoid:

- Heavy gradients
- Too many cards
- Excessive animations
- Complex dashboards
- Tiny text

Use:

- White/neutral background
- Strong typography
- Clear status indicators
- Large tap targets
- Familiar icons
- One primary CTA

## Navigation

Desktop:

```text
Dashboard
Reminders
Calendar
Categories
Settings
```

Mobile:

```text
Home
Reminders
Calendar
Settings
```

Floating button:

```text
+
```

for adding a reminder.

---

# 32. Mobile UX

The majority of users may manage reminders from mobile.

The mobile dashboard should look like:

```text
Good morning 👋

3 reminders need attention

[ + Add Reminder ]

DUE SOON

🚗 Vehicle Insurance
7 days left

🪪 Driving License
15 days left

EXPIRING TODAY

📱 Mobile Subscription
Expires today
```

---

# 33. Add Reminder — Mobile

Use a single-page form rather than a long multi-step wizard.

```text
Add Reminder

Category
[ Vehicle Insurance ▼ ]

Name
[ Toyota Hilux Insurance ]

Expiry Date
[ 25 Oct 2026 ]

For
[ Rabin ]

Optional details
[ + Add details ]

Email reminders
[ ✓ ]

[ Save Reminder ]
```

Advanced settings can be collapsed.

---

# 34. Accessibility

Requirements:

- WCAG 2.2 AA target
- Keyboard navigation
- Visible focus states
- Screen-reader labels
- Minimum touch target ~44px
- Do not rely on color alone
- Proper form errors
- Semantic HTML
- Good contrast

Example:

Do not show only:

```text
🔴
```

Show:

```text
🔴 Expired
```

---

# 35. Notifications Architecture

Initial channels:

1. Email

Future:

2. Browser push
3. SMS
4. WhatsApp
5. In-app notifications

Notification abstraction:

```typescript
interface NotificationProvider {
    send(notification: NotificationPayload): Promise<Result>;
}
```

Implement:

```text
EmailNotificationProvider
PushNotificationProvider
SMSNotificationProvider
WhatsAppNotificationProvider
```

This allows channels to be added without changing reminder logic.

---

# 36. Email Templates

Templates required:

1. Welcome email
2. Verify email
3. Password reset
4. Reminder — 90 days
5. Reminder — 60 days
6. Reminder — 30 days
7. Reminder — 15 days
8. Reminder — 7 days
9. Reminder — 3 days
10. Reminder — 1 day
11. Expiry day
12. Overdue
13. Renewal confirmation
14. Weekly summary
15. Account deletion confirmation

Use a consistent template:

```text
Logo

Reminder title

What is expiring?
Expiry date
Days remaining

Primary CTA

Manage notification settings

Footer
```

---

# 37. Weekly Email

Subject:

```text
Your Renewal Reminder weekly summary
```

Example:

```text
You have 4 upcoming renewals.

NEXT 7 DAYS

Vehicle Insurance
25 Sep 2026

Internet Subscription
28 Sep 2026

NEXT 30 DAYS

Driving License
12 Oct 2026

Passport
20 Oct 2026

[ Open Dashboard ]
```

---

# 38. Email Unsubscribe Rules

Transactional expiry emails should remain distinguishable from marketing emails.

Provide notification controls inside the application.

Marketing emails must have a separate opt-in/opt-out mechanism.

Every email should include:

- Product name
- Support contact
- Notification settings link
- Unsubscribe/preferences link where legally appropriate

---

# 39. Security

## Authentication

- Password hashing using Argon2id or bcrypt
- Secure session/token handling
- Rate limiting
- Login attempt protection
- Email verification
- Password reset tokens expire

## API

- HTTPS only
- CORS restrictions
- CSRF protection where applicable
- Input validation
- Output sanitization
- Rate limits
- Authorization on every resource

## Database

Users must only access their own reminders.

Every query should scope by authenticated user:

```sql
WHERE user_id = authenticated_user_id
```

Never trust user-provided user IDs.

---

# 40. Privacy

Sensitive fields should be minimized.

Avoid collecting information that is not required.

For attachments:

- Encrypt at rest where supported
- Private bucket
- Short-lived signed URLs
- Access logging
- Delete with account deletion

Privacy settings:

```text
Download my data
Delete my account
Delete attachments
```

---

# 41. Data Export

Users should be able to export reminders.

Format:

```text
CSV
JSON
```

Example CSV:

```text
Title,Category,Owner,Expiry Date,Status
Vehicle Insurance,Insurance,Rabin,2026-10-25,Active
Driving License,Document,Rabin,2026-11-12,Active
```

---

# 42. Admin Panel

Admin dashboard should show system health, not private document content by default.

## Metrics

```text
Users
Active Users
Reminders
Emails Sent Today
Emails Failed
Upcoming Expiries
```

## Email delivery

```text
Sent
Delivered
Bounced
Failed
Queued
```

## User management

Admin can:

- Search users
- View account status
- Suspend account
- Restore account
- View aggregate usage
- View support-related metadata

Do not expose document attachments to admins unless a specific support workflow and authorization exists.

---

# 43. Admin Categories

Admin can manage:

```text
Categories
Default reminder schedules
Email templates
System settings
```

Example:

```text
Vehicle Insurance

Default:
90
60
30
15
7
3
1
0
```

---

# 44. Subscription Model

The product can be SaaS.

## Free

Example:

- 10 reminders
- Email reminders
- Basic categories
- Basic history

## Pro

Example:

- Unlimited reminders
- Attachments
- Family members
- Custom reminder schedules
- Calendar
- Advanced reports

## Business

Example:

- Multiple team members
- Shared assets
- Role-based access
- Audit logs
- Business dashboard

Pricing should be configurable from the admin panel rather than hard-coded.

---

# 45. Multi-User / Family Architecture

A future organization model:

```text
User
  ↓
Organization
  ↓
Members
  ↓
Assets
  ↓
Reminders
```

Roles:

```text
Owner
Admin
Member
Viewer
```

This supports:

- Families
- Companies
- Fleet managers
- Offices

For MVP, individual accounts can own reminders directly.

---

# 46. Recurring Subscription Logic

Subscriptions can use:

```text
Monthly
Quarterly
Half-yearly
Yearly
Custom
```

Example:

```text
Netflix
Renewal: Monthly
Next expiry: 15 Oct 2026
```

When renewed:

```text
Previous:
15 Oct 2026

New:
15 Nov 2026
```

---

# 47. Smart Defaults

The system should make reasonable defaults based on category.

Example:

### Driving License

```text
Category: Driving License
Default reminders:
90, 60, 30, 15, 7, 3, 1
```

### Vehicle Insurance

```text
90, 60, 30, 15, 7, 3, 1, 0
```

### Subscription

```text
30, 7, 1
```

Users can modify them.

These are application defaults, not claims about the legal renewal period of any document.

---

# 48. Dashboard Intelligence

The system can generate simple insights.

Example:

```text
⚠ Attention

2 items expire within 7 days.
```

```text
✓ All clear

You have no items expiring in the next 30 days.
```

```text
Expired

1 item needs renewal.
```

Do not make legal assumptions.

---

# 49. API Validation

Example validation:

```text
title:
required
1–255 characters

expiryDate:
required
valid ISO date

email:
valid email

daysBefore:
integer
0–3650
```

Reject invalid values.

---

# 50. Error Handling

Use consistent API format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Expiry date is required",
    "fields": {
      "expiryDate": "Required"
    }
  }
}
```

HTTP codes:

```text
200 OK
201 Created
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Validation Error
429 Too Many Requests
500 Server Error
```

---

# 51. Logging

Application logs should include:

- Request ID
- User ID where appropriate
- Endpoint
- Status code
- Execution time
- Error code

Do not log:

- Passwords
- Authentication tokens
- Full document contents
- Sensitive attachment URLs

---

# 52. Monitoring

Track:

```text
API latency
5xx rate
Queue depth
Email failure rate
Database CPU
Database connections
Redis health
Storage usage
```

Alerts:

```text
Email queue stuck
High email failure rate
API error spike
Database unavailable
Scheduler stopped
```

---

# 53. Backup Strategy

PostgreSQL:

- Automated daily backup
- Point-in-time recovery if available
- Retention policy

Attachments:

- Object-storage versioning where appropriate
- Backup policy
- Disaster recovery documentation

Recommended target:

```text
RPO: ≤ 24 hours
RTO: ≤ 4 hours
```

These should be tightened for paid/business tiers if required.

---

# 54. Testing Strategy

## Unit tests

Test:

- Date calculations
- Status calculations
- Reminder schedule calculations
- Recurrence
- Permission rules
- Validation

Example:

```text
Expiry = today + 7
daysBefore = 7

Expected:
notification generated
```

## Integration tests

Test:

```text
Create reminder
↓
Scheduler detects it
↓
Notification job created
↓
Email worker processes it
↓
Notification log updated
```

## End-to-end

Test:

```text
Register
→ Verify email
→ Login
→ Add reminder
→ Configure email
→ Receive reminder
→ Renew
→ Verify history
```

---

# 55. Critical Date Testing

Test timezone boundaries.

Example:

```text
UTC:
2026-09-24 18:30

Nepal:
2026-09-25 00:15
```

The application must use the user's local date rather than server UTC date when calculating "days remaining."

---

# 56. Performance

Target:

```text
Dashboard API:
< 300ms p95

CRUD API:
< 500ms p95

Email queue:
Process within 1–5 minutes

Scheduler:
Complete daily scan within agreed capacity
```

For large-scale systems, avoid scanning every reminder every minute.

Use indexed queries:

```sql
CREATE INDEX idx_reminders_expiry
ON reminders(expiry_date);

CREATE INDEX idx_reminders_user_expiry
ON reminders(user_id, expiry_date);

CREATE INDEX idx_notification_logs_scheduled
ON notification_logs(scheduled_for, status);
```

---

# 57. Scaling Strategy

MVP:

```text
1 API
1 worker
1 scheduler
PostgreSQL
Redis
```

Scale later:

```text
Load Balancer
      ↓
API 1
API 2
API 3

Worker 1
Worker 2
Worker 3

PostgreSQL
Read Replica
Redis
```

Reminder jobs should be idempotent.

---

# 58. Cron / Scheduler

Example:

```text
Every day at 00:05 in application infrastructure
```

The scheduler finds users based on timezone.

For higher scale, process timezone groups or use a rolling queue.

Do not rely solely on frontend timers.

---

# 59. Security Threat Model

Potential threats:

### Account takeover

Mitigation:

- Strong password hashing
- MFA later
- Rate limiting
- Secure sessions

### Unauthorized document access

Mitigation:

- Authorization checks
- Private object storage
- Signed URLs

### Duplicate emails

Mitigation:

- Idempotency
- Unique notification records

### Scheduler failure

Mitigation:

- Monitoring
- Job recovery
- Health checks

### Data leakage

Mitigation:

- Encryption
- Access controls
- Minimal logs
- Secure backups

---

# 60. Folder Structure

Recommended monorepo:

```text
renewal-reminder/
│
├── apps/
│   ├── web/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── public/
│   │
│   ├── api/
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── reminders/
│   │   │   ├── categories/
│   │   │   ├── notifications/
│   │   │   ├── attachments/
│   │   │   └── admin/
│   │   └── tests/
│   │
│   └── worker/
│       ├── src/
│       │   ├── reminder-engine/
│       │   ├── email/
│       │   └── jobs/
│       └── tests/
│
├── packages/
│   ├── database/
│   ├── shared/
│   ├── email-templates/
│   └── validation/
│
├── docs/
│
├── docker-compose.yml
├── package.json
└── README.md
```

---

# 61. Frontend Routes

```text
/
 /login
 /register
 /verify-email
 /forgot-password
 /reset-password

 /dashboard
 /reminders
 /reminders/new
 /reminders/[id]
 /reminders/[id]/edit

 /calendar
 /categories

 /settings
 /settings/profile
 /settings/notifications
 /settings/security
 /settings/data

 /admin
 /admin/users
 /admin/reminders
 /admin/emails
 /admin/categories
 /admin/settings
```

---

# 62. Component Architecture

```text
AppShell
├── Sidebar
├── MobileNav
├── Header
└── PageContent

Dashboard
├── SummaryCards
├── UpcomingList
├── ExpiredList
├── QuickAdd
└── EmptyState

ReminderForm
├── CategorySelector
├── DatePicker
├── OwnerField
├── ReferenceField
├── ReminderSchedule
├── AttachmentUploader
└── SubmitButton
```

---

# 63. Empty States

If user has no reminders:

```text
Nothing to renew yet.

Add your first reminder and we'll remind you
before it expires.

[ + Add Reminder ]
```

If no upcoming items:

```text
You're all clear.

Nothing is expiring in the next 30 days.
```

---

# 64. Onboarding

First login:

```text
Welcome!

Let's protect your important dates.

You can track:
✓ Driving License
✓ Vehicle Insurance
✓ Passport
✓ Subscriptions
✓ Warranties

[ Add My First Reminder ]
```

Optional quick setup:

```text
What do you want to track?

☐ Vehicle
☐ Documents
☐ Insurance
☐ Subscriptions
☐ Warranties
```

Then guide the user through selected categories.

---

# 65. Nepal Localization

Default:

```text
Country: Nepal
Timezone: Asia/Kathmandu
Currency: NPR
Locale: en-NP
```

Language support:

### MVP

- English
- Nepali

Design all strings through translation keys.

Example:

```json
{
  "dashboard.upcoming": "Upcoming",
  "dashboard.expired": "Expired",
  "reminder.add": "Add Reminder"
}
```

Nepali:

```json
{
  "dashboard.upcoming": "आगामी",
  "dashboard.expired": "म्याद सकिएको",
  "reminder.add": "रिमाइन्डर थप्नुहोस्"
}
```

---

# 66. Nepali Date Support

The primary database should store dates using Gregorian ISO dates.

Example:

```text
2026-10-25
```

The UI can optionally display:

```text
25 October 2026
```

and later support:

```text
2083 Kartik 8
```

for Bikram Sambat display.

Do not store BS as the authoritative date unless conversion rules are rigorously implemented and tested.

---

# 67. Progressive Web App

The application should support:

- Install on Android
- Install on desktop
- Offline shell
- Push notification support later
- App icon
- Splash screen
- Responsive UI

Email reminders remain independent of PWA installation.

---

# 68. Future AI Features

AI should be optional.

Potential features:

### Smart extraction

User uploads a document.

System extracts:

```text
Document type
Name
Document number
Issue date
Expiry date
```

The extracted values must be shown for confirmation before saving.

### Natural language add

User types:

> My vehicle insurance expires on October 25.

System converts to:

```text
Title:
Vehicle Insurance

Expiry:
25 Oct 2026
```

User confirms before saving.

AI must not silently create a reminder from uncertain information.

---

# 69. Future Government Integrations

Potential future integrations could help users navigate to relevant official services.

The system should distinguish:

```text
Reminder information
```

from:

```text
Official government status
```

If an integration is introduced, it must use authorized APIs or official mechanisms and clearly show when information was last synchronized.

---

# 70. Analytics

User-facing analytics:

```text
Total reminders
Renewals completed
Upcoming renewals
Expired items
```

Admin analytics:

```text
New users
Active users
Reminders created
Reminders renewed
Email delivery rate
Retention
```

Avoid collecting unnecessary behavioral data.

---

# 71. Product Analytics Events

Recommended events:

```text
account_created
email_verified
reminder_created
reminder_edited
reminder_deleted
reminder_renewed
attachment_uploaded
notification_preferences_updated
email_sent
email_failed
```

Do not send sensitive document contents to analytics platforms.

---

# 72. MVP Scope

## Phase 1 — Core

Build:

- Authentication
- Dashboard
- Reminder CRUD
- Categories
- Expiry calculation
- Status
- Email reminders
- Reminder settings
- PostgreSQL
- Redis queue
- Email logs
- Responsive mobile UI

## Phase 2 — Productivity

Add:

- Calendar
- Attachments
- Renewal history
- Recurring reminders
- CSV export
- Weekly email summary
- Nepali language

## Phase 3 — SaaS

Add:

- Billing
- Pro plans
- Family accounts
- Business accounts
- Team permissions
- Admin analytics

## Phase 4 — Advanced

Add:

- Push notifications
- SMS
- WhatsApp
- OCR
- AI extraction
- Natural language reminder creation
- Government integrations where officially supported

---

# 73. Development Sequence

## Sprint 1

```text
Project setup
Database
Authentication
Design system
```

## Sprint 2

```text
Categories
Reminder CRUD
Dashboard
Status engine
```

## Sprint 3

```text
Reminder scheduler
Redis queue
Email provider
Email templates
Notification logs
```

## Sprint 4

```text
Renewal flow
History
Settings
Search/filter
```

## Sprint 5

```text
Attachments
Calendar
PWA
Nepali localization
```

## Sprint 6

```text
Testing
Security
Performance
Monitoring
Production deployment
```

---

# 74. Definition of Done

A reminder is considered fully functional when:

- User can create it.
- Expiry date is stored correctly.
- Days remaining is calculated correctly.
- Status updates automatically.
- Reminder schedule is stored.
- Scheduler detects the scheduled reminder.
- Email job is queued.
- Email is delivered through provider.
- Notification log is updated.
- Duplicate email is prevented.
- User can edit it.
- User can renew it.
- Renewal history is stored.
- New expiry date resets the reminder schedule.
- User can delete it.
- Authorization prevents other users from accessing it.

---

# 75. Production Checklist

## Backend

- [ ] Environment variables
- [ ] PostgreSQL production database
- [ ] Redis production instance
- [ ] Database migrations
- [ ] Seed categories
- [ ] Authentication
- [ ] Authorization
- [ ] Rate limiting
- [ ] Validation
- [ ] Logging
- [ ] Health endpoint

## Email

- [ ] Domain verification
- [ ] SPF
- [ ] DKIM
- [ ] DMARC
- [ ] Transactional email provider
- [ ] Email templates
- [ ] Bounce handling
- [ ] Retry logic
- [ ] Notification logs

## Frontend

- [ ] Responsive design
- [ ] PWA manifest
- [ ] Error states
- [ ] Loading states
- [ ] Empty states
- [ ] Accessibility
- [ ] SEO landing page

## Security

- [ ] HTTPS
- [ ] Secure cookies/tokens
- [ ] Password hashing
- [ ] Authorization tests
- [ ] Private storage
- [ ] Signed attachment URLs
- [ ] Backup policy
- [ ] Account deletion

## Operations

- [ ] Monitoring
- [ ] Error tracking
- [ ] Queue monitoring
- [ ] Database backups
- [ ] Deployment pipeline
- [ ] Rollback process

---

# 76. Recommended MVP User Journey

```text
Landing Page
     ↓
Create Account
     ↓
Verify Email
     ↓
Dashboard
     ↓
Add Reminder
     ↓
Choose "Vehicle Insurance"
     ↓
Enter expiry date
     ↓
Default email schedule selected
     ↓
Save
     ↓
Dashboard shows:
"Expires in 37 days"
     ↓
System scheduler runs
     ↓
7-day reminder generated
     ↓
Email sent
     ↓
User renews insurance
     ↓
Click "Mark as Renewed"
     ↓
Enter new expiry
     ↓
Renewal history saved
     ↓
New reminder cycle starts
```

---

# 77. Key Product Requirement

The application must make the following promise operationally:

> **Add an expiry date once. The system remembers it and reminds you before it expires.**

The user should not have to remember to open the application.

Email scheduling, queue processing, notification logging, retry handling, and duplicate prevention are therefore core infrastructure—not optional UI features.

---

# 78. Recommended Final Architecture

```text
                    RENEWAL REMINDER SYSTEM

                           USER
                            │
                 ┌──────────┴──────────┐
                 │                     │
               Web                   PWA
                 │                     │
                 └──────────┬──────────┘
                            │
                         Next.js
                            │
                         REST API
                            │
                       NestJS API
                            │
          ┌─────────────────┼──────────────────┐
          │                 │                  │
      PostgreSQL          Redis             S3/R2
          │                 │                  │
          │                 │             Attachments
          │                 │
          │          Reminder Queue
          │                 │
          │          Email Worker
          │                 │
          │          Email Provider
          │                 │
          └─────────────────┴───────────────► USER EMAIL
```

---

# 79. Final Recommendation

Build the MVP around four pillars:

1. **Simple reminder creation**
2. **Accurate date/status engine**
3. **Reliable automated email delivery**
4. **Renewal history and recurring dates**

Do not make the first version unnecessarily complicated. A user should be able to open the app, add a Driving License or Vehicle Insurance in under 30 seconds, close the app, and trust the system to notify them before the expiry date.

The architecture above is designed so that SMS, WhatsApp, push notifications, OCR, AI extraction, family accounts, business accounts, and government-service integrations can be added later without rebuilding the core reminder engine.
