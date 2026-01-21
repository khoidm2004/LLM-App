# LLM Meeting Minute Recap App 📝

A web application that uses LLM to summarize meeting minutes into structured, actionable insights.

![App Image](https://i.ibb.co/zVxhXWWF/Meet-Recap.png)

## Features ✨

- Paste meeting minutes and get instant AI-powered summaries
- Structured output with key decisions, action items, and next steps
- Clean, responsive UI

## Tech Stack 💻

| Category         | Technology                  |
| ---------------- | --------------------------- |
| Frontend         | Vite + React + Tailwind CSS |
| Backend          | Node.js + Express           |
| LLM Framework    | LangChain                   |
| LLM Provider     | Groq (Free Tier)            |
| AI Model         | Llama 3.1 8B Instant        |
| Frontend Hosting | Vercel                      |
| Backend Hosting  | Render                      |

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
   ```

4. Run the application

   ```bash
   # Backend (from Backend folder)
   pnpm run dev

   # Frontend (from Frontend folder)
   pnpm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Demo 🎬

[Watch Demo on YouTube ▶️](https://youtu.be/dfypiwCNp2A)
