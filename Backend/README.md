# Backend Architecture ⚙️

## Overview

The backend is a **Node.js + Express** server that handles meeting summarization requests using **LangChain** with **Groq** as the LLM provider.

## Directory Structure

```
Backend/
├── src/
│   └── server.ts           # Main server file (entry point)
├── dist/                   # Compiled JavaScript output
├── .env                    # Environment variables (not in git)
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies & scripts
├── pnpm-lock.yaml          # Lock file
└── tsconfig.json           # TypeScript configuration
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      Express Server                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────┐  │
│  │  Middleware  │───▶    Routes     │───▶  Handlers │  │
│  │  - CORS      │    │              │    │           │  │
│  │  - JSON      │    │ POST /api/   │    │ Summarize │  │
│  └──────────────┘    │   summarize  │    │  Logic    │  │
│                      │              │    │           │  │
│                      │ GET /health  │    └─────┬─────┘  │
│                      └──────────────┘          │        │
│                                                │        │
│                      ┌─────────────────────────▼─────┐  │
│                      │         LangChain             │  │
│                      │  ┌─────────────────────────┐  │  │
│                      │  │    PromptTemplate       │  │  │
│                      │  │    (Structured Format)  │  │  │
│                      │  └───────────┬─────────────┘  │  │
│                      │              │                │  │
│                      │  ┌───────────▼─────────────┐  │  │
│                      │  │       ChatGroq          │  │  │
│                      │  │  (llama-3.1-8b-instant) │  │  │
│                      │  └─────────────────────────┘  │  │
│                      └───────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │    Groq API      │
                    │  (LLM Provider)  │
                    └──────────────────┘
```

## API Endpoints

| Method | Endpoint         | Description               |
| ------ | ---------------- | ------------------------- |
| `POST` | `/api/summarize` | Summarize meeting minutes |
| `GET`  | `/health`        | Health check endpoint     |

### POST /api/summarize

**Request:**

```json
{
  "meetingMinutes": "Meeting notes text here..."
}
```

**Response:**

```json
{
  "summary": "1. KEY DECISIONS: ...\n2. ACTION ITEMS: ..."
}
```

**Error Response:**

```json
{
  "error": "Failed to summarize meeting",
  "details": "Error message"
}
```

## LangChain Pipeline

```
Input (meetingMinutes)
        │
        ▼
┌───────────────────┐
│  PromptTemplate   │  ← Structures the prompt with format instructions
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│     ChatGroq      │  ← Sends to Groq API (Llama 3.1 8B)
└─────────┬─────────┘
          │
          ▼
    Structured Summary
```

## Key Technologies

| Package           | Purpose                         |
| ----------------- | ------------------------------- |
| `express`         | Web server framework            |
| `cors`            | Cross-origin resource sharing   |
| `dotenv`          | Environment variable management |
| `@langchain/groq` | Groq LLM integration            |
| `@langchain/core` | LangChain core utilities        |

## Environment Variables

Create a `.env` file in the Backend directory:

```env
GROQ_API_KEY=gsk_xxxxxxxxxxxx     # Required: Groq API key
PORT=3001                         # Optional: Server port
FRONTEND_URL=https://your-app.com # Optional: Additional CORS origin

# Required for document upload/summarization (/api/upload,
# /api/summarize-documents). Omitting these doesn't break /api/summarize —
# the Supabase client is created lazily — but the upload routes will
# return a clear 500 until both are set. SUPABASE_SERVICE_ROLE_KEY bypasses
# RLS: never expose it to the frontend.
SUPABASE_URL=https://mperhmypqmzbhngpieyf.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Document Upload & Summarization

Lets a user upload up to 3 meeting documents (PDF/DOC/DOCX/TXT, 10MB max
each) and get back one meeting-minutes summary (overview, key discussion
points, decisions, action items as a table), at a chosen length
(short/medium/detailed).

| Method | Endpoint                             | Description                                             |
| ------ | ------------------------------------- | --------------------------------------------------------- |
| `POST` | `/api/upload`                         | Upload files (multipart: `sessionToken?`, `files[]`)      |
| `POST` | `/api/summarize-documents`            | Summarize a session's uploaded files (`sessionToken`, `length`) |
| `GET`  | `/api/sessions/:sessionToken/summary` | Fetch the most recent summary for a session (counts as "view" activity) |

There's no login — `sessionToken` is a random id the frontend generates and
stores in `localStorage` (see `Frontend/src/lib/uploadSession.ts`). Files
live in a private Supabase Storage bucket (`meeting-documents`) and
metadata in Postgres (`upload_sessions`, `uploaded_files`, `summaries`,
see `supabase/migrations/`). A session idle for 20 minutes is deleted
(Storage files + DB rows) by a pg_cron job calling the
`cleanup-stale-sessions` Edge Function every 10 minutes — see
`supabase/functions/cleanup-stale-sessions/`.

## Scripts

```bash
pnpm dev        # Start development server with hot reload
pnpm build      # Compile TypeScript to JavaScript
pnpm start      # Run compiled JavaScript
```

## CORS Configuration

Allowed origins:

- `http://localhost:5173` (Vite dev server)
- `http://localhost:5174` (Alternate port)
- `https://llm-app-phi.vercel.app` (Production frontend)
- Custom URL via `FRONTEND_URL` env var

## Deployment

The backend is deployed on **Render** as a web service. Ensure the following:

1. Set `GROQ_API_KEY` in Render environment variables
2. Set build command: `pnpm install && pnpm build`
3. Set start command: `pnpm start`
