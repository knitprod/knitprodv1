import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const CONFIG_FILE = path.join(process.cwd(), 'app_config.json');
const DB_FILE = path.join(process.cwd(), 'app_db.json');

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

// Central database helpers
function loadDb() {
  let db: any = {
    settings: {
      rejectThreshold: '2.5',
      maxIdleMachines: '4',
      alarmEmail: 'knitprod-alerts@epyllion.com',
      targets: {
        'EKL': '7500',
        'EFL': '15000',
        'EFL-2': '15000',
        'Auto Stripe': '12000',
        'EFL-Extension': '15000',
        'ESL-Extension': '10000',
      },
      machines: {
        'EKL': '48',
        'EFL': '40',
        'EFL-2': '35',
        'Auto Stripe': '20',
        'EFL-Extension': '25',
        'ESL-Extension': '16',
      }
    },
    users: [],
    ledger: [],
    productionEntries: [],
    activityLogs: []
  };

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileData = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(fileData);
      if (parsed) {
        db = { ...db, ...parsed };
      }
    } catch (e) {
      console.error('Error reading app_db.json:', e);
    }
  }
  return db;
}

function saveDb(partial: any) {
  const current = loadDb();
  let updated = { ...current, ...partial };

  // Smart upsert for users array if provided
  if (partial.users && Array.isArray(partial.users) && current.users && Array.isArray(current.users)) {
    const newUsers = [...current.users];
    for (const u of partial.users) {
      if (!u || !u.uid) continue;
      const idx = newUsers.findIndex(existing => 
        (existing.uid && u.uid && existing.uid.toString().trim().toUpperCase() === u.uid.toString().trim().toUpperCase()) ||
        (existing.id && u.id && existing.id === u.id)
      );
      if (idx >= 0) {
        newUsers[idx] = { ...newUsers[idx], ...u };
      } else {
        newUsers.unshift(u);
      }
    }
    updated.users = newUsers;
  }

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing app_db.json:', e);
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

// Central Database state endpoint (cross-device fallback store)
app.get('/api/db', (req, res) => {
  const db = loadDb();
  res.json({ success: true, db });
});

app.post('/api/db', (req, res) => {
  const updated = saveDb(req.body || {});
  res.json({ success: true, db: updated });
});

// Proxy to Google Apps Script REST API to prevent CORS issues across all devices
app.all('/api/gas-proxy', async (req, res) => {
  const config = loadConfig();
  
  try {
    let targetUrl = config.gasWebAppUrl;
    
    // Allow URL override from body or query if provided
    if (req.method === 'GET' && req.query.url) {
      targetUrl = String(req.query.url);
    } else if (req.method === 'POST' && req.body && req.body.url) {
      targetUrl = String(req.body.url);
    }

    if (!targetUrl || !targetUrl.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Google Apps Script Web App URL is not configured centrally on the server.'
      });
    }

    let trimmedUrl = targetUrl.trim();

    // Auto-correct common Google Apps Script URL mistakes
    if (trimmedUrl.endsWith('/dev')) {
      trimmedUrl = trimmedUrl.replace(/\/dev$/, '/exec');
    } else if (trimmedUrl.endsWith('/edit')) {
      trimmedUrl = trimmedUrl.replace(/\/edit$/, '/exec');
    } else if (trimmedUrl.includes('/macros/s/') && !trimmedUrl.endsWith('/exec')) {
      trimmedUrl = trimmedUrl.replace(/\/+$/, '') + '/exec';
    }

    if (req.method === 'GET') {
      const urlObj = new URL(trimmedUrl);
      for (const [key, val] of Object.entries(req.query)) {
        if (key !== 'url') {
          urlObj.searchParams.append(key, String(val));
        }
      }

      const response = await fetch(urlObj.toString(), {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        redirect: 'follow'
      });

      if (!response.ok) {
        let hint = '';
        if (response.status === 404) {
          hint = ' (404 Not Found: Ensure URL ends in "/exec", not "/dev", and that a Web App deployment exists in Google Apps Script).';
        } else if (response.status === 401 || response.status === 403) {
          hint = ' (Access Denied: Set "Who has access" to "Anyone" in Google Apps Script deployment).';
        }
        return res.status(response.status).json({
          success: false,
          message: `Google Apps Script returned HTTP status ${response.status}${hint}`
        });
      }

      const text = await response.text();
      try {
        const json = JSON.parse(text);
        return res.json(json);
      } catch (e) {
        return res.json({ success: false, message: 'Invalid JSON response from Apps Script', raw: text });
      }
    } else if (req.method === 'POST') {
      // Forward POST payload to Google Apps Script
      const postBody = { ...req.body };
      delete postBody.url; // Remove internal url param if passed

      const response = await fetch(trimmedUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(postBody),
        redirect: 'follow'
      });

      if (!response.ok) {
        let hint = '';
        if (response.status === 404) {
          hint = ' (404 Not Found: Ensure URL ends in "/exec", not "/dev", and that a Web App deployment exists in Google Apps Script).';
        } else if (response.status === 401 || response.status === 403) {
          hint = ' (Access Denied: Set "Who has access" to "Anyone" in Google Apps Script deployment).';
        }
        return res.status(response.status).json({
          success: false,
          message: `Google Apps Script returned HTTP status ${response.status}${hint}`
        });
      }

      const text = await response.text();
      try {
        const json = JSON.parse(text);
        return res.json(json);
      } catch (e) {
        return res.json({ success: false, message: 'Invalid JSON response from Apps Script', raw: text });
      }
    } else {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (err: any) {
    console.error('GAS Proxy Error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Error communicating with Google Apps Script'
    });
  }
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
