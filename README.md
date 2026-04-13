# BedR - Full Stack Property Management System

BedR is a premium real estate and tenant property management dashboard. It uses a **Django REST Framework** backend providing strict hierarchical capacity logic (Flats → Rooms → Beds → Tenants) mapped directly to a rapid **React 19 / Vite** frontend utilizing state-of-the-art Glassmorphism CSS UI components.

## 🚀 Live Deployments (Placeholder)
- **Frontend (Vercel)**: [https://bedr-dashboard.vercel.app](https://bedr-dashboard.vercel.app)
- **Backend API (Render)**: [https://bedr-api.onrender.com](https://bedr-api.onrender.com)

---

## 🛠️ Architecture Overview

- **Backend Folder (`/`)**: Django 6, DRF, PostgreSQL, Gunicorn natively handling data mapping and constraints (e.g. rejecting deletion of occupied flats).
- **Frontend Folder (`/frontend`)**: React 19 SPA running on Vite utilizing native `axios` and `react-router-dom` avoiding extraneous bloat packages.

---

## 💻 Local Development Setup

### 1. Backend (Django)
```bash

python -m venv venv
source venv/Scripts/activate  

pip install -r requirements.txt


python manage.py makemigrations
python manage.py migrate

python manage.py createsuperuser

python manage.py runserver

```

### 2. Frontend (React)
```bash
# In an adjacent terminal, navigate to the frontend folder
cd frontend

# 1. Install Node modules
npm install

# 2. Setup environment mapping
# Create a .env file locally pointing explicitly to your localhost server:
# VITE_API_URL=http://127.0.0.1:8000/api

# 3. Start Development Server
npm run dev
# Browser launches on local Vite port (usually http://localhost:5173)
```

---

## 🔐 Environment Variables

### Backend (`.env` in Root)
These variables are securely read inside `settings.py`:
- `SECRET_KEY`: Your Django Secret string.
- `DEBUG`: `True` for Local, `False` for Production.
- `DB_NAME`: Local/Live Postgres Database.
- `DB_USER`: Postgres Username.
- `DB_PASSWORD`: Postgres Password.
- `DB_HOST`: Database IP Address.
- `DB_PORT`: Database connection port mapping (usually 5432).
- `FRONTEND_URL`: URL of the deployed Vercel application to unblock CORS rules inside production. (e.g. `https://bedr-dashboard.vercel.app`)

### Frontend (`frontend/.env`)
- `VITE_API_URL`: Path pointing back to the Django Service. 
  - Local setting: `http://127.0.0.1:8000/api`
  - Production setting: `https://your-backend-url.onrender.com/api`

---

## ☁️ Deployment Instructions

### Deploying the Backend (Render)
1. Ensure the `render.yaml` file natively existing in the root repository mapping Web services to Gunicorn `Procfile`.
2. Push your code to GitHub.
3. Access **Render.com** and securely link your repository invoking **Blueprint / Build from YAML**.
4. Pass the Database environment variables directly inside the Render Native Dashboard.
5. Retrieve your deployed `.onrender.com` URL.

### Deploying the Frontend (Vercel)
1. Navigate to **Vercel.com** and "Add New Project", authenticating the same connected GitHub monorepo.
2. In Project Setup, modify "Root Directory" to specify `frontend`.
3. Vercel automatically detects **Vite**; verify **Build Command** maps to `npm run build` natively and **Output Directory** matches `dist`.
4. Drop your Render URL mapping securely under **Environment Variables**:
   - Key: `VITE_API_URL`
   - Value: `https://your-backend-url.onrender.com/api`
5. The `vercel.json` rewrite file natively intercepts React routing SPA conflicts automatically.
6. Click Deploy!
"# BedR" 
