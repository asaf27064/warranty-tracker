# Deploying Warranty Tracker (free stack)

Stack: **Vercel** (frontend) + **Render** (backend, runs the Dockerfile) + **Neon** (Postgres) + **Cloudflare R2** (files). All have free tiers.

Order matters: database first, then backend, then frontend, then wire the OAuth redirect.

---

## 1. Database - Neon (free)
1. Create a project at neon.tech. Copy the **pooled** connection string (looks like `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require`).
2. Keep it for `DATABASE_URL` below. (Migrations run automatically on backend deploy via `prisma migrate deploy`.)

## 2. Backend - Render (free web service, Docker)
1. New > **Web Service** > connect this GitHub repo.
2. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Docker (Render auto-detects `backend/Dockerfile`)
   - **Instance type:** Free
3. **Environment variables** (from `backend/.env.example`):
   - `DATABASE_URL` = the Neon pooled URL
   - `NODE_ENV` = `production`
   - `CLIENT_URL` = your Vercel URL (fill after step 3, e.g. `https://warranty-tracker.vercel.app`)
   - `SERVER_URL` = your **Vercel** URL (the OAuth callback is proxied through Vercel so the auth cookie is first-party; see the auth-proxy note below)
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` = long random strings
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - `R2_REGION` (`auto`), `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `PUBLIC_FILES_URL`
   - `ANTHROPIC_API_KEY`
   - `EMAIL_USER`, `EMAIL_PASS` (Gmail App Password)
   - `SERPAPI_KEY` (optional)
   - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (web push; generate the keypair with `npx web-push generate-vapid-keys`, set `VAPID_SUBJECT` to `mailto:you@example.com`). Optional: push disables itself if unset.
   - Do **not** set `PORT` (Render injects it; the app reads `process.env.PORT`).
4. Deploy. Note the URL, e.g. `https://warranty-tracker-api.onrender.com`.

> Free tier sleeps after ~15 min idle, so the 08:00 reminder cron may not run while asleep. Later: a free pinger (cron-job.org) can hit a health route daily to wake it.

## 3. Frontend - Vercel (free)
1. New Project > import this repo.
2. Settings:
   - **Root Directory:** `frontend`
   - Framework preset: Vite (build `npm run build`, output `dist`)
3. **Environment variables:**
   - `VITE_API_URL` = the Render backend URL (e.g. `https://warranty-tracker-api.onrender.com`)
   - `VITE_VAPID_PUBLIC_KEY` = the same `VAPID_PUBLIC_KEY` value from Render (the public key is safe to expose; needed for web push).
4. Deploy. Note the URL, e.g. `https://warranty-tracker.vercel.app`.
5. Go back to Render and set `CLIENT_URL` to this Vercel URL, then redeploy the backend.

## 4. Google OAuth redirect
In Google Cloud Console > Credentials > your OAuth client:
- **Authorized redirect URI:** `https://<your-vercel-frontend>/auth/google/callback` (the callback is proxied through Vercel; keep the Render one too if you want both)
- **Authorized JavaScript origins:** your Vercel URL.

## Auth proxy (why login works on mobile)
Frontend and backend are different sites, so the refresh cookie would be a third-party cookie and mobile browsers (Samsung Internet, Safari) block it, bouncing users back to login. To avoid this, `frontend/vercel.json` proxies `/auth/*` to the Render backend so the cookie is **first-party** to the Vercel domain. Only `/auth/*` is proxied; `/api/*` (including uploads) goes directly to Render with the Bearer token, so large uploads are unaffected by Vercel's request-size limit. Leave `VITE_AUTH_URL` **unset** in production (the app then uses the same-origin proxy); set it to the backend URL only for local dev.

## 5. Cloudflare R2 CORS
Make sure the R2 bucket allows your Vercel origin (GET/PUT) so image uploads/preview work from the deployed frontend.

---

## Local run (Docker)
```
cp backend/.env.example backend/.env   # fill in the secrets
docker compose up --build              # Postgres + backend on :5000
cd frontend && npm run dev             # frontend on :5173 (set VITE_API_URL=http://localhost:5000)
```

## Notes
- Cross-domain auth works because the refresh cookie is `SameSite=None; Secure` in production (set automatically when `NODE_ENV=production`).
- Before sharing publicly: set a **monthly spend cap** in the Anthropic console.
- Email deliverability: Gmail SMTP works but lands in spam. For inbox delivery, move to Resend on a verified domain.
- Web push and PWA install need HTTPS, which Vercel provides automatically. After adding the VAPID vars, redeploy both services so they pick them up.
