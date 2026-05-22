import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase request size limit to handle uploaded base64 photos
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy initializer for Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return geminiClient;
}

// Endpoint 1: Analyze image with AI Vision when there is no GPS EXIF data
app.post("/api/analyze-image", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Missing image data" });
    }

    const ai = getGeminiClient();
    
    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/jpeg",
        data: imageBase64,
      },
    };

    const textPart = {
      text: `Analyze this scenery/image and estimate its geographic location or identify landmarks. 
      If you can recognize the landmark or scenery:
      Return a list of up to 5 potential candidate locations.
      For each location, provide:
      - name: A specific, short landmark/spot name (e.g., "Eiffel Tower", "Golden Gate Bridge Overlook", "Kyoto Bamboo Grove")
      - address: Approximate street address or city/state/country description
      - lat: Precise latitude coordinate (decimal number)
      - lng: Precise longitude coordinate (decimal number)
      - confidence: Integer confidence score (1 to 100)
      - reasoning: Brief sentence explaining why this photo matches this spot (e.g., matching mountain ridge, unique architectural tower, etc.)
      
      Respond STRICTLY with a JSON array containing these objects. Do not wrap in markdown markup outside of the JSON, e.g., NO \`\`\`json blocks. Just the raw valid JSON array.`,
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              address: { type: Type.STRING },
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER },
              confidence: { type: Type.INTEGER },
              reasoning: { type: Type.STRING },
            },
            required: ["name", "address", "lat", "lng", "confidence", "reasoning"],
          },
        },
      },
    });

    const textResult = response.text || "[]";
    const candidates = JSON.parse(textResult.trim());
    return res.json({ success: true, candidates });
  } catch (error: any) {
    console.error("AI Image analysis error:", error);
    return res.status(500).json({ error: error.message || "Failed to analyze image with AI" });
  }
});

// Endpoint 2: Get Location Recommendations, Solar Timing (SunCalc advice), and historical photo guide
app.post("/api/location-tips", async (req, res) => {
  try {
    const { name, lat, lng } = req.body;
    if (!lat || !lng) {
      return res.status(400).json({ error: "Missing coordinates" });
    }

    const ai = getGeminiClient();
    
    const prompt = `Give me a comprehensive, descriptive travel, photography, and sun-tracking guide for tourists visiting these coordinates: Latitude ${lat}, Longitude ${lng}${name ? `, named/known close to: "${name}"` : ""}.

    Provide the instructions in structured sections:
    1. HISTORIC_SUMMARY: A 2-3 sentence overview of this location's history and cultural significance.
    2. PHOTOGRAPHY_TIPS: 3 bullet points on camera angles, compositions, focal lengths, or framing options to make photos look spectacular here.
    3. SOLAR_ADVICE: Specific timing recommendations for sunrise, sunset, and golden hours. Mention the sun's direction (east/west) relative to shooting perspectives, and high-quality sun angles (like dramatic sidelighting or silhouette timings). Give estimates for typical sunrise and sunset hours.
    4. MUST_SEE_SPOTS: A list of 3 specific and interesting view angles or neighboring walk-to spots (keep names simple and direct).
    5. SAFETY_ETIQUETTE: A brief warning about crowds, respectful tourist behavior, weather hazards, or local laws (e.g. drone bans, sacred photography restrictions).

    Respond STRICTLY with a JSON object. Do not wrap in markdown markup outside of the JSON. Just the raw valid JSON object with the following schema:
    {
      "history": "string",
      "tips": ["string", "string", "string"],
      "solar": "string",
      "mustSee": [{"name": "string", "description": "string"}],
      "safety": "string"
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            history: { type: Type.STRING },
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            solar: { type: Type.STRING },
            mustSee: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["name", "description"]
              }
            },
            safety: { type: Type.STRING }
          },
          required: ["history", "tips", "solar", "mustSee", "safety"]
        }
      }
    });

    const textResult = response.text || "{}";
    const tips = JSON.parse(textResult.trim());
    return res.json({ success: true, tips });
  } catch (error: any) {
    console.error("AI location tips error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate location tips" });
  }
});

// Setup Vite Dev Server or Production Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
