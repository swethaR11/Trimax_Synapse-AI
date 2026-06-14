# Synapse AI

> Translate the abstract. Personalize the path.

Synapse AI is an adaptive learning app for Arc Night 2026. Give it a topic, pasted notes, or a PDF; add an interest you already understand; and it builds a rigorous academic explanation beside a one-to-one analogy in your own mental language.

## What Is Built

- Gemini Scholar, Stylist, Critic, and Theme Selector agents
- Server-sent events for agent status, phase progress, theme changes, and content
- PDF, TXT, and Markdown text extraction
- 148 selectable theme IDs with adaptive palettes and ambient animation
- API-key onboarding stored only in browser `localStorage`
- Resizable academic and analogy workspace
- Active-recall grading, hints, confetti, and persistent XP
- Session history, lesson restoration, keyboard palette, and PNG share cards
- Gossip Mode with validated, staged WhatsApp-style conversations
- Responsive layouts for desktop, tablet, and mobile

## Architecture

```text
Browser
  |
  | X-Gemini-Key + JSON / multipart
  v
FastAPI
  |-- Theme Selector
  |-- Scholar
  |-- Stylist
  |-- Critic
  |-- Recall grader
  `-- Gossip generator
        |
        v
    Gemini API
```

The API key is sent in the `X-Gemini-Key` header. The backend does not save it to disk, logs, or a database.

## Run Locally

Requirements:

- Node.js 20 or newer
- Python 3.14 (the pinned dependencies also support recent Python 3.x versions)
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

Terminal 1:

```powershell
.\start-backend.ps1
```

For backend auto-reload during development:

```powershell
.\start-backend.ps1 -Reload
```

If Synapse is already running, the launcher exits cleanly. Restart it after backend changes with:

```powershell
.\start-backend.ps1 -Restart
```

Terminal 2:

```powershell
.\start-frontend.ps1
```

Open [http://localhost:3000](http://localhost:3000). API documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).

To use a different Gemini model, set `GEMINI_MODEL` before starting the backend:

```powershell
$env:GEMINI_MODEL = "gemini-2.5-flash"
.\start-backend.ps1
```

## Manual Setup

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload
```

```powershell
cd frontend
npm install
npm run dev
```

## Verification

```powershell
.\.venv\Scripts\python.exe -m pytest backend\tests -q
cd frontend
npm run typecheck
npm run build
npm audit --audit-level=moderate
```

## API

| Endpoint | Purpose |
| --- | --- |
| `POST /api/validate-key` | Verify a browser-supplied Gemini key |
| `POST /api/preview-theme` | Select a theme from an interest |
| `POST /api/upload-pdf` | Extract PDF/TXT/Markdown content |
| `POST /api/learn` | Run the agent pipeline as an SSE stream |
| `POST /api/recall` | Grade an active-recall response |
| `POST /api/gossip` | Generate a validated gossip conversation |
| `GET /health` | Service health check |

The frontend API base defaults to `http://localhost:8000`. Override it with `NEXT_PUBLIC_API_URL`.

## Project Layout

```text
backend/
  agents/       Gemini prompts and orchestration
  routes/       FastAPI endpoints
  schemas/      Pydantic contracts
  utils/        Upload and JSON parsing helpers
frontend/
  app/          Next.js application shell
  components/   Landing, workspace, and UI modules
  hooks/        Main Synapse state machine
  lib/          API, themes, storage, and types
```
