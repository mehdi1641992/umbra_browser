import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));

// Initialize Gemini AI SDK if key is available
const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// DuckDuckGo search suggestions proxy
app.get('/api/suggestions', async (req, res) => {
  const query = req.query.q as string;
  if (!query) {
    return res.json([]);
  }
  try {
    const response = await fetch(`https://duckduckgo.com/ac/?q=${encodeURIComponent(query)}&type=json`);
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('Suggestions error:', error);
    res.json([]);
  }
});

// Proxy route for web browsing with ad blocking & tracker scrubbing
app.get('/api/proxy', async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing target URL' });
  }

  let formattedUrl = targetUrl;
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = 'https://' + formattedUrl;
  }

  try {
    const response = await fetch(formattedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AetherShieldBrowser/1.0 (Privacy-Enhanced)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    const contentType = response.headers.get('content-type') || '';
    const bodyText = await response.text();

    if (contentType.includes('text/html')) {
      // Simulate ad & tracker blocking
      let cleanedHtml = bodyText;
      const blockedTrackers: string[] = [];

      // Detect and strip known tracking domains / ad scripts
      const trackerPatterns = [
        /src="[^"]*?(googletagmanager|google-analytics|doubleclick|facebook|hotjar|criteo|taboola|outbrain|adnxs|scorecardresearch|quantserve)[^"]*?"/gi,
        /<script[^>]*?>[\s\S]*?(analytics|tracker|adsense|pixel|beacon)[\s\S]*?<\/script>/gi
      ];

      trackerPatterns.forEach(pattern => {
        cleanedHtml = cleanedHtml.replace(pattern, (match) => {
          blockedTrackers.push(match.substring(0, 80) + '...');
          return '<!-- [Aether Shields Blocked Tracker/Ad] -->';
        });
      });

      // Inject base tag & privacy shield banner script
      const shieldInjection = `
        <style>
          .aether-shield-banner {
            position: fixed; bottom: 10px; right: 10px; z-index: 999999;
            background: rgba(15, 23, 42, 0.95); color: #38bdf8; padding: 8px 14px;
            border-radius: 8px; font-family: system-ui, sans-serif; font-size: 12px;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); border: 1px solid rgba(56, 189, 248, 0.3);
            display: flex; align-items: center; gap: 8px; backdrop-filter: blur(8px);
          }
          .aether-shield-dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; animation: pulse 2s infinite; }
          @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
        </style>
        <div class="aether-shield-banner">
          <div class="aether-shield-dot"></div>
          <span>Aether Shields Active (${blockedTrackers.length} trackers & ads blocked)</span>
        </div>
      `;

      if (cleanedHtml.includes('</body>')) {
        cleanedHtml = cleanedHtml.replace('</body>', shieldInjection + '</body>');
      } else {
        cleanedHtml += shieldInjection;
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('X-Frame-Options', 'ALLOWALL');
      return res.send(cleanedHtml);
    } else {
      res.setHeader('Content-Type', contentType);
      return res.send(bodyText);
    }
  } catch (error: any) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch URL securely: ' + error.message });
  }
});

// Gemini AI endpoint for Leo AI Assistant
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { prompt, pageContext, history } = req.body;
    if (!ai) {
      return res.status(500).json({ error: 'Gemini API key not configured on server.' });
    }

    const modelName = 'gemini-2.5-flash';
    const systemInstruction = `You are Leo, the built-in AI assistant in Aether Shield Browser. You are helpful, privacy-focused, expert in web technologies, cybersecurity, ad blocking, and IDM-style downloading. 
Context of current page: ${pageContext ? JSON.stringify(pageContext) : 'New Tab / Home'}`;

    const chatHistory = history || [];
    const contents = [
      ...chatHistory.map((h: any) => ({ role: h.role, parts: [{ text: h.text }] })),
      { role: 'user', parts: [{ text: prompt }] }
    ];

    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: error.message || 'AI generation failed' });
  }
});

// AI Privacy & Tracker Audit endpoint
app.post('/api/ai/audit', async (req, res) => {
  try {
    const { url, htmlSnippet } = req.body;
    if (!ai) {
      return res.json({
        summary: "Privacy audit unavailable (No API key)",
        trackers: ["Google Analytics (Simulated)", "Facebook Pixel (Simulated)"],
        score: 85,
        recommendations: ["Enable aggressive cookie blocking", "Disable third-party storage"]
      });
    }

    const prompt = `Analyze this webpage (${url}) and HTML snippet for privacy risks, trackers, cross-site cookies, and malicious scripts. Return valid JSON with fields: summary (string), trackers (array of strings), score (number 0-100), recommendations (array of strings). HTML snippet: ${htmlSnippet?.substring(0, 3000)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const data = JSON.parse(response.text || '{}');
    res.json(data);
  } catch (error: any) {
    console.error('AI Audit Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Vite middleware integration for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' }
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Aether Shield Browser server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
