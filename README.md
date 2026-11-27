# LLM Meeting Minute Recap App 📝

A web application that uses LLM to summarize meeting minutes into structured, actionable insights.

[![Architecture Diagram](https://img.shields.io/badge/📐_Architecture_Diagram-view_live-blue)](https://khoidm2004.github.io/LLM-App/)

![App Image](https://i.ibb.co/zVxhXWWF/Meet-Recap.png)

## Features ✨

- Paste meeting minutes and get instant AI-powered summaries
- Upload up to 3 meeting documents (PDF, DOC, DOCX, TXT) and get one summary at a chosen length (short/medium/detailed)
- Structured output with key decisions, action items (as a table), and next steps — bold headers, underlined notes, bold+underlined names
- Typewriter-style response rendering, a bubbling typing indicator, and dark/light mode
- Clean, responsive chat UI

## Architecture 🏗️

- [Backend & Supabase architecture diagram](https://khoidm2004.github.io/LLM-App/) — components, data flow, and deployment ownership (Render vs. Supabase vs. Groq), generated with [Archify](https://github.com/tt-a1i/archify) and source-backed against this repo.
- See [`Backend/README.md`](Backend/README.md) and [`Frontend/README.md`](Frontend/README.md) for the detailed per-service breakdown.

## Tech Stack 💻

| Category         | Technology                                              |
| ----------------- | -------------------------------------------------------- |
| Frontend          | Vite + React + Tailwind CSS                              |
| Backend           | Node.js + Express                                        |
| LLM Framework     | LangChain                                                |
| LLM Provider      | Groq (Free Tier)                                         |
| AI Model          | `openai/gpt-oss-120b` (via Groq)                         |
| File parsing      | `pdf-parse`, `mammoth` (DOCX), `word-extractor` (DOC)    |
| Storage & DB      | Supabase (Postgres + private Storage bucket)             |
| Scheduled cleanup | Supabase Edge Function + `pg_cron` (every 10 min)        |
| Frontend Hosting  | Vercel                                                   |
| Backend Hosting   | Render                                                   |

## Getting Started 🚀

### Prerequisites

- Node.js 18+
- pnpm
- [Groq API Key](https://console.groq.com) (Free)

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/your-username/MinuteRecap.git
   cd MinuteRecap
   ```

2. Install dependencies

   ```bash
   # Frontend
   cd Frontend
   pnpm install

   # Backend
   cd ../Backend
   pnpm install
   ```

3. Set up environment variables

   ```bash
   # In Backend folder, create .env file
   GROQ_API_KEY=your_groq_api_key_here
   PORT=3001

   # Optional: only needed for document upload (/api/upload,
   # /api/summarize-documents). Without these, the paste-text flow still
   # works. See Backend/README.md for the full Supabase setup.
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. Run the application

   ```bash
   # Backend (from Backend folder)
   pnpm run dev

   # Frontend (from Frontend folder)
   pnpm run dev
   ```

