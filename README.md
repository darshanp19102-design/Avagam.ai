# Avagama.ai

Production-ready full stack app with FastAPI + React for AI process evaluation.

## Folder Structure

- `backend/` FastAPI backend (Python 3.11, Motor, JWT, Mistral integration)
- `frontend/` React + Vite frontend

## Run Instructions

### 1) Backend

```bash
cd backend
python3.11 -m venv .venv
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

- `backend/.env` contains MongoDB Atlas, JWT, and Mistral settings.
- `frontend/.env` contains `VITE_API_URL`.
