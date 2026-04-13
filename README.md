# BedR - Full Stack Property Management System

BedR is a premium real estate and tenant property management dashboard. It uses an **Express.js** backend providing strict hierarchical capacity logic (Flats → Rooms → Beds → Tenants) mapped directly to a **Next.js** frontend with a clean Glassmorphism CSS UI.

## 🚀 Live Deployments

- **Frontend (Vercel)**: [https://bed-r-git-main-rohit-ranvirs-projects.vercel.app](https://bed-r-git-main-rohit-ranvirs-projects.vercel.app)
- **Backend API (Render)**: [https://bedr.onrender.com](https://bedr.onrender.com)

---

## 🛠️ Architecture Overview

- **Backend (`/backend`)**: Express.js REST API with PostgreSQL via Supabase, enforcing all business logic server-side (e.g. rejecting deletion of occupied flats, capacity checks on rooms, automatic bed status updates).
- **Frontend (`/frontend`)**: Next.js SPA with `axios` for API communication and clean component structure.

---

## 💻 Local Development Setup

### 1. Backend (Express.js)

```bash
cd backend
npm install
# Create a .env file with the required environment variables (see below)
npm run dev
# Server starts on http://localhost:5000
```

### 2. Frontend (Next.js)

```bash
cd frontend
npm install
# Create a .env.local file with the required environment variables (see below)
npm run dev
# App starts on http://localhost:3000
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

- `DATABASE_URL`: Your Supabase PostgreSQL connection string.
- `PORT`: Port for the Express server (default: `5000`).
- `FRONTEND_URL`: URL of the deployed Vercel frontend to allow CORS (e.g. `https://bed-r-git-main-rohit-ranvirs-projects.vercel.app`).

### Frontend (`frontend/.env.local`)

- `NEXT_PUBLIC_API_URL`: URL pointing to the Express backend.
  - Local: `http://localhost:5000/api`
  - Production: `https://bedr.onrender.com/api`

---

## ☁️ Deployment

### Backend (Render)

1. Push your code to GitHub.
2. Go to [Render.com](https://render.com) and create a new **Web Service** linked to your repository.
3. Set the root directory to `backend`.
4. Set the start command to `npm start`.
5. Add all environment variables in the Render dashboard.
6. Deploy — your backend will be live at `https://bedr.onrender.com`.

### Frontend (Vercel)

1. Go to [Vercel.com](https://vercel.com) and import your GitHub repository.
2. Set the root directory to `frontend`.
3. Vercel auto-detects Next.js — verify build command is `npm run build`.
4. Add environment variables:
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: `https://bedr.onrender.com/api`
5. Click Deploy!

---

## 📋 Features

- **Flat Management** — Create, view, and delete flats with active-tenant guard
- **Room Management** — Create rooms under flats with max bed capacity enforcement
- **Bed Management** — Track bed status: Available, Occupied, or Under Maintenance
- **Tenant Assignment** — Assign tenants to beds with automatic status updates
- **Occupancy Dashboard** — View occupancy summary per flat and per room
