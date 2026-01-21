# Frontend Architecture 🎨

## Overview

The frontend is built with **React + Vite** and styled with **Tailwind CSS**. It provides a chat-like interface for users to input meeting minutes and receive AI-generated summaries.

## Directory Structure

```
Frontend/
├── public/                 # Static assets
├── api/                    # Vercel serverless functions
│   └── summarize.js        # API proxy for Vercel deployment
├── src/
│   ├── assets/             # Images, icons, and other assets
│   ├── components/         # Reusable UI components
│   │   ├── ChatContent/    # Displays conversation messages
│   │   ├── ChatHeader/     # Header with app title/branding
│   │   ├── ChatInput/      # Text input for meeting minutes
│   │   ├── ChatPlaceHolder/# Empty state placeholder
│   │   └── Sidebar/        # Navigation sidebar
│   ├── pages/              # Page components
│   │   ├── Home/           # Main chat interface
│   │   ├── LoadingPage/    # Loading state page
│   │   └── NotFound/       # 404 error page
│   ├── route/              # Routing configuration
│   │   └── AppRoutes.tsx   # React Router setup
│   ├── App.tsx             # Root component
│   ├── App.css             # App-level styles
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles & Tailwind imports
├── index.html              # HTML template
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── vercel.json             # Vercel deployment settings
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

| Component         | Description                                               |
| ----------------- | --------------------------------------------------------- |
| `ChatInput`       | Text area for entering meeting minutes with submit button |
| `ChatContent`     | Renders the conversation (user input + AI summary)        |
| `ChatHeader`      | Top navigation bar with branding                          |
| `ChatPlaceHolder` | Welcome message shown before first interaction            |
| `Sidebar`         | Side navigation panel                                     |

## Data Flow

1. User enters meeting minutes in `ChatInput`
2. Form submission triggers API call to backend `/api/summarize`
3. Response is displayed in `ChatContent`
4. State is managed at the `Home` page level

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
VITE_API_URL=http://localhost:3001  # Backend API URL
```

## Deployment

The frontend is deployed on **Vercel**. The `vercel.json` configures routing and the `api/` folder contains serverless functions for production API calls.
