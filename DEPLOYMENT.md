# 🚀 Deployment Guide: RetailRocket AI Recommendation System

This guide provides step-by-step instructions for deploying both the **FastAPI Backend (with ML model)** and the **Vite React Frontend** to production.

---

## 📋 Architecture Overview

| Component | Technology | Recommended Host | Production Port / URL |
| :--- | :--- | :--- | :--- |
| **Backend API & ML Engine** | FastAPI + SVD CF + Scikit-Learn | [Render](https://render.com) / [Railway](https://railway.app) / Docker | Port 8088 / `0.0.0.0` |
| **Frontend Web App** | React 18 + Vite + TailwindCSS | [Vercel](https://vercel.com) / [Netlify](https://netlify.com) / Nginx | Port 80 / 443 |
| **Persistence & Auth** | Supabase PostgreSQL | [Supabase](https://supabase.com) (Active) | Cloud Database |

---

## 🔑 1. Environment Variables Configuration

Before deploying, ensure you have your production environment variables ready:

### Backend `.env`
```env
PORT=8088
SUPABASE_URL=https://fkoenadkhgevcrycfhan.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-secret-key
```

### Frontend `.env` (or Vercel Environment Variables)
```env
VITE_API_URL=https://your-backend-service.onrender.com
VITE_SUPABASE_URL=https://fkoenadkhgevcrycfhan.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-public-key
```

---

## 🌐 Option A: Cloud Platform Deployment (Recommended & Free Tier)

### Step 1: Deploy the FastAPI Backend to Render
1. Push your repository to **GitHub** or **GitLab**.
2. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** → **Web Service**.
3. Select your repository.
4. Configure settings:
   - **Name:** `retailrocket-ai-backend`
   - **Language:** `Python 3`
   - **Branch:** `main`
   - **Root Directory:** *(leave blank / repository root)*
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Under **Environment Variables**, add:
   - `SUPABASE_URL` = `https://fkoenadkhgevcrycfhan.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = `your_service_role_key`
6. Click **Create Web Service**.
7. Once deployed, copy your backend URL (e.g., `https://retailrocket-ai-backend.onrender.com`).

---

### Step 2: Deploy the React Frontend to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** → **Project**.
2. Import your GitHub repository.
3. In project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Expand **Environment Variables** and add:
   - `VITE_API_URL` = `https://retailrocket-ai-backend.onrender.com` (Your Render URL from Step 1)
   - `VITE_SUPABASE_URL` = `https://fkoenadkhgevcrycfhan.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your_anon_key`
5. Click **Deploy**.
6. Vercel will build and assign a custom HTTPS domain (e.g., `https://retailrocket-ai.vercel.app`).

---

## 🐳 Option B: Docker & Docker Compose Deployment (VPS / Self-Hosted)

For deploying to an **AWS EC2, DigitalOcean Droplet, GCP Compute Engine, or Ubuntu VPS**:

### Step 1: Clone Repository on Server
```bash
git clone https://github.com/your-username/retail-rocket-ai.git
cd retail-rocket-ai
```

### Step 2: Create Environment File
```bash
cp .env.example .env
nano .env
```

### Step 3: Run with Docker Compose
```bash
# Build and launch both Backend and Frontend containers in background
docker compose up -d --build
```

### Step 4: Verify Running Containers
```bash
docker compose ps
curl http://localhost:8088/health
```

---

## 🖥️ Option C: Manual VPS Deployment (Ubuntu / Debian with systemd & Nginx)

### 1. Setup Backend with systemd
Create `/etc/systemd/system/retailrocket-backend.service`:
```ini
[Unit]
Description=RetailRocket AI FastAPI Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/var/www/retail-rocket-ai
ExecStart=/var/www/retail-rocket-ai/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8088 --workers 4
Restart=always
Environment="PATH=/var/www/retail-rocket-ai/venv/bin"
EnvironmentFile=/var/www/retail-rocket-ai/.env

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable retailrocket-backend
sudo systemctl start retailrocket-backend
```

### 2. Build Frontend & Configure Nginx
```bash
cd /var/www/retail-rocket-ai/frontend
npm install
npm run build
```

Configure `/etc/nginx/sites-available/retailrocket`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend SPA
    location / {
        root /var/www/retail-rocket-ai/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Reverse proxy to FastAPI backend
    location /api/ {
        proxy_pass http://127.0.0.1:8088/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable SSL using Certbot:
```bash
sudo certbot --nginx -d yourdomain.com
```

---

## 🧪 Post-Deployment Verification Checklist

- [ ] Check API health status: `curl https://<backend-url>/health`
- [ ] Verify Supabase DB connection via `/health` or in dashboard UI
- [ ] Click through Product Discovery, add items to cart, and verify recommendations update dynamically
- [ ] Test User Profile Switcher with multiple sample personas
