# Deployment Guide: PythonAnywhere + Vercel

Complete step-by-step instructions to deploy the Angular frontend on Vercel and Flask backend on PythonAnywhere (free tier, no credit card required).

## Architecture
- **Frontend**: Vercel (static Angular build) → Serves parent/admin dashboards
- **Backend**: PythonAnywhere (Python web app) → Handles Excel uploads, authentication, API
- **Database**: Supabase (PostgreSQL) → Managed cloud database

## Prerequisites
1. GitHub account with your repo pushed.
2. Vercel account (free) at https://vercel.com
3. PythonAnywhere account (free) at https://www.pythonanywhere.com (no credit card needed)
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

### 1.2 Backend Test (optional)
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
4. Framework Preset: Select **Other**
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
   - **Value**: `http://localhost:5000` (temporary, will update after PythonAnywhere URL is live)
   - **Environments**: Development, Preview, Production
3. Click **Add** then **Redeploy**

### 2.3 Verify Frontend
Click the deployment URL (e.g., `https://your-project.vercel.app`). You should see the login page.

---

## PHASE 3: Backend to PythonAnywhere (20 min)

### 3.1 Create PythonAnywhere Account
1. Go to https://www.pythonanywhere.com/
2. Click **Sign up** → choose **Free account**
3. Fill in details (no credit card required)
4. Verify email
5. Login to dashboard

### 3.2 Create Web App
1. In PythonAnywhere dashboard, click **Web** (left sidebar)
2. Click **Add a new web app**
3. Choose **Manual configuration** (not using a template)
4. Select **Python 3.10** (or latest available)
5. Click **Next** → Done

You should now see a Web app created (e.g., `yourusername.pythonanywhere.com`).

### 3.3 Upload Backend Code
PythonAnywhere has a file browser and web IDE. You can:

**Option A (Easiest): Upload via Web IDE**
1. In PythonAnywhere, click **Files** (left sidebar)
2. Navigate to `/home/yourusername/mysite/` folder
3. Click **New file** or **New folder**
4. Create folder `backend` (if not exists)
5. Upload or paste your `app.py` file
6. Upload `requirements.txt` file

**Option B: Use Git (recommended for updates)**
1. Click **Consoles** → **Bash**
2. Clone your repo:
   ```bash
   cd ~
   git clone https://github.com/your-username/your-repo.git
   ```
3. Verify files are there:
   ```bash
   ls ~/your-repo/backend/
   ```

### 3.4 Configure WSGI File
PythonAnywhere needs a WSGI file to run your Flask app.

1. Click **Web** (sidebar)
2. Under "Code", find **WSGI configuration file** link
3. Click it → opens an editor
4. **Replace entire content** with:

```python
import sys
import os

# Add your project directory to the path
project_home = '/home/yourusername/your-repo/backend'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Set environment variables
os.environ['SUPABASE_URL'] = 'https://xxx.supabase.co'  # Replace with your URL
os.environ['SUPABASE_KEY'] = 'your_key_here'  # Replace with your key

# Import and run your Flask app
from app import app as application
```

Replace:
- `yourusername` with your PythonAnywhere username
- `your-repo` with your GitHub repo name
- `https://xxx.supabase.co` with your Supabase URL
- `your_key_here` with your Supabase anon key

5. Click **Save** button

### 3.5 Install Python Packages
1. Click **Consoles** (sidebar)
2. Click **Bash** to open a terminal
3. Install requirements:
   ```bash
   cd ~/your-repo/backend
   pip install --user -r requirements.txt
   ```
   (Use `--user` flag for free tier)

4. Wait for install to complete (may take 2–3 minutes)

### 3.6 Reload Web App
1. Go back to **Web** (sidebar)
2. Find your web app (e.g., `yourusername.pythonanywhere.com`)
3. Click the green **Reload** button at the top
4. Wait ~10 seconds for it to restart

### 3.7 Verify Backend
Visit in browser:
```
https://yourusername.pythonanywhere.com/api/health
```

Expected response:
```json
{"status":"ok","message":"Flask backend is running"}
```

If you see 404 or error:
- Check **Log files** (Web sidebar) → Error log
- Verify WSGI file paths are correct
- Ensure Supabase credentials are set in WSGI file
- Reload web app again

---ؤي 

## PHASE 4: Connect Frontend ↔ Backend (5 min)

### 4.1 Update Frontend API URL
1. Go to Vercel dashboard → Project **Settings** → **Environment Variables**
2. Update `API_BASE_URL`:
   - **Value**: `https://yourusername.pythonanywhere.com` (replace with your PythonAnywhere URL from Phase 3.7)
   - Environments: Production
3. Click **Save** → Redeploy

### 4.2 Test Integration
1. Open your Vercel frontend URL: `https://your-project.vercel.app/login`
2. Login with a parent phone number + password
3. Navigate to parent dashboard → should see students and sessions loading from PythonAnywhere backend
4. Try uploading an Excel file (admin portal) — should succeed

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
- Check browser console (F12) for network errors
- Verify `API_BASE_URL` environment variable is set to correct PythonAnywhere URL
- Ensure PythonAnywhere backend is live (Reload button shows green checkmark)

### PythonAnywhere returns 404
- Click **Web** → View error log
- Check WSGI file configuration (paths must be correct)
- Verify app.py is in correct location
- Make sure web app is **Enabled** (toggle on Web page)

### Import errors (Module not found)
- In PythonAnywhere Bash console, run:
  ```bash
  pip install --user pandas openpyxl supabase flask flask-cors python-dateutil
  ```
- Reload web app after install

### WSGI file errors
- Check exact paths using bash:
  ```bash
  pwd  # shows current directory
  ls ~/your-repo/backend/  # verify app.py exists
  ```
- Update paths in WSGI file to match

---

## Monitoring & Logs

**Vercel**:
- Dashboard → Deployments → select a deployment → Logs tab

**PythonAnywhere**:
- **Web** page → scroll down → **Error log** and **Access log**
- Or: **Consoles** → **Bash** to debug via terminal

---

## Optional: Custom Domain

### Vercel
1. **Settings** → **Domains** → add your domain (e.g., `app.yourdomain.com`)
2. Follow DNS setup instructions provided by Vercel

### PythonAnywhere (paid feature)
- Custom domains require a paid account on PythonAnywhere
- Free tier is limited to `yourusername.pythonanywhere.com`

---

## Cost (Free Tier)
- **Vercel**: Free for static sites, includes 100GB bandwidth/month
- **PythonAnywhere**: Free tier: 512 MB disk, 1 web app, limitations on CPU/time
  - For production: upgrade to Hacker ($5/month) for better performance
- **Supabase**: Free tier includes 500MB database + 1GB bandwidth

---

## Limits & Considerations

**PythonAnywhere Free Tier**:
- 512 MB total disk space
- Limited CPU time per day
- Requests to external APIs (like Supabase) count against quota
- Good for: Testing, small projects, low traffic
- Not ideal for: High-traffic production, large file uploads

**Scaling Up**:
If you hit limits, upgrade to:
- **PythonAnywhere Hacker tier** ($5/month): 2GB disk, higher quotas
- Or migrate to **Render/Railway/Fly** (more generous free tiers)

---

## Summary of Files
- `vercel.json` — Vercel build config for Angular
- `backend/requirements.txt` — Python dependencies
- `backend/Procfile` — (Not used on PythonAnywhere, but kept for future use)

Push all changes to GitHub. PythonAnywhere pulls directly from your repo via Git or manual file upload.

---

## Next Steps
1. Create PythonAnywhere account (free, no CC)
2. Upload backend code and configure WSGI file
3. Reload web app and verify /api/health works
4. Update Vercel `API_BASE_URL` to PythonAnywhere URL
5. Test full integration

Good luck! 🚀
