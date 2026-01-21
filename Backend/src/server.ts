import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ChatGroq } from "@langchain/groq";
import { PromptTemplate } from "@langchain/core/prompts";

dotenv.config({ path: ".env" });

// Debug: Check if env vars are loaded (remove after testing)
console.log("GROQ_API_KEY exists:", !!process.env.GROQ_API_KEY);
console.log("NODE_ENV:", process.env.NODE_ENV);

const app = express();

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://llm-app-phi.vercel.app",
  process.env.FRONTEND_URL, // Add additional URLs via env var
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  }),
);

app.use(express.json());

const model = new ChatGroq({
  model: "llama-3.1-8b-instant",
  apiKey: process.env.GROQ_API_KEY!,
  temperature: 0.3,
});

const prompt = PromptTemplate.fromTemplate(`
You are a professional meeting summarizer. Analyze the following meeting minutes and provide a structured summary.

Format your response as follows:
1. KEY DECISIONS: List the main decisions made
2. ACTION ITEMS: List all action items with owners and deadlines
3. IMPORTANT DISCUSSION POINTS: Highlight key topics discussed
4. NEXT STEPS: What happens next

Meeting Minutes:
{meetingMinutes}

Provide a clear, concise, and well-organized summary:
`);

app.post("/api/summarize", async (req, res) => {
  try {
    const { meetingMinutes } = req.body;
    if (!meetingMinutes || meetingMinutes.trim() === "") {
      return res.status(400).json({ error: "Meeting minutes are required" });
    }
    const chain = prompt.pipe(model);
    const result = await chain.invoke({ meetingMinutes });

    res.json({ summary: result.content });
  } catch (error) {
    res.status(500).json({
      error: "Failed to summarize meeting",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
