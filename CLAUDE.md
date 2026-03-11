# AUDIOBOOK MARKETPLACE PLATFORM — PROJECT BRIEF & REQUIREMENTS

## For Use With Claude Code (CLAUDE.md Compatible)

---

## 1. PROJECT OVERVIEW

### What We're Building
A full-stack audiobook marketplace platform — similar to Audible meets Draft2Digital — where:
- **Customers** can browse, purchase, or subscribe to access audiobooks and ebooks
- **Authors** can upload and sell their books/audiobooks (charged a platform commission, like Draft2Digital)
- **Admins** manage the entire platform, approve content, and configure business settings

### Platform Components
1. **Public Website** — Landing page, book catalog, pricing, author signup
2. **Customer Dashboard** — Library, audio player, purchases, subscription management
3. **Author Dashboard** — Upload books, track sales, manage royalties, view payouts
4. **Admin Panel** — User management, content approval, revenue tracking, platform settings
5. **Mobile Apps** — Android + iOS via React Native / Expo (customer-facing)

### Existing Accounts (Already Set Up)
- **Paystack** — Payment processing (NOT Stripe)
- **Netlify** — Web hosting and deployment
- **GitHub** — Version control and CI/CD
- **Custom Domain** — Already purchased

---

## 2. TECH STACK

### Web Application
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **State Management:** Zustand or React Context

### Backend & Database
- **Backend:** Next.js API Routes + Server Actions
- **Database:** PostgreSQL via Supabase (includes Auth, Storage, Realtime)
- **ORM:** Prisma
- **File Storage:** Supabase Storage (for audio files, covers, ebooks) or Cloudflare R2
- **Search:** Supabase full-text search or Meilisearch

### Payments (Paystack — NOT Stripe)
- **One-time purchases:** Paystack Transactions API
- **Subscriptions:** Paystack Subscriptions API (Plans + recurring billing)
- **Author commission splits:** Paystack Split Payments with Subaccounts
- **Webhooks:** Paystack webhook events for payment confirmation

### Authentication
- **Provider:** Supabase Auth (or NextAuth.js with Supabase adapter)
- **Methods:** Email/password, Google OAuth, optional phone OTP
- **Roles:** customer, author, admin (role-based access control)

### Mobile Apps
- **Framework:** React Native with Expo
- **Navigation:** React Navigation
- **Audio:** expo-av for audio playback
- **Shared Logic:** Share API client and types with web app via monorepo

### Deployment
- **Web:** Netlify (with Next.js adapter / serverless functions)
- **Mobile:** Expo EAS Build → Apple App Store + Google Play Store
- **CI/CD:** GitHub Actions → auto-deploy to Netlify on push to main

---

## 3. DATABASE SCHEMA

### Users Table
```
users
├── id (uuid, primary key)
├── email (unique)
├── password_hash
├── full_name
├── avatar_url
├── role (enum: 'customer', 'author', 'admin')
├── phone
├── is_verified (boolean)
├── is_active (boolean)
├── created_at
└── updated_at
```

### Author Profiles Table
```
author_profiles
├── id (uuid, primary key)
├── user_id (foreign key → users.id)
├── pen_name
├── bio
├── website_url
├── social_links (jsonb)
├── bank_name
├── bank_account_number
├── bank_account_name
├── paystack_subaccount_code (for split payments)
├── commission_rate (decimal, default: 0.70 — author gets 70%)
├── total_earnings (decimal)
├── pending_payout (decimal)
├── is_approved (boolean, admin must approve)
├── created_at
└── updated_at
```

### Books Table
```
books
├── id (uuid, primary key)
├── author_id (foreign key → author_profiles.id)
├── title
├── slug (unique, URL-friendly)
├── description (text)
├── short_description
├── cover_image_url
├── genre (enum or tags)
├── sub_genre
├── language
├── isbn (optional)
├── publication_date
├── page_count (for ebooks)
├── price (decimal — in kobo/cents for Paystack)
├── discount_price (optional)
├── is_free (boolean)
├── book_type (enum: 'ebook', 'audiobook', 'both')
├── status (enum: 'draft', 'pending_review', 'published', 'rejected', 'archived')
├── rejection_reason (text, optional)
├── rating_average (decimal)
├── rating_count (integer)
├── download_count (integer)
├── created_at
└── updated_at
```

### Audio Files Table (for audiobooks)
```
audio_files
├── id (uuid, primary key)
├── book_id (foreign key → books.id)
├── chapter_number (integer)
├── chapter_title
├── file_url (secure storage URL)
├── duration_seconds (integer)
├── file_size_bytes (bigint)
├── format (enum: 'mp3', 'aac', 'm4a', 'm4b')
├── sort_order (integer)
├── created_at
└── updated_at
```

### Ebook Files Table
```
ebook_files
├── id (uuid, primary key)
├── book_id (foreign key → books.id)
├── file_url (secure storage URL)
├── format (enum: 'epub', 'pdf', 'mobi')
├── file_size_bytes (bigint)
├── created_at
└── updated_at
```

### Subscription Plans Table
```
subscription_plans
├── id (uuid, primary key)
├── name (e.g., "Basic", "Premium", "VIP")
├── description
├── price (decimal — in kobo/cents)
├── interval (enum: 'monthly', 'quarterly', 'annually')
├── paystack_plan_code
├── max_books_per_month (integer, null = unlimited)
├── features (jsonb — list of plan features)
├── is_active (boolean)
├── created_at
└── updated_at
```

### Customer Subscriptions Table
```
customer_subscriptions
├── id (uuid, primary key)
├── user_id (foreign key → users.id)
├── plan_id (foreign key → subscription_plans.id)
├── paystack_subscription_code
├── paystack_email_token
├── status (enum: 'active', 'attention', 'cancelled', 'completed', 'non_renewing')
├── current_period_start
├── current_period_end
├── next_payment_date
├── cancelled_at (optional)
├── created_at
└── updated_at
```

### Purchases Table (one-time book purchases)
```
purchases
├── id (uuid, primary key)
├── user_id (foreign key → users.id)
├── book_id (foreign key → books.id)
├── amount_paid (decimal)
├── platform_fee (decimal — the commission kept)
├── author_earnings (decimal — amount going to author)
├── paystack_reference
├── paystack_transaction_id
├── status (enum: 'pending', 'successful', 'failed', 'refunded')
├── purchased_at
└── created_at
```

### User Library Table (tracks what each user can access)
```
user_library
├── id (uuid, primary key)
├── user_id (foreign key → users.id)
├── book_id (foreign key → books.id)
├── access_type (enum: 'purchased', 'subscription')
├── added_at
├── last_accessed_at
├── listening_progress (jsonb — { chapter: 3, position_seconds: 145 })
└── reading_progress (jsonb — { page: 42, percentage: 0.35 })
```

### Reviews Table
```
reviews
├── id (uuid, primary key)
├── user_id (foreign key → users.id)
├── book_id (foreign key → books.id)
├── rating (integer, 1–5)
├── review_text (text)
├── is_verified_purchase (boolean)
├── is_visible (boolean, admin can hide)
├── created_at
└── updated_at
```

### Author Payouts Table
```
author_payouts
├── id (uuid, primary key)
├── author_id (foreign key → author_profiles.id)
├── amount (decimal)
├── period_start (date)
├── period_end (date)
├── status (enum: 'pending', 'processing', 'paid', 'failed')
├── paystack_transfer_reference (optional, if manual payout)
├── notes
├── paid_at
└── created_at
```

### Platform Settings Table
```
platform_settings
├── id (uuid, primary key)
├── key (unique string)
├── value (text/jsonb)
├── description
└── updated_at
```
**Default settings to seed:**
- `default_author_commission_rate` → 0.70 (authors keep 70%)
- `platform_fee_percentage` → 0.30 (platform keeps 30%)
- `min_book_price` → 50000 (₦500 in kobo)
- `max_upload_size_mb` → 500
- `supported_audio_formats` → ["mp3", "aac", "m4a", "m4b"]
- `supported_ebook_formats` → ["epub", "pdf"]

---

## 4. PAYSTACK INTEGRATION DETAILS

### One-Time Book Purchases
- Use Paystack Inline JS popup or redirect to initialize transaction
- Pass `subaccount: "ACCT_authorcode"` to automatically split payment
- Platform gets its commission %, author gets the rest
- Listen for `charge.success` webhook to confirm and update purchase record
- Add book to user's library upon successful payment

### Subscription Plans
- Create plans via Paystack API: monthly, quarterly, annual
- Initialize first payment with `plan: "PLN_xxxxx"` parameter
- Paystack handles recurring charges automatically
- Listen for `subscription.create`, `charge.success`, and `subscription.disable` webhooks
- Update customer_subscriptions table based on webhook events
- Grant/revoke catalog access based on subscription status

### Author Subaccounts (Commission System)
- When author registers and is approved, create a Paystack subaccount via API:
  - `POST /subaccount` with author's bank details
  - Store returned `subaccount_code` in author_profiles table
- Default split: `percentage_charge: 30` (30% to platform, 70% to author subaccount)
- Override per-author if needed using `transaction_charge` (flat fee) or custom percentage
- Authors can see their earnings and Paystack handles payouts automatically (T+1 by default)

### Webhook Events to Handle
```
charge.success          → Confirm purchase, add to library, record earnings
subscription.create     → Activate subscription, grant access
subscription.disable    → Handle cancellation or expiry
subscription.not_renew  → Mark subscription as non-renewing
transfer.success        → Confirm author payout (if using manual transfers)
transfer.failed         → Flag failed payout for admin review
```

### Webhook Security
- Validate webhook signature using Paystack secret key
- Verify event by calling Paystack API to confirm transaction
- Use idempotency to prevent duplicate processing

---

## 5. PAGE-BY-PAGE REQUIREMENTS

### PUBLIC PAGES (No login required)

#### Homepage
- Hero section with tagline, CTA buttons ("Browse Books" / "Start Listening" / "Become an Author")
- Featured/trending audiobooks carousel
- Genre categories grid
- "How It Works" section (3 steps for customers, 3 steps for authors)
- Subscription plan comparison cards
- Testimonials section
- Newsletter signup
- Footer with links, social media, legal pages

#### Book Catalog / Browse Page
- Grid/list view toggle for book cards
- Filters: genre, price range, format (ebook/audiobook/both), language, rating
- Sort by: newest, popular, price low→high, price high→low, top rated
- Search bar with autocomplete
- Pagination or infinite scroll

#### Book Detail Page
- Cover image (large)
- Title, author name (linked to author profile), genre tags
- Price display with "Buy Now" and "Add to Wishlist" buttons
- If user has subscription: "Listen Now" / "Read Now" button
- Audio sample player (first 2–3 minutes preview)
- Chapter list with durations
- Book description (expandable)
- Reviews section with star ratings
- "More by this Author" section
- "Similar Books" section

#### Pricing Page
- Subscription plan comparison table
- Feature breakdown per tier
- "Subscribe Now" buttons → Paystack checkout
- FAQ section about billing

#### Author Signup / Info Page
- Benefits of publishing on the platform
- Commission structure explanation (transparent)
- Step-by-step process
- "Apply to Become an Author" CTA → registration form

#### Static Pages
- About Us
- Contact (form + email)
- Terms of Service
- Privacy Policy
- FAQ / Help Center

---

### CUSTOMER DASHBOARD (Login required, role: customer)

#### My Library
- Grid of purchased books and subscription-accessible books
- Tabs: "All", "Audiobooks", "Ebooks", "In Progress", "Completed"
- Continue listening/reading cards with progress bars
- Search within library

#### Audio Player Page
- Full-screen audio player
- Album art / cover image display
- Play/pause, skip forward 30s, skip back 15s
- Chapter selector dropdown
- Playback speed control (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x)
- Sleep timer
- Progress bar with time elapsed / total
- Remember position across sessions (save to user_library.listening_progress)
- Download for offline listening (mobile app feature)

#### Ebook Reader Page
- Clean reading interface
- Font size adjustment
- Light/dark/sepia mode toggle
- Bookmark functionality
- Progress tracking
- Remember page position across sessions

#### My Subscription
- Current plan details and status
- Next billing date and amount
- Usage stats (books accessed this month vs limit)
- Upgrade/downgrade plan options
- Cancel subscription (with confirmation)
- Billing history

#### Purchase History
- List of all one-time purchases
- Date, book title, amount paid
- Download receipt

#### Profile Settings
- Edit name, email, phone, avatar
- Change password
- Notification preferences
- Delete account option

#### Wishlist
- Saved books for later
- Quick purchase button

---

### AUTHOR DASHBOARD (Login required, role: author)

#### Author Overview / Home
- Earnings summary: total earnings, this month, pending payout
- Sales chart (line graph — last 30 days / 12 months toggle)
- Recent sales list
- Total books published
- Average rating across all books
- Quick action buttons: "Upload New Book", "View Analytics"

#### My Books
- Table/grid of all uploaded books
- Status badges: draft, pending review, published, rejected
- Edit / delete actions
- Filter by status
- Click to view book detail/edit

#### Upload / Edit Book
- Multi-step form:
  - **Step 1: Book Details** — Title, description, genre, sub-genre, language, tags, ISBN (optional)
  - **Step 2: Pricing** — Set price (platform shows net earnings after commission deduction), mark as free option
  - **Step 3: Cover Upload** — Drag-and-drop image upload, preview, crop tool
  - **Step 4: Files Upload** — Upload audio files (per chapter) or ebook files. Show upload progress. Validate file formats.
  - **Step 5: Chapter Management** — Reorder chapters, set chapter titles, preview audio
  - **Step 6: Review & Submit** — Summary of all details, "Submit for Review" button
- Save as draft at any point
- Show commission breakdown: "Price: ₦2,000 → You earn: ₦1,400 | Platform fee: ₦600"

#### Sales & Analytics
- Revenue chart (daily/weekly/monthly/yearly)
- Sales by book (table with title, units sold, total revenue, author earnings)
- Geographic breakdown (if available from Paystack)
- Best performing books
- Export CSV option

#### Earnings & Payouts
- Current balance
- Payout history (date, amount, status, reference)
- Payout schedule info (Paystack auto T+1 or manual)
- Bank account details display (masked) with option to update
- Earnings breakdown: gross sales, platform commission, net earnings, Paystack fees

#### Author Profile Settings
- Edit pen name, bio, avatar, website, social links
- Update bank account details (triggers new Paystack subaccount or update)
- View/accept terms of service

---

### ADMIN PANEL (Login required, role: admin)

#### Admin Dashboard / Home
- Total users (customers + authors)
- Total books on platform
- Total revenue (platform's share)
- Revenue chart
- Recent signups
- Pending items count (book reviews, author approvals)

#### User Management
- Searchable, sortable table of all users
- Filter by role (customer, author, admin)
- View user detail: profile info, activity, purchases/earnings
- Activate / deactivate accounts
- Change user roles
- Send notifications

#### Book Management
- All books table with status filter
- **Approval Queue:** Books with status "pending_review"
  - View full book details, preview audio/ebook
  - Approve → status becomes "published"
  - Reject → status becomes "rejected", provide rejection reason
- Feature/unfeature books on homepage
- Remove/archive books

#### Author Management
- All authors table
- Approve new author applications
- View author earnings and payout history
- Adjust individual author commission rates
- Manage Paystack subaccounts

#### Subscription Management
- View all subscription plans
- Create / edit / deactivate plans
- View all active subscriptions
- Subscriber analytics

#### Financial Reports
- Total platform revenue
- Revenue by period (daily, weekly, monthly)
- Commission earned
- Author payouts summary
- Export reports (CSV/PDF)

#### Platform Settings
- Default commission rate
- Minimum book price
- Maximum upload file size
- Supported file formats
- Homepage featured books selection
- Announcement banner text

#### Content Moderation
- Reported reviews
- Flagged content
- Bulk actions

---

## 6. MOBILE APP REQUIREMENTS (React Native / Expo)

### Screens (Customer-Facing Only for V1)
- **Splash / Onboarding** — App intro slides, then login/signup
- **Login / Signup** — Email + password, Google OAuth
- **Home Feed** — Featured books, continue listening, recommendations
- **Browse / Search** — Category filters, search bar
- **Book Detail** — Same as web but mobile-optimized
- **Audio Player** — Full-featured with background playback, lock screen controls, notification controls
- **My Library** — Tabs for audiobooks, ebooks, in-progress
- **Subscription** — View plan, upgrade, billing
- **Profile / Settings** — Account management, notification preferences, download management
- **Offline Downloads** — Download audiobooks for offline listening (stored on device)

### Mobile-Specific Features
- Background audio playback (continues when app is minimized)
- Lock screen / notification media controls
- Push notifications (new releases, subscription reminders)
- Offline mode with downloaded content
- Deep linking (share book links that open in app)
- Car mode / simplified player interface

### App Store Requirements
- Apple Developer Account ($99/year)
- Google Play Developer Account ($25 one-time)
- App Store screenshots and descriptions
- Privacy policy URL
- Age rating configuration

---

## 7. SECURITY REQUIREMENTS

- All API routes protected with authentication middleware
- Role-based access control (RBAC) on every endpoint
- Paystack webhook signature verification
- Audio/ebook file URLs are signed/temporary (not publicly accessible)
- Rate limiting on auth endpoints and file uploads
- Input validation and sanitization on all forms
- CSRF protection
- XSS prevention
- SQL injection prevention (Prisma handles this)
- Secure password hashing (bcrypt)
- HTTPS everywhere (Netlify provides SSL)
- Environment variables for all secrets (never hardcode)

---

## 8. SEO & PERFORMANCE

- Server-side rendering (SSR) for public pages (Next.js)
- Dynamic meta tags per book (Open Graph, Twitter Cards)
- Sitemap.xml auto-generation
- Structured data (JSON-LD) for books (Schema.org Book/Audiobook)
- Image optimization (Next.js Image component)
- Lazy loading for book grids
- Audio streaming (not full download for playback)
- CDN for static assets (Netlify CDN)
- Database query optimization with proper indexes

---

## 9. EMAIL NOTIFICATIONS

Use a transactional email service (Resend, SendGrid, or Mailgun):

### Customer Emails
- Welcome / verify email
- Purchase confirmation with receipt
- Subscription activated / renewed / cancelled
- Payment failed (subscription)
- Password reset
- New releases from followed authors

### Author Emails
- Application received / approved / rejected
- Book submitted / approved / rejected
- New sale notification
- Monthly earnings summary
- Payout processed

### Admin Emails
- New author application
- New book submission for review
- Revenue milestones
- System alerts

---

## 10. DEVELOPMENT PHASES & CLAUDE CODE PROMPTS

### PHASE 1: Project Setup & Database (Days 1–3)
```
Prompt for Claude Code:
"Initialize a Next.js 14 project with TypeScript, Tailwind CSS, and shadcn/ui.
Set up Prisma ORM with a PostgreSQL connection (Supabase).
Create the complete database schema from the project brief with these tables:
users, author_profiles, books, audio_files, ebook_files, subscription_plans,
customer_subscriptions, purchases, user_library, reviews, author_payouts,
platform_settings.
Set up Supabase Auth with email/password and Google OAuth.
Implement role-based middleware (customer, author, admin).
Create the base layout with responsive navigation.
Seed the database with sample subscription plans and platform settings."
```

### PHASE 2: Public Website (Days 4–7)
```
Prompt for Claude Code:
"Build all public-facing pages:
- Homepage with hero, featured books carousel, genre grid, pricing cards,
  how-it-works section, testimonials, newsletter signup, footer
- Book catalog page with grid/list view, filters (genre, price, format,
  rating), sort options, search with autocomplete, pagination
- Book detail page with cover, description, audio preview player,
  chapter list, reviews, 'More by Author', 'Similar Books'
- Pricing page with plan comparison table and FAQ
- Author info/signup page with benefits and application CTA
- About, Contact, Terms, Privacy, FAQ static pages
Use SSR for SEO. Add Open Graph meta tags. Make everything fully responsive."
```

### PHASE 3: Authentication & Customer Dashboard (Days 8–12)
```
Prompt for Claude Code:
"Build the complete authentication flow and customer dashboard:
- Login / signup pages with email+password and Google OAuth
- Email verification flow
- Password reset flow
- Protected customer dashboard layout with sidebar navigation
- My Library page: grid of accessible books, tabs (All/Audiobooks/Ebooks/
  In Progress/Completed), progress bars, search
- Full audio player: play/pause, chapter navigation, speed control, sleep
  timer, progress saving to database, skip forward/back buttons
- Ebook reader: clean interface, font sizing, light/dark/sepia modes,
  bookmark, progress saving
- Purchase history page with receipt download
- Wishlist page
- Profile settings: edit info, change password, notification prefs
- My Subscription page: plan details, usage, upgrade/downgrade, cancel,
  billing history"
```

### PHASE 4: Paystack Integration (Days 13–16)
```
Prompt for Claude Code:
"Integrate Paystack for all payment flows:
1. ONE-TIME PURCHASES: Use Paystack Inline JS. When customer buys a book,
   initialize transaction with the book price and author's subaccount code
   for automatic split payment. Handle charge.success webhook to confirm
   purchase and add book to user library.
2. SUBSCRIPTIONS: Create Paystack plans matching our subscription_plans table.
   Initialize subscription checkout with plan code. Handle subscription.create,
   charge.success, subscription.disable, subscription.not_renew webhooks.
   Grant/revoke catalog access based on subscription status.
3. WEBHOOK HANDLER: Create /api/webhooks/paystack endpoint. Verify webhook
   signature. Process events idempotently. Update database records.
4. Payment history and receipt generation for customers.
Use Paystack TEST keys for development. Store keys in environment variables."
```

### PHASE 5: Author Dashboard (Days 17–22)
```
Prompt for Claude Code:
"Build the complete author dashboard:
- Author registration: multi-step form with personal info, bank details,
  bio/pen name, terms acceptance. On submission, create Paystack subaccount
  via API and store subaccount_code. Set status to pending approval.
- Author dashboard home: earnings summary, sales chart (recharts), recent
  sales, published books count, average rating
- My Books page: table/grid of all books with status badges, edit/delete
- Book upload: multi-step form (details → pricing with commission preview →
  cover upload → file upload with progress → chapter management with drag
  reorder → review & submit). Support audio files per chapter and ebook files.
  Upload to Supabase Storage with signed URLs.
- Sales & Analytics: revenue charts, per-book breakdown, export CSV
- Earnings & Payouts: current balance, payout history, bank details display
- Author profile settings: edit pen name, bio, social links, bank details
  (updating bank details should update Paystack subaccount)
Show commission breakdown everywhere: 'Price ₦2,000 → You earn ₦1,400'"
```

### PHASE 6: Admin Panel (Days 23–28)
```
Prompt for Claude Code:
"Build the admin panel:
- Admin dashboard: total users, books, revenue stats, charts, pending items
- User management: searchable table, filter by role, activate/deactivate,
  view user details and activity
- Book management: all books table, approval queue for pending_review books,
  approve/reject with reason, feature books on homepage
- Author management: approve applications (creates Paystack subaccount),
  view earnings, adjust commission rates per author
- Subscription management: CRUD for plans, view active subscriptions,
  subscriber analytics
- Financial reports: platform revenue, commission earned, author payouts,
  export CSV/PDF
- Platform settings: default commission rate, min price, max upload size,
  supported formats, featured books, announcements
- Content moderation: reported reviews, flagged content
Protect all admin routes with admin role middleware."
```

### PHASE 7: Email Notifications (Days 29–30)
```
Prompt for Claude Code:
"Set up transactional email with Resend (or SendGrid).
Create email templates for:
- Customer: welcome, purchase confirmation, subscription activated/renewed/
  cancelled, payment failed, password reset
- Author: application received/approved/rejected, book approved/rejected,
  new sale, monthly earnings summary, payout processed
- Admin: new author application, new book submission, revenue milestones
Use React Email for templates. Trigger emails from appropriate API routes
and webhook handlers."
```

### PHASE 8: Mobile App (Days 31–40)
```
Prompt for Claude Code:
"Create a React Native / Expo mobile app in a /mobile directory:
- Set up Expo with TypeScript and React Navigation
- Screens: splash, onboarding, login/signup, home feed, browse/search,
  book detail, audio player, my library, subscription, profile/settings
- Audio player with expo-av: background playback, lock screen controls,
  notification media controls, chapter navigation, speed control, sleep timer
- Offline downloads: download audio files to device storage
- Push notifications with Expo Notifications
- Share the API client types with the web app
- Deep linking configuration
- Connect to the same Supabase backend as the web app
Make the UI mobile-native (not a web wrapper). Use proper mobile patterns."
```

### PHASE 9: Deployment (Days 41–43)
```
Prompt for Claude Code:
"Prepare for production deployment:
- Set up environment variables for production (Paystack LIVE keys, Supabase
  production URL, email service API key)
- Configure Netlify deployment: create netlify.toml with Next.js config,
  build command, publish directory, serverless functions
- Set up GitHub Actions for CI/CD: test → build → deploy to Netlify on
  push to main
- Configure custom domain on Netlify with SSL
- Set up Paystack LIVE webhook URL pointing to production
- Run database migrations on production Supabase
- Mobile: configure Expo EAS Build for production builds
- Submit to Apple App Store and Google Play Store
- Set up error monitoring (Sentry) and analytics (PostHog or Plausible)"
```

---

## 11. ENVIRONMENT VARIABLES NEEDED

```env
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...

# Paystack
PAYSTACK_SECRET_KEY=sk_test_xxxxx (use sk_live_xxxxx for production)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
PAYSTACK_WEBHOOK_SECRET=whsec_xxxxx

# Auth
NEXTAUTH_SECRET=generate-a-random-string
NEXTAUTH_URL=http://localhost:3000 (update for production)
GOOGLE_CLIENT_ID=xxxxx
GOOGLE_CLIENT_SECRET=xxxxx

# Email
RESEND_API_KEY=re_xxxxx

# File Storage
SUPABASE_STORAGE_BUCKET=audiobooks

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Your Platform Name"
```

---

## 12. FOLDER STRUCTURE

```
audiobook-platform/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (public)/               # Public pages (no auth)
│   │   │   ├── page.tsx            # Homepage
│   │   │   ├── books/
│   │   │   │   ├── page.tsx        # Catalog
│   │   │   │   └── [slug]/page.tsx # Book detail
│   │   │   ├── pricing/page.tsx
│   │   │   ├── authors/page.tsx
│   │   │   ├── about/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   ├── terms/page.tsx
│   │   │   └── privacy/page.tsx
│   │   ├── (auth)/                 # Auth pages
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── verify-email/page.tsx
│   │   ├── dashboard/              # Customer dashboard
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx            # Library
│   │   │   ├── player/[bookId]/page.tsx
│   │   │   ├── reader/[bookId]/page.tsx
│   │   │   ├── subscription/page.tsx
│   │   │   ├── purchases/page.tsx
│   │   │   ├── wishlist/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── author/                 # Author dashboard
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx            # Overview
│   │   │   ├── books/
│   │   │   │   ├── page.tsx        # My books
│   │   │   │   ├── new/page.tsx    # Upload
│   │   │   │   └── [id]/edit/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   ├── earnings/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── admin/                  # Admin panel
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx            # Dashboard
│   │   │   ├── users/page.tsx
│   │   │   ├── books/page.tsx
│   │   │   ├── authors/page.tsx
│   │   │   ├── subscriptions/page.tsx
│   │   │   ├── reports/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── api/                    # API routes
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── webhooks/paystack/route.ts
│   │   │   ├── books/
│   │   │   ├── purchases/
│   │   │   ├── subscriptions/
│   │   │   ├── authors/
│   │   │   ├── admin/
│   │   │   └── upload/
│   │   └── layout.tsx              # Root layout
│   ├── components/
│   │   ├── ui/                     # shadcn components
│   │   ├── public/                 # Public page components
│   │   ├── dashboard/              # Customer dashboard components
│   │   ├── author/                 # Author dashboard components
│   │   ├── admin/                  # Admin panel components
│   │   ├── player/                 # Audio player components
│   │   └── shared/                 # Shared components
│   ├── lib/
│   │   ├── db.ts                   # Prisma client
│   │   ├── paystack.ts             # Paystack API helpers
│   │   ├── supabase.ts             # Supabase client
│   │   ├── auth.ts                 # Auth utilities
│   │   ├── email.ts                # Email sending helpers
│   │   ├── storage.ts              # File upload helpers
│   │   └── utils.ts                # General utilities
│   ├── hooks/                      # Custom React hooks
│   ├── types/                      # TypeScript types
│   └── middleware.ts               # Auth + role middleware
├── mobile/                         # React Native / Expo app
│   ├── app/                        # Expo Router screens
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── app.json
├── public/                         # Static assets
├── emails/                         # React Email templates
├── .env.local
├── netlify.toml
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── CLAUDE.md                       # ← This file for Claude Code context
```

---

## 13. KEY BUSINESS RULES

1. Authors MUST be approved by admin before they can publish books
2. Books MUST be reviewed and approved by admin before going live
3. Platform commission is deducted AUTOMATICALLY via Paystack split payments
4. Customers with active subscriptions can access ALL published books in the catalog
5. One-time purchases grant PERMANENT access to that specific book
6. Audio files must be served via signed/temporary URLs (not direct public links)
7. Authors can see real-time earnings but payouts follow Paystack's settlement schedule
8. Free books can be accessed without purchase or subscription (but require account)
9. Authors cannot set prices below the platform minimum
10. Admin can override commission rates for specific authors
11. Subscription cancellation takes effect at end of current billing period
12. Deleted/archived books remain accessible to customers who already purchased them

---

## 14. REFERENCE SITES FOR DESIGN INSPIRATION

- Audible.com (audio player, library UX)
- Draft2Digital.com (author dashboard, commission model)
- Scribd.com (subscription model, book browsing)
- Spotify (audio player design on mobile)
- Gumroad.com (creator dashboard simplicity)

---

*End of Project Brief*
*Document Version: 1.0*
*Created: March 2026*
