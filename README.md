# Avagama.ai

Full-stack Avagama.ai application with FastAPI + Motor + JWT backend and a production-style SPA frontend.

## Folder Structure

- `backend/` FastAPI backend (async APIs, JWT auth, Motor data layer, Mistral agent integration)
- `frontend/` frontend SPA and lightweight Node static server

## Run Instructions

### 1) Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:8000

## Environment Files

- `backend/.env` stores MongoDB, JWT, and Mistral settings.
- `frontend/.env` stores `VITE_API_URL`.
