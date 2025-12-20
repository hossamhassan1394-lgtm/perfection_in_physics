# Deployment Guide: PerfectionWeb Frontend + Backend

Complete step-by-step instructions to deploy the Angular frontend on Vercel and Flask backend on Render.

## Architecture
- **Frontend**: Vercel (static Angular build) → Serves parent/admin dashboards
- **Backend**: Render (Python 3.x) → Handles Excel uploads, authentication, API
- **Database**: Supabase (PostgreSQL) → Managed cloud database

## Prerequisites
1. GitHub account with your repo pushed.
2. Vercel account (free) at https://vercel.com
3. Render account (free tier available) at https://render.com
4. Supabase credentials (`SUPABASE_URL`, `SUPABASE_KEY`) from your project.

---

## PHASE 1: Test Locally (5 min)

### 1.1 Frontend Build Test
From project root:
```bash
npm install
npm run build
```
Check that `dist/prefectionweb/` folder exists with index.html inside.

### 1.2 Backend Test (optional, but recommended)
From `backend/` folder:
```bash
pip install -r requirements.txt
python app.py
```
Visit `http://localhost:5000/api/health` — should return `{"status":"ok", ...}`.

---

## PHASE 2: Frontend to Vercel (10 min)

### 2.1 Create Vercel Project
1. Go to https://vercel.com/dashboard
2. Click **Add New** → **Project**
3. Select **Import Git Repository** → find your GitHub repo and click **Import**
4. Framework Preset: Select **Other** (since it's Angular, which Vercel may not auto-detect)
5. Configure:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/prefectionweb`
   - **Install Command**: `npm install`
6. Click **Deploy** — wait for build to complete (2–3 min).

### 2.2 Set Frontend Environment Variables
After deployment:
1. Go to project **Settings** → **Environment Variables**
2. Add:
   - **Name**: `API_BASE_URL`
   - **Value**: `http://localhost:5000` (temporary for testing, you'll update this after Render URL is live)
   - **Environments**: Development, Preview, Production
3. Click **Add**
4. Redeploy: Click **Deployments** → latest → **Redeploy**

### 2.3 Verify Frontend
Click the deployment URL (e.g., `https://your-project.vercel.app`). You should see the login page.

**Note**: The parent dashboard will show "error loading sessions" because the backend isn't live yet. That's normal.

---

## PHASE 3: Backend to Render (10 min)

### 3.1 Create Render Service
1. Go to https://render.com/dashboard
2. Click **New** → **Web Service**
3. **Connect Repository**: Choose your GitHub repo
4. **Environment Path** (optional): Set to `backend` if repo root has both frontend + backend folders. If Render can't find `requirements.txt`, manually set the **Start Command** later.
5. **Runtime**: Python 3
6. **Build Command**: 
   ```
   pip install -r requirements.txt
   ```
7. **Start Command**:
   ```
   gunicorn app:app --bind 0.0.0.0:$PORT -w 4
   ```
8. **Environment Variables**: Add (via **Environment** tab):
   - `SUPABASE_URL`: Your Supabase URL (e.g., `https://xxx.supabase.co`)
   - `SUPABASE_KEY`: Your Supabase Key (anon public key)
   - (Optional) `FLASK_ENV`: `production`
9. Click **Create Web Service** — wait for build & deployment (3–5 min).

### 3.2 Get Render Backend URL
After deployment, copy the live URL from Render dashboard (e.g., `https://perfectionweb-backend.onrender.com`).

### 3.3 Verify Backend
In browser, visit: `https://<your-render-url>/api/health`

Expected response:
```json
{"status":"ok", "message":"Flask backend is running"}
```

If you see 404 or error:
- Check **Logs** tab in Render dashboard for error messages.
- Ensure `requirements.txt` exists and lists all dependencies.
- Verify `SUPABASE_URL` and `SUPABASE_KEY` are set correctly.

---

## PHASE 4: Connect Frontend ↔ Backend (5 min)

### 4.1 Update Frontend API URL
1. Go back to Vercel dashboard → Project **Settings** → **Environment Variables**
2. Update `API_BASE_URL`:
   - **Value**: `https://<your-render-url>` (replace `<your-render-url>` with Render service URL)
   - Environments: Production
3. Click **Save** → Redeploy:
   - **Deployments** → latest → **Redeploy**
4. Wait for redeploy to complete.

### 4.2 Test Integration
1. Open your Vercel frontend URL: `https://your-project.vercel.app/login`
2. Login with a parent phone number + password.
3. Navigate to parent dashboard → should see students and sessions loading from the Render backend.
4. Try uploading an Excel file (admin portal) — should succeed.

---

## PHASE 5: Final Verification Checklist

- [ ] Frontend loads on Vercel without errors
- [ ] Backend /api/health returns 200
- [ ] Parent can login with phone number
- [ ] Sessions load on parent dashboard
- [ ] Excel upload works from admin dashboard
- [ ] Logout button appears and works
- [ ] Start time displays in DD/MM/YYYY HH:MM:SS ص/م format
- [ ] No console errors in browser (F12 → Console tab)

---

## Troubleshooting

### Frontend shows "error loading sessions"
- Check browser console (F12) for network errors.
- Verify `API_BASE_URL` environment variable is set to the correct Render URL.
- Ensure Render backend is running (check Render dashboard logs).

### Render backend shows error "Module not found"
- Run locally: `cd backend && pip install -r requirements.txt`
- Check that all imports in `app.py` are listed in `requirements.txt`.
- Verify Python version matches (Render uses Python 3.x; check logs for exact version).

### Vercel build fails
- Check **Build Logs** in Vercel dashboard.
- Run locally: `npm run build` to reproduce error.
- Verify `dist/prefectionweb/` is created (Angular default output folder).

### 404 on /api/upload-excel
- Ensure Render backend is live (not sleeping).
- Check Render **Logs** for Flask startup errors.
- Verify `SUPABASE_URL` and `SUPABASE_KEY` are correct.

---

## Monitoring & Logs

**Vercel**:
- Dashboard → Deployments → select a deployment → Logs tab

**Render**:
- Dashboard → Web Service → Logs tab (real-time)

---

## Optional: Custom Domain

### Vercel
1. **Settings** → **Domains** → add your domain (e.g., `app.yourdomain.com`)
2. Follow DNS setup instructions provided by Vercel.

### Render
1. **Settings** → **Custom Domains** → add your domain (e.g., `api.yourdomain.com`)
2. Follow DNS setup instructions provided by Render.

---

## Cost (Free Tier)
- **Vercel**: Free for static sites, includes 100GB bandwidth/month.
- **Render**: Free tier has 750 compute hours/month (enough for dev/small traffic). May sleep after 15 min of inactivity.
  - To avoid sleep, upgrade to **Standard** (~$7/month).
- **Supabase**: Free tier includes 500MB database + 1GB bandwidth.

---

## Summary of Files Added/Updated
- `vercel.json` — Vercel build config for Angular static site
- `backend/requirements.txt` — Python dependencies for Render
- `backend/Procfile` — Render startup command
- `.env` (already exists) — local Supabase credentials (never commit)

Push all changes to GitHub, then proceed with Vercel + Render setup above.

---

## Support
- Vercel docs: https://vercel.com/docs
- Render docs: https://render.com/docs
- Angular deployment: https://angular.io/guide/deployment
