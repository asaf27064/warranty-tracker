<p align="center">
  <img src="frontend/public/logo.png" width="88" alt="Warranty Tracker" />
</p>

<h1 align="center">Warranty Tracker</h1>

<p align="center">
  <a href="https://github.com/asaf27064/warranty-tracker/actions/workflows/ci.yml">
    <img src="https://github.com/asaf27064/warranty-tracker/actions/workflows/ci.yml/badge.svg" alt="CI" />
  </a>
</p>

**Never lose track of a product warranty again.**

Warranty Tracker is a full-stack TypeScript app for managing product warranties: add products, store receipts and documents, get reminded before coverage expires, and manage everything by chatting with an AI assistant that can answer questions about your warranties.

> **Live demo:** **[warranty-tracker-kohl.vercel.app](https://warranty-tracker-kohl.vercel.app)** - sign in with Google and try it (the API is on a free tier, so the first request after a while may take ~30s to wake).

---

## 📸 Screenshots

| Dashboard Dark Theme | Product Details Dark Theme |
|---|---|
| ![Dashboard Dark Theme](docs/screenshots/dashboard_dark.png) | ![Product details Dark Theme](docs/screenshots/product-details_dark.png) |

| Dashboard Light Theme | Product Details Light Theme |
|---|---|
| ![Dashboard Light Theme](docs/screenshots/dashboard_light.png) | ![Product details Light Theme](docs/screenshots/product-details_light.png) |

---

## ✨ Highlights

- **AI assistant (tool-using agent).** Chat to search your products, see what's expiring, set reminders, or add a product. After an add, attach a photo or receipt right in the chat. Built on Claude with real tool use over a shared, Zod-validated service layer.
- **Local-first natural-language add.** "I bought a laptop yesterday, 1 year warranty" is parsed by a rule-based parser (chrono-node + regex), confirmed, and created with no LLM call.
- **Receipt and invoice scanning.** Upload a photo or PDF and extracts the product name, store, purchase date, and warranty length, then pre-fills the form for review.
- **Reminder digest emails.** A daily job groups everything expiring soon into one clean email per user, with product thumbnails, color-coded status, and a warranty progress bar.
- **Web push and installable PWA.** Opt in to browser push (via the Web Push / VAPID protocol and a service worker) to get notified even when the app is closed, and install the app to your home screen or desktop.

## 🧩 Features

**Warranties**
- Add, edit, delete products with automatic status (Active → Expiring soon → Expired)
- Server-side search, filter (status + category), sort, and cursor-paginated infinite scroll
- Cards and list views, active-filter chips with clear-all, CSV export, bulk select + delete

**Documents and images**
- Upload receipts, invoices, and warranty certificates to Cloudflare R2
- Inline document/receipt preview (images + PDFs) without leaving the page
- Product image upload, plus image search to find a product photo

**Notifications**
- Daily cron updates statuses and sends the reminder digest (30 / 7 / 1 days before expiry)
- In-app notification bell with unread count, independent of email delivery
- In-app, email, and browser push channels, each an independent opt-in
- Browser push (Web Push + VAPID + service worker) that fires even when the app is closed

**Preferences and account**
- First-login onboarding to choose notification channels
- Settings page: theme, default view, per-channel notification toggles, and a test-push action
- Preferences (theme, default view) follow the user across devices
- Self-service account deletion that removes the user, their files in R2, and all related data, behind a type-to-confirm dialog
- Installable PWA (web app manifest + service worker, add to home screen / desktop)

**Auth and UX**
- Google OAuth with short-lived JWT access tokens and an HttpOnly refresh cookie
- Resilient sessions (refresh on tab focus, single-flight refresh, clear "session expired" handling)
- Dark / light / system theme, responsive layout, toasts, smooth animations

---

## 🛠️ Tech stack

**Frontend:** React + TypeScript, Vite, Tailwind CSS v4, shadcn / Base UI, TanStack Query, React Router, Framer Motion, next-themes, sonner. Installable PWA with a service worker for web push.

**Backend:** Node.js + Express, TypeScript, Prisma v7 + PostgreSQL, Passport (Google OAuth 2.0), JWT, Zod validation, Anthropic SDK (Claude), Cloudflare R2 (S3 SDK), Nodemailer, web-push (VAPID), node-cron, Multer, express-rate-limit.

**Infra:** Docker, Vercel (frontend), Render (backend), Neon (Postgres), Cloudflare R2. Jest + Supertest (API tests), Vitest + Testing Library (frontend), GitHub Actions for CI.

---

## 🏗️ Architecture

A shared **service layer** is the single source of truth for products, reminders, and conversations. Both the REST controllers and the AI agent call into it, so HTTP requests and the chatbot run the exact same Zod-validated logic instead of duplicating it.

```
React (Vite)  ->  Express REST API  ->  Service layer  ->  Prisma  ->  PostgreSQL
                          |                   ^
                          v                   |
                   Anthropic agent  ----------+   (same services as tools)
                          |
                   R2 (files) · Nodemailer (email) · node-cron (reminders)
```

---

## 🚀 Getting started

**Prerequisites:** Node 20+, and either Docker (for the bundled Postgres) or your own Postgres.

1. Copy the env template and fill it in:
   ```bash
   cp backend/.env.example backend/.env
   ```
   You'll need a Postgres URL, Google OAuth credentials, Cloudflare R2 keys, an Anthropic API key, and Gmail SMTP (App Password). `SERPAPI_KEY` is optional (image search degrades gracefully). For web push, generate a VAPID keypair with `npx web-push generate-vapid-keys` and set `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` (push disables itself if unset).

2. **Option A: Docker (Postgres + backend)**
   ```bash
   docker compose up --build        # backend on :5000, Postgres on :5432
   cd frontend && npm install && npm run dev   # frontend on :5173
   ```

3. **Option B: run locally**
   ```bash
   cd backend && npm install && npx prisma migrate dev && npm run dev
   cd frontend && npm install && npm run dev
   ```

Set `VITE_API_URL=http://localhost:5000` in `frontend/.env` for local dev. For web push, also set `VITE_VAPID_PUBLIC_KEY` to the same public key used by the backend.

---

## ☁️ Deployment

Step-by-step for the free stack (Vercel + Render + Neon + R2) is in **[DEPLOY.md](DEPLOY.md)**. The backend ships as a Docker image that runs `prisma migrate deploy` on start.

## ✅ Tests and CI

```bash
cd backend && npm test     # Jest + Supertest (needs a test database)
cd frontend && npm test    # Vitest + Testing Library
```

GitHub Actions runs a backend typecheck and a frontend build on every pull request.

---

Built by Asaf Ohana.
