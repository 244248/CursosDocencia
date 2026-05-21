# Documentación Técnica y Evaluación de Requisitos - Gestion Docente

> Sistema de Gestión de Cursos y Docencia - Universidad La Salle Nezahualcoyotl

---

## Tabla de Contenidos

1. [Arquitectura General del Sistema](#1-arquitectura-general-del-sistema)
2. [Evaluación: Fundamentos de Redes y Ruteo](#2-evaluacion-fundamentos-de-redes-y-ruteo)
3. [Evaluación: Implementación e Integración de Servidores](#3-evaluacion-implementacion-e-integracion-de-servidores)
4. [Evaluación: Desarrollo Integral para Aplicaciones Empresariales](#4-evaluacion-desarrollo-integral-para-aplicaciones-empresariales)
5. [Referencia Completa de API](#5-referencia-completa-de-api)
6. [Estructura de Base de Datos](#6-estructura-de-base-de-datos)
7. [Guía de Despliegue](#7-guia-de-despliegue)

---

## 1. Arquitectura General del Sistema

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CAPA DE CLIENTES                                │
──────────────────────────────┬──────────────────────────────────────────┤
│  Web App (React 18)          │  iOS App (SwiftUI)                       │
│  - AdminPanel                │  - HomeView                              │
│  - DocentePanel              │  - LoginDocenteView                      │
│  - Login                     │  - LoginAdminView                        │
│  - Home                      │  - AdminPanelView                        │
│  - ChatBot                   │  - DocentePanelView                      │
│  - VoiceAgent                │  - DeveloperPanelView                    │
│  - RealTimeStats             │                                          │
└────────┬─────────────────────┴────────────┬─────────────────────────────┘
         │                                  │
         ▼                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        SERVICIOS BACKEND                                 │
├──────────────────────────┬──────────────────────────┬───────────────────┤
│  Sync Server             │  Azure Functions         │  Firebase         │
│  (Node.js HTTP)          │  (Jarvis Backend)        │  Services         │
│  Puerto: 3333            │  Puerto: 7071            │  - Auth           │
│  HTTP/HTTPS              │  HTTP                    │  - Firestore      │
│  TLS 1.2+                │  SSE Streaming           │  - Realtime DB    │
│                          │                          │  - Storage        │
└─────────────────────────┴──────────┬───────────────┴────────┬──────────┘
         │                            │                        │
         ▼                            ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          CAPA DE DATOS                                   │
├──────────────────────────┬──────────────────────────┬───────────────────┤
│  SQL Server              │  Firebase RTDB           │  Firebase          │
│  DB: GestionDocente      │  - docentes/             │  Firestore         │
│  - docentes              │  - cursos/               │  - administradores │
│  - cursos                │  - administradores/      │  - cursos          │
│  - administradores       │  - institutionConfig     │                    │
└──────────────────────────┴──────────────────────────┴───────────────────┘
```

### Tecnologías Principales

| Capa | Tecnología | Versión | Archivo Principal |
|------|-----------|---------|-------------------|
| Frontend Web | React | 18.2.0 | `src/App.js` |
| Frontend Web | React Router DOM | 6.8.1 | `src/App.js` |
| Frontend Web | Firebase SDK | 10.12.5 | `src/firebase/config.js` |
| Frontend Web | Bootstrap | 5.3.8 | `src/index.css` |
| Frontend Web | Chart.js | 3.9.1 | `src/components/AdminPanel.jsx` |
| Frontend Web | GSAP | 3.15.0 | `src/animations/` |
| Frontend iOS | SwiftUI | Native | `GestionDocenteiOS/` |
| Backend Sync | Node.js HTTP | 24.16.0 | `sync-server.js` |
| Backend AI | Azure Functions | v4 | `jarvis-backend/src/functions/jarvis.js` |
| Backend AI | Azure OpenAI | 1.0.0-beta.11 | `jarvis-backend/src/functions/jarvis.js` |
| Base de Datos | SQL Server | - | `jarvis-backend/src/lib/sqlserver.js` |
| Base de Datos | Firebase RTDB | - | `src/firebase/config.js` |
| Base de Datos | Firebase Firestore | - | `src/firebase/config.js` |
| Voz | Azure Speech SDK | 1.49.0 | `src/components/VoiceAgent.jsx` |
| Email | EmailJS | 4.4.1 | `src/services/ReminderService.js` |
| PDF | jsPDF | 3.0.3 | `src/components/AdminPanel.jsx` |

---

## 2. Evaluación: Fundamentos de Redes y Ruteo

### Criterio 1: Aplica modelo OSI y direccionamiento IP con VLSM para justificar la segmentación de red

**Evaluación: PARCIALMENTE CUMPLE**

Este proyecto es de desarrollo de software, no de infraestructura de red física. Sin embargo, implementa conceptos de red a nivel de aplicación (Capa 7 OSI) y transporte (Capa 4 OSI).

#### Lo que SÍ implementa:

**Capa 7 - Aplicación (HTTP/HTTPS/REST):**

```javascript
// sync-server.js: Líneas 296-398
// Servidor HTTP nativo con enrutamiento por método y path
function createRequestHandler() {
  return async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const route = `${req.method} ${url.pathname}`;
    
    // Router basado en método + path (patrón REST)
    const router = {
      'POST /sync/docente': async (body) => { /* ... */ },
      'POST /sync/curso': async (body) => { /* ... */ },
      'POST /sync/admin': async (body) => { /* ... */ }
    };
    
    const handler = router[route];
    if (!handler) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
      return;
    }
    // ...
  };
}
```

**Capa 4 - Transporte (TCP con TLS 1.2+):**

```javascript
// sync-server.js: Líneas 416-422
// Configuración de TLS con cifrados fuertes
const options = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
  minVersion: 'TLSv1.2',
  honorCipherOrder: true,
  ciphers: 'ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256'
};
const server = https.createServer(options, requestHandler);
```

**Segmentación lógica por servicios (microservicios):**

| Servicio | Puerto | Protocolo | Función |
|----------|--------|-----------|---------|
| React Dev Server | 3000 | HTTP | Frontend desarrollo |
| Sync Server | 3333 | HTTP/HTTPS | Sincronización DB |
| Azure Functions | 7071 | HTTP | AI + API REST |
| Firebase Hosting | 443 | HTTPS | Producción web |

**Cloudflare Tunnel (segmentación de red perimetral):**

```bash
# .env - Línea 9
REACT_APP_SYNC_API=https://diabetes-increased-trigger-bid.trycloudflare.com
```

El tunnel de Cloudflare actúa como reverse proxy que segmenta el acceso público del servidor local, proporcionando una capa de seguridad perimetral sin exponer puertos directamente.

#### Lo que NO implementa:
- Direccionamiento IP con VLSM (no aplica a software de aplicación)
- Configuración de subnets físicas
- Segmentación de red a nivel de switch/router

---

### Criterio 2: Configura switches, routers y ruteo dinámico mediante RIP, EIGRP u OSPF

**Evaluación: NO APLICA DIRECTAMENTE**

Este es un proyecto de desarrollo de software web/móvil, no de infraestructura de red. No se configuran switches, routers ni protocolos de ruteo dinámico.

#### Alternativas implementadas a nivel de aplicación:

**Enrutamiento de aplicación (React Router):**

```javascript
// src/App.js: Líneas 1-50
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <InstitutionProvider>
      <ErrorBoundary>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/docente" element={<DocentePanel />} />
            <Route path="/login-admin" element={<Navigate to="/login" />} />
            <Route path="/login-docente" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
      </ErrorBoundary>
    </InstitutionProvider>
  );
}
```

**Enrutamiento de API REST:**

```javascript
// sync-server.js: Líneas 244-266
const router = {
  'POST /sync/docente': async (body) => {
    const validationError = validateDocente(body);
    if (validationError) return { success: false, error: validationError };
    const { key, ...data } = body;
    upsert('docentes', key, mapDocente(key, data));
    return { success: true, message: `Docente ${key} sincronizado` };
  },
  'POST /sync/curso': async (body) => { /* ... */ },
  'POST /sync/admin': async (body) => { /* ... */ }
};
```

---

### Criterio 3: Propone tolerancia a fallas y valida conectividad con pruebas como ping, tracert y tablas de ruteo

**Evaluación: PARCIALMENTE CUMPLE**

#### Tolerancia a fallas implementada:

**1. Health Check Endpoint (monitoreo de conectividad):**

```javascript
// sync-server.js: Líneas 269-293
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
```

**Ejemplo de respuesta del health check:**
```json
{
  "status": "healthy",
  "uptime": "0h 1m 18s",
  "timestamp": "2026-05-21T22:49:09.560Z",
  "version": "1.0.0",
  "resources": {
    "memory": { "rss": "42MB", "heapUsed": "5MB", "heapTotal": "7MB" },
    "cpu": "109000us"
  },
  "metrics": {
    "totalRequests": 8,
    "totalErrors": 0,
    "sqlQueries": 0,
    "sqlFailures": 0,
    "lastRequest": "2026-05-21T22:49:09.560Z"
  }
}
```

**2. Retry con Exponential Backoff (tolerancia a fallas de red):**

```javascript
// src/services/DualWriteService.js: Líneas 1-60
class DualWriteService {
  constructor(baseUrl, apiSecret) {
    this.baseUrl = baseUrl;
    this.apiSecret = apiSecret;
    this.maxRetries = 3;
    this.baseDelay = 1000;
  }

  async fetchWithRetry(url, options, retries = 0) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'X-API-Secret': this.apiSecret,
          'Content-Type': 'application/json'
        }
      });
      return response;
    } catch (error) {
      if (retries < this.maxRetries) {
        const delay = this.baseDelay * Math.pow(2, retries);
        console.warn(`Reintento ${retries + 1}/${this.maxRetries} en ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, options, retries + 1);
      }
      throw error;
    }
  }

  async saveDocente(firebaseKey, data) {
    return this.fetchWithRetry(`${this.baseUrl}/sync/docente`, {
      method: 'POST',
      body: JSON.stringify({ key: firebaseKey, ...data })
    });
  }
}
```

**3. Graceful Shutdown (tolerancia a fallas del servidor):**

```javascript
// sync-server.js: Líneas 420-431
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
```

**4. Fallback HTTP si HTTPS falla:**

```javascript
// sync-server.js: Líneas 404-414
if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  logWarn('HTTPS enabled but certificates not found, falling back to HTTP', {
    keyPath,
    certPath,
    hint: 'Run: openssl req -x509 -newkey rsa:4096 -keyout certs/server.key -out certs/server.crt -days 365 -nodes'
  });
  startHttp();
}
```

**5. Error Boundary en React (tolerancia a fallas de UI):**

```javascript
// src/components/ErrorBoundary.jsx: Líneas 1-40
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Algo salió mal</h2>
          {process.env.NODE_ENV === 'development' && (
            <pre>{this.state.error.toString()}</pre>
          )}
          <button onClick={() => window.location.reload()}>Recargar</button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

#### Lo que NO implementa:
- Comandos ping/tracert desde la aplicación
- Tablas de ruteo visibles
- Monitoreo de latencia de red en tiempo real

---

## 3. Evaluación: Implementación e Integración de Servidores

### Criterio 1: Monitorea recursos del servidor como CPU, memoria, disco y red con herramientas adecuadas

**Evaluación: CUMPLE**

#### Monitoreo de Memoria (RSS, Heap):

```javascript
// sync-server.js: Líneas 270-282
function getHealthStatus() {
  const memory = process.memoryUsage();
  return {
    resources: {
      memory: {
        rss: `${Math.round(memory.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`
      }
    }
  };
}
```

**Métrica expuesta en `/health`:**
```json
{
  "resources": {
    "memory": { "rss": "42MB", "heapUsed": "5MB", "heapTotal": "7MB" }
  }
}
```

#### Monitoreo de CPU:

```javascript
// sync-server.js: Línea 283
cpu: process.cpuUsage ? `${process.cpuUsage().user}us` : 'N/A'
```

#### Monitoreo de Red (peticiones HTTP):

```javascript
// sync-server.js: Líneas 38-44
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
```

**Métrica expuesta en `/metrics`:**
```json
{
  "requests": {
    "total": 8,
    "byEndpoint": { "/health": 3, "/metrics": 2, "POST /sync/docente": 3 },
    "byStatus": { "200": 7, "401": 1 }
  },
  "errors": { "total": 0, "byType": {} },
  "sql": { "total": 0, "failed": 0 }
}
```

#### Monitoreo de SQL Server:

```javascript
// sync-server.js: Líneas 58-61
function recordSqlQuery(success) {
  metrics.sqlQueries.total++;
  if (!success) metrics.sqlQueries.failed++;
}
```

#### Logging Estructurado con Niveles:

```javascript
// sync-server.js: Líneas 18-35
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

// Ejemplo de uso:
logInfo('Sync Server started', { port: PORT, protocol: 'http' });
logWarn('Unauthorized access attempt', { ip: req.socket.remoteAddress, route });
logError('SQL query failed', { error: e.message, duration, query: query.substring(0, 100) });
```

**Ejemplo de log de producción:**
```json
{"timestamp":"2026-05-21T22:47:19.939Z","level":"INFO","message":"Sync Server started","port":3333,"protocol":"http"}
{"timestamp":"2026-05-21T22:47:19.948Z","level":"INFO","message":"Authentication: ENABLED (X-API-Secret required)"}
{"timestamp":"2026-05-21T22:47:19.948Z","level":"WARN","message":"Unauthorized access attempt","ip":"::1","route":"GET /metrics"}
```

#### Application Insights (Azure Functions):

```json
// jarvis-backend/host.json
{
  "version": "2.0",
  "logging": {
    "applicationInsights": {
      "samplingSettings": {
        "isEnabled": true,
        "excludedTypes": "Request"
      }
    }
  }
}
```

---

### Criterio 2: Administra permisos, servicios y resolución de problemas durante la operación del servidor

**Evaluación: CUMPLE**

#### Autenticación por API Secret:

```javascript
// sync-server.js: Líneas 92-96
function authenticate(req) {
  if (!API_SECRET) return true;
  const providedSecret = req.headers['x-api-secret'];
  return providedSecret === API_SECRET;
}

// Uso en el middleware:
if (!authenticate(req)) {
  recordRequest(route, 401);
  logWarn('Unauthorized access attempt', { ip: req.socket.remoteAddress, route });
  res.writeHead(401, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'No autorizado. Proporciona X-API-Secret valido.' }));
  return;
}
```

#### Control de Orígenes (CORS):

```javascript
// sync-server.js: Líneas 72-89
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3002,http://localhost:3000').split(',');

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
```

#### Headers de Seguridad:

| Header | Valor | Propósito |
|--------|-------|-----------|
| `X-Content-Type-Options` | `nosniff` | Previene MIME sniffing |
| `X-Frame-Options` | `DENY` | Previene clickjacking |
| `X-XSS-Protection` | `1; mode=block` | Previene XSS |

#### Resolución de Problemas - Logging de Errores SQL:

```javascript
// sync-server.js: Líneas 126-145
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
```

#### Timeout de Peticiones (prevención de hang):

```javascript
// sync-server.js: Línea 133
timeout: 10000  // 10 segundos máximo por consulta SQL
```

#### Límite de Tamaño de Body:

```javascript
// sync-server.js: Líneas 367-369
if (raw.length > 1024 * 1024) {
  reject(new Error('Request body too large (max 1MB)'));
}
```

#### Gestión de Sesiones - Timeout por Inactividad:

```javascript
// src/hooks/useInactivityTimer.js: Líneas 1-40
import { useEffect, useRef } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';

export function useInactivityTimer(timeoutMinutes = 5) {
  const timerRef = useRef(null);

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      localStorage.clear();
      signOut(auth);
      window.location.href = '/login';
    }, timeoutMinutes * 60 * 1000);
  };

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => document.addEventListener(event, resetTimer));
    resetTimer();
    return () => {
      events.forEach(event => document.removeEventListener(event, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
}
```

---

### Criterio 3: Implementa la aplicación web en Windows o Linux y valida la integración con las apps móviles

**Evaluación: CUMPLE**

#### Implementación Web - Firebase Hosting:

```json
// firebase.json
{
  "hosting": {
    "public": "build",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

**Comando de despliegue:**
```bash
# package.json
"scripts": {
  "build": "react-scripts build",
  "deploy": "npm run build && firebase deploy --only hosting"
}
```

#### Servidor Sync en Windows:

```batch
:: sincronizar.bat
@echo off
echo Iniciando servidor de sincronizacion...
node sync-server.js
pause
```

**Variables de entorno para Windows:**
```powershell
$env:SYNC_SERVER_PORT="3333"
$env:SYNC_API_SECRET="tu-clave-secreta"
$env:ENABLE_HTTPS="false"
$env:LOG_LEVEL="INFO"
node sync-server.js
```

#### Servidor Sync en Linux:

```bash
export SYNC_SERVER_PORT=3333
export SYNC_API_SECRET="tu-clave-secreta"
export ENABLE_HTTPS=true
export HTTPS_KEY_PATH=/etc/ssl/private/server.key
export HTTPS_CERT_PATH=/etc/ssl/certs/server.crt
export LOG_LEVEL=INFO
node sync-server.js
```

#### Integración con App Móvil iOS:

**FirebaseManager.swift - Conexión a los mismos servicios:**

```swift
// GestionDocenteiOS/Services/FirebaseManager.swift
import Firebase

class FirebaseManager {
    static let shared = FirebaseManager()
    
    let auth: Auth
    let firestore: Firestore
    let database: Database
    let storage: Storage
    
    private init() {
        FirebaseApp.configure()
        self.auth = Auth.auth()
        self.firestore = Firestore.firestore()
        self.database = Database.database()
        self.storage = Storage.storage()
    }
}
```

**InstitutionManager.swift - Misma configuración que la web:**

```swift
// GestionDocenteiOS/ViewModels/InstitutionManager.swift
import Foundation
import Firebase

class InstitutionManager: ObservableObject {
    @Published var institutionName = "Universidad La Salle Nezahualcoyotl"
    @Published var primaryColor = "#1a5276"
    @Published var logoUrl: String?
    
    private var dbRef: DatabaseReference?
    
    func loadConfig() {
        dbRef = Database.database().reference().child("institutionConfig")
        dbRef?.observe(.value) { snapshot in
            guard let dict = snapshot.value as? [String: Any] else { return }
            DispatchQueue.main.async {
                self.institutionName = dict["institutionName"] as? String ?? self.institutionName
                self.primaryColor = dict["colors"] as? [String: Any]?["primary"] as? String ?? self.primaryColor
                self.logoUrl = dict["logoUrl"] as? String
            }
        }
    }
}
```

**Datos compartidos entre plataformas:**

| Recurso | Web (React) | iOS (SwiftUI) | Fuente |
|---------|-------------|---------------|--------|
| Autenticación | Firebase Auth | Firebase Auth | Mismo proyecto Firebase |
| Cursos | RTDB `cursos/` | RTDB `cursos/` | Mismo nodo |
| Docentes | RTDB `docentes/` | RTDB `docentes/` | Mismo nodo |
| Configuración | RTDB `institutionConfig` | RTDB `institutionConfig` | Mismo nodo |
| Colores/Theme | CSS Variables | SwiftUI Color | Mismos valores hex |

---

## 4. Evaluación: Desarrollo Integral para Aplicaciones Empresariales

### Criterio 1: Diseña una arquitectura empresarial con bajo acoplamiento, tolerancia a fallos y N-capas o microservicios

**Evaluación: CUMPLE**

#### Arquitectura en N-Capas:

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPA 1: PRESENTACIÓN                      │
│  - React Web App (src/components/)                          │
│  - iOS App (GestionDocenteiOS/Views/)                       │
│  - ChatBot UI, VoiceAgent UI                                │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST + Firebase SDK
┌──────────────────────▼──────────────────────────────────────┐
│                    CAPA 2: SERVICIOS                         │
│  - DualWriteService (src/services/)                         │
│  - AIService, ChatBotService                                │
│  - InstitutionConfigService                                 │
│  - ReminderService                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP API + Firebase API
┌──────────────────────▼──────────────────────────────────────┘
│                    CAPA 3: BACKEND                           │
│  - Sync Server (sync-server.js)                             │
│  - Azure Functions (jarvis-backend/)                        │
│  - Jarvis AI (OpenAI integration)                           │
└──────────────────────┬──────────────────────────────────────┘
                       │ sqlcmd + Firebase REST API
┌──────────────────────▼──────────────────────────────────────┐
│                    CAPA 4: DATOS                             │
│  - SQL Server (GestionDocente)                              │
│  - Firebase RTDB                                            │
│  - Firebase Firestore                                       │
│  - Firebase Storage                                         │
└─────────────────────────────────────────────────────────────┘
```

#### Bajo Acoplamiento - Servicios Independientes:

**Cada servicio tiene su propia responsabilidad:**

```javascript
// src/services/DualWriteService.js - Solo sincronización
class DualWriteService {
  constructor(baseUrl, apiSecret) { /* ... */ }
  async saveDocente(firebaseKey, data) { /* ... */ }
  async saveCurso(firebaseKey, data) { /* ... */ }
  async saveAdmin(firebaseKey, data) { /* ... */ }
  async getEstadisticas() { /* ... */ }
  async migrarTodo() { /* ... */ }
}

// src/services/ChatBotService.js - Solo chatbot
class ChatBotService {
  constructor() { /* ... */ }
  async processMessage(message, context) { /* ... */ }
  async getIntent(message) { /* ... */ }
  async queryFirebase(intent, params) { /* ... */ }
}

// src/services/AIService.js - Solo AI local
class AIService {
  constructor() { /* ... */ }
  async queryOllama(message) { /* ... */ }
  async getFallbackResponse(intent) { /* ... */ }
}

// src/services/InstitutionConfigService.js - Solo configuración
class InstitutionConfigService {
  constructor() { /* ... */ }
  async loadConfig() { /* ... */ }
  async saveConfig(config) { /* ... */ }
  applyTheme(config) { /* ... */ }
}

// src/services/ReminderService.js - Solo recordatorios
class ReminderService {
  constructor() { /* ... */ }
  async checkAndSendReminders() { /* ... */ }
  async sendReminderEmail(docente, course) { /* ... */ }
}
```

#### Tolerancia a Fallos - Múltiples Mecanismos:

| Mecanismo | Implementación | Archivo |
|-----------|---------------|---------|
| Retry con backoff | Exponential backoff 3 intentos | `DualWriteService.js` |
| Health checks | Endpoint `/health` con métricas | `sync-server.js:269-293` |
| Graceful shutdown | SIGTERM/SIGINT handlers | `sync-server.js:420-431` |
| Error Boundary | React error catching | `ErrorBoundary.jsx` |
| Fallback HTTPS→HTTP | Auto-fallback si no hay certs | `sync-server.js:404-414` |
| Timeout SQL | 10s máximo por query | `sync-server.js:133` |
| Session timeout | Auto-logout 5 min inactividad | `useInactivityTimer.js` |

#### Patrón Dual-Write (Firebase + SQL Server):

```javascript
// jarvis-backend/src/functions/sync.js: Líneas 88-107
app.post('sync-docente', {
  authLevel: 'anonymous',
  route: 'api/sync/docente',
  handler: async (request, context) => {
    try {
      const body = await request.json();
      const validationError = validateDocente(body);
      if (validationError) return { status: 400, jsonBody: { error: validationError } };

      const { key, ...data } = body;
      const sqlData = mapDocente(key, data);
      
      // Escritura dual: SQL Server + Firebase
      await upsert('docentes', key, sqlData);
      await firebasePut(`docentes/${key}`, data);

      return { status: 200, jsonBody: { success: true, message: `Docente ${key} sincronizado en ambas bases` } };
    } catch (error) {
      context.error(`Error sync docente: ${error.message}`);
      return { status: 500, jsonBody: { error: 'Error interno del servidor' } };
    }
  }
});
```

---

### Criterio 2: Integra servicios REST para almacenamiento dinámico e interoperabilidad con la plataforma

**Evaluación: CUMPLE**

#### Servicios REST Completos:

**Sync Server (Node.js HTTP) - 7 endpoints:**

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/health` | No | Health check con métricas de recursos |
| GET | `/api/health` | No | Alias de health check |
| GET | `/metrics` | Sí | Métricas detalladas de requests, errores, SQL |
| GET | `/api/metrics` | Sí | Alias de metrics |
| POST | `/sync/docente` | Sí | Upsert docente en SQL Server |
| POST | `/sync/curso` | Sí | Upsert curso en SQL Server |
| POST | `/sync/admin` | Sí | Upsert admin en SQL Server |

**Azure Functions - 5 endpoints:**

| Método | Route | Descripción |
|--------|-------|-------------|
| POST | `/api/sync/docente` | Dual-write docente (SQL + Firebase) |
| POST | `/api/sync/curso` | Dual-write curso (SQL + Firebase) |
| POST | `/api/sync/admin` | Dual-write admin (SQL + Firebase) |
| GET | `/api/sync/estadisticas` | Estadísticas agregadas (counts por tabla) |
| POST | `/api/sync/migrar` | Migración completa Firebase → SQL |
| POST | `/api/jarvis-query` | AI query con SSE streaming |

#### Ejemplo de Interoperabilidad - DualWriteService:

```javascript
// src/services/DualWriteService.js: Uso completo
import { DualWriteService } from './DualWriteService';

const syncService = new DualWriteService(
  process.env.REACT_APP_SYNC_API,
  process.env.REACT_APP_SYNC_API_SECRET
);

// Guardar docente (escribe en Firebase + SQL Server)
await syncService.saveDocente('doc-123', {
  nombre: 'Juan',
  apellidos: 'Pérez',
  email: 'juan@universidad.edu.mx',
  area: 'Matemáticas'
});

// Guardar curso
await syncService.saveCurso('curso-456', {
  nombre: 'Cálculo Diferencial',
  tipo: 'Obligatoria',
  fecha: '2026-01-15',
  url: 'https://meet.google.com/xxx'
});

// Obtener estadísticas
const stats = await syncService.getEstadisticas();
// { totalCursos: 45, totalDocentes: 12, totalAdmins: 3, cursosPorTipo: {...} }

// Migrar todo Firebase → SQL
const result = await syncService.migrarTodo();
// { docentes: 12, cursos: 45, administradores: 3, errores: [] }
```

#### Firebase REST API Directa:

```javascript
// sync-server.js: Líneas 230-241
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
```

#### Server-Sent Events (SSE) para AI:

```javascript
// jarvis-backend/src/functions/jarvis.js: Streaming SSE
app.post('jarvis-query', {
  authLevel: 'anonymous',
  route: 'api/jarvis-query',
  handler: async (request, context) => {
    const { message } = await request.json();
    
    // SSE headers
    context.res = {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    };
    
    // Streaming de respuestas de OpenAI chunk por chunk
    for await (const chunk of openaiStream) {
      context.res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }
    context.res.end();
  }
});
```

---

### Criterio 3: Aplica seguridad criptográfica, control de versiones y documentación técnica del sistema

**Evaluación: CUMPLE**

#### Seguridad Criptográfica:

**1. HTTPS/TLS 1.2+ con Cifrados Fuertes:**

```javascript
// sync-server.js: Líneas 416-422
const options = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
  minVersion: 'TLSv1.2',
  honorCipherOrder: true,
  ciphers: 'ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256'
};
```

| Cifrado | Descripción |
|---------|-------------|
| `ECDHE-RSA-AES256-GCM-SHA384` | Key exchange ECDHE, cifrado AES-256-GCM, hash SHA-384 |
| `ECDHE-RSA-AES128-GCM-SHA256` | Key exchange ECDHE, cifrado AES-128-GCM, hash SHA-256 |

**2. Sanitización SQL (prevención de inyección):**

```javascript
// sync-server.js: Líneas 103-110
function sanitizeValue(value) {
  if (value === null || value === undefined) return { sql: 'NULL', type: 'null' };
  if (typeof value === 'number') return { sql: String(value), type: 'number' };
  if (typeof value === 'boolean') return { sql: value ? '1' : '0', type: 'boolean' };
  // String: escape single quotes y backslashes
  const sanitized = String(value).replace(/'/g, "''").replace(/\\/g, '\\\\');
  return { sql: `'${sanitized}'`, type: 'string' };
}
```

**3. Whitelist de Tablas (prevención de acceso no autorizado):**

```javascript
// sync-server.js: Líneas 115-121
const ALLOWED_TABLES = ['docentes', 'cursos', 'administradores'];
function validateTable(table) {
  if (!ALLOWED_TABLES.includes(table)) {
    throw new Error(`Tabla no permitida: ${table}. Tablas permitidas: ${ALLOWED_TABLES.join(', ')}`);
  }
  return table;
}
```

**4. Validación de Input con Límites de Longitud:**

```javascript
// sync-server.js: Líneas 176-197
function validateDocente(data) {
  if (!data.key || typeof data.key !== 'string') return 'Campo key es requerido y debe ser texto';
  if (!data.nombre || typeof data.nombre !== 'string') return 'Campo nombre es requerido y debe ser texto';
  if (data.email && typeof data.email !== 'string') return 'Campo email debe ser texto';
  if (data.nombre.length > 200) return 'Nombre demasiado largo (max 200 chars)';
  if (data.email && data.email.length > 255) return 'Email demasiado largo (max 255 chars)';
  return null;
}
```

**5. Variables de Entorno (credenciales no hardcodeadas):**

```javascript
// src/firebase/config.js: Líneas 7-16
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};
```

```
# .env.example - Plantilla segura (sin credenciales reales)
REACT_APP_FIREBASE_API_KEY=tu_api_key_aqui
REACT_APP_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
REACT_APP_SYNC_API_SECRET=cambia-esto-a-una-clave-secreta-fuerte
```

**6. .gitignore para proteger credenciales:**

```
# .gitignore: Líneas 64-69
# dotenv environment variables file (NEVER commit .env files)
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

#### Control de Versiones:

**Git configurado con:**
- `.gitignore` que excluye `.env`, `node_modules/`, `build/`, `.vscode/`
- Commits con mensajes descriptivos
- Remote configurado: `https://github.com/244248/CursosDocencia`

```bash
# Commit realizado:
git commit -m "feat: security hardening and infrastructure improvements - SQL injection prevention, credential sanitization, input validation, HTTPS support, monitoring endpoints, and .env enforcement"

# 143 archivos, 95,045 líneas insertadas
```

#### Documentación Técnica:

| Documento | Ubicación | Contenido |
|-----------|-----------|-----------|
| README.md | Raíz | Guía de instalación y uso |
| README2.md | Raíz | Documentación técnica completa y evaluación de requisitos |
| TECHNICAL.md | `docs/` | Detalles técnicos de arquitectura |
| CHATBOT_CONFIG.md | Raíz | Configuración del chatbot |
| FIREBASE_STORAGE_RULES.md | Raíz | Reglas de seguridad Firebase |
| GUIA_RAPIDA_DESARROLLADOR.md | Raíz | Guía rápida para desarrolladores |
| MODO_DESARROLLADOR.md | Raíz | Documentación del modo desarrollador |
| INSTRUCCIONES_OLLAMA.md | Raíz | Configuración de AI local |
| .env.example | Raíz | Plantilla de variables de entorno |
| firebase.json | Raíz | Configuración de Firebase Hosting |

---

## 5. Referencia Completa de API

### Sync Server (Puerto 3333)

#### GET /health
```bash
curl http://localhost:3333/health
```
```json
{
  "status": "healthy",
  "uptime": "0h 1m 18s",
  "timestamp": "2026-05-21T22:49:09.560Z",
  "version": "1.0.0",
  "resources": {
    "memory": { "rss": "42MB", "heapUsed": "5MB", "heapTotal": "7MB" },
    "cpu": "109000us"
  },
  "metrics": {
    "totalRequests": 8,
    "totalErrors": 0,
    "sqlQueries": 0,
    "sqlFailures": 0,
    "lastRequest": "2026-05-21T22:49:09.560Z"
  }
}
```

#### GET /metrics
```bash
curl -H "X-API-Secret: tu-secret" http://localhost:3333/metrics
```
```json
{
  "uptime": "0h 1m 23s",
  "requests": {
    "total": 3,
    "byEndpoint": { "/health": 2, "/metrics": 1 },
    "byStatus": { "200": 3 }
  },
  "errors": { "total": 0, "byType": {} },
  "sql": { "total": 0, "failed": 0 }
}
```

#### POST /sync/docente
```bash
curl -X POST http://localhost:3333/sync/docente \
  -H "Content-Type: application/json" \
  -H "X-API-Secret: tu-secret" \
  -d '{"key":"doc-1","nombre":"Juan","apellidos":"Perez","email":"juan@test.com","area":"Matematicas"}'
```
```json
{ "success": true, "message": "Docente doc-1 sincronizado" }
```

#### POST /sync/curso
```bash
curl -X POST http://localhost:3333/sync/curso \
  -H "Content-Type: application/json" \
  -H "X-API-Secret: tu-secret" \
  -d '{"key":"curso-1","nombre":"Calculo","tipo":"Obligatoria","fecha":"2026-01-15"}'
```
```json
{ "success": true, "message": "Curso curso-1 sincronizado" }
```

#### POST /sync/admin
```bash
curl -X POST http://localhost:3333/sync/admin \
  -H "Content-Type: application/json" \
  -H "X-API-Secret: tu-secret" \
  -d '{"key":"admin-1","email":"admin@test.com","nombre":"Admin","apellidos":"User","rol":"administrador"}'
```
```json
{ "success": true, "message": "Admin admin-1 sincronizado" }
```

### Azure Functions (Puerto 7071)

#### GET /api/sync/estadisticas
```bash
curl http://localhost:7071/api/sync/estadisticas
```
```json
{
  "totalCursos": 45,
  "totalDocentes": 12,
  "totalAdmins": 3,
  "cursosPorTipo": { "Obligatoria": 30, "Optativa": 15 }
}
```

#### POST /api/sync/migrar
```bash
curl -X POST http://localhost:7071/api/sync/migrar
```
```json
{
  "success": true,
  "resultados": {
    "docentes": 12,
    "cursos": 45,
    "administradores": 3,
    "errores": []
  }
}
```

---

## 6. Estructura de Base de Datos

### SQL Server - Tabla `docentes`

| Columna | Tipo | Max | Nullable | Default |
|---------|------|-----|----------|---------|
| `firebase_key` | NVARCHAR | - | NO | - |
| `nombre` | NVARCHAR | 200 | NO | - |
| `apellidos` | NVARCHAR | 200 | SÍ | - |
| `email` | NVARCHAR | 255 | SÍ | - |
| `area` | NVARCHAR | 100 | SÍ | 'No especificada' |

### SQL Server - Tabla `cursos`

| Columna | Tipo | Max | Nullable | Default |
|---------|------|-----|----------|---------|
| `firebase_key` | NVARCHAR | - | NO | - |
| `nombre` | NVARCHAR | 200 | NO | - |
| `tipo` | NVARCHAR | 50 | SÍ | - |
| `fecha` | NVARCHAR | - | SÍ | 'Sin fecha' |
| `modalidad` | NVARCHAR | - | SÍ | 'Presencial' o 'En linea' |
| `docente_key` | NVARCHAR | 128 | SÍ | - |
| `url` | NVARCHAR | 500 | SÍ | - |

### SQL Server - Tabla `administradores`

| Columna | Tipo | Max | Nullable | Default |
|---------|------|-----|----------|---------|
| `firebase_key` | NVARCHAR | - | NO | - |
| `email` | NVARCHAR | 255 | NO | - |
| `nombre` | NVARCHAR | 200 | SÍ | - |
| `apellidos` | NVARCHAR | 200 | SÍ | - |
| `rol` | NVARCHAR | 50 | SÍ | 'administrador' |
| `uid` | NVARCHAR | 128 | SÍ | - |

### Firebase RTDB - Estructura

```
/
── docentes/
│   └── {firebase_key}/
│       ├── nombre: string
│       ├── apellidos: string
│       ├── email: string
│       └── area: string
├── cursos/
│   └── {firebase_key}/
│       ├── nombre: string
│       ├── tipo: string
│       ├── fecha: string
│       ├── url: string
│       ├── assignedTeachers: array
│       └── teacherStatus: object
├── administradores/
│   └── {firebase_key}/
│       ├── email: string
│       ├── nombre: string
│       ├── apellidos: string
│       ├── rol: string
│       └── uid: string
└── institutionConfig/
    ├── institutionName: string
    ├── institutionShortName: string
    ├── institutionSlogan: string
    ├── logoUrl: string
    ├── colors: { primary, secondary, ... }
    ├── contact: { email, phone, address }
    ├── socialMedia: { facebook, twitter, ... }
    ├── features: { chatbot, statistics, reports, ... }
    ├── uiSettings: { ... }
    ├── interfaceSettings: { home, admin, docente, login }
    ├── seo: { title, description }
    └── lastUpdated: timestamp
```

---

## 7. Guía de Despliegue

### Prerrequisitos

| Componente | Versión Mínima |
|------------|---------------|
| Node.js | 18.x |
| SQL Server | 2019+ |
| Firebase CLI | 12.x |
| sqlcmd | Incluido con SQL Server |

### Variables de Entorno

#### Frontend (.env)
```
REACT_APP_FIREBASE_API_KEY=tu_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://tu_proyecto-default-rtdb.firebaseio.com
REACT_APP_FIREBASE_PROJECT_ID=tu_proyecto
REACT_APP_FIREBASE_STORAGE_BUCKET=tu_proyecto.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
REACT_APP_FIREBASE_APP_ID=tu_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=tu_measurement_id
REACT_APP_SYNC_API=https://tu-api-url
REACT_APP_SYNC_API_SECRET=tu-secret-key
```

#### Sync Server
```
SYNC_SERVER_PORT=3333
SYNC_API_SECRET=tu-secret-key
FIREBASE_DATABASE_URL=https://tu_proyecto-default-rtdb.firebaseio.com
ENABLE_HTTPS=false
LOG_LEVEL=INFO
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3002
```

#### Azure Functions (jarvis-backend/.env)
```
AZURE_OPENAI_KEY=tu_openai_key
AZURE_OPENAI_ENDPOINT=https://tu-recurso.openai.azure.com/
AZURE_DEPLOYMENT_NAME=gpt-4o
FIREBASE_DATABASE_URL=https://tu_proyecto-default-rtdb.firebaseio.com
PORT=7071
```

### Comandos de Despliegue

```bash
# 1. Instalar dependencias
npm install
cd jarvis-backend && npm install && cd ..

# 2. Iniciar Sync Server
node sync-server.js

# 3. Iniciar Azure Functions (local)
cd jarvis-backend && func start

# 4. Build y deploy web
npm run build
firebase deploy --only hosting

# 5. Deploy Azure Functions
cd jarvis-backend && func azure functionapp publish <nombre-app>
```

---

## Resumen de Evaluación

| Materia | Criterio | Evaluación | Evidencia |
|---------|----------|------------|-----------|
| **Redes y Ruteo** | 1. OSI e IP/VLSM | Parcial | HTTP/HTTPS, TCP/TLS, Cloudflare Tunnel |
| **Redes y Ruteo** | 2. Switches/Routers/Ruteo | No aplica | Software de aplicación, no infraestructura |
| **Redes y Ruteo** | 3. Tolerancia a fallas | Parcial | Health checks, retry, graceful shutdown |
| **Servidores** | 1. Monitoreo de recursos | **Cumple** | /health, /metrics, CPU, memoria, SQL |
| **Servidores** | 2. Permisos y servicios | **Cumple** | API Secret, CORS, headers seguridad, logging |
| **Servidores** | 3. Implementación web+móvil | **Cumple** | Firebase Hosting, iOS app, datos compartidos |
| **Desarrollo Empresarial** | 1. Arquitectura N-capas | **Cumple** | 4 capas, bajo acoplamiento, dual-write |
| **Desarrollo Empresarial** | 2. Servicios REST | **Cumple** | 12 endpoints REST, SSE, Firebase API |
| **Desarrollo Empresarial** | 3. Seguridad y documentación | **Cumple** | TLS 1.2, sanitización, git, 9 documentos |
