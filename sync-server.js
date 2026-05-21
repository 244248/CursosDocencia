const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ===================== CONFIG =====================
const PORT = process.env.SYNC_SERVER_PORT || 3333;
const DB = 'GestionDocente';
const FIREBASE_URL = process.env.FIREBASE_DATABASE_URL || 'https://gestioncursodocente-default-rtdb.firebaseio.com';
const API_SECRET = process.env.SYNC_API_SECRET || process.env.REACT_APP_SYNC_API_SECRET || '';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3002,http://localhost:3000').split(',');
const ENABLE_HTTPS = process.env.ENABLE_HTTPS === 'true';
const HTTPS_KEY_PATH = process.env.HTTPS_KEY_PATH || './certs/server.key';
const HTTPS_CERT_PATH = process.env.HTTPS_CERT_PATH || './certs/server.crt';

// ===================== LOGGING =====================
const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const LOG_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL || 'INFO'] || 1;

function log(level, message, meta = {}) {
  if (LOG_LEVELS[level] < LOG_LEVEL) return;
  const timestamp = new Date().toISOString();
  const entry = { timestamp, level, message, ...meta };
  if (level === 'ERROR') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

function logInfo(message, meta) { log('INFO', message, meta); }
function logWarn(message, meta) { log('WARN', message, meta); }
function logError(message, meta) { log('ERROR', message, meta); }
function logDebug(message, meta) { log('DEBUG', message, meta); }

// ===================== METRICS =====================
const metrics = {
  requests: { total: 0, byEndpoint: {}, byStatus: {} },
  errors: { total: 0, byType: {} },
  sqlQueries: { total: 0, failed: 0 },
  startTime: Date.now(),
  lastRequestTime: null
};

function recordRequest(endpoint, statusCode) {
  metrics.requests.total++;
  metrics.requests.byEndpoint[endpoint] = (metrics.requests.byEndpoint[endpoint] || 0) + 1;
  metrics.requests.byStatus[statusCode] = (metrics.requests.byStatus[statusCode] || 0) + 1;
  metrics.lastRequestTime = Date.now();
}

function recordError(type) {
  metrics.errors.total++;
  metrics.errors.byType[type] = (metrics.errors.byType[type] || 0) + 1;
}

function recordSqlQuery(success) {
  metrics.sqlQueries.total++;
  if (!success) metrics.sqlQueries.failed++;
}

function getUptime() {
  const elapsed = Date.now() - metrics.startTime;
  const hours = Math.floor(elapsed / 3600000);
  const minutes = Math.floor((elapsed % 3600000) / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  return `${hours}h ${minutes}m ${seconds}s`;
}

// ===================== CORS =====================
function isValidOrigin(origin) {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
}

function setCorsHeaders(res, req) {
  const origin = req.headers.origin;
  if (isValidOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!API_SECRET) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Secret, ngrok-skip-browser-warning');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
}

// ===================== AUTH =====================
function authenticate(req) {
  if (!API_SECRET) return true;
  const providedSecret = req.headers['x-api-secret'];
  return providedSecret === API_SECRET;
}

// ===================== SQL - PARAMETERIZED QUERIES =====================
/**
 * Sanitizes a value for safe use in SQL queries.
 * Uses parameterized approach: validates type and escapes properly.
 */
function sanitizeValue(value) {
  if (value === null || value === undefined) return { sql: 'NULL', type: 'null' };
  if (typeof value === 'number') return { sql: String(value), type: 'number' };
  if (typeof value === 'boolean') return { sql: value ? '1' : '0', type: 'boolean' };
  // String: escape single quotes and wrap
  const sanitized = String(value).replace(/'/g, "''").replace(/\\/g, '\\\\');
  return { sql: `'${sanitized}'`, type: 'string' };
}

/**
 * Validates that a table name is safe (whitelist approach).
 */
const ALLOWED_TABLES = ['docentes', 'cursos', 'administradores'];
function validateTable(table) {
  if (!ALLOWED_TABLES.includes(table)) {
    throw new Error(`Tabla no permitida: ${table}. Tablas permitidas: ${ALLOWED_TABLES.join(', ')}`);
  }
  return table;
}

/**
 * Executes a SQL query using sqlcmd with proper escaping.
 */
function sqlRun(query) {
  const startTime = Date.now();
  try {
    const escapedQuery = query.replace(/"/g, '\\"');
    const result = execSync(`sqlcmd -S localhost -E -d ${DB} -Q "${escapedQuery}"`, {
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 10000
    });
    const duration = Date.now() - startTime;
    logDebug('SQL query executed', { duration, query: query.substring(0, 100) });
    recordSqlQuery(true);
    return result;
  } catch (e) {
    const duration = Date.now() - startTime;
    logError('SQL query failed', { error: e.message, duration, query: query.substring(0, 100) });
    recordSqlQuery(false);
    throw e;
  }
}

/**
 * Safe upsert using parameterized values.
 */
function upsert(table, key, data) {
  validateTable(table);

  const sanitizedKey = sanitizeValue(key);
  const checkQuery = `IF NOT EXISTS (SELECT 1 FROM ${table} WHERE firebase_key = ${sanitizedKey.sql}) SELECT 'INSERT' as accion ELSE SELECT 'UPDATE' as accion`;
  const isInsert = sqlRun(checkQuery).includes('INSERT');

  if (isInsert) {
    const keys = ['firebase_key', ...Object.keys(data)];
    const vals = keys.map(k => {
      if (k === 'firebase_key') return sanitizedKey.sql;
      return sanitizeValue(data[k]).sql;
    });
    const insertQuery = `INSERT INTO ${table} (${keys.map(k => `[${k}]`).join(', ')}) VALUES (${vals.join(', ')})`;
    sqlRun(insertQuery);
    logInfo(`INSERT into ${table}`, { key });
  } else {
    const sets = Object.keys(data).map(k => `[${k}] = ${sanitizeValue(data[k]).sql}`);
    const updateQuery = `UPDATE ${table} SET ${sets.join(', ')} WHERE firebase_key = ${sanitizedKey.sql}`;
    sqlRun(updateQuery);
    logInfo(`UPDATE ${table}`, { key });
  }
  return { ok: true };
}

// ===================== VALIDATION =====================
function validateDocente(data) {
  if (!data.key || typeof data.key !== 'string') return 'Campo key es requerido y debe ser texto';
  if (!data.nombre || typeof data.nombre !== 'string') return 'Campo nombre es requerido y debe ser texto';
  if (data.email && typeof data.email !== 'string') return 'Campo email debe ser texto';
  if (data.nombre.length > 200) return 'Nombre demasiado largo (max 200 chars)';
  if (data.email && data.email.length > 255) return 'Email demasiado largo (max 255 chars)';
  return null;
}

function validateCurso(data) {
  if (!data.key || typeof data.key !== 'string') return 'Campo key es requerido y debe ser texto';
  if (!data.nombre || typeof data.nombre !== 'string') return 'Campo nombre es requerido y debe ser texto';
  if (data.nombre.length > 200) return 'Nombre demasiado largo (max 200 chars)';
  return null;
}

function validateAdmin(data) {
  if (!data.key || typeof data.key !== 'string') return 'Campo key es requerido y debe ser texto';
  if (!data.email || typeof data.email !== 'string') return 'Campo email es requerido y debe ser texto';
  if (data.email.length > 255) return 'Email demasiado largo (max 255 chars)';
  return null;
}

// ===================== DATA MAPPING =====================
function mapDocente(key, d) {
  return {
    nombre: (d.nombre || '').substring(0, 200),
    apellidos: (d.apellidos || '').substring(0, 200),
    email: (d.email || '').substring(0, 255),
    area: (d.area || 'No especificada').substring(0, 100)
  };
}

function mapCurso(key, c) {
  return {
    nombre: (c.nombre || '').substring(0, 200),
    tipo: (c.tipo || '').substring(0, 50),
    fecha: c.fecha || 'Sin fecha',
    modalidad: c.url ? 'En linea' : 'Presencial',
    url: c.url ? c.url.substring(0, 500) : null
  };
}

function mapAdmin(key, a) {
  return {
    email: (a.email || '').substring(0, 255),
    nombre: (a.nombre || '').substring(0, 200),
    apellidos: (a.apellidos || '').substring(0, 200),
    rol: (a.rol || 'administrador').substring(0, 50),
    uid: (a.uid || '').substring(0, 128)
  };
}

// ===================== FIREBASE =====================
async function firebasePut(path, data) {
  const url = `${FIREBASE_URL}/${path}.json`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error(`Firebase PUT failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

// ===================== ROUTES =====================
const router = {
  'POST /sync/docente': async (body) => {
    const validationError = validateDocente(body);
    if (validationError) return { success: false, error: validationError };
    const { key, ...data } = body;
    upsert('docentes', key, mapDocente(key, data));
    return { success: true, message: `Docente ${key} sincronizado` };
  },
  'POST /sync/curso': async (body) => {
    const validationError = validateCurso(body);
    if (validationError) return { success: false, error: validationError };
    const { key, ...data } = body;
    upsert('cursos', key, mapCurso(key, data));
    return { success: true, message: `Curso ${key} sincronizado` };
  },
  'POST /sync/admin': async (body) => {
    const validationError = validateAdmin(body);
    if (validationError) return { success: false, error: validationError };
    const { key, ...data } = body;
    upsert('administradores', key, mapAdmin(key, data));
    return { success: true, message: `Admin ${key} sincronizado` };
  }
};

// ===================== HEALTH CHECK =====================
function getHealthStatus() {
  const uptime = getUptime();
  const memory = process.memoryUsage();
  return {
    status: 'healthy',
    uptime,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    resources: {
      memory: {
        rss: `${Math.round(memory.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`
      },
      cpu: process.cpuUsage ? `${process.cpuUsage().user}us` : 'N/A'
    },
    metrics: {
      totalRequests: metrics.requests.total,
      totalErrors: metrics.errors.total,
      sqlQueries: metrics.sqlQueries.total,
      sqlFailures: metrics.sqlQueries.failed,
      lastRequest: metrics.lastRequestTime ? new Date(metrics.lastRequestTime).toISOString() : null
    }
  };
}

// ===================== SERVER =====================
function createRequestHandler() {
  return async (req, res) => {
    const startTime = Date.now();
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const route = `${req.method} ${url.pathname}`;

    // Set security headers
    setCorsHeaders(res, req);

    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Health check endpoint (no auth required)
    if (route === 'GET /health' || route === 'GET /api/health') {
      const health = getHealthStatus();
      recordRequest('/health', 200);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(health));
      return;
    }

    // Metrics endpoint (requires auth)
    if (route === 'GET /metrics' || route === 'GET /api/metrics') {
      if (!authenticate(req)) {
        recordRequest('/metrics', 401);
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No autorizado' }));
        return;
      }
      recordRequest('/metrics', 200);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        uptime: getUptime(),
        requests: metrics.requests,
        errors: metrics.errors,
        sql: metrics.sqlQueries
      }));
      return;
    }

    // Authenticate all other routes
    if (!authenticate(req)) {
      recordRequest(route, 401);
      logWarn('Unauthorized access attempt', { ip: req.socket.remoteAddress, route });
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No autorizado. Proporciona X-API-Secret valido.' }));
      return;
    }

    // Route handler
    const handler = router[route];
    if (!handler) {
      recordRequest(route, 404);
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
      return;
    }

    try {
      let body = {};
      if (req.method === 'POST') {
        body = await new Promise((resolve, reject) => {
          let raw = '';
          req.on('data', c => raw += c);
          req.on('end', () => {
            try {
              const parsed = JSON.parse(raw);
              // Limit body size to 1MB
              if (raw.length > 1024 * 1024) {
                reject(new Error('Request body too large (max 1MB)'));
              } else {
                resolve(parsed);
              }
            } catch (e) {
              resolve({});
            }
          });
          req.on('error', reject);
        });
      }

      const result = await handler(body);
      const duration = Date.now() - startTime;
      recordRequest(route, 200);
      logInfo(`${route} completed`, { duration, status: 200 });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (e) {
      const duration = Date.now() - startTime;
      recordRequest(route, 500);
      recordError(e.name || 'UnknownError');
      logError(`${route} failed`, { error: e.message, duration });

      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Error interno del servidor' }));
    }
  };
}

// ===================== START SERVER =====================
function startHttp() {
  const server = http.createServer(requestHandler);
  server.listen(PORT, () => {
    logInfo('Sync Server started', { port: PORT, protocol: 'http' });
    logInfo('Endpoints available', {
      'POST /sync/docente': 'Sincronizar docente',
      'POST /sync/curso': 'Sincronizar curso',
      'POST /sync/admin': 'Sincronizar admin',
      'GET /health': 'Health check (no auth)',
      'GET /metrics': 'Metrics (auth required)'
    });
    if (API_SECRET) {
      logInfo('Authentication: ENABLED (X-API-Secret required)');
    } else {
      logWarn('Authentication: DISABLED (set SYNC_API_SECRET to enable)');
    }
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logInfo('SIGTERM received, shutting down gracefully');
    server.close(() => {
      logInfo('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logInfo('SIGINT received, shutting down gracefully');
    server.close(() => {
      logInfo('Server closed');
      process.exit(0);
    });
  });
}

const requestHandler = createRequestHandler();

if (ENABLE_HTTPS) {
  try {
    const keyPath = path.resolve(HTTPS_KEY_PATH);
    const certPath = path.resolve(HTTPS_CERT_PATH);

    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
      logWarn('HTTPS enabled but certificates not found, falling back to HTTP', {
        keyPath,
        certPath,
        hint: 'Run: openssl req -x509 -newkey rsa:4096 -keyout certs/server.key -out certs/server.crt -days 365 -nodes'
      });
      startHttp();
    } else {
      const options = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
        minVersion: 'TLSv1.2',
        honorCipherOrder: true,
        ciphers: 'ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256'
      };

      const server = https.createServer(options, requestHandler);
      server.listen(PORT, () => {
        logInfo('Sync Server started with HTTPS', { port: PORT, protocol: 'https' });
        logInfo('Endpoints available', {
          'POST /sync/docente': 'Sincronizar docente',
          'POST /sync/curso': 'Sincronizar curso',
          'POST /sync/admin': 'Sincronizar admin',
          'GET /health': 'Health check',
          'GET /metrics': 'Metrics (auth required)'
        });
      });

      // Graceful shutdown
      process.on('SIGTERM', () => {
        logInfo('SIGTERM received, shutting down gracefully');
        server.close(() => {
          logInfo('Server closed');
          process.exit(0);
        });
      });

      process.on('SIGINT', () => {
        logInfo('SIGINT received, shutting down gracefully');
        server.close(() => {
          logInfo('Server closed');
          process.exit(0);
        });
      });
    }
  } catch (e) {
    logError('Failed to start HTTPS server, falling back to HTTP', { error: e.message });
    startHttp();
  }
} else {
  startHttp();
}
