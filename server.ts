import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const CONFIG_FILE = path.join(process.cwd(), 'app_config.json');

app.use(express.json({ limit: '10mb' }));

// Helper to load persistent server configuration
function loadConfig() {
  let config: { gasWebAppUrl: string; databaseMode: 'gas' | 'mock' } = {
    gasWebAppUrl: process.env.GAS_WEB_APP_URL || process.env.VITE_GAS_WEB_APP_URL || '',
    databaseMode: (process.env.GAS_WEB_APP_URL || process.env.VITE_GAS_WEB_APP_URL) ? 'gas' : 'mock',
  };

  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const fileData = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const data = JSON.parse(fileData);
      if (data) {
        if (typeof data.gasWebAppUrl === 'string' && data.gasWebAppUrl.trim()) {
          config.gasWebAppUrl = data.gasWebAppUrl.trim();
        }
        if (data.databaseMode === 'gas' || data.databaseMode === 'mock') {
          config.databaseMode = data.databaseMode;
        }
      }
    } catch (e) {
      console.error('Error reading app_config.json file:', e);
    }
  }
  return config;
}

// Helper to save server configuration to disk
function saveConfig(newConfig: Partial<{ gasWebAppUrl: string; databaseMode: 'gas' | 'mock' }>) {
  const current = loadConfig();
  const updated = {
    ...current,
    ...newConfig,
  };
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing app_config.json file:', e);
  }
  return updated;
}

// GET central database configuration
app.get('/api/config', (req, res) => {
  const config = loadConfig();
  res.json({ success: true, config });
});

// POST update central database configuration (syncs across all devices)
app.post('/api/config', (req, res) => {
  const { gasWebAppUrl, databaseMode } = req.body || {};
  const updated = saveConfig({
    gasWebAppUrl: typeof gasWebAppUrl === 'string' ? gasWebAppUrl : undefined,
    databaseMode: (databaseMode === 'gas' || databaseMode === 'mock') ? databaseMode : undefined,
  });
  res.json({ success: true, config: updated });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
