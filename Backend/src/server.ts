import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";

dotenv.config({ path: ".env.example" });

const app = express();

// CORS configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "https://your-frontend.vercel.app" // Update this after deploying frontend
        : "http://localhost:5173", // Vite default port
  }),
);

app.use(express.json());

const model = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",
  apiKey: process.env.GOOGLE_API_KEY!,
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
    console.error("Error summarizing meeting:", error);
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
