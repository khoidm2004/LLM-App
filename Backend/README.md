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
GROQ_API_KEY=gsk_xxxxxxxxxxxx    # Required: Groq API key
PORT=3001                         # Optional: Server port
FRONTEND_URL=https://your-app.com # Optional: Additional CORS origin
```

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
