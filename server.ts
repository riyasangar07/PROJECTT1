import express from "express";
import path from "path";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
// Increase limit for base64 image uploads
app.use(express.json({ limit: '50mb' }));

const PORT = 3000;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is missing from environment variables.");
}

const ai = GEMINI_API_KEY ? new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
}) : null as any;

app.post("/api/analyze", async (req, res) => {
  const { content, type, mimeType } = req.body;
  if (!content) {
    return res.status(400).json({ error: "Content is required" });
  }

  const isInvalidKey = !GEMINI_API_KEY || GEMINI_API_KEY === "" || GEMINI_API_KEY.includes("your_gemini_api_key");

  if (isInvalidKey) {
    console.warn("GEMINI_API_KEY is not configured or placeholder detected. Using local Wikipedia/Fact-Check scraper.");
    try {
      const { fallbackAnalysis } = await import("./fallback");
      const fallbackResult = await fallbackAnalysis(content, type);
      return res.json(fallbackResult);
    } catch (fallbackErr: any) {
      console.error("Fallback analysis failed:", fallbackErr.message);
      return res.status(500).json({ error: "Analysis failed. Please configure GEMINI_API_KEY." });
    }
  }

  try {
    let prompt = `You are an expert fact-checker. Please analyze the following content.
Follow these steps carefully:
1. Extract the main claim(s) from the content.
2. Use Google Search to verify these claims against trusted news sources.
3. Compare information from multiple sources.
4. Identify supporting evidence and contradictory evidence.
5. Calculate a confidence score based on the evidence found.
6. If the evidence is insufficient or you cannot find enough reliable information, you MUST set the "verdict" to "Insufficient Evidence". Do not guess!
7. Never claim a news story is real or fake without supporting evidence.

Format your response strictly as JSON with the following keys:
- verdict: (string) "True", "Likely True", "Mixed", "Likely False", "False", or "Insufficient Evidence"
- truthPercentage: (number) 0-100
- falsePercentage: (number) 0-100
- confidenceScore: (number) 0-100
- credibilityScore: (number) 0-100
- riskLevel: (string) "Low", "Medium", "High", or "Critical"
- explanation: (string) Detailed AI explanation of the findings and your reasoning.
- factCheckSummary: (string) Recommmendation and cross-reference findings summary.
- supportingEvidence: (string array) List of points and evidence found supporting or contradicting the claims.
- potentialConcerns: (string array) List of suspicious points, logical fallacies, or missing context.
- sourcesVerified: (string array) List of Trusted Sources (include names of websites and articles you found during your search).

Content to analyze: `;

    let contentsArray: any[] = [];

    if (type === "url") {
        prompt += `\nAnalyze the potential fake news from this URL context: ${content}`;
        contentsArray = [prompt];
    } else if (type === "text") {
        prompt += `\n${content}`;
        contentsArray = [prompt];
    } else if (type === "image") {
        prompt += `\nExtract text via OCR from the provided image and analyze the image context/text for misinformation.`;
        // Assuming content is base64 string
        const base64Data = content.replace(/^data:image\/\w+;base64,/, "");
        contentsArray = [
            prompt,
            { inlineData: { data: base64Data, mimeType: mimeType || "image/jpeg" } }
        ];
    }

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: contentsArray,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    if (!response.text) throw new Error("Empty response from Gemini");
    
    let parsedData;
    try {
      parsedData = JSON.parse(response.text.replace(/```json\n?|```/g, ''));
    } catch(e) {
      console.warn("Failed to parse JSON, returning raw text text");
      return res.status(500).json({ error: "AI returned malformed JSON" });
    }
    res.json(parsedData);
  } catch (err: any) {
    console.warn("Gemini API call failed. Falling back to local Wikipedia/Fact-Check scraper. Error:", err.message || err);
    try {
      const { fallbackAnalysis } = await import("./fallback");
      const fallbackResult = await fallbackAnalysis(content, type);
      res.json(fallbackResult);
    } catch (fallbackErr: any) {
      console.error("Fallback analysis failed:", fallbackErr);
      res.json({
          verdict: "Insufficient Evidence",
          truthPercentage: 0,
          falsePercentage: 0,
          confidenceScore: 0,
          credibilityScore: 0,
          riskLevel: "Low",
          explanation: "Rate limited or error by AI model.",
          factCheckSummary: "Rate limited or invalid credentials.",
          supportingEvidence: [],
          potentialConcerns: [],
          sourcesVerified: []
      });
    }
  }
});

app.post("/api/chat", async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: "API Key Missing: Please configure GEMINI_API_KEY in your environment." });
  }
  try {
    const { messages } = req.body;
    let history = messages.map((m: any) => ({
      role: m.role,
      parts: [{ text: m.content }]
    }));
    
    // Ensure strict alternation of user and model roles.
    const cleanHistory = [];
    for (const msg of history) {
      if (cleanHistory.length === 0) {
        if (msg.role === 'user') cleanHistory.push(msg);
      } else {
        const lastRole = cleanHistory[cleanHistory.length - 1].role;
        if (msg.role !== lastRole) {
          cleanHistory.push(msg);
        } else {
          // Append to the last message part if roles are the same
          cleanHistory[cleanHistory.length - 1].parts[0].text += `\n\n${msg.parts[0].text}`;
        }
      }
    }

    const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: cleanHistory,
        config: {
            systemInstruction: "You are TruthLens AI, an expert, factual, and unbiased fact-checking assistant. You help users understand complex news, identify misinformation, explain cognitive biases, and provide summaries. Maintain a professional, journalistic, and helpful tone.",
            tools: [{ googleSearch: {} }]
        }
    });

    res.json({ text: response.text });
  } catch(err: any) {
    console.warn("Chat API call failed. Falling back to local offline chat helper. Error:", err.message || err);
    return res.json({ 
      text: "Hello! I am TruthLens AI, running in local fallback mode because the Gemini API is currently unavailable (or rate-limited/unconfigured). You can still analyze specific claims in the 'Fake News Detector' tab which uses Wikipedia/Factcheck scraping fallbacks, or paste a valid `GEMINI_API_KEY` in your `.env` file to unlock my full conversational AI capabilities!" 
    });
  }
});

app.get("/api/news", async (req, res) => {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "API Key Missing: Please configure GEMINI_API_KEY in your environment." });
    }
    const category = (req.query.category as string || "All Fields").toLowerCase();
    
    let gnewsCategory = "general";
    if (category.includes('tech')) gnewsCategory = 'technology';
    if (category.includes('sport')) gnewsCategory = 'sports';
    if (category.includes('business')) gnewsCategory = 'business';
    if (category.includes('health')) gnewsCategory = 'health';
    if (category.includes('science')) gnewsCategory = 'science';
    if (category.includes('world') || category.includes('international')) gnewsCategory = 'world';
    if (category.includes('india') || category.includes('nation')) gnewsCategory = 'nation';

    try {
        // Try GNews First
        const GNEWS_KEY = process.env.GNEWS_API_KEY;
        if (GNEWS_KEY) {
            const resGnews = await fetch(`https://gnews.io/api/v4/top-headlines?category=${gnewsCategory}&lang=en&apikey=${GNEWS_KEY}`);
            if (resGnews.ok) {
                const data: any = await resGnews.json();
                if (data.articles && data.articles.length > 0) {
                    const mappedArticles = data.articles.map((a: any) => ({
                        title: a.title,
                        summary: a.description || "No summary available.",
                        source: a.source.name,
                        date: a.publishedAt,
                        category: category,
                        credibilityScore: 85,
                        severity: "Low"
                    }));
                    return res.json(mappedArticles);
                }
            }
        }
        
        let prompt = `Search for the latest, real, top news articles in the category: ${category}. Return the results strictly as a JSON array of objects.
Do not use markdown blocks, just raw JSON. Each object MUST have:
- title: (string) The real news headline
- summary: (string) A short summary of the article
- source: (string) The news publisher (e.g. Reuters, BBC)
- date: (string) ISO format timestamp of publication estimation
- category: (string) The category name
- credibilityScore: (number) Estimated credibility out of 100
- severity: (string) "Low", "Medium" or "High"

Return around 6-8 real news articles.`;

        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
            }
        });

        if (!response.text) throw new Error("Empty text");
        const text = response.text;
        res.json(JSON.parse(text));
    } catch(err: any) {
        console.error("News API Error:", err.message);
        // Fallback to mock data on rate limit or other API errors
        return res.json([
            {
                title: `Major Updates in ${category.toUpperCase()}`,
                summary: `This is a simulated fallback news summary for ${category}. Currently running in high traffic mode. Add GNEWS_API_KEY to bypass limits.`,
                source: "System Fallback",
                date: new Date().toISOString(),
                category: category,
                credibilityScore: 70,
                severity: "Low"
            },
            {
                title: `${category.toUpperCase()} Trends Today`,
                summary: `Generated local mock data. Researchers and analysts observe new patterns in ${category}.`,
                source: "System Fallback",
                date: new Date().toISOString(),
                category: category,
                credibilityScore: 65,
                severity: "Low"
            },
             {
                title: `Community Update: ${category}`,
                summary: `This is offline fallback news data. The live news endpoint connects to verified APIs.`,
                source: "System Fallback",
                date: new Date().toISOString(),
                category: category,
            }
        ]);
    }
});

app.get("/api/trending", async (req, res) => {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "API Key Missing: Please configure GEMINI_API_KEY in your environment." });
    }
    try {
        let prompt = `Provide a list of 3 trending fake news, rumors, or misinformation stories circulating online right now. Return the results strictly as a JSON array of objects.
Do not use markdown blocks, just raw JSON. Each object MUST have:
- id: (number) a unique identifier starting from 1
- topic: (string) The headline of the misinformation/rumor
- severity: (string) "High" or "Medium"
- virality: (string) estimated share count or reach (e.g. "2.4M", "950K")
- description: (string) A concise description of the claim and why/how it is false or misleading.

Return only real recent rumors or fact-checked claims. Do not wrap in markdown.`;

        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
            }
        });

        if (!response.text) throw new Error("Empty text");
        const text = response.text;
        res.json(JSON.parse(text));
    } catch(err: any) {
        console.error("Trending API Error:", err.message);
        // Fallback to local mock data on rate limit or other API errors
        return res.json([
           { id: 1, topic: "Election Fraud Claims", severity: "High", virality: "2.4M", description: "Viral videos claiming to show election fraud are actually recycled footage from 2018." },
           { id: 2, topic: "Crypto Giveaways", severity: "Medium", virality: "1.1M", description: "Deepfake videos of tech CEOs promising crypto returns." },
           { id: 3, topic: "Fake Health Cures", severity: "High", virality: "850K", description: "Dangerous misinformation about pseudo-scientific cancer cures spreading on social groups." }
        ]);
    }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production" && process.env.STANDALONE_API !== "true") {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e: any) {
      console.warn("Could not start Vite dev server inline. Starting standalone API server instead. Error:", e.message);
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;

if (process.env.VERCEL !== "1") {
  startServer();
}
