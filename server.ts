import express from "express";
import path from "path";
import cors from "cors";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // API endpoint to process lyrics
  app.post("/api/lyrics/process", async (req, res) => {
    try {
      const { lyrics } = req.body;
      if (!lyrics) {
        return res.status(400).json({ error: "Lyrics are required" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the following Japanese song lyrics. Segment the text into parts. 
        For each part, identify if it contains Kanji. 
        If it is Kanji, provide the Japanese reading (in Hiragana).
        If it is not Kanji (Hiragana, Katakana, Romaji, punctuation, etc.), leave reading empty.
        
        Lyrics:
        ${lyrics}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { 
                  type: Type.STRING,
                  description: "The original segment of text."
                },
                reading: { 
                  type: Type.STRING, 
                  description: "Japanese reading in Hiragana (only for Kanji)."
                },
                isKanji: { 
                  type: Type.BOOLEAN,
                  description: "Whether this segment contains Kanji characters."
                }
              },
              required: ["text", "isKanji"]
            },
          },
        },
      });

      const processedData = JSON.parse(response.text || "[]");
      res.json(processedData);
    } catch (error: any) {
      console.error("Error processing lyrics:", error);
      res.status(500).json({ error: error.message || "Failed to process lyrics" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
