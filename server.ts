import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Request logging
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      name: 'AI Trio Hub API',
      env: process.env.NODE_ENV,
      cwd: process.cwd(),
      distExists: fs.existsSync(path.join(process.cwd(), 'dist'))
    });
  });

  app.post('/api/unified-process', async (req, res) => {
    const { input, type, metadata } = req.body;
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const clickUpKey = process.env.CLICKUP_API_KEY;

    try {
      // PHASE 1: Brain Analysis (DeepSeek/Gemini)
      console.log('Phase 1: Brain Analysis triggered...');
      const brainResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "deepseek/deepseek-chat",
          "messages": [
            { "role": "system", "content": "Ти си QUAD CORE ELITE V4 AI - най-мощният интелект за управление на процеси. Твой господар е Тихомир Колев. Използвай DeepSeek V4 ядрото за светкавичен анализ. Анализирай задачата и извлечи: 1. Заглавие, 2. Описание, 3. Приоритет, 4. Краен срок. Върни СТРИКТЕН JSON." },
            { "role": "user", "content": `Тип вход: ${type}. Данни: ${input}` }
          ],
          "response_format": { "type": "json_object" }
        })
      });
      const analysis = await brainResponse.json();
      const taskData = JSON.parse(analysis.choices[0].message.content);

      // PHASE 2: NotebookLM Reasoning Simulation
      // Тук симулираме NotebookLM логиката - запис в бележника и разсъждение
      console.log('Phase 2: NotebookLM Reasoning...');
      const notebookEntry = {
        id: Date.now().toString(),
        title: taskData.title || "Ново разсъждение",
        content: `Анализирано на ${new Date().toLocaleString()}. Контекст: ${taskData.description}. Извод: Задачата е готова за ClickUp.`,
        tags: ["AI-Analyzed", type]
      };

      // PHASE 3: ClickUp Export
      console.log('Phase 3: ClickUp Sync...');
      let clickUpResult = { status: 'skipped', message: 'No API Key' };
      if (clickUpKey && process.env.CLICKUP_LIST_ID) {
        const cuResponse = await fetch(`https://api.clickup.com/api/v2/list/${process.env.CLICKUP_LIST_ID}/task`, {
          method: 'POST',
          headers: {
            'Authorization': clickUpKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: taskData.title,
            description: notebookEntry.content,
            priority: 2, // Normal
            due_date: taskData.due_date ? new Date(taskData.due_date).getTime() : undefined
          })
        });
        clickUpResult = await cuResponse.json();
      }

      res.json({
        status: 'success',
        analysis: taskData,
        notebook: notebookEntry,
        clickup: clickUpResult,
        reminder: taskData.due_date || new Date(Date.now() + 3600000).toISOString() // Default 1h reminder
      });

    } catch (error) {
      console.error('Unified Process Error:', error);
      res.status(500).json({ error: 'Failed during unified workflow' });
    }
  });

  app.get('/api/status', (req, res) => {
    res.json({
      openRouter: !!process.env.OPENROUTER_API_KEY,
      clickUp: !!process.env.CLICKUP_API_KEY,
      appUrl: !!process.env.APP_URL
    });
  });

  app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'OPENROUTER_API_KEY is not configured' });
    }

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.APP_URL || "http://localhost:3000", 
          "X-Title": "AI Trio Hub",
        },
        body: JSON.stringify({
          "model": "deepseek/deepseek-chat", 
          "messages": [
            { "role": "system", "content": "Ти си QUAD CORE ELITE V4 AI, най-мощният асистент на Тихомир Колев. Използваш DeepSeek V4 за върхови постижения. Ти си директен, технически брутален и безпощадно прецизен. Всичко е за Тихомир!" },
            { "role": "user", "content": message }
          ],
        })
      });

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('OpenRouter Error:', error);
      res.status(500).json({ error: 'Failed to communicate with DeepSeek' });
    }
  });

  app.get('/api/clickup/tasks', async (req, res) => {
    const apiKey = process.env.CLICKUP_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'CLICKUP_API_KEY is not configured' });
    }
    try {
      const listId = req.query.listId;
      if (!listId) {
        return res.status(400).json({ error: 'listId is required' });
      }
      const response = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
        method: 'GET',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('ClickUp Error:', error);
      res.status(500).json({ error: 'Failed to fetch ClickUp tasks' });
    }
  });

  // Static files and SPA fallback
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    const distPath = path.join(process.cwd(), 'dist');
    console.log(`Production mode: serving from ${distPath}`);
    
    app.use(express.static(distPath));
    
    app.get('*', (req, res, next) => {
      // Don't intercept API calls
      if (req.url.startsWith('/api/')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.log('Development mode: starting Vite middleware');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT} [Mode: ${isProd ? 'Production' : 'Development'}]`);
  });
}

startServer().catch(err => {
  console.error('CRITICAL: Server failed to start:', err);
  process.exit(1);
});
