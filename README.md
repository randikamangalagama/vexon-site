# Vexon Studios — Full System Documentation

> A complete reference for engineers inheriting or extending this project. Covers everything from local development to production deployment, database schema, admin panel usage, and system architecture.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Local Development Setup](#4-local-development-setup)
5. [Environment Variables & Secrets](#5-environment-variables--secrets)
6. [Firebase Configuration](#6-firebase-configuration)
7. [Firestore Database Schema](#7-firestore-database-schema)
8. [Firestore Security Rules](#8-firestore-security-rules)
9. [Firestore Indexes](#9-firestore-indexes)
10. [Cloudinary Image Uploads](#10-cloudinary-image-uploads)
11. [Admin Panel Guide](#11-admin-panel-guide)
12. [Pages & Routes](#12-pages--routes)
13. [Component Architecture](#13-component-architecture)
14. [Context Providers](#14-context-providers)
15. [Contact Form & Email Forwarding](#15-contact-form--email-forwarding)
16. [OTP Two-Factor Authentication](#16-otp-two-factor-authentication)
17. [Firebase Hosting Deployment](#17-firebase-hosting-deployment)
18. [Build Pipeline](#18-build-pipeline)
19. [Known Patterns & Conventions](#19-known-patterns--conventions)

---

## 1. Project Overview

**Vexon Studios** is a full-service creative studio website built as a React + Vite single-page application, hosted on Firebase Hosting. It consists of:

| Surface | Purpose |
|---|---|
| **Main site** (`/`) | Company homepage with hero, services, about, showreel, team, reviews, contact |
| **Photography page** (`/photography`) | Dedicated photography studio page with gallery, packages, and booking form |
| **Products page** (`/products`) | Showcase of apps, websites, and digital systems built by Vexon Studios |
| **Admin panel** (`/dilshanpage`) | Password + OTP-protected control panel for all site content |

Everything visible on the public site — shoots, team, packages, products, reviews, contact details, showreel video, logo, favicon — is managed entirely through the admin panel and stored in Firestore. There is no hardcoded content except fallback UI states.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + TypeScript |
| Build tool | Vite 7 |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Routing | Wouter (lightweight React router) |
| Database | Firebase Firestore (NoSQL) |
| Authentication | Firebase Auth (email/password) |
| Image hosting | Cloudinary (unsigned uploads) |
| Email forwarding | FormSubmit.co (no server needed) |
| Hosting | Firebase Hosting |
| UI components | shadcn/ui (Radix UI primitives) |
| Icons | Lucide React |
| Monorepo | pnpm workspaces |
| OTP backend | Express.js API server (`artifacts/api-server`) |

---

## 3. Repository Structure

```
workspace/
├── artifacts/
│   ├── vexon-studios/          ← Main website (this document covers this)
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── home.tsx        Home page
│   │   │   │   ├── photography.tsx Photography + gallery + packages
│   │   │   │   ├── products.tsx    Our Products page
│   │   │   │   ├── admin.tsx       Admin panel (all 8 tabs)
│   │   │   │   └── not-found.tsx   404 page
│   │   │   ├── components/
│   │   │   │   ├── layout/
│   │   │   │   │   ├── navbar.tsx  Top navigation bar
│   │   │   │   │   └── footer.tsx  Site footer
│   │   │   │   ├── animations/
│   │   │   │   │   └── fade-in.tsx Scroll-reveal components
│   │   │   │   └── ui/
│   │   │   │       ├── booking-modal.tsx  Session booking modal
│   │   │   │       ├── review-modal.tsx   Write-a-review form
│   │   │   │       └── particle-canvas.tsx (deprecated, removed from pages)
│   │   │   ├── context/
│   │   │   │   ├── auth-context.tsx     Firebase auth state
│   │   │   │   ├── booking-context.tsx  Booking modal open/close state
│   │   │   │   └── branding-context.tsx Logo, favicon, contact data
│   │   │   ├── lib/
│   │   │   │   ├── firebase.ts  Firebase app + Firestore + Auth init
│   │   │   │   └── api.ts       OTP API calls to the Express server
│   │   │   ├── App.tsx          Route definitions + provider tree
│   │   │   └── main.tsx         React entry point
│   │   ├── index.html           HTML shell (favicon link overridden at runtime)
│   │   ├── vite.config.ts       Vite config (port from $PORT env var)
│   │   └── tailwind.config.ts   Tailwind config + custom theme
│   └── api-server/              Express OTP server
│       └── src/
│           ├── index.ts         Server entry
│           ├── app.ts           Express app setup
│           └── routes/
│               ├── health.ts    GET /api/health
│               └── otp.ts       POST /api/otp/send, POST /api/otp/verify
├── firestore.rules              Firestore security rules
├── firestore.indexes.json       Composite index definitions
├── firebase.json                Firebase project config (hosting, firestore)
├── .firebaserc                  Firebase project alias (vexon-v1)
└── pnpm-workspace.yaml          pnpm workspace definition
```

---

## 4. Local Development Setup

### Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Firebase CLI (`npm install -g firebase-tools`)

### Steps

```bash
# Clone / open the repo
cd workspace

# Install all dependencies
pnpm install

# Start the main website dev server
# (Replit handles this automatically via the "web" workflow)
pnpm --filter @workspace/vexon-studios run dev

# Start the OTP API server
pnpm --filter @workspace/api-server run dev
```

The website will be available at the URL shown in the Replit preview pane.

On Replit, both servers are started automatically by the configured workflows. You do not need to start them manually.

---

## 5. Environment Variables & Secrets

All secrets are stored as **Replit Secrets** (never in source code). They are injected as environment variables at build time and runtime.

| Secret key | Where used | Value |
|---|---|---|
| `SESSION_SECRET` | API server — OTP session signing | Random 32+ char string |
| `VITE_FIREBASE_API_KEY` | Frontend — Firebase SDK init | From Firebase console |
| `FIREBASE_TOKEN` | Deploy script — `firebase deploy` | From `firebase login:ci` |
| `VITE_CLOUDINARY_CLOUD_NAME` | Frontend — Cloudinary uploads | `dyfwks8az` |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Frontend — Cloudinary preset | `vexon_unsigned` |

> **Note:** `VITE_CLOUDINARY_CLOUD_NAME` and `VITE_CLOUDINARY_UPLOAD_PRESET` are also hardcoded as fallback constants in `admin.tsx` since these are public values required for unsigned uploads (not secrets). The Replit secrets provide the recommended override path.

### Firebase SDK configuration

Firebase config is initialized in `src/lib/firebase.ts`. The `apiKey` is pulled from `import.meta.env.VITE_FIREBASE_API_KEY`. Other Firebase config values (projectId, authDomain, etc.) are hardcoded in that file since they are not secrets.

---

## 6. Firebase Configuration

**Project ID:** `vexon-v1`  
**Hosting site:** `vexon-v1`  
**Live URL:** https://vexon-v1.web.app

### Firebase services in use

| Service | Purpose |
|---|---|
| Firebase Hosting | Static file serving for the built React app |
| Firestore | NoSQL database for all site content |
| Firebase Auth | Admin authentication (email + password, gated by OTP) |

### Firebase services NOT in use

| Service | Reason |
|---|---|
| Firebase Storage | Replaced by Cloudinary for image hosting |
| Firebase Functions | Not needed — email forwarding via FormSubmit, OTP via Express |

---

## 7. Firestore Database Schema

Firestore is a NoSQL document database. All data lives in two top-level collections: `site_content` (singleton docs for settings) and dynamic collections (`reviews`, `shoots`, `inquiries`).

---

### Collection: `reviews`

Each document is one client review.

| Field | Type | Description |
|---|---|---|
| `name` | string | Reviewer's name |
| `email` | string | Reviewer's email (not shown publicly) |
| `service` | string | Service used (e.g. "Photography") |
| `rating` | number | 1–5 star rating |
| `text` | string | Review body text |
| `approved` | boolean | `true` = visible on homepage, `false` = hidden |
| `createdAt` | Timestamp | When the review was submitted |

Reviews are submitted by visitors via the Review Modal. They start with `approved: false` and must be approved in the admin panel to appear on the site.

---

### Collection: `shoots`

Each document is a photography shoot/gallery.

| Field | Type | Description |
|---|---|---|
| `title` | string | Shoot name (e.g. "Brand Shoot – May 2025") |
| `description` | string | Optional short description |
| `coverUrl` | string | Cloudinary URL of the cover/thumbnail image |
| `photos` | array | Array of `{ url: string, caption?: string }` objects |
| `visible` | boolean | `true` = shown on photography page |
| `createdAt` | Date | Creation timestamp (JS `new Date()`, not Firestore serverTimestamp) |

> **Important:** `createdAt` uses `new Date()` (not `serverTimestamp()`) when creating shoots from the admin. This ensures the shoot appears immediately in the `orderBy("createdAt", "desc")` query without waiting for the Firestore server timestamp to resolve.

---

### Collection: `inquiries`

Each document is a contact form submission.

| Field | Type | Description |
|---|---|---|
| `name` | string | Sender's name |
| `email` | string | Sender's email |
| `service` | string | Service of interest |
| `message` | string | Message body |
| `date` | string | Preferred session date (photography bookings) |
| `source` | string | `"homepage"` or `"photography_page"` |
| `status` | string | `"new"` (unread) or `"read"` |
| `createdAt` | Timestamp | Submission timestamp |

Inquiries are forwarded to `vexonstudiosmain@gmail.com` via FormSubmit.co at submission time, and are also visible in the admin panel under "Messages".

---

### Document: `site_content/homepage`

Singleton document for homepage settings.

| Field | Type | Description |
|---|---|---|
| `showreelUrl` | string | YouTube/Vimeo/MP4 URL for the homepage showreel |

---

### Document: `site_content/team`

Singleton document for team members.

| Field | Type | Description |
|---|---|---|
| `members` | array | Array of `{ id, name, role, imageUrl, bio }` objects |

The `id` field is a `Date.now().toString()` string, used as a React key and for update/delete operations.

---

### Document: `site_content/packages`

Singleton document for photography packages.

| Field | Type | Description |
|---|---|---|
| `items` | array | Array of Package objects (see below) |

**Package object:**

| Field | Type | Description |
|---|---|---|
| `id` | string | `Date.now().toString()` |
| `name` | string | Package name (e.g. "Essential") |
| `price` | string | Price text (e.g. "Rs. 25,000") — free text, supports any currency |
| `description` | string | Short description |
| `features` | string[] | List of included features (bullet points) |
| `popular` | boolean | Shows "Most Popular" badge if true |
| `visible` | boolean | Whether to show on photography page |
| `category` | string | Category label (e.g. "Wedding", "Portrait") |

---

### Document: `site_content/products`

Singleton document for the Our Products page.

| Field | Type | Description |
|---|---|---|
| `items` | array | Array of Product objects (see below) |

**Product object:**

| Field | Type | Description |
|---|---|---|
| `id` | string | `Date.now().toString()` |
| `title` | string | Product name |
| `description` | string | Product description |
| `imageUrl` | string | Preview image URL |
| `category` | string | `"website"` / `"app"` / `"system"` / `"design"` / `"other"` |
| `demoUrl` | string | Live demo URL |
| `downloadUrl` | string | Download link (GitHub release, etc.) |
| `actionType` | string | `"demo"` / `"download"` / `"both"` / `"none"` — controls which buttons show |
| `visible` | boolean | Whether to show on the products page |

---

### Document: `site_content/contact`

Singleton document for contact details and social links.

| Field | Type | Description |
|---|---|---|
| `email` | string | Contact email address |
| `phone` | string | Phone number (displayed as-is) |
| `address` | string | Studio address or city |
| `instagram` | string | Full Instagram profile URL |
| `facebook` | string | Full Facebook page URL |
| `whatsapp` | string | WhatsApp number digits only (used to build `wa.me/` link) |
| `twitter` | string | Full Twitter/X profile URL |

---

### Document: `site_content/branding`

Singleton document for brand assets.

| Field | Type | Description |
|---|---|---|
| `logoUrl` | string | Cloudinary URL of the logo image. If set, replaces "VEXON STUDIOS" text in navbar and footer. |
| `faviconUrl` | string | Cloudinary URL of the favicon. Updated dynamically in the browser tab via JavaScript. |
| `siteName` | string | Studio name used in footer copyright line |

---

## 8. Firestore Security Rules

Located at `firestore.rules`.

```
Rules summary:
- reviews:     Public read. Write requires auth (admin submits approvals).
               Unauthenticated users can CREATE (submit a review).
- shoots:      Public read.
- inquiries:   Public create (contact form). Read/write requires auth.
- site_content: Public read. Write requires auth.
```

The full rules file enforces these constraints. If you add new collections, update `firestore.rules` and redeploy (`firebase deploy --only firestore:rules`).

---

## 9. Firestore Indexes

Located at `firestore.indexes.json`.

Firestore requires composite indexes for queries that combine a `where()` clause with `orderBy()` on a different field.

| Collection | Fields | Reason |
|---|---|---|
| `shoots` | `visible ASC`, `createdAt DESC` | Previously used for the filtered + sorted query |
| `reviews` | `approved ASC`, `createdAt DESC` | Used when fetching only approved reviews in order |

> **Note:** The photography page query was changed from a Firestore-side `where("visible", "==", true)` to a client-side filter after a bug where missing composite indexes caused the gallery to show empty. The composite index still exists for future use, but the current query simply fetches all shoots ordered by date and filters `visible !== false` in JavaScript.

To deploy indexes: `firebase deploy --only firestore:indexes`

---

## 10. Cloudinary Image Uploads

All image uploads use **Cloudinary** with an **unsigned upload preset**. This means the frontend uploads directly to Cloudinary without any server-side signing.

**Cloudinary account:**
- Cloud name: `dyfwks8az`
- Upload preset: `vexon_unsigned` (unsigned, folder: `vexon-studios`)

**Why unsigned uploads are safe here:**
Unsigned presets allow anyone with the cloud name + preset name to upload. However:
- The preset restricts the upload folder
- Cloudinary's free plan limits storage and bandwidth
- The admin panel where uploads happen is protected by email + OTP authentication

**Upload flow:**
1. Admin selects a file in the admin panel
2. `uploadToCloudinary(file, onProgress)` in `admin.tsx` sends a `multipart/form-data` POST to `https://api.cloudinary.com/v1_1/dyfwks8az/image/upload`
3. Cloudinary returns `{ secure_url: "https://res.cloudinary.com/..." }`
4. The URL is stored in Firestore

**Where uploads are used:**
- Photo shoot photos (Photo Shoots tab)
- Team member photos (Team tab)
- Product preview images (Products tab)
- Logo (Branding tab)
- Favicon (Branding tab)

---

## 11. Admin Panel Guide

**URL:** `/dilshanpage`

**Login flow:**
1. Enter admin email (`vexonstudiosmain@gmail.com`) and password
2. A 6-digit OTP is sent to the admin email via the Express API server
3. Enter the OTP to gain access

**Tabs:**

| Tab | What you can do |
|---|---|
| **Reviews** | Approve, unpublish, or delete client reviews. Filter by All / Pending / Approved. Pending reviews are highlighted in gold. |
| **Messages** | View all contact form submissions. Click the email to reply. Mark as read. Delete. |
| **Photo Shoots** | Create shoots, add photos (via URL or file upload), toggle visibility, delete. Click a shoot card to open its photo manager. |
| **Team** | Add team members with name, role, photo. Edit inline. Reorder by deleting and re-adding. Press "Save Team" to publish changes. |
| **Packages** | Add/edit/delete photography packages with name, price, description, features list, and popular flag. Press "Save" to publish. |
| **Products** | Add/edit/delete products for the /products page. Supports demo URL, download URL, or both. |
| **Site Settings** | Edit showreel video URL, contact details (email, phone, address), and social links (Instagram, Facebook, WhatsApp, Twitter). |
| **Branding** | Upload or set URL for the site logo (replaces text in navbar/footer) and favicon (updates browser tab icon). Set site name. |

**Important:** Most tabs require pressing a "Save" button to persist changes. Photo shoots and team members auto-save individual operations (add/remove), but bulk edits require saving.

---

## 12. Pages & Routes

| Route | Component | Description |
|---|---|---|
| `/` | `Home` | Main homepage |
| `/photography` | `Photography` | Photography studio page |
| `/products` | `Products` | Products & portfolio page |
| `/dilshanpage` | `Admin` | Admin panel (no navbar/footer) |
| `*` | `NotFound` | 404 fallback |

Routing is handled by **Wouter** (`useLocation`, `Switch`, `Route`). The router uses a `base` path derived from `import.meta.env.BASE_URL` for compatibility with the Replit proxy system.

---

## 13. Component Architecture

### Layout components

**`Navbar`** — Fixed top bar. Scrolls between transparent (top) and blurred dark (scrolled). Links: Studio, Photography, Products, Book Us. Shows logo image if configured in Firestore branding.

**`Footer`** — Dynamic. Reads contact and social link data from `BrandingContext`. Shows only the fields that are configured (e.g., if no Instagram is set, the Instagram icon is not shown).

### Animation components

**`FadeIn`** — Wraps any content in a scroll-triggered fade-up animation (Framer Motion `whileInView`).

**`StaggerContainer` / `StaggerItem`** — Parent/child pair for staggered list animations.

### UI components

**`BookingModal`** — Full-screen booking form modal. Triggered from navbar "Book Us" button and CTAs throughout the site. Saves to `inquiries` collection and emails via FormSubmit.

**`ReviewModal`** — Form to submit a new review. Review starts as `approved: false` and is visible only to the admin until approved.

---

## 14. Context Providers

Three React contexts wrap the entire app (defined in `App.tsx`):

### `AuthProvider`

Wraps `onAuthStateChanged` from Firebase Auth. Provides `{ user, loading }`. Used by the admin page to detect if the user is already logged in (skips password step, goes straight to OTP).

### `BookingProvider`

Provides `{ openModal, closeModal, isOpen }`. The `BookingModal` component subscribes to `isOpen`. Any component can call `openModal()` to show the booking form.

### `BrandingProvider`

On mount, fetches `site_content/branding` and `site_content/contact` from Firestore. Provides:
- `branding: { logoUrl, faviconUrl, siteName }` — used by Navbar and Footer
- `contact: { email, phone, address, instagram, facebook, whatsapp, twitter }` — used by Footer and home page contact section
- `loading: boolean` — whether the initial fetch is complete
- `reload()` — function to re-fetch (not currently called, but available)

Also handles the dynamic favicon: when `branding.faviconUrl` changes, it updates the `<link rel="icon">` element in `document.head`.

---

## 15. Contact Form & Email Forwarding

Both the homepage contact form and the photography booking form use **FormSubmit.co** for email forwarding. This is a free service that forwards form submissions to an email address without requiring a backend.

**Target email:** `vexonstudiosmain@gmail.com`

**How it works:**
1. The form submission is saved to Firestore `inquiries` collection
2. Simultaneously, a `fetch` POST is sent to `https://formsubmit.co/ajax/vexonstudiosmain@gmail.com`
3. FormSubmit forwards the data as an email to the configured address
4. The admin can also see the submission in the Messages tab of the admin panel

**Important:** FormSubmit requires email confirmation on the first submission. If emails stop arriving, check the FormSubmit inbox activation — the service may have sent a confirmation email to `vexonstudiosmain@gmail.com` that needs to be clicked.

---

## 16. OTP Two-Factor Authentication

The admin panel uses a custom OTP system for two-factor authentication on top of Firebase Auth.

**Flow:**
1. Admin enters email + password → Firebase Auth validates credentials
2. If valid, the frontend calls `POST /api/otp/send` on the Express server
3. The Express server generates a 6-digit code, stores it (with expiry) in memory, and emails it via Nodemailer
4. Admin enters the code → `POST /api/otp/verify` validates it
5. If valid, the frontend sets stage to "dashboard"

**API server routes:**
- `POST /api/otp/send` — body: `{ email }` → sends OTP, returns `{ sessionId }`
- `POST /api/otp/verify` — body: `{ sessionId, otp }` → returns `{ success: true }` or error

The Express server is in `artifacts/api-server/`. It runs on a separate port (configured by the `PORT` env var) and is proxied via Replit's path-based router at `/api`.

---

## 17. Firebase Hosting Deployment

### Deploy command

```bash
cd artifacts/vexon-studios && PORT=3000 BASE_PATH=/ pnpm run build && firebase deploy --only hosting,firestore --token "$FIREBASE_TOKEN"
```

This command:
1. Builds the Vite app to `artifacts/vexon-studios/dist/public/`
2. Deploys the `dist/public/` folder to Firebase Hosting
3. Deploys Firestore rules and indexes

### Deploy only hosting (faster, when only frontend changed)

```bash
cd artifacts/vexon-studios && PORT=3000 BASE_PATH=/ pnpm run build && firebase deploy --only hosting --token "$FIREBASE_TOKEN"
```

### Deploy only Firestore rules/indexes (when no frontend changes)

```bash
firebase deploy --only firestore --token "$FIREBASE_TOKEN"
```

### What gets deployed

- `artifacts/vexon-studios/dist/public/` → Firebase Hosting (https://vexon-v1.web.app)
- `firestore.rules` → Firestore security rules
- `firestore.indexes.json` → Firestore composite indexes

### SPA routing

`firebase.json` configures a catch-all rewrite so that all paths serve `index.html` — this is required for client-side routing (Wouter) to work after page refresh:

```json
"rewrites": [{ "source": "**", "destination": "/index.html" }]
```

---

## 18. Build Pipeline

### Development (Replit)

Replit runs two workflows automatically:
- **`artifacts/vexon-studios: web`** — runs `pnpm --filter @workspace/vexon-studios run dev` — Vite dev server
- **`artifacts/api-server: API Server`** — runs `pnpm --filter @workspace/api-server run dev` — Express OTP server

### Production build

```bash
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/vexon-studios run build
```

Output: `artifacts/vexon-studios/dist/public/`

Vite reads `PORT` and `BASE_PATH` from environment variables (required by the Replit monorepo convention for path-based proxy routing).

### TypeScript checking

```bash
pnpm run typecheck
```

Runs `tsc --build --emitDeclarationOnly` using project references for all lib packages, then `tsc --noEmit` for each artifact. Always run this before deploying to catch type errors.

---

## 19. Known Patterns & Conventions

### Firestore data arrays vs subcollections

`site_content/team`, `site_content/packages`, and `site_content/products` all store their data as arrays (`members[]`, `items[]`) inside a single Firestore document rather than as subcollections. This is a deliberate trade-off:

- **Pro:** Simpler queries, no composite indexes needed, atomic updates
- **Con:** Firestore document size limit of 1MB (not a concern at current scale)
- **Rule:** Always load the full array, mutate in memory, then `setDoc` the entire array back

### `new Date()` vs `serverTimestamp()` for shoot creation

Shoots use `createdAt: new Date()` (client-side JS Date) instead of `serverTimestamp()`. This is because `serverTimestamp()` is `null` until the write completes on the server, which caused new shoots to be filtered out by `orderBy("createdAt", "desc")` immediately after creation. `new Date()` provides an immediate timestamp.

### Cloudinary URLs are permanent

Once an image is uploaded to Cloudinary, its URL never changes. If a team member's photo or a product image is updated, the old Cloudinary file remains (orphaned). This is acceptable for the current usage scale. A cleanup process could be implemented in the future using the Cloudinary Admin API.

### Admin panel saves are manual (not auto-save)

Most tabs require pressing a "Save" button to push changes to Firestore. Individual operations (adding a photo to a shoot, adding a team member) do auto-save, but editing existing fields does not — changes are held in local React state until "Save" is pressed.

### Contact form dual write

All contact form submissions write to Firestore AND send via FormSubmit in parallel. If one fails, the submission is not lost — it still exists in the other location. The admin panel shows the Firestore copy; the email is the real-time notification.

### Responsive grid for team members

The team grid on the homepage adapts based on the number of members:
- 1 member → single column, narrow
- 2 members → 2-column grid
- 3 members → 3-column grid
- 4+ members → 4-column grid (responsive)

### Dynamic favicon implementation

The favicon is updated at runtime in `BrandingContext` by finding the `<link rel="icon">` element in `document.head` and setting its `href`. This happens whenever `branding.faviconUrl` changes. The `index.html` still has a default `<link rel="icon" href="/favicon.svg">` as a fallback for the initial page load before Firestore is queried.
