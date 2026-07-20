import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with lazy key validation
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not defined");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// In-Memory Database Store loaded initially from typescript source or fallback files
let articlesStore: any[] = [];
let categoriesStore: any[] = [];
let settingsStore: any = {};
let commentsStore: any[] = [];
let adSlotsStore: any[] = [];
let careersStore: any[] = [];

// To make this fully persistent, we can write/read to a JSON file in the environment.
const DATA_FILE = path.join(process.cwd(), "news_db.json");

function loadFromBackup() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      articlesStore = data.articles || [];
      categoriesStore = data.categories || [];
      settingsStore = data.settings || {};
      commentsStore = data.comments || [];
      adSlotsStore = data.adSlots || [];
      careersStore = data.careers || [];
      console.log("Successfully loaded database from news_db.json backup.");
      return;
    } catch (e) {
      console.error("Error loading news_db.json backup, resetting to defaults", e);
    }
  }
  console.log("No news_db.json backup found or failed to load. Will load in-memory from React data file.");
}

function saveToBackup() {
  try {
    const data = {
      articles: articlesStore,
      categories: categoriesStore,
      settings: settingsStore,
      comments: commentsStore,
      adSlots: adSlotsStore,
      careers: careersStore
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write database to backup file", e);
  }
}

// Ensure database is initially loaded
loadFromBackup();

// --- API Endpoints ---

// Get DB state (returns stored state or defaults to client if empty)
app.get("/api/db-state", (req, res) => {
  res.json({
    articles: articlesStore,
    categories: categoriesStore,
    settings: settingsStore,
    comments: commentsStore,
    adSlots: adSlotsStore,
    careers: careersStore,
    hasBackup: fs.existsSync(DATA_FILE)
  });
});

// Update DB state from client sync (enables smooth client-server synchronization)
app.post("/api/db-sync", (req, res) => {
  const { articles, categories, settings, comments, adSlots, careers } = req.body;
  if (articles) articlesStore = articles;
  if (categories) categoriesStore = categories;
  if (settings) settingsStore = settings;
  if (comments) commentsStore = comments;
  if (adSlots) adSlotsStore = adSlots;
  if (careers) careersStore = careers;
  
  saveToBackup();
  res.json({ success: true, message: "Database synchronized successfully on server." });
});

// AI Assisted article writer via Google Gemini
app.post("/api/generate-article", async (req, res) => {
  try {
    const { topic, category } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    const ai = getAi();
    const prompt = `Write a professional, world-class news article about: "${topic}" ${category ? `in the category "${category}"` : ""}. 
You must respond STRICTLY with a valid JSON object matching this structure:
{
  "title": "A highly catchy, professional headline in BBC/CNN style",
  "subtitle": "An elegant subtitle detailing the immediate outcome or secondary fact",
  "summary": "A concise single-sentence summary of the news story",
  "content": "A detailed, structured news article with multiple sections. Use Markdown formatting like '### Section Header' and include quotes, dates, and background context. Minimum 300 words.",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}
Do not write any markdown codeblocks or explanation. Return only the raw JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No response returned from Gemini API");
    }

    const parsedData = JSON.parse(responseText);
    res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate news article using AI." });
  }
});

// Weather API Mock for beautiful real-time widget
app.get("/api/weather", (req, res) => {
  const cities = [
    { city: "New York", temp: "22°C", desc: "Sunny" },
    { city: "London", temp: "15°C", desc: "Rainy" },
    { city: "New Delhi", temp: "34°C", desc: "Humid" },
    { city: "Tokyo", temp: "20°C", desc: "Cloudy" },
    { city: "Sydney", temp: "18°C", desc: "Windy" }
  ];
  res.json(cities);
});

// Markets API Mock for financial ticker
app.get("/api/markets", (req, res) => {
  res.json([
    { name: "DOW", value: "39,122.40", change: "+1.31%", isUp: true },
    { name: "NASDAQ", value: "16,274.94", change: "+1.82%", isUp: true },
    { name: "S&P 500", value: "5,211.49", change: "+0.89%", isUp: true },
    { name: "FTSE 100", value: "7,935.09", change: "-0.22%", isUp: false },
    { name: "NIFTY 50", value: "22,513.70", change: "+1.15%", isUp: true },
    { name: "GOLD", value: "$2,342.10", change: "+0.45%", isUp: true }
  ]);
});

// Serves standard XML sitemap for Google News and search indexes
app.get("/sitemap.xml", (req, res) => {
  res.header("Content-Type", "application/xml");
  const urls = [
    "https://fastcoverages.com/",
    "https://fastcoverages.com/breaking",
    "https://fastcoverages.com/latest",
    "https://fastcoverages.com/trending",
    "https://fastcoverages.com/world",
    "https://fastcoverages.com/india",
    "https://fastcoverages.com/politics",
    "https://fastcoverages.com/technology",
    "https://fastcoverages.com/business",
    "https://fastcoverages.com/sports"
  ];
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.map(url => `
  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>always</changefreq>
    <priority>1.0</priority>
  </url>`).join('')}
</urlset>`;
  res.send(sitemap);
});

// Serves standard Robots.txt for Search Engines
app.get("/robots.txt", (req, res) => {
  res.header("Content-Type", "text/plain");
  res.send(`User-agent: *
Allow: /
Disallow: /admin
Sitemap: https://fastcoverages.com/sitemap.xml`);
});

// Vite Middleware integration in server
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
    console.log(`FAST COVERAGES Server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer();
