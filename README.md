# AI-Powered Rural Healthcare Assistance System

First-level healthcare assistance for rural and tier-3 users: symptom communication,
urgency guidance, and finding nearby care. The system **does not diagnose diseases
and does not prescribe medicines**.

## Repository layout

| Folder | What it is |
|---|---|
| `frontend/` | React app (Vite). Talks to the backend over HTTP only. |
| `backend/` | FastAPI app. Exposes the versioned REST API under `/api/v1`. |
| `ai-engine/` | Standalone Python package for triage logic. Independent of FastAPI. |
| `docs/` | Architecture notes, API contract, safety policy. |

## Prerequisites

- Node.js 20.19 or newer
- Python 3.10 or newer

## Run the backend

```bash
cd backend
python -m venv .venv
# macOS/Linux:  source .venv/bin/activate
# Windows:      .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- Health check: http://localhost:8000/api/v1/health
- API docs: http://localhost:8000/docs

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Environment files

Copy `.env.example` to `.env` inside `frontend/` and `backend/` when you need to
change a value. Defaults work without a `.env` file. Never commit `.env`.

## Development rules

- Built in small phases, UI first. Each stage is tested before the next begins.
- Frontend and backend stay independent; the frontend never imports backend code.
- No feature is added before its phase.

## Current status

- Symptom triage API implemented at `POST /api/v1/triage/symptoms`, backed by the
  standalone `ai-engine` rule-based provider and deterministic safety layer.
- Frontend "Check Your Symptoms" screen calls the triage API and shows urgency
  guidance, red flags, and safe next steps.
- `GET /api/v1/facilities/nearby` lists facilities from a local SQLite database,
  seeded with demo data on first start.
- Frontend "Nearby Healthcare" screen filters facilities by place, type, and
  emergency/24x7 availability, and shows distance and contact details.
- `GET /api/v1/medicines/availability` searches medicine stock by name, place,
  and stock status; the "Medicine Availability" screen shows stock, price, and
  the supplying facility.
- Login and translations are not built yet.