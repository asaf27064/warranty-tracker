# Deploying Warranty Tracker (free stack)

Stack: **Vercel** (frontend) + **Render** (backend, runs the Dockerfile) + **Neon** (Postgres) + **Cloudflare R2** (files). All have free tiers.

Order matters: database first, then backend, then frontend, then wire the OAuth redirect.

---

## 1. Database — Neon (free)
1. Create a project at neon.tech. Copy the **pooled** connection string (looks like `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require`).
2. Keep it for `DATABASE_URL` below. (Migrations run automatically on backend deploy via `prisma migrate deploy`.)

## 2. Backend — Render (free web service, Docker)
1. New > **Web Service** > connect this GitHub repo.
2. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Docker (Render auto-detects `backend/Dockerfile`)
   - **Instance type:** Free
3. **Environment variables** (from `backend/.env.example`):
   - `DATABASE_URL` = the Neon pooled URL
   - `NODE_ENV` = `production`
   - `CLIENT_URL` = your Vercel URL (fill after step 3, e.g. `https://warranty-tracker.vercel.app`)
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` = long random strings
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - `R2_REGION` (`auto`), `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `PUBLIC_FILES_URL`
   - `ANTHROPIC_API_KEY`
   - `EMAIL_USER`, `EMAIL_PASS` (Gmail App Password)
   - `SERPAPI_KEY` (optional)
   - Do **not** set `PORT` (Render injects it; the app reads `process.env.PORT`).
4. Deploy. Note the URL, e.g. `https://warranty-tracker-api.onrender.com`.

> Free tier sleeps after ~15 min idle, so the 08:00 reminder cron may not run while asleep. Later: a free pinger (cron-job.org) can hit a health route daily to wake it.

## 3. Frontend — Vercel (free)
1. New Project > import this repo.
2. Settings:
   - **Root Directory:** `frontend`
   - Framework preset: Vite (build `npm run build`, output `dist`)
3. **Environment variable:**
   - `VITE_API_URL` = the Render backend URL (e.g. `https://warranty-tracker-api.onrender.com`)
4. Deploy. Note the URL, e.g. `https://warranty-tracker.vercel.app`.
5. Go back to Render and set `CLIENT_URL` to this Vercel URL, then redeploy the backend.

## 4. Google OAuth redirect
In Google Cloud Console > Credentials > your OAuth client:
- **Authorized redirect URI:** `https://<your-render-backend>/auth/google/callback`
- **Authorized JavaScript origins:** your Vercel URL.

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
