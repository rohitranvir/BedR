# BedR - Full Stack Property Management System

BedR is a premium real estate and tenant property management dashboard. It uses a **Django REST Framework** backend providing strict hierarchical business logic (Flats → Rooms → Beds → Tenants) with a **React 19 / Vite** frontend featuring a custom Glassmorphism design system.

## 🚀 Live Deployments

- **Frontend (Vercel)**: [https://bed-r-git-main-rohit-ranvirs-projects.vercel.app](https://bed-r-git-main-rohit-ranvirs-projects.vercel.app)
- **Backend API (Render)**: [https://bedr.onrender.com](https://bedr.onrender.com)

---

## 🛠️ Tech Stack

### 🎨 Frontend
| Technology | Purpose |
|---|---|
| React 19 | Core UI framework |
| Vite | Fast modern build tool |
| React Router DOM v7 | Client-side routing |
| Pure CSS (Vanilla) | Custom design system with Glassmorphism & CSS variables |
| Inter + JetBrains Mono | Typography via Google Fonts |
| Recharts | Dashboard occupancy & trend charts |
| Leaflet / React-Leaflet | Property location mapping |
| Axios | HTTP client for API communication |

### ⚙️ Backend
| Technology | Purpose |
|---|---|
| Django 5.0.6 | Core web framework |
| Django REST Framework (DRF) | JSON REST API layer |
| djangorestframework-simplejwt | JWT-based authentication |
| WhiteNoise | Static file serving in production |
| Gunicorn | Production WSGI server |
| Python 3.10.0 | Runtime language |

### 🗄️ Database & Storage
| Technology | Purpose |
|---|---|
| PostgreSQL | Relational database engine |
| Supabase | Managed PostgreSQL hosting via `dj-database-url` |
| Local File System | Tenant photo storage (`media/` directory) |

### 🚀 Deployment
| Service | Purpose |
|---|---|
| Vercel | Frontend hosting (auto-handles Vite SPA routing) |
| Render.com | Backend hosting via `render.yaml` Blueprint (runs migrations, collects static, boots Gunicorn) |

---

## 💻 Local Development Setup

### 1. Backend (Django)

```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # macOS/Linux
source venv/Scripts/activate    # Windows

# Install dependencies
pip install -r requirements.txt

# Apply migrations
python manage.py makemigrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Start development server
python manage.py runserver
# API available at http://127.0.0.1:8000/api
```

### 2. Frontend (React + Vite)

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Create local environment file
# Add the following to a new .env file:
# VITE_API_URL=http://127.0.0.1:8000/api

# Start development server
npm run dev
# App available at http://localhost:5173
```

---

## 🔐 Environment Variables

### Backend (`.env` in root)

| Variable | Description |
|---|---|
| `SECRET_KEY` | Django secret key |
| `DEBUG` | `True` for local, `False` for production |
| `DB_NAME` | PostgreSQL database name |
| `DB_USER` | PostgreSQL username |
| `DB_PASSWORD` | PostgreSQL password |
| `DB_HOST` | Database host (Supabase endpoint) |
| `DB_PORT` | Database port (default: `5432`) |
| `FRONTEND_URL` | Vercel frontend URL for CORS (e.g. `https://bed-r-git-main-rohit-ranvirs-projects.vercel.app`) |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL |

- Local: `http://127.0.0.1:8000/api`
- Production: `https://bedr.onrender.com/api`

---

## ☁️ Deployment

### Backend (Render)

1. Push your code to GitHub.
2. Go to [Render.com](https://render.com) and select **Blueprint** → link your repository.
3. Render reads `render.yaml` automatically — it runs DB migrations, collects static files, and boots Gunicorn.
4. Set all backend environment variables in the Render dashboard.
5. Your backend will be live at `https://bedr.onrender.com`.

### Frontend (Vercel)

1. Go to [Vercel.com](https://vercel.com) and import your GitHub repository.
2. Set the **Root Directory** to `frontend`.
3. Vercel auto-detects Vite — verify:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add environment variable:
   - Key: `VITE_API_URL`
   - Value: `https://bedr.onrender.com/api`
5. The `vercel.json` config handles SPA routing rewrites automatically.
6. Click **Deploy**!

---

## 📋 Features

- **Flat Management** — Create, view, and delete flats; deletion blocked if active tenant assignments exist
- **Room Management** — Create rooms under flats with max bed capacity enforcement
- **Bed Management** — Track bed status: `Available`, `Occupied`, or `Under Maintenance`; auto-updates on tenant changes
- **Tenant Assignment** — Assign tenants to beds; reassignment auto-reverts previous bed to `Available`
- **Occupancy Dashboard** — Visual summary of occupancy per flat and per room with charts

---

## 📌 Business Logic (Backend Enforced)

All rules are validated server-side — client-side checks alone are not sufficient:

- ❌ A bed marked **Under Maintenance** cannot be assigned to a tenant
- ❌ An **Occupied** bed cannot be assigned to another tenant
- ❌ A room cannot exceed its defined **bed capacity**
- ❌ A flat with **active tenant assignments** cannot be deleted
- ❌ A tenant with an **active bed assignment** cannot be deleted
- ✅ Reassigning a tenant automatically marks the **previous bed as Available**
