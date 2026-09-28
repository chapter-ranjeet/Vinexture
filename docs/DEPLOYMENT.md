# VINEXTURE Live Deployment Guide (Render + Vercel)

This repository is pre-configured for deployment with **Render** (Django REST API + PostgreSQL) and **Vercel** (Next.js 16 + TypeScript Frontend).

---

## 🚀 Part 1: Deploy Backend on Render

### Method A: Blueprint (Recommended - 1 Click)
1. Go to **[dashboard.render.com](https://dashboard.render.com/)**.
2. Click **New +** &rarr; **Blueprint**.
3. Connect your GitHub repository: `https://github.com/chapter-ranjeet/Vinexture`.
4. Render will detect [`render.yaml`](../render.yaml) automatically:
   - **Web Service**: `vinexture-backend` (Python 3.11 with Gunicorn & WhiteNoise)
   - **Database**: `vinexture-db` (Free PostgreSQL instance)
   - **Build Command**: `bash ./build.sh` (collects static files, runs migrations, seeds initial data)
   - **Start Command**: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
5. Click **Apply**.
6. Once deployed, copy your Render backend URL (e.g. `https://vinexture-backend.onrender.com`).

### Method B: Manual Web Service
If creating manually:
1. Click **New +** &rarr; **PostgreSQL**:
   - Name: `vinexture-db` &bull; Click **Create Database**.
   - Copy the **Internal Database URL**.
2. Click **New +** &rarr; **Web Service**:
   - Connect repository: `https://github.com/chapter-ranjeet/Vinexture`.
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `bash ./build.sh`
   - **Start Command**: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
3. Add **Environment Variables**:
   - `PYTHON_VERSION`: `3.11.9`
   - `DJANGO_SECRET_KEY`: (Click generate)
   - `DJANGO_DEBUG`: `False`
   - `DJANGO_ALLOWED_HOSTS`: `*`
   - `DATABASE_URL`: (Paste database connection string)
   - `FRONTEND_URL`: `https://your-app-name.vercel.app`

---

## ⚡ Part 2: Deploy Frontend on Vercel

1. Go to **[vercel.com/new](https://vercel.com/new)**.
2. Select and import `chapter-ranjeet/Vinexture`.
3. In **Project Settings**:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `frontend` *(already pre-configured in `vercel.json`)*
4. Under **Environment Variables**, add:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://<YOUR-RENDER-BACKEND-URL>/api` (e.g. `https://vinexture-backend.onrender.com/api`)
5. Click **Deploy**.
6. Vercel will build and assign your production domain (e.g. `https://vinexture.vercel.app`).

---

## 🔗 Part 3: Connect Frontend & Backend

1. In your **Render Dashboard** &rarr; `vinexture-backend` &rarr; **Environment**:
   - Update `FRONTEND_URL` to your production Vercel domain (e.g. `https://vinexture.vercel.app`).
   - Save changes (Render will automatically redeploy with CORS permissions).
2. Create an admin user on Render:
   - In Render Web Service &rarr; Click **Shell** tab &rarr; Run:
     ```bash
     python manage.py createsuperuser
     ```
   - Follow prompts to set email and password.

---

## ✅ Live Testing Checklist

- [ ] Visit frontend at `https://<YOUR-APP>.vercel.app` &bull; check homepage and cohort listings.
- [ ] Log in with your admin user at `/login` &bull; verify access to `/admin` and `/admin/offers`.
- [ ] Test candidate application submission &bull; verify payment proof upload.
- [ ] Test Offer Letter generation for accepted candidates &bull; verify single-page A4 PDF download.
- [ ] Scan dynamic QR code &bull; verify `/offers/verify/<verification_code>` page loads and confirms authenticity.
