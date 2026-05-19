import { GoogleGenAI, Type } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { lyrics } = req.body;

    if (!lyrics) {
      return res.status(400).json({
        error: "Lyrics are required",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Missing GEMINI_API_KEY",
      });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
Analyze the following Japanese song lyrics.

Rules:
1. Split the lyrics into small segments.
2. If a segment contains Kanji, provide its Hiragana reading.
3. If it does not contain Kanji, leave reading empty.
4. Return valid JSON only.

Lyrics:
${lyrics}
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              reading: { type: Type.STRING },
              isKanji: { type: Type.BOOLEAN },
            },
            required: ["text", "isKanji"],
          },
        },
      },
    });

    const processedData = JSON.parse(response.text || "[]");

    return res.status(200).json(processedData);
  } catch (error: any) {
    console.error("Error processing lyrics:", error);

    return res.status(500).json({
      error: error.message || "Failed to process lyrics",
    });
  }
}