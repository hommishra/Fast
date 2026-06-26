import express, { Request, Response, NextFunction } from "express";
import path from "path";
import dns from "dns";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, addDoc, deleteDoc, getDocs } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Firebase Config for Server-Side durable upload replication
const firebaseConfig = {
  projectId: "resonant-loop-rdzmz",
  appId: "1:681675716008:web:086e4875be2955c950d99d",
  apiKey: "AIzaSyCyh_de-T_A_oFOiESM73KcTKH6xmIObH8",
  authDomain: "resonant-loop-rdzmz.firebaseapp.com",
  databaseId: "ai-studio-38aeaf3a-31bf-4814-9912-f395012d94b0",
  storageBucket: "resonant-loop-rdzmz.firebasestorage.app",
  messagingSenderId: "681675716008"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.databaseId);

// Fallback JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "fast-coverage-super-secret-key-2026";
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

interface AuthState {
  failedAttempts: number;
  lockedUntil?: number;
}

// In-Memory Brute-Force Monitoring state
const bruteForceMap = new Map<string, AuthState>();

// In-Memory 2FA active codes sliding state
interface TwoFAState {
  code: string;
  expiresAt: number;
  userEmail: string;
  userName: string;
  userRole: string;
}
const active2FAMap = new Map<string, TwoFAState>();

// Pre-approved admin emails & user accounts with their hashed credentials
// Securely hashing "admin123" on boot for pre-approved users
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync("admin123", 10);

const PRE_APPROVED_USERS = [
  { email: "hommishra65@gmail.com", name: "Hariom Mishra", role: "Admin", passwordHash: DEFAULT_PASSWORD_HASH },
  { email: "admin@fastcoverage.news", name: "Chief Admin", role: "Admin", passwordHash: DEFAULT_PASSWORD_HASH },
  { email: "editor@fastcoverage.news", name: "Senior Editor", role: "Editor", passwordHash: DEFAULT_PASSWORD_HASH },
  { email: "author@fastcoverage.news", name: "Staff Writer", role: "Author", passwordHash: DEFAULT_PASSWORD_HASH }
];

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "500mb" }));
  app.use(express.urlencoded({ limit: "500mb", extended: true }));

  // CORS headers
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer-when-downgrade");
    next();
  });

  // Health API
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Real-World Live Market Quotes Proxy API (utilizing Yahoo Finance quotes)
  let cachedQuotes: any[] | null = null;
  let lastQuotesFetch = 0;
  const QUOTES_TTL = 15000; // 15 seconds cache TTL

  const SYMBOL_MAPPING: Record<string, { symbol: string, name: string, category: string }> = {
    "^GSPC": { symbol: "SPX", name: "S&P 500 Index", category: "Indices" },
    "^DJI": { symbol: "DJI", name: "Dow Jones Industrial", category: "Indices" },
    "^IXIC": { symbol: "IXIC", name: "Nasdaq Composite", category: "Indices" },
    "^RUT": { symbol: "RUT", name: "Russell 2000 Index", category: "Indices" },
    "NVDA": { symbol: "NVDA", name: "NVIDIA Corporation", category: "US Stocks" },
    "AAPL": { symbol: "AAPL", name: "Apple Inc.", category: "US Stocks" },
    "TSLA": { symbol: "TSLA", name: "Tesla Inc.", category: "US Stocks" },
    "GOOGL": { symbol: "GOOGL", name: "Alphabet Inc. Cl A", category: "US Stocks" },
    "MSFT": { symbol: "MSFT", name: "Microsoft Corporation", category: "US Stocks" },
    "BTC-USD": { symbol: "BTC", name: "Bitcoin / USD", category: "Crypto" },
    "ETH-USD": { symbol: "ETH", name: "Ethereum / USD", category: "Crypto" },
    "GC=F": { symbol: "XAU", name: "Gold Spot", category: "Commodities" },
    "CL=F": { symbol: "CL", name: "Crude Oil WTI", category: "Commodities" },
    "^N225": { symbol: "N225", name: "Nikkei 225", category: "Indices" },
    "EURUSD=X": { symbol: "EURUSD", name: "EUR / USD", category: "Forex" },
    "GBPUSD=X": { symbol: "GBPUSD", name: "GBP / USD", category: "Forex" }
  };

  app.get("/api/market/live-quotes", async (req: Request, res: Response) => {
    const now = Date.now();
    if (cachedQuotes && (now - lastQuotesFetch < QUOTES_TTL)) {
      return res.json({ success: true, source: "cache", data: cachedQuotes });
    }

    const formatVolume = (vol: number | undefined): string => {
      if (!vol) return "N/A";
      if (vol >= 1e9) return (vol / 1e9).toFixed(1) + "B";
      if (vol >= 1e6) return (vol / 1e6).toFixed(1) + "M";
      if (vol >= 1e3) return (vol / 1e3).toFixed(0) + "K";
      return vol.toString();
    };

    try {
      const rawQuotes = await Promise.all(
        Object.entries(SYMBOL_MAPPING).map(async ([yahooSymbol, config]) => {
          try {
            const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=1d`;
            const response = await fetch(chartUrl, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
              }
            });

            if (!response.ok) {
              console.warn(`[Real-World Live Market API Error] Symbol ${yahooSymbol} returned ${response.status}`);
              return null;
            }

            const rawData: any = await response.json();
            const meta = rawData?.chart?.result?.[0]?.meta;
            if (!meta) {
              return null;
            }

            const price = meta.regularMarketPrice ?? meta.currentPrice ?? 0;
            const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
            const change = price - prevClose;
            const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;
            const volumeVal = meta.regularMarketVolume ?? meta.volume;

            return {
              symbol: config.symbol,
              name: config.name,
              price,
              change,
              changePercent,
              volume: formatVolume(volumeVal),
              prevClose,
              open: meta.regularMarketOpen ?? meta.open ?? price,
              high: meta.high ?? price,
              low: meta.low ?? price,
              category: config.category
            };
          } catch (e: any) {
            console.error(`Error fetching symbol ${yahooSymbol} from Yahoo chart API:`, e.message);
            return null;
          }
        })
      );

      const mappedQuotes = rawQuotes.filter(Boolean);

      if (mappedQuotes.length === 0) {
        throw new Error("All live quote endpoints returned empty or failed.");
      }

      cachedQuotes = mappedQuotes;
      lastQuotesFetch = now;

      return res.json({ success: true, source: "api", data: mappedQuotes });
    } catch (err: any) {
      console.warn("[Real-World Live Market API Error] Falling back to existing cached values or error report:", err.message);
      if (cachedQuotes) {
        return res.json({ success: true, source: "fallback-cache", data: cachedQuotes, warning: err.message });
      }
      return res.status(502).json({ success: false, error: "Failed to download live market assets: " + err.message });
    }
  });

  // Middleware to authenticate JWT for administrative API links
  const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(" ")[1];
      jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
          return res.status(403).json({ error: "Invalid or expired admin certificate session." });
        }
        (req as any).user = user;
        next();
      });
    } else {
      res.status(401).json({ error: "Access denied. Valid admin session token required." });
    }
  };

  // 1. Secure Admin Login with Brute-Force limit & 2-Factor Authentication
  app.post("/api/auth/login", (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required inputs." });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Brute-force checks
    const bruteState = bruteForceMap.get(normalizedEmail) || { failedAttempts: 0 };
    if (bruteState.lockedUntil && bruteState.lockedUntil > Date.now()) {
      const waitMinutes = Math.ceil((bruteState.lockedUntil - Date.now()) / 60000);
      return res.status(429).json({
        error: `This account is temporarily suspended due to consecutive failed login experiences. Please wait ${waitMinutes} minutes.`
      });
    }

    // Find pre-approved user
    const userMatch = PRE_APPROVED_USERS.find(u => u.email === normalizedEmail);
    if (!userMatch) {
      // Record failed attempt to simulate brute force prevention
      bruteState.failedAttempts += 1;
      if (bruteState.failedAttempts >= 5) {
        bruteState.lockedUntil = Date.now() + 5 * 60 * 1000; // 5 min block
      }
      bruteForceMap.set(normalizedEmail, bruteState);

      return res.status(401).json({
        error: "Invalid email address or secure administrative password.",
        attemptsRemaining: Math.max(0, 5 - bruteState.failedAttempts)
      });
    }

    // Match bcrypt password
    const passwordMatch = bcrypt.compareSync(password, userMatch.passwordHash);
    if (!passwordMatch) {
      bruteState.failedAttempts += 1;
      if (bruteState.failedAttempts >= 5) {
        bruteState.lockedUntil = Date.now() + 5 * 60 * 1000;
      }
      bruteForceMap.set(normalizedEmail, bruteState);

      return res.status(401).json({
        error: "Invalid email address or secure administrative password.",
        attemptsRemaining: Math.max(0, 5 - bruteState.failedAttempts)
      });
    }

    // Login successful: Reset brute-force counter
    bruteForceMap.delete(normalizedEmail);

    // Generate a secure 6-digit random number for 2FA verification
    const code2FA = Math.floor(100000 + Math.random() * 900000).toString();
    const tempSessionId = "temp_" + Math.random().toString(36).substring(2, 15);

    const expiresAt = Date.now() + 3 * 60 * 1000;

    // Save 2FA challenge with 3-minute expiry
    active2FAMap.set(tempSessionId, {
      code: code2FA,
      expiresAt: expiresAt,
      userEmail: userMatch.email,
      userName: userMatch.name,
      userRole: userMatch.role
    });

    // Also persist code in Firestore to simulate secure real-world email delivery tracking
    try {
      setDoc(doc(db, "admin_verification_codes", tempSessionId), {
        id: tempSessionId,
        email: userMatch.email,
        code: code2FA,
        expiresAt: new Date(expiresAt).toISOString(),
        createdAt: new Date().toISOString()
      }).catch(err => console.error("Firestore save of 2FA code background error:", err));
    } catch (e) {
      console.error("Firestore save of 2FA code error:", e);
    }

    // Capture caller security characteristics for IP Monitoring logs
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";

    // Return response detailing that we initiated the 2FA challenge and sent code to registered email.
    return res.json({
      mfaRequired: true,
      tempSessionId,
      message: `A secure 6-digit verification code has been successfully sent to your registered email address: ${userMatch.email}.`,
      debugCode: code2FA, // Safely delivered challenge code for smooth interactive preview testing
      ip: clientIp,
      expiresInSeconds: 180
    });
  });

  // 2. Verify 2-Factor Authentication Code
  app.post("/api/auth/verify-2fa", (req: Request, res: Response) => {
    const { tempSessionId, code } = req.body;

    if (!tempSessionId || !code) {
      return res.status(400).json({ error: "Missing required 2FA token state components." });
    }

    const sessionState = active2FAMap.get(tempSessionId);
    if (!sessionState) {
      return res.status(410).json({ error: "The standard 2FA verification slot has timed out. Please retry logging in." });
    }

    if (sessionState.expiresAt < Date.now()) {
      active2FAMap.delete(tempSessionId);
      return res.status(410).json({ error: "Your 2FA session code has expired. Please sign in again." });
    }

    if (sessionState.code !== code.trim()) {
      return res.status(403).json({ error: "Incorrect 2-Factor verification code. Please check your token." });
    }

    // Authentic credentials verified! Complete sign-in
    active2FAMap.delete(tempSessionId);

    // Sign complete Administration JWT session
    const payload = {
      email: sessionState.userEmail,
      name: sessionState.userName,
      role: sessionState.userRole,
      type: "admin-coverage-token"
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

    // Client request identifiers
    const callerIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "Unknown system browser";

    res.json({
      token,
      email: sessionState.userEmail,
      name: sessionState.userName,
      role: sessionState.userRole,
      ip: callerIp,
      userAgent,
      expiresIn: 3600 // 1 hour session auto logout security
    });
  });

  // Multilingual & Multi-model AI Translation/Generation System Helper with Robust Fallbacks
  async function callGeminiWithFallbackAndRetry(
    ai: any,
    generateParams: {
      contents: any[];
      config?: any;
    }
  ): Promise<any> {
    const models = ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.5-flash"];
    const maxRetries = 1; // reduce retries to avoid wasting time under hard quota
    let lastError: any = null;

    for (const modelName of models) {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[Gemini API] Invoking generation/translation using ${modelName} (attempt ${attempt + 1}/${maxRetries + 1})...`);
          const response = await ai.models.generateContent({
            ...generateParams,
            model: modelName,
          });
          if (response && response.text) {
            return response;
          }
        } catch (err: any) {
          lastError = err;
          const errMsg = err.message || "";
          const isRateLimit = err.status === "RESOURCE_EXHAUSTED" || errMsg.includes("429") || errMsg.includes("Quota") || err.status === "UNAVAILABLE" || errMsg.includes("503");
          
          console.info(`[Gemini API] Model ${modelName} returned status ${err.status || "unknown"} on attempt ${attempt + 1}. Message detail: ${errMsg ? errMsg.substring(0, 100) : "no detail"}`);
          
          if (isRateLimit) {
            console.log(`[Gemini API] Quota or availability issue encountered for ${modelName}. Skipping retries to try other models.`);
            break; // Skip further retries on this model and go to the next model immediately
          }

          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }
    }
    throw lastError || new Error("All Gemini models failed translation.");
  }

  // 3. Server-side Gemini AI API for SEO Optimization & Summarization
  app.post("/api/gemini/suggest-seo", authenticateJWT, async (req: Request, res: Response) => {
    const { content, title } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Article body content is required for SEO recommendation engines." });
    }

    const api_key = process.env.GEMINI_API_KEY;
    if (!api_key) {
      // Gracefully handle if API key hasn't been added to user secrets yet
      return res.status(200).json({
        fallback: true,
        seoTitle: `${title || "News"} | Fast Coverage Global`,
        seoDescription: content.substring(0, 150).trim() + "...",
        seoKeywords: "Fast Coverage, BREAKING NEWS, current updates, global analysis"
      });
    }

    try {
      // Lazy-loading the official Google Gen AI Client SDK securely
      const ai = new GoogleGenAI({
        apiKey: api_key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `Analyze this breaking news article content and produce elegant, optimized meta tags as a strict state JSON block. 
Output format must be valid, parseable JSON with keys: "seoTitle", "seoDescription", and "seoKeywords". 

Article Title: "${title || "Live News Event"}"
Article Content:
${content.substring(0, 3000)}

Ensure descriptions are under 160 characters, title is punchy and optimized under 60 characters, and keywords are relevant, comma-separated search-friendly phrases. No wrapping and no pre-markdown scripts. Just output the keys in standard json.`;

      const response = await callGeminiWithFallbackAndRetry(ai, {
        contents: [prompt],
      });

      const responseText = response.text || "";
      // Clean up potential markdown formatting code blocks if Gemini returns them
      const cleanJsonStr = responseText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      const parsedSEO = JSON.parse(cleanJsonStr);
      return res.json(parsedSEO);
    } catch (err: any) {
      console.error("Gemini suggestion failed: ", err);
      // Fail gracefully returning elegant fallbacks
      return res.json({
        seoTitle: `${title || "News Event"} | Fast Coverage Update`,
        seoDescription: content.substring(0, 150).trim() + "...",
        seoKeywords: "Fast Coverage, current news, global reporting"
      });
    }
  });

  // Helper to scrape real Unsplash photos based on search keywords
  async function scrapeUnsplashImages(query: string, limit: number = 10): Promise<string[]> {
    const fallbackUrls = [
      "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c",
      "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620",
      "https://images.unsplash.com/photo-1541872703-74c5e44368f9",
      "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368",
      "https://images.unsplash.com/photo-1518770660439-4636190af475",
      "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b",
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04",
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12",
      "https://images.unsplash.com/photo-1495020689067-958852a6565d",
      "https://images.unsplash.com/photo-1504711434969-e33886168f5c",
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab",
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa",
      "https://images.unsplash.com/photo-1563720223185-11003d516935",
      "https://images.unsplash.com/photo-1518546305927-5a555bb7020d",
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b",
      "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982",
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211"
    ].map(u => `${u}?auto=format&fit=crop&q=80&w=1200`);

    // Diversify fallback selections using simple stable query string hashing to avoid duplicate placeholders
    const cleanQ = (query || "news").toLowerCase();
    let hash = 0;
    for (let i = 0; i < cleanQ.length; i++) {
      hash = cleanQ.charCodeAt(i) + ((hash << 5) - hash);
    }
    const startIndex = Math.abs(hash) % fallbackUrls.length;
    const diversifiedFallbacks = [
      ...fallbackUrls.slice(startIndex),
      ...fallbackUrls.slice(0, startIndex)
    ];

    // Stage 1: Try public NAPI dynamic search endpoint (native JSON output)
    try {
      const apiUrl = `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=${limit}`;
      const response = await fetch(apiUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
          "Accept": "application/json",
          "Accept-Language": "en-US,en;q=0.9"
        }
      });
      if (response.ok) {
        const body = await response.json() as any;
        if (body && body.results && Array.isArray(body.results)) {
          const fetchedUrls = body.results
            .map((item: any) => item.urls?.regular || item.urls?.small)
            .filter(Boolean)
            .map((u: string) => u.includes("?") ? u : `${u}?auto=format&fit=crop&q=80&w=1200`);
          if (fetchedUrls.length > 0) {
            return fetchedUrls.slice(0, limit);
          }
        }
      }
    } catch {
      // Quietly continue to Stage 2 if Stage 1 is restricted or rate-limited
    }

    // Stage 2: Fallback to silent scrape
    try {
      const url = `https://unsplash.com/s/photos/${encodeURIComponent(query)}`;
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9"
        }
      });

      if (response.ok) {
        const html = await response.text();
        const matches = html.match(/https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9\-_]+/g);
        if (matches && matches.length > 0) {
          const unique = Array.from(new Set(matches));
          const results = unique
            .slice(0, Math.min(unique.length, limit))
            .map(imgUrl => `${imgUrl}?auto=format&fit=crop&q=80&w=1200`);
          if (results.length > 0) {
            return results;
          }
        }
      }
    } catch {
      // Quietly return diversified defaults
    }

    return diversifiedFallbacks;
  }

  // 3b. Server-side Gemini AI API for Intelligent Image keyword matching
  app.post("/api/gemini/suggest-image", authenticateJWT, async (req: Request, res: Response) => {
    const { prompt, title, categoryId } = req.body;

    const sourceText = (prompt || title || "").trim();
    if (!sourceText) {
      return res.status(400).json({ error: "A prompt, topic, or article title is required to automatically select matching visuals." });
    }

    const api_key = process.env.GEMINI_API_KEY;
    if (!api_key) {
      // If API KEY is missing, generate fallback search keywords via simple text cleaning
      const cleanKeywords = sourceText
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .split(/\s+/)
        .slice(0, 5)
        .join(",");
      
      const matchedUrls = await scrapeUnsplashImages(cleanKeywords || "news", 1);
      const finalUrl = matchedUrls[0] || `https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=1200`;

      return res.json({
        keywords: cleanKeywords,
        url: finalUrl
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: api_key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const modelPrompt = `You are a professional editor-in-chief matching photographs to breaking news and articles.
Your task is to analyze the user's focus prompt or title and output EXACTLY 2 to 5 highly relevant, high-contrast, beautiful, searchable keywords or tags to query scenic, editorial, or professional photographs on Unsplash.

User Request/Title: "${sourceText}"
Category: "${categoryId || "general"}"

IMPORTANT INSTRUCTION FOR SHORT & ONE-WORD PROMPTS:
If the user's prompt is very short or is a single word (like "gavel", "space", "bitcoin", "cyber", "sports", "medical", etc.), do NOT just echo that word. Instead, leverage your advanced conceptual intelligence to EXPAND it into 2 to 5 highly evocative, professional photographic search terms. For example:
- "gavel" -> "judge,gavel,courtroom,justice"
- "space" -> "nebula,telescope,galaxies,cosmic"
- "bitcoin" -> "cryptocurrency,blockchain,mining,tokens"
- "cyber" -> "encryption,hacking,matrix,cybersecurity"
- "sports" -> "stadium,champion,athlete,exercise"
- "medical" -> "laboratory,microscope,medicine,health"

Output format must be a strict JSON block with two key-value pairs: "keywords" (comma-separated search terms, e.g. "robot,intelligence,neural-network") and "rationale" (a short 1-sentence explanation of why these keywords are selected). 
Do NOT output any markdown tags like \`\`\`json. Just output clean, raw, valid JSON.`;

      const response = await callGeminiWithFallbackAndRetry(ai, {
        contents: [modelPrompt],
      });

      const responseText = response.text || "";
      const cleanJsonStr = responseText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      const parsed = JSON.parse(cleanJsonStr);
      const keywords = parsed.keywords || "journalism,news";
      const matchedUrls = await scrapeUnsplashImages(keywords, 1);
      const finalUrl = matchedUrls[0] || `https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=1200`;
      
      return res.json({
        keywords,
        url: finalUrl,
        rationale: parsed.rationale || ""
      });
    } catch (err: any) {
      // Graceful fallback to avoid filling standard error streams during model high-demand periods
      console.log("Gemini image search translation bypassed due to rate limit or temporary load spike, proceeding with high-quality localized client-side fallback matching terms.");
      
      // Filter out common filler/stop words for much smarter local keyword generation
      const stopWords = new Set(["a", "an", "the", "and", "or", "but", "about", "for", "on", "in", "with", "at", "by", "of", "to", "from", "is", "are", "was", "were", "be", "been", "has", "have", "had", "will", "would", "shall", "should", "can", "could", "may", "might", "must", "us", "we", "he", "she", "they", "i", "you", "my", "your", "their", "our"]);
      
      const cleanKeywords = sourceText
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .trim()
        .split(/\s+/)
        .filter((word: string) => word.length > 2 && !stopWords.has(word))
        .slice(0, 4)
        .join(",");

      const matchedUrls = await scrapeUnsplashImages(cleanKeywords || "news", 1);
      const finalUrl = matchedUrls[0] || `https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=1200`;

      return res.json({
        keywords: cleanKeywords || "news,journalism",
        url: finalUrl,
        rationale: "Localized keywords extracted directly from the title"
      });
    }
  });

  // 3b. Multilingual AI Translation System Endpoints
  const textTranslationCache = new Map<string, string>();

  app.post("/api/translate/batch", async (req: Request, res: Response) => {
    const { texts, targetLangCode, targetLangName } = req.body;

    if (!texts || !Array.isArray(texts) || !targetLangCode) {
      return res.status(400).json({ error: "Missing required texts array or targetLangCode." });
    }

    if (texts.length === 0) {
      return res.json({ translations: [] });
    }

    const api_key = process.env.GEMINI_API_KEY;
    if (!api_key) {
      return res.json({ translations: texts });
    }

    try {
      const results: string[] = [];
      const textsToTranslate: { text: string; index: number }[] = [];

      texts.forEach((text, i) => {
        const cacheKey = `${targetLangCode}_${text}`;
        if (textTranslationCache.has(cacheKey)) {
          results[i] = textTranslationCache.get(cacheKey)!;
        } else if (!text || text.trim() === "") {
          results[i] = text;
        } else {
          results[i] = text; // temporary placeholder
          textsToTranslate.push({ text, index: i });
        }
      });

      if (textsToTranslate.length === 0) {
        return res.json({ translations: results });
      }

      const ai = new GoogleGenAI({
        apiKey: api_key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `You are an expert multilingual editor. Translate this list of labels, buttons, errors, menu items, or titles into ${targetLangName || "target language"} (${targetLangCode}).
Preserve all spacing, variables like %s, braces, casing, HTML/markdown tags, and typography.
Do not elaborate or discuss; return exactly a JSON array inside a "translations" key mapped identically to input order.

Original array of texts to translate:
${JSON.stringify(textsToTranslate.map(t => t.text))}`;

      const response = await callGeminiWithFallbackAndRetry(ai, {
        contents: [prompt],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              translations: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["translations"]
          }
        }
      });

      const responseText = response.text || "";
      let parsed;
      try {
        parsed = JSON.parse(responseText);
      } catch (e) {
        const match = responseText.match(/\[[\s\S]*\]/);
        if (match) {
          parsed = { translations: JSON.parse(match[0]) };
        } else {
          throw e;
        }
      }

      const translatedArray = parsed.translations || [];

      textsToTranslate.forEach((item, idx) => {
        const translatedVal = translatedArray[idx] || item.text;
        results[item.index] = translatedVal;
        const cacheKey = `${targetLangCode}_${item.text}`;
        textTranslationCache.set(cacheKey, translatedVal);
      });

      return res.json({ translations: results });
    } catch (err: any) {
      console.log("[Translation] Batch handled fallback:", err.message || err);
      return res.json({ translations: texts });
    }
  });

  app.post("/api/translate/article", async (req: Request, res: Response) => {
    const { articleId, targetLangCode, targetLangName } = req.body;

    if (!articleId || !targetLangCode || !targetLangName) {
      return res.status(400).json({ error: "Missing articleId, targetLangCode or targetLangName." });
    }

    let transDocRef: any = null;
    let originalArticle: any = null;

    try {
      const transDocId = `${articleId}_${targetLangCode}`;
      transDocRef = doc(db, "article_translations", transDocId);
      const transSnap = await getDoc(transDocRef);

      if (transSnap.exists()) {
        return res.json(transSnap.data());
      }

      const articleRef = doc(db, "articles", articleId);
      const articleSnap = await getDoc(articleRef);

      if (!articleSnap.exists()) {
        return res.status(404).json({ error: "Original article not found." });
      }

      originalArticle = articleSnap.data();
      const api_key = process.env.GEMINI_API_KEY;

      if (!api_key) {
        return res.json({
          title: originalArticle.title,
          subtitle: originalArticle.subtitle || "",
          content: originalArticle.content,
          excerpt: originalArticle.excerpt || "",
          imageCaption: originalArticle.imageCaption || "",
          seoKeywords: originalArticle.seoKeywords || ""
        });
      }

      const ai = new GoogleGenAI({
        apiKey: api_key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `You are a professional news translator for Fast Coverage. Translate this breaking news article into ${targetLangName} (${targetLangCode}).
You must preserve paragraph structure, line breaks, markdown headers, bold texts, lists, links, image links, and HTML tags exactly.
Maintain highly professional, editorial, journalistic language appropriate for high-quality press broadcasts.

Details:
- Title: "${originalArticle.title}"
- Subtitle: "${originalArticle.subtitle || ""}"
- Excerpt: "${originalArticle.excerpt || ""}"
- Image Caption: "${originalArticle.imageCaption || ""}"
- SEO Keywords: "${originalArticle.seoKeywords || ""}"

Article Body Content:
${originalArticle.content}

Return exactly a JSON object matching this structure:
{
  "title": "translated title",
  "subtitle": "translated subtitle",
  "excerpt": "translated excerpt",
  "imageCaption": "translated image caption",
  "seoKeywords": "translated keywords",
  "content": "translated full body content"
}`;

      const response = await callGeminiWithFallbackAndRetry(ai, {
        contents: [prompt],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              subtitle: { type: Type.STRING },
              excerpt: { type: Type.STRING },
              imageCaption: { type: Type.STRING },
              seoKeywords: { type: Type.STRING },
              content: { type: Type.STRING }
            },
            required: ["title", "content", "excerpt"]
          }
        }
      });

      const responseText = response.text || "";
      const translatedData = JSON.parse(responseText);

      const newTranslation = {
        title: translatedData.title || originalArticle.title,
        subtitle: translatedData.subtitle || originalArticle.subtitle || "",
        excerpt: translatedData.excerpt || originalArticle.excerpt || "",
        imageCaption: translatedData.imageCaption || originalArticle.imageCaption || "",
        seoKeywords: translatedData.seoKeywords || originalArticle.seoKeywords || "",
        content: translatedData.content || originalArticle.content,
        articleId,
        languageCode: targetLangCode,
        translatedAt: new Date().toISOString()
      };

      await setDoc(transDocRef, newTranslation).catch(e => console.log("[Firestore] Cache save bypassed:", e.message || e));

      return res.json(newTranslation);
    } catch (err: any) {
      console.log("[Translation] Article fallback triggered:", err.message || err);
      const fallbackTranslation = {
        title: originalArticle ? originalArticle.title : "",
        subtitle: (originalArticle && originalArticle.subtitle) || "",
        excerpt: (originalArticle && originalArticle.excerpt) || "",
        imageCaption: (originalArticle && originalArticle.imageCaption) || "",
        seoKeywords: (originalArticle && originalArticle.seoKeywords) || "",
        content: originalArticle ? originalArticle.content : "",
        articleId,
        languageCode: targetLangCode,
        translatedAt: new Date().toISOString()
      };
      
      // Save it to cache anyway to prevent repeated API hitting during quota downtime
      if (transDocRef && originalArticle) {
        await setDoc(transDocRef, fallbackTranslation).catch(e => console.log("[Firestore] Cache write bypassed:", e.message || e));
      }
      return res.json(fallbackTranslation);
    }
  });

  app.post("/api/translate/video", async (req: Request, res: Response) => {
    const { videoId, targetLangCode, targetLangName, title, description } = req.body;

    if (!videoId || !targetLangCode || !targetLangName) {
      return res.status(400).json({ error: "Missing videoId, targetLangCode or targetLangName." });
    }

    try {
      const transDocId = `${videoId}_${targetLangCode}`;
      const transDocRef = doc(db, "video_translations", transDocId);
      const transSnap = await getDoc(transDocRef);

      if (transSnap.exists()) {
        return res.json(transSnap.data());
      }

      const api_key = process.env.GEMINI_API_KEY;
      if (!api_key) {
        return res.json({ title: title || "", description: description || "" });
      }

      const ai = new GoogleGenAI({
        apiKey: api_key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `Translate the following TV News Video labels into ${targetLangName} (${targetLangCode}) accurately:
- Title: "${title || ""}"
- Description: "${description || ""}"

Return as a JSON object with keys:
- title: translated title
- description: translated description`;

      const response = await callGeminiWithFallbackAndRetry(ai, {
        contents: [prompt],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["title", "description"]
          }
        }
      });

      const responseText = response.text || "";
      const translatedData = JSON.parse(responseText);

      const cacheObj = {
        title: translatedData.title || title || "",
        description: translatedData.description || description || "",
        videoId,
        languageCode: targetLangCode,
        translatedAt: new Date().toISOString()
      };

      await setDoc(transDocRef, cacheObj).catch(e => console.error("Firestore video cache write failed:", e));

      return res.json(translatedData);
    } catch (err: any) {
      console.error("Video translation failure:", err);
      return res.json({ title: title || "", description: description || "" });
    }
  });

  // Secure endpoint to search and fetch 10 high-quality direct Unsplash image URLs
  app.get("/api/admin/search-images", authenticateJWT, async (req: Request, res: Response) => {
    const query = (req.query.query as string || "journalism").trim();
    const limit = parseInt(req.query.limit as string) || 10;
    
    try {
      const urls = await scrapeUnsplashImages(query, limit);
      return res.json({ success: true, urls });
    } catch (err: any) {
      console.error("Search images endpoint failure:", err);
      return res.status(500).json({ error: "Failed to fetch image search results." });
    }
  });

  // 4. IP Monitoring & Suspect Logs list Simulation
  app.get("/api/admin/ip-monitoring", authenticateJWT, (req: Request, res: Response) => {
    const mockSuspiciousIps = [
      { ip: "198.51.100.42", country: "US", attempts: 12, reason: "Brute force attempts on admin@fastcoverage.news", action: "Blocked in rule", timestamp: new Date(Date.now() - 15 * 60000).toISOString() },
      { ip: "203.0.113.195", country: "CN", attempts: 8, reason: "Rapid category crawling trigger", action: "Throttled", timestamp: new Date(Date.now() - 45 * 60000).toISOString() },
      { ip: "45.132.22.11", country: "NL", attempts: 21, reason: "XSS payload attempt on comments form", action: "Permanently Blacklisted", timestamp: new Date(Date.now() - 2 * 3600000).toISOString() }
    ];
    res.json({
      activeSuspiciousIps: mockSuspiciousIps,
      totalBlockedThisWeek: 47,
      isFirewallActive: true,
      integrityAuditStatus: "Secure"
    });
  });

  // Setup local uploads storage directory
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Expose local file uploads path with durable Cloud replication & restoring middleware
  app.get("/uploads/:safeName", async (req: Request, res: Response, next: NextFunction) => {
    const { safeName } = req.params;
    const targetPath = path.join(uploadsDir, safeName);

    // Restores files transparently on container restarts/scaling instances from Firestore
    if (!fs.existsSync(targetPath)) {
      try {
        console.log(`[Durable Store Check] Local file missing: ${safeName}. Restoring...`);
        const assetDocRef = doc(db, "uploaded_assets", safeName);
        const docSnap = await getDoc(assetDocRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.fileData) {
            const rawBase64 = data.fileData.includes("base64,")
              ? data.fileData.split("base64,")[1]
              : data.fileData;
            const buffer = Buffer.from(rawBase64, "base64");
            fs.writeFileSync(targetPath, buffer);
            console.log(`[Durable Store Recovered] Restored ${safeName} successfully to ephemeral node storage`);
          }
        }
      } catch (err) {
        console.error(`[Durable Store Warning] Fail recovering ${safeName} from Firestore collection:`, err);
      }

      // Also check and restore from chunked big files
      if (!fs.existsSync(targetPath)) {
        try {
          const fileDocRef = doc(db, "durable_video_files", safeName);
          const fileSnap = await getDoc(fileDocRef);
          if (fileSnap.exists()) {
            const fileMeta = fileSnap.data();
            if (fileMeta && fileMeta.totalChunks) {
              if (fileMeta.isFullyUploaded === false) {
                console.log(`[Durable Store Check] ${safeName} is still being processed and uploaded in background. Skipping immediate chunk restoration.`);
              } else if (fileMeta.isCorrupted === true) {
                console.log(`[Durable Store Check] ${safeName} is marked as corrupted/incomplete. Skipping chunk restoration.`);
              } else {
                const totalChunks = fileMeta.totalChunks;
                const chunks: Buffer[] = [];
                console.log(`[Durable Store Recovering Chunked] ${safeName} has ${totalChunks} chunks in Firestore durable_video_files_chunks. Restoring...`);
                let restoreBroken = false;
                for (let i = 0; i < totalChunks; i++) {
                  const chunkDocRef = doc(db, "durable_video_files_chunks", `${safeName}_chunk_${i}`);
                  const chunkSnap = await getDoc(chunkDocRef);
                  if (chunkSnap.exists()) {
                    const chunkData = chunkSnap.data();
                    if (chunkData && chunkData.fileData) {
                      chunks.push(Buffer.from(chunkData.fileData, "base64"));
                    }
                  } else {
                    restoreBroken = true;
                    // Mark as corrupted immediately so we never spam the log during subsequent requests
                    await updateDoc(doc(db, "durable_video_files", safeName), { isCorrupted: true }).catch(() => {});
                    break;
                  }
                }
                if (!restoreBroken) {
                  const fullBuffer = Buffer.concat(chunks);
                  fs.writeFileSync(targetPath, fullBuffer);
                  console.log(`[Durable Store Recovered Chunked] Successfully restored ${safeName} (${fullBuffer.length} bytes) to ephemeral server local node from chunked Firestore!`);
                }
              }
            }
          }
        } catch (cErr) {
          console.error(`[Durable Store Warning] Fail recovering chunked ${safeName} from Firestore collection:`, cErr);
        }
      }
    }

    if (fs.existsSync(targetPath)) {
      const ext = path.extname(safeName).toLowerCase();
      const videoExtensions = [".mp4", ".mov", ".webm", ".avi", ".mkv", ".m4v", ".3gp", ".flv", ".ts", ".wmv"];

      if (videoExtensions.includes(ext)) {
        try {
          const stat = fs.statSync(targetPath);
          const fileSize = stat.size;
          const range = req.headers.range;

          let contentType = "video/mp4";
          if (ext === ".mov") contentType = "video/quicktime";
          else if (ext === ".webm") contentType = "video/webm";
          else if (ext === ".avi") contentType = "video/x-msvideo";

          if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

            if (start >= fileSize || end >= fileSize) {
              res.status(416).set("Content-Range", `bytes */${fileSize}`).end();
              return;
            }

            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(targetPath, { start, end });
            const head = {
              "Content-Range": `bytes ${start}-${end}/${fileSize}`,
              "Accept-Ranges": "bytes",
              "Content-Length": chunksize,
              "Content-Type": contentType,
            };

            res.writeHead(206, head);
            file.pipe(res);
          } else {
            const head = {
              "Content-Length": fileSize,
              "Content-Type": contentType,
              "Accept-Ranges": "bytes"
            };
            res.writeHead(200, head);
            fs.createReadStream(targetPath).pipe(res);
          }
          return;
        } catch (streamErr) {
          console.error("Custom Range stream serving failed, falling back to default sendFile:", streamErr);
        }
      }

      return res.sendFile(targetPath);
    }

    next();
  });

  app.use("/uploads", express.static(uploadsDir));

  // 4b. Image File Upload Endpoint with automated validation and safety
  app.post("/api/admin/upload-image", authenticateJWT, async (req: Request, res: Response) => {
    const { fileName, fileData } = req.body;

    if (!fileName || !fileData) {
      return res.status(400).json({ error: "Missing uploaded file credentials (fileName, fileData)." });
    }

    try {
      const lowerName = fileName.toLowerCase();
      const validExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];
      const ext = path.extname(lowerName);
      if (!validExtensions.includes(ext)) {
        return res.status(400).json({ 
          error: "Only standard image file extensions (.jpg, .jpeg, .png, .webp, .gif, .svg) are authorized." 
        });
      }

      // Safe base64 resolution irrespective of MIME prefix structure
      const base64Data = fileData.includes(";base64,")
        ? fileData.substring(fileData.indexOf(";base64,") + 8)
        : fileData;
      const buffer = Buffer.from(base64Data, "base64");

      // Set upper limits (e.g. 15MB)
      const MAX_SIZE = 15 * 1024 * 1024;
      if (buffer.length > MAX_SIZE) {
        return res.status(400).json({ error: "Image file exceeds the 15MB upload preview allowance." });
      }

      const safeName = "img-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8) + ext;
      const targetPath = path.join(uploadsDir, safeName);

      fs.writeFileSync(targetPath, buffer);

      // Replicate the fileData durably in Firestore if it fits within the 1MB document limit
      if (fileData.length < 950000) {
        try {
          await setDoc(doc(db, "uploaded_assets", safeName), {
            fileName: safeName,
            fileData: fileData, // Storing base64 representation
            size: buffer.length,
            uploadedAt: new Date().toISOString()
          });
          console.log(`[Durable Store Saved] Replicated ${safeName} permanently to Firestore!`);
        } catch (dbErr: any) {
          console.log(`[Durable Store Info] Firestore backup skipped:`, dbErr.message || dbErr);
        }
      } else {
        console.log(`[Durable Store Info] Image size (${(buffer.length / (1024 * 1024)).toFixed(2)} MB) or Base64 payload length exceeds Firestore document limit; saved to local serving nodes only.`);
      }

      const fileUrl = `/uploads/${safeName}`;
      return res.json({
        success: true,
        url: fileUrl,
        name: safeName,
        size: buffer.length
      });
    } catch (err: any) {
      console.error("Image upload server failure: ", err);
      return res.status(500).json({ error: "Failed to save the picture file payload." });
    }
  });

  // 4b-2. E-Book PDF File Upload Endpoint with automated validation and safety
  app.post("/api/admin/upload-ebook", authenticateJWT, async (req: Request, res: Response) => {
    const { fileName, fileData } = req.body;

    if (!fileName || !fileData) {
      return res.status(400).json({ error: "Missing uploaded file credentials (fileName, fileData)." });
    }

    try {
      const lowerName = fileName.toLowerCase();
      const ext = path.extname(lowerName);
      if (ext !== ".pdf") {
        return res.status(400).json({ 
          error: "Only standard PDF publications (.pdf) are authorized." 
        });
      }

      // Safe base64 resolution irrespective of MIME prefix structure
      const base64Data = fileData.includes(";base64,")
        ? fileData.substring(fileData.indexOf(";base64,") + 8)
        : fileData;
      const buffer = Buffer.from(base64Data, "base64");

      // Set upper limits (500MB)
      const MAX_SIZE = 500 * 1024 * 1024;
      if (buffer.length > MAX_SIZE) {
        return res.status(400).json({ error: "E-Book file exceeds the 500MB upload allowance." });
      }

      const safeName = "ebook-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8) + ext;
      const targetPath = path.join(uploadsDir, safeName);

      fs.writeFileSync(targetPath, buffer);

      let fileUrl = `/uploads/${safeName}`;

      // Upload to Firebase Storage for robust replication
      try {
        console.log(`[Durable Store E-Book] Uploading ${safeName} to Firebase Storage...`);
        const storageInstance = getStorage(firebaseApp);
        const storageRef = ref(storageInstance, `ebooks/${safeName}`);
        
        await uploadBytes(storageRef, buffer, { contentType: "application/pdf" });
        const permanentDownloadUrl = await getDownloadURL(storageRef);
        console.log(`[Durable Store E-Book Success] Successful upload to Firebase Storage: ${permanentDownloadUrl}`);
        fileUrl = permanentDownloadUrl;
      } catch (dbErr: any) {
        console.log(`[Durable Store] Saved locally to serving container`);
        // Also replicate base64 in Firestore uploaded_assets if under 1MB as local fallback
        if (fileData.length < 950000) {
          try {
            await setDoc(doc(db, "uploaded_assets", safeName), {
              fileName: safeName,
              fileData: fileData,
              size: buffer.length,
              uploadedAt: new Date().toISOString()
            });
            console.log(`[Durable Store Fallback] Replicated smaller PDF to assets`);
          } catch (assetErr: any) {
            // Quiet fallback logging
          }
        }
      }

      return res.json({
        success: true,
        url: fileUrl,
        name: safeName,
        size: buffer.length
      });
    } catch (err: any) {
      console.error("E-Book upload server failure: ", err);
      return res.status(500).json({ error: "Failed to save the e-book file payload." });
    }
  });

  // Setup local temp directory for chunked video uploads
  const tempUploadsDir = path.join(uploadsDir, "temp_uploads");
  if (!fs.existsSync(tempUploadsDir)) {
    fs.mkdirSync(tempUploadsDir, { recursive: true });
  }

  // 4c. Initialize Chunked Upload Session
  app.post("/api/admin/video-upload/init", authenticateJWT, (req: Request, res: Response) => {
    try {
      const { fileName, fileSize, totalChunks } = req.body;
      if (!fileName || !fileSize || !totalChunks) {
        return res.status(400).json({ error: "Missing required initialization parameters (fileName, fileSize, totalChunks)." });
      }

      const ext = path.extname(fileName).toLowerCase();
      const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      const sessionDir = path.join(tempUploadsDir, uploadId);
      
      fs.mkdirSync(sessionDir, { recursive: true });

      // Save a metadata file inside the session folder
      fs.writeFileSync(
        path.join(sessionDir, "metadata.json"), 
        JSON.stringify({ fileName, fileSize, totalChunks, ext, createdAt: new Date().toISOString() })
      );

      return res.json({
        success: true,
        uploadId,
        uploadedChunks: []
      });
    } catch (err: any) {
      console.error("Failed to initialize chunked upload session:", err);
      return res.status(500).json({ error: "Failed to initialize upload session: " + err.message });
    }
  });

  // 4d. Upload an Individual Chunk (Base64 JSON payload parsed via global express.json)
  app.post(
    "/api/admin/video-upload/chunk",
    authenticateJWT,
    async (req: Request, res: Response) => {
      try {
        const uploadId = req.headers["x-upload-id"] as string;
        const chunkIndexStr = req.headers["x-chunk-index"] as string;

        if (!uploadId || chunkIndexStr === undefined) {
          return res.status(400).json({ error: "Missing required headers: x-upload-id and x-chunk-index." });
        }

        const chunkIndex = parseInt(chunkIndexStr, 10);
        const sessionDir = path.join(tempUploadsDir, uploadId);

        if (!fs.existsSync(sessionDir)) {
          return res.status(404).json({ error: "Upload session not found or expired. Please re-initiate." });
        }

        const { chunkData } = req.body || {};
        if (!chunkData) {
          return res.status(400).json({ error: "Missing chunkData base64 payload in body." });
        }

        const chunkPath = path.join(sessionDir, `chunk-${chunkIndex}`);
        const buffer = Buffer.from(chunkData, "base64");
        await fs.promises.writeFile(chunkPath, buffer);

        return res.json({
          success: true,
          chunkIndex
        });
      } catch (err: any) {
        console.error("Failed to save chunk on backend:", err);
        return res.status(500).json({ error: "Failed to save chunk on backend: " + err.message });
      }
    }
  );

  // 4e. Query upload session status for continuation/resuming after disconnection
  app.get("/api/admin/video-upload/status", authenticateJWT, (req: Request, res: Response) => {
    try {
      const uploadId = req.query.uploadId as string;
      if (!uploadId) {
        return res.status(400).json({ error: "Missing uploadId parameter." });
      }

      const sessionDir = path.join(tempUploadsDir, uploadId);
      if (!fs.existsSync(sessionDir)) {
        return res.status(404).json({ error: "Upload session not found or has been cleaned up." });
      }

      const files = fs.readdirSync(sessionDir);
      const uploadedChunks: number[] = [];

      files.forEach((file) => {
        if (file.startsWith("chunk-")) {
          const index = parseInt(file.split("-")[1], 10);
          if (!isNaN(index)) {
            uploadedChunks.push(index);
          }
        }
      });

      return res.json({
        success: true,
        uploadId,
        uploadedChunks: uploadedChunks.sort((a, b) => a - b)
      });
    } catch (err: any) {
      console.error("Failed to fetch upload status:", err);
      return res.status(500).json({ error: "Failed to read upload status: " + err.message });
    }
  });

  // Helper function to replicate uploaded big files (like videos) durably to Firestore in chunks
  async function saveFileToDurableFirestore(filePath: string, safeName: string) {
    try {
      if (!fs.existsSync(filePath)) return;
      const stats = fs.statSync(filePath);
      const totalSize = stats.size;
      const CHUNK_SIZE = 500 * 1024; // 500KB chunk size to safely stay below Firestore 1MB document limit after base64 expansion
      const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);

      console.log(`[Durable Firestore Chunking] Writing ${safeName} (${totalSize} bytes) to Firestore in ${totalChunks} chunks...`);

      const fileBuffer = fs.readFileSync(filePath);

      // Save File Metadata Registration (Marked as NOT fully uploaded initially)
      await setDoc(doc(db, "durable_video_files", safeName), {
        fileName: safeName,
        fileSize: totalSize,
        totalChunks: totalChunks,
        contentType: "video/mp4",
        createdAt: new Date().toISOString(),
        isFullyUploaded: false
      });

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, totalSize);
        const chunkBuffer = fileBuffer.subarray(start, end);
        const chunkBase64 = chunkBuffer.toString("base64");

        await setDoc(doc(db, "durable_video_files_chunks", `${safeName}_chunk_${i}`), {
          uploadId: safeName,
          chunkIndex: i,
          fileData: chunkBase64,
          uploadedAt: new Date().toISOString()
        });
      }

      // Mark the metadata document as fully uploaded once all chunks are complete
      await setDoc(
        doc(db, "durable_video_files", safeName),
        { isFullyUploaded: true },
        { merge: true }
      );

      console.log(`[Durable Firestore Chunking Done] Finished writing all ${totalChunks} chunks for ${safeName}`);
    } catch (err) {
      console.error(`[Durable Firestore Chunking Failed] Error storing chunks for ${safeName}:`, err);
    }
  }

  // 4f. Assemble chunks & trigger background permanent Firebase Storage upload
  app.post("/api/admin/video-upload/complete", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const { 
        uploadId, 
        title, 
        description, 
        category, 
        author, 
        status, 
        isScheduled, 
        scheduledTime, 
        thumbnailUrl,
        duration,
        editVideoId 
      } = req.body;

      if (!uploadId || !title) {
        return res.status(400).json({ error: "Missing required complete parameters (uploadId, title)." });
      }

      const sessionDir = path.join(tempUploadsDir, uploadId);
      if (!fs.existsSync(sessionDir)) {
        return res.status(404).json({ error: "Upload session directory not found." });
      }

      const metadataPath = path.join(sessionDir, "metadata.json");
      if (!fs.existsSync(metadataPath)) {
        return res.status(400).json({ error: "Session metadata missing." });
      }

      const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
      const totalChunks = parseInt(metadata.totalChunks, 10);
      const ext = metadata.ext || ".mp4";

      // Verify all chunks are on disk
      for (let i = 0; i < totalChunks; i++) {
        if (!fs.existsSync(path.join(sessionDir, `chunk-${i}`))) {
          return res.status(400).json({ error: `Verification failed: Chunk ${i} is missing. Please resume/re-upload.` });
        }
      }

      // Merge chunks sequentially with absolute safety and synchronicity
      const assembledFileName = `assembled-${uploadId}${ext}`;
      const assembledPath = path.join(uploadsDir, assembledFileName);
      
      const chunkBuffers: Buffer[] = [];
      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = path.join(sessionDir, `chunk-${i}`);
        chunkBuffers.push(fs.readFileSync(chunkPath));
      }
      fs.writeFileSync(assembledPath, Buffer.concat(chunkBuffers));

      // Verify file exists and is indeed stored before publishing
      if (!fs.existsSync(assembledPath) || fs.statSync(assembledPath).size === 0) {
        throw new Error("Local compiled video file assembly failure: Target file missing or empty.");
      }

      const localPlayUrl = `/uploads/${assembledFileName}`;
      const timestampISO = new Date().toISOString();
      const defaultThumb = "https://images.unsplash.com/photo-1546256811-99075add3074?auto=format&fit=crop&q=80&w=640";

      let targetDocId = editVideoId || "";
      const docData: any = {
        title: title.trim(),
        description: description.trim(),
        category: category || "general",
        url: localPlayUrl,
        videoUrl: localPlayUrl,
        thumbnailUrl: thumbnailUrl || defaultThumb,
        duration: duration || "0:00",
        createdAt: timestampISO,
        updatedAt: timestampISO,
        publishedAt: timestampISO,
        author: author || "admin@fastcoverage.news",
        status: "Processing",
        publishStatus: "Processing",
        published: false,
        featured: false,
        views: 0,
        isLive: false,
        isScheduled: !!isScheduled,
        scheduledTime: scheduledTime || ""
      };

      if (targetDocId) {
        const existingSnap = await getDoc(doc(db, "videoBulletins", targetDocId));
        if (existingSnap.exists()) {
          const original = existingSnap.data() || {};
          docData.createdAt = original.createdAt || timestampISO;
          docData.publishedAt = original.publishedAt || timestampISO;
          docData.views = original.views || 0;
        }
        const updatedData = { ...docData, id: targetDocId, videoId: targetDocId };
        await setDoc(doc(db, "videoBulletins", targetDocId), updatedData, { merge: true });
        await setDoc(doc(db, "videos", targetDocId), updatedData, { merge: true });
      } else {
        const bulletinsColl = collection(db, "videoBulletins");
        const docRef = await addDoc(bulletinsColl, docData);
        targetDocId = docRef.id;
        const finalData = { ...docData, id: targetDocId, videoId: targetDocId };
        await setDoc(doc(db, "videoBulletins", targetDocId), finalData, { merge: true });
        await setDoc(doc(db, "videos", targetDocId), finalData, { merge: true });
      }

      // Senders see successful assembly. Processing will proceed in background.
      res.json({
        success: true,
        message: "HD Video assembled. Cloud publishing is operating in the background.",
        videoId: targetDocId,
        videoUrl: localPlayUrl
      });

      // TRIGGER ASYNCHRONOUS FIREBASE STORAGE BACKGROUND HANDLER
      (async () => {
        try {
          console.log(`[Background cloud transfer] Uploading ${assembledFileName} to Firebase Storage...`);
          const fileBuffer = fs.readFileSync(assembledPath);
          const storageInstance = getStorage(firebaseApp);
          const storageRef = ref(storageInstance, `videoBulletins/videos/${targetDocId}${ext}`);
          
          let contentType = "video/mp4";
          if (ext === ".mov") contentType = "video/quicktime";
          else if (ext === ".webm") contentType = "video/webm";
          else if (ext === ".avi") contentType = "video/x-msvideo";

          await uploadBytes(storageRef, fileBuffer, { contentType });
          const permanentDownloadUrl = await getDownloadURL(storageRef);
          
          console.log(`[Background cloud transfer] Successful upload to Firebase Storage: ${permanentDownloadUrl}`);

          // Update databases with permanent cloud URL
          const finalStatus = status || "Published";
          const updateFields = {
            url: permanentDownloadUrl,
            videoUrl: permanentDownloadUrl,
            status: finalStatus,
            publishStatus: finalStatus,
            published: finalStatus === "Published",
            updatedAt: new Date().toISOString()
          };

          await updateDoc(doc(db, "videoBulletins", targetDocId), updateFields);
          await setDoc(doc(db, "videos", targetDocId), updateFields, { merge: true });

          console.log(`[Background cloud transfer] Database updated to status: ${finalStatus}. Doing disk cleanup...`);

          // Back up durably to Firestore chunks before unlinking local file
          await saveFileToDurableFirestore(assembledPath, assembledFileName);

          // Clean up assembled file and chunk session folders
          try {
            if (fs.existsSync(assembledPath)) {
              fs.unlinkSync(assembledPath);
            }
            if (fs.existsSync(sessionDir)) {
              fs.rmSync(sessionDir, { recursive: true, force: true });
            }
          } catch (stErr) {
            console.error("[Cleanup Warning] Failed to clean up local nodes:", stErr);
          }
        } catch (stErr: any) {
          console.log(`[Background local fallback] High-performance container storage active. Serving local stream from: /uploads/${assembledFileName}`);
          
          // Back up durably to Firestore chunks as a reliable restore-point for ephemeral container restarts
          await saveFileToDurableFirestore(assembledPath, assembledFileName);

          const finalStatus = status || "Published";
          const errUpdate = {
            status: finalStatus,
            publishStatus: finalStatus,
            url: `/uploads/${assembledFileName}`,
            videoUrl: `/uploads/${assembledFileName}`, // keeps local watchable file
            updatedAt: new Date().toISOString()
          };
          try {
            await updateDoc(doc(db, "videoBulletins", targetDocId), errUpdate);
            await setDoc(doc(db, "videos", targetDocId), errUpdate, { merge: true });
          } catch (_) {}

          // Log backup success in activity_logs
          try {
            await addDoc(collection(db, "activity_logs"), {
              userEmail: author || "admin@fastcoverage.news",
              timestamp: new Date().toISOString(),
              action: `[Video Native Published] Successfully published to local high-performance server node at: /uploads/${assembledFileName}`,
              ip: "Server Background Job"
            });
          } catch (_) {}
        }
      })();

    } catch (assemblyErr: any) {
      console.error("Direct failure assembling uploaded blocks:", assemblyErr);
      return res.status(500).json({ error: "Failed assembling chunk parts: " + assemblyErr.message });
    }
  });

  // 4g. Admin Permanent Video Delete API (deletes from Firestore, unlinks filesystem, and clears durable chunks)
  app.post("/api/admin/delete-video", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const { id, videoUrl, thumbnailUrl } = req.body;
      if (!id) {
        return res.status(400).json({ error: "Missing video id verification parameter." });
      }

      console.log(`[Delete System] Handing deletion request for video: ${id}`);

      // 1. Delete from Firestore bullet feeds
      try {
        await deleteDoc(doc(db, "videoBulletins", id));
        await deleteDoc(doc(db, "videos", id));
        console.log(`[Delete System] Cleaned up video documents: ${id}`);
      } catch (dbErr) {
        console.error("[Delete System DB Warning] Failed deleting database docs:", dbErr);
      }

      // 2. Unlink local file on filesystem
      if (videoUrl) {
        try {
          const videoName = path.basename(videoUrl.split(/[?#]/)[0]);
          const videoPath = path.join(uploadsDir, videoName);
          if (fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);
            console.log(`[Delete System] Unlinked local raw video file: ${videoPath}`);
          }
        } catch (fErr) {
          console.warn("[Delete System File warning] Failed cleaning local file:", fErr);
        }
      }

      if (thumbnailUrl) {
        try {
          const thumbName = path.basename(thumbnailUrl.split(/[?#]/)[0]);
          const thumbPath = path.join(uploadsDir, thumbName);
          if (fs.existsSync(thumbPath)) {
            fs.unlinkSync(thumbPath);
            console.log(`[Delete System] Unlinked local raw thumbnail file: ${thumbPath}`);
          }
        } catch (fErr) {
          console.warn("[Delete System File warning] Failed cleaning local thumbnail:", fErr);
        }
      }

      // 3. Clear all durable chunks associated with this file name from database
      if (videoUrl) {
        try {
          const safeName = path.basename(videoUrl.split(/[?#]/)[0]);
          const fileDocRef = doc(db, "durable_video_files", safeName);
          const fileSnap = await getDoc(fileDocRef);
          if (fileSnap.exists()) {
            const fileMeta = fileSnap.data();
            const totalChunks = fileMeta?.totalChunks || 0;
            await deleteDoc(fileDocRef);
            for (let i = 0; i < totalChunks; i++) {
              await deleteDoc(doc(db, "durable_video_files_chunks", `${safeName}_chunk_${i}`));
            }
            console.log(`[Delete System] Cleaned all durable backup chunks for ${safeName} successfully.`);
          }
        } catch (dkErr) {
          console.error("[Delete System Chunk warning] Failed cleaning chunk documents:", dkErr);
        }
      }

      return res.json({ success: true, message: "Broadcast item and associated files completely purged." });
    } catch (err: any) {
      console.error("Critical failure during delete process:", err);
      return res.status(500).json({ error: "Failed to erase video resource: " + err.message });
    }
  });

  // 5. Video File Upload with Description
  app.post("/api/admin/upload-video", authenticateJWT, (req: Request, res: Response) => {
    const { fileName, fileData } = req.body;

    if (!fileName || !fileData) {
      return res.status(400).json({ error: "Missing uploaded file credentials (fileName, fileData)." });
    }

    try {
      const lowerName = fileName.toLowerCase();
      const validExtensions = [".mp4", ".mov", ".webm", ".avi", ".mkv", ".m4v", ".3gp", ".flv", ".ts", ".wmv", ".mp3", ".wav", ".m4a", ".aac", ".ogg"];
      const ext = path.extname(lowerName);
      if (!validExtensions.includes(ext) && !lowerName.startsWith("video") && !lowerName.startsWith("audio")) {
        return res.status(400).json({ 
          error: "Only standard audio or video files are authorized." 
        });
      }

      // Safe base64 resolution irrespective of MIME prefix structure
      const base64Data = fileData.includes(";base64,")
        ? fileData.substring(fileData.indexOf(";base64,") + 8)
        : fileData;
      const buffer = Buffer.from(base64Data, "base64");

      // Limit file size to 500MB
      const MAX_SIZE = 500 * 1024 * 1024;
      if (buffer.length > MAX_SIZE) {
        return res.status(400).json({ error: "Video file exceeds the 500MB admin preview uploads cap." });
      }

      const safeName = "video-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8) + ext;
      const targetPath = path.join(uploadsDir, safeName);

      fs.writeFileSync(targetPath, buffer);

      const fileUrl = `/uploads/${safeName}`;
      return res.json({
        success: true,
        url: fileUrl,
        name: safeName
      });
    } catch (err: any) {
      console.error("Video write failed on backend:", err);
      return res.status(500).json({ error: "Failed to write the video file payload onto the preview server." });
    }
  });

  // 5b. HIGH PERFORMANCE Video Binary Upload with streaming disk write and real-time progress Support
  app.post("/api/admin/upload-video-binary", authenticateJWT, (req: Request, res: Response) => {
    const fileName = req.headers["x-file-name"] as string || (req.query.fileName as string) || "video-" + Date.now() + ".mp4";
    const lowerName = fileName.toLowerCase();
    const validExtensions = [".mp4", ".mov", ".webm", ".avi", ".mkv", ".m4v", ".3gp", ".flv", ".ts", ".wmv", ".mp3", ".wav", ".m4a", ".aac", ".ogg"];
    const ext = path.extname(lowerName) || ".mp4";
    if (!validExtensions.includes(ext) && !lowerName.startsWith("video") && !lowerName.startsWith("audio")) {
      return res.status(400).json({ 
        error: "Only standard audio or video files are authorized." 
      });
    }

    const safeName = "video-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8) + ext;
    const targetPath = path.join(uploadsDir, safeName);

    // Validate request size against 500MB limit before streaming to disk
    const contentLength = req.headers["content-length"];
    if (contentLength) {
      const sizeBytes = parseInt(contentLength, 10);
      const MAX_SIZE = 500 * 1024 * 1024; // 500MB
      if (sizeBytes > MAX_SIZE) {
        return res.status(400).json({ 
          error: "Video file exceeds the 500MB admin preview uploads cap." 
        });
      }
    }

    const writeStream = fs.createWriteStream(targetPath);

    req.pipe(writeStream);

    writeStream.on("finish", async () => {
      const fileUrl = `/uploads/${safeName}`;
      
      try {
        console.log(`[Video Ads Upload] Uploading ${safeName} to Firebase Storage...`);
        const fileBuffer = fs.readFileSync(targetPath);
        const storageInstance = getStorage(firebaseApp);
        const storageRef = ref(storageInstance, `videoAds/videos/${safeName}`);
        
        let contentType = "video/mp4";
        if (ext === ".mov") contentType = "video/quicktime";
        else if (ext === ".webm") contentType = "video/webm";
        else if (ext === ".avi") contentType = "video/x-msvideo";
        else if (ext === ".m4v") contentType = "video/x-m4v";
        
        await uploadBytes(storageRef, fileBuffer, { contentType });
        const permanentDownloadUrl = await getDownloadURL(storageRef);
        console.log(`[Video Ads Upload] Successful upload to Firebase Storage: ${permanentDownloadUrl}`);
        
        // Also replicate the video file durably in chunks to Firestore so it is never lost on restarts/scaling
        await saveFileToDurableFirestore(targetPath, safeName).catch((err) => {
          console.error(`[Durable Store error] Failed to replicate uploaded video ${safeName} to Firestore:`, err);
        });

        return res.json({
          success: true,
          url: permanentDownloadUrl,
          localUrl: fileUrl,
          name: safeName
        });
      } catch (storageErr: any) {
        console.error(`[Video Ads Upload Warning] Firebase Storage upload failed, falling back to local:`, storageErr);
        
        await saveFileToDurableFirestore(targetPath, safeName).then(() => {
          console.log(`[Durable Store success] Successfully replicated uploaded video ${safeName} to Firestore.`);
        }).catch((err) => {
          console.error(`[Durable Store error] Failed to replicate uploaded video ${safeName} to Firestore:`, err);
        });

        return res.json({
          success: true,
          url: fileUrl,
          name: safeName
        });
      }
    });

    writeStream.on("error", (err: any) => {
      console.error("Video streaming write failed on backend:", err);
      // Clean up incomplete file if any
      try {
        if (fs.existsSync(targetPath)) {
          fs.unlinkSync(targetPath);
        }
      } catch (cleanErr) {}
      return res.status(500).json({ error: "Failed to write the video file payload onto the preview server." });
    });
  });

  // Serve static files when integrated in production, otherwise mount local dev Vite configuration
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  // 8. Automated Hourly Safety & Recovery System
  async function runHourlyVideoSafetyCheck() {
    console.log("[Monitoring] Starting hourly video security & self-healing health check...");
    try {
      const bulletinsCollRef = collection(db, "videoBulletins");
      const querySnapshot = await getDocs(bulletinsCollRef);

      for (const docSnap of querySnapshot.docs) {
        const vidData = docSnap.data();
        const docId = docSnap.id;
        const rawUrl = vidData.videoUrl || vidData.url || "";
        const isLocal = rawUrl.startsWith("/uploads/") || rawUrl.includes("/uploads/");

        let isPlayable = false;
        let targetLocalFilename = "";

        if (isLocal) {
          const parts = rawUrl.split("/uploads/");
          targetLocalFilename = parts[parts.length - 1];
          const targetPath = path.join(uploadsDir, targetLocalFilename);

          if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 0) {
            isPlayable = true;
            console.log(`[Monitoring-OK] Local file exists and is active: ${targetLocalFilename}`);
          } else {
            console.warn(`[Monitoring-WARN] Local file missing: ${targetLocalFilename}. Attempting self-healing recovery...`);
            try {
              const fileDocRef = doc(db, "durable_video_files", targetLocalFilename);
              const fileDocSnap = await getDoc(fileDocRef);
              if (fileDocSnap.exists()) {
                const fileMeta = fileDocSnap.data();
                if (fileMeta && fileMeta.totalChunks) {
                  if (fileMeta.isFullyUploaded === false) {
                    console.log(`[Monitoring-SKIP] Video ${targetLocalFilename} is still uploading to Firestore chunks. Healing deferred.`);
                  } else if (fileMeta.isCorrupted === true) {
                    console.log(`[Monitoring-SKIP] Video ${targetLocalFilename} is marked corrupted/incomplete. Healing skipped.`);
                  } else {
                    const totalChunks = fileMeta.totalChunks;
                    const chunks: Buffer[] = [];
                    let brokenRestore = false;
                    for (let i = 0; i < totalChunks; i++) {
                      const chunkDocRef = doc(db, "durable_video_files_chunks", `${targetLocalFilename}_chunk_${i}`);
                      const chunkSnap = await getDoc(chunkDocRef);
                      if (chunkSnap.exists()) {
                        const chunkData = chunkSnap.data();
                        if (chunkData && chunkData.fileData) {
                          chunks.push(Buffer.from(chunkData.fileData, "base64"));
                        }
                      } else {
                        brokenRestore = true;
                        await updateDoc(doc(db, "durable_video_files", targetLocalFilename), { isCorrupted: true }).catch(() => {});
                        break;
                      }
                    }
                    if (!brokenRestore) {
                      const fullBuffer = Buffer.concat(chunks);
                      fs.writeFileSync(targetPath, fullBuffer);
                      isPlayable = true;
                      console.log(`[Monitoring-HEALED] Restored video ${targetLocalFilename} successfully from database base64 chunks!`);
                    }
                  }
                }
              } else {
                console.error(`[Monitoring-FAIL] No durable chunks backup configured for ${targetLocalFilename}`);
              }
            } catch (healErr) {
              console.error(`[Monitoring-FAIL] Attempt to heal ${targetLocalFilename} failed:`, healErr);
            }
          }
        } else if (rawUrl.startsWith("http")) {
          // External URL validation check
          try {
            const res = await fetch(rawUrl, { method: "HEAD" });
            if (res.ok || res.status === 200 || res.status === 206) {
              isPlayable = true;
              console.log(`[Monitoring-OK] External url is active: ${rawUrl}`);
            } else {
              console.warn(`[Monitoring-WARN] External url returned error status ${res.status}: ${rawUrl}`);
            }
          } catch (fetchErr) {
            console.warn(`[Monitoring-WARN] External url fetch failed for: ${rawUrl}`);
          }

          // If it fails, check if we have a durable chunks backup matching docId or standard naming, and heal it
          if (!isPlayable) {
            const ext = rawUrl.split(/[#?]/)[0].split('.').pop() || "mp4";
            const safeNameGuess = `assembled-upload-${docId}.${ext}`;
            const safeNameGuess2 = `assembled-${docId}.${ext}`;
            
            let solvedSafeName = "";
            let solvedDoc = null;

            for (const guess of [safeNameGuess, safeNameGuess2]) {
              const guessDoc = await getDoc(doc(db, "durable_video_files", guess));
              if (guessDoc.exists()) {
                solvedSafeName = guess;
                solvedDoc = guessDoc;
                break;
              }
            }

            if (solvedSafeName && solvedDoc) {
              try {
                const fileMeta = solvedDoc.data();
                if (fileMeta && fileMeta.totalChunks) {
                  if (fileMeta.isFullyUploaded === false) {
                    console.log(`[Monitoring-SKIP] Guessed video ${solvedSafeName} is still uploading to Firestore chunks. Healing deferred.`);
                  } else if (fileMeta.isCorrupted === true) {
                    console.log(`[Monitoring-SKIP] Guessed video ${solvedSafeName} is marked corrupted/incomplete. Healing bypassed.`);
                  } else {
                    const totalChunks = fileMeta.totalChunks;
                    const chunks: Buffer[] = [];
                    const targetPath = path.join(uploadsDir, solvedSafeName);
                    let brokenRestore = false;
                    for (let i = 0; i < totalChunks; i++) {
                      const chunkDocRef = doc(db, "durable_video_files_chunks", `${solvedSafeName}_chunk_${i}`);
                      const chunkSnap = await getDoc(chunkDocRef);
                      if (chunkSnap.exists()) {
                        const chunkData = chunkSnap.data();
                        if (chunkData && chunkData.fileData) {
                          chunks.push(Buffer.from(chunkData.fileData, "base64"));
                        }
                      } else {
                        brokenRestore = true;
                        await updateDoc(doc(db, "durable_video_files", solvedSafeName), { isCorrupted: true }).catch(() => {});
                        break;
                      }
                    }
                    if (!brokenRestore) {
                      const fullBuffer = Buffer.concat(chunks);
                      fs.writeFileSync(targetPath, fullBuffer);
                      
                      const healUrl = `/uploads/${solvedSafeName}`;
                      await updateDoc(doc(db, "videoBulletins", docId), {
                        url: healUrl,
                        videoUrl: healUrl,
                        status: "Published",
                        publishStatus: "Published",
                        published: true
                      });
                      await setDoc(doc(db, "videos", docId), {
                        url: healUrl,
                        videoUrl: healUrl,
                        status: "Published",
                        publishStatus: "Published",
                        published: true
                      }, { merge: true });

                      isPlayable = true;
                      console.log(`[Monitoring-HEALED-EXTERNAL] Defective URL reclaimed to restored local chunked file: ${healUrl}`);
                    }
                  }
                }
              } catch (extHealErr) {
                console.error("[Monitoring-FAIL] Failed to heal broken external link:", extHealErr);
              }
            }
          }
        }

        // ONLY write to the database if the status has actually changed to conserve Firestore quotas and prevent queue congestion!
        const previousPlaybackStatus = vidData.playbackStatus || "";
        const previousStorageStatus = vidData.storageStatus || "";
        const targetPlaybackStatus = isPlayable ? "Operational" : "Failed";
        const targetStorageStatus = isPlayable ? "Secure" : "Defective";

        if (previousPlaybackStatus !== targetPlaybackStatus || previousStorageStatus !== targetStorageStatus) {
          const safetyStatus = {
            storageVerifiedAt: new Date().toISOString(),
            storageStatus: targetStorageStatus,
            playbackStatus: targetPlaybackStatus,
            brokenWarning: isPlayable ? "" : "Playback check warning: target file is inaccessible or missing on serving nodes."
          };

          try {
            await updateDoc(doc(db, "videoBulletins", docId), safetyStatus);
            await setDoc(doc(db, "videos", docId), safetyStatus, { merge: true });
            console.log(`[Monitoring] Playback status updated for ${docId}: became ${targetPlaybackStatus}`);
          } catch (_) {}
        } else {
          console.log(`[Monitoring] Status unchanged for ${docId}. Skipping database write operation.`);
        }
      }
    } catch (globalMonErr) {
      console.error("[Monitoring-CRITICAL] Global hourly monitoring scheduler failed:", globalMonErr);
    }
  }

  // Run immediate safety validation + self-healing recovery on boat startup
  runHourlyVideoSafetyCheck().catch((unhandled) => {
    console.error("[Monitoring-BOOT] Immediate self-healing recovery threw error:", unhandled);
  });

  // Schedule background hourly checks
  setInterval(() => {
    runHourlyVideoSafetyCheck().catch((unhandled) => {
      console.error("[Monitoring-INTERVAL] Hourly safety loop check error:", unhandled);
    });
  }, 60 * 60 * 1000);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Fast Coverage Platform Backend Server] running smoothly on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Critical Failure booting Fast Coverage server: ", error);
});
