# Frontend Architecture 🎨

## Overview

The frontend is built with **React + Vite** and styled with **Tailwind CSS**. It provides a chat-like interface for users to input meeting minutes and receive AI-generated summaries.

## Directory Structure

```
Frontend/
├── public/                 # Static assets
├── api/                    # Vercel serverless functions
│   └── summarize.js        # Proxies /api/summarize to the Render backend.
│                           # Only this one route has a proxy — the upload
│                           # routes bypass it entirely via VITE_API_LINK
│                           # (see Environment Variables below).
├── src/
│   ├── assets/             # Images, icons, and other assets
│   ├── components/         # Reusable UI components
│   │   ├── ChatContent/        # Renders messages: markers → bold/underline,
│   │   │   ├── ChatContent.tsx       # markdown tables, typewriter reveal
│   │   │   ├── MarkdownTable.tsx     # Renders a parsed markdown table
│   │   │   └── renderMessageContent.tsx # Splits text/table blocks
│   │   ├── ChatHeader/     # Header with app title/branding + ThemeToggle
│   │   ├── ChatInput/      # Text input + file attach (upload up to 3 files)
│   │   ├── ChatPlaceHolder/# Empty state placeholder
│   │   ├── Sidebar/        # Navigation sidebar
│   │   ├── ThemeToggle/    # Dark/light mode toggle
│   │   └── TypingIndicator/# Bubbling-dots "generating" indicator
│   ├── hooks/
│   │   ├── useTheme.ts      # Dark/light mode state (localStorage + class)
│   │   └── useTypewriter.ts # Progressive text reveal for assistant replies
│   ├── lib/
│   │   ├── parseFormattedText.tsx # **bold**/<u>underline</u> marker parser
│   │   ├── documentUpload.ts      # Upload/summarize-documents API calls
│   │   └── uploadSession.ts       # Anonymous per-browser sessionToken
│   ├── pages/              # Page components
│   │   ├── Home/           # Main chat interface
│   │   ├── LoadingPage/    # Loading state page
│   │   └── NotFound/       # 404 error page
│   ├── route/              # Routing configuration
│   │   └── AppRoutes.tsx   # React Router setup
│   ├── App.tsx             # Root component
│   ├── App.css             # App-level styles
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles, Tailwind imports, dark-mode variant
├── index.html              # HTML template
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── vercel.json             # Vercel deployment settings (SPA rewrite only)
└── package.json            # Dependencies & scripts
```

## Component Architecture

```
App
└── AppRoutes
    ├── Home (main page)
    │   ├── Sidebar
    │   ├── ChatHeader
    │   ├── ChatPlaceHolder / ChatContent
    │   └── ChatInput
    ├── LoadingPage
    └── NotFound
```

## Key Components

| Component         | Description                                                                |
| ------------------ | --------------------------------------------------------------------------- |
| `ChatInput`        | Textarea for pasted text, plus a paperclip button to attach up to 3 files and pick a summary length |
| `ChatContent`      | Renders a message: typewriter reveal for the newest assistant reply, bold/underline markers, markdown tables, and a copy button |
| `MarkdownTable`     | Renders one parsed markdown table block inside a message                    |
| `ChatHeader`       | Top navigation bar with branding + the dark/light mode toggle               |
| `ChatPlaceHolder`  | Welcome message shown before first interaction                              |
| `Sidebar`          | Side navigation panel                                                       |
| `ThemeToggle`      | Switches `dark`/`light` (persisted in `localStorage`)                       |
| `TypingIndicator`  | Bubbling-dots indicator shown while a response is generating                |

## Data Flow

**Paste-text path:**
1. User pastes meeting minutes in `ChatInput` and submits
2. Request goes to `/api/summarize` (proxied to the Render backend via `Frontend/api/summarize.js` in production, or direct via `VITE_API_LINK` in dev)
3. Response is rendered in `ChatContent`, state managed at the `Home` page level

**Document-upload path:**
1. User attaches up to 3 files (`ChatInput`) and picks a length
2. Files upload via `POST /api/upload`, then `POST /api/summarize-documents` is called with the same `sessionToken` (`src/lib/documentUpload.ts`, `src/lib/uploadSession.ts`)
3. Both calls go **directly to the backend** via `VITE_API_LINK` — there is no Vercel proxy file for these routes (see Environment Variables below for why that matters)
4. The returned summary is appended as an assistant message, rendered the same way as the paste-text path

## Scripts

```bash
pnpm dev        # Start development server
pnpm build      # Build for production
pnpm preview    # Preview production build
pnpm format     # Run Prettier
pnpm lint       # Run ESLint
```

## Environment Variables

Create a `.env` file if needed:

```env
VITE_API_LINK=http://localhost:3001  # Backend API URL
```

When set, **every** API call (`/api/summarize`, `/api/upload`, `/api/summarize-documents`,
`/api/sessions/:token/summary`) goes directly to this URL instead of a relative path.
When unset, only `/api/summarize` works in production, because it's the only route with
a matching proxy file in `api/` — see Deployment below.

## Deployment

The frontend is deployed on **Vercel**. `vercel.json` configures SPA routing only
(it rewrites everything except `/api/*` to `index.html`).

**Important:** `api/summarize.js` is a Vercel serverless function that proxies
`/api/summarize` to the Render backend (`process.env.BACKEND_URL`, a Vercel-side
env var). **No such proxy file exists for `/api/upload`, `/api/summarize-documents`,
or the summary-view endpoint** — a relative-path call to those routes 404s on
Vercel without ever reaching the backend. Those routes also carry file uploads,
and Vercel Serverless Functions cap request bodies around 4.5MB, which the
proxy pattern can't reliably carry anyway.

Instead, set `VITE_API_LINK` in the Vercel project's environment variables to
the Render backend's public URL (e.g. `https://meetrecap-backend.onrender.com`)
and redeploy. This routes every API call directly to Render, bypassing the
proxy layer and its size limit entirely — confirmed working this way in
production. The backend's CORS config already allowlists the Vercel domain
(see `Backend/README.md`).
