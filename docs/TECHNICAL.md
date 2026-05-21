# Documentación Técnica - Gestión Docente

## 1. Arquitectura del Sistema

### 1.1 Diagrama de Capas

```
┌─────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                  │
│  React 18 + React Router + Chart.js + jsPDF              │
│  Components: Home, Login, AdminPanel, DocentePanel       │
│  ErrorBoundary: Captura y maneja errores de renderizado  │
─────────────────────────────────────────────────────────┤
│                    CAPA DE SERVICIOS                     │
│  DualWriteService: Sync Firebase → SQL con retry logic   │
│  ReminderService: Envío de recordatorios por email       │
│  AIService: Integración con Ollama AI + fallback         │
│  ChatBotService: Chatbot con cache y fallback RTDB/FS    │
│  InstitutionConfigService: Theming dinámico              │
├─────────────────────────────────────────────────────────┤
│                    CAPA DE DATOS                         │
│  Firebase (Firestore + Realtime Database + Auth)         │
│  SQL Server (via sync-server.js / cloudflared tunnel)    │
│  localStorage (cache, recordatorios enviados)            │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Flujo de Datos

```
Usuario → React Component → Service Layer → Firebase (primario)
                                      ↘ SQL Server (secundario, via REST)
```

### 1.3 Tolerancia a Fallos

| Mecanismo | Implementación | Ubicación |
|-----------|---------------|-----------|
| ErrorBoundary | Captura errores de renderizado | `src/components/ErrorBoundary.jsx` |
| Retry con exponential backoff | 3 intentos con delay 1s, 2s, 4s | `src/services/DualWriteService.js` |
| Fallback AI | Si Ollama falla → respuestas predefinidas | `src/services/AIService.js:179-205` |
| Fallback datos | Si RTDB falla → Firestore | `src/services/ChatBotService.js:510-545` |
| Fallback config | Si Firebase falla → config por defecto | `src/services/InstitutionConfigService.js:215` |

## 2. Servicios REST

### 2.1 Endpoints del Sync Server

| Método | Ruta | Descripción | Autenticación |
|--------|------|-------------|---------------|
| POST | `/sync/docente` | Sincroniza docente a SQL | X-API-Secret header |
| POST | `/sync/curso` | Sincroniza curso a SQL | X-API-Secret header |
| POST | `/sync/admin` | Sincroniza admin a SQL | X-API-Secret header |
| GET | `/sync/estadisticas` | Obtiene estadísticas de SQL | X-API-Secret header |
| POST | `/sync/migrar` | Migración completa Firebase→SQL | X-API-Secret header |

### 2.2 Validación de Entrada

Cada endpoint valida los campos requeridos antes de procesar:
- **docente**: `key` (string), `nombre` (string)
- **curso**: `key` (string), `nombre` (string)
- **admin**: `key` (string), `email` (string)

### 2.3 CORS

- Orígenes permitidos configurables via `ALLOWED_ORIGINS` env var
- Por defecto: `http://localhost:3002,http://localhost:3000`
- Si no hay `API_SECRET` configurado, permite `*` (solo desarrollo)

## 3. Seguridad

### 3.1 Variables de Entorno

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `REACT_APP_FIREBASE_API_KEY` | API Key de Firebase | Sí |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | Dominio de auth | Sí |
| `REACT_APP_FIREBASE_DATABASE_URL` | URL de Realtime Database | Sí |
| `REACT_APP_FIREBASE_PROJECT_ID` | ID del proyecto | Sí |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | Bucket de storage | Sí |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | Sender ID | Sí |
| `REACT_APP_FIREBASE_APP_ID` | App ID | Sí |
| `REACT_APP_FIREBASE_MEASUREMENT_ID` | Measurement ID | No |
| `REACT_APP_SYNC_API` | URL del sync server | No (default: cloudflared) |
| `REACT_APP_SYNC_API_SECRET` | Clave secreta para sync API | Recomendada |
| `REACT_APP_EMAILJS_PUBLIC_KEY` | Public key de EmailJS | Para recordatorios |
| `REACT_APP_EMAILJS_SERVICE_ID` | Service ID de EmailJS | Para recordatorios |
| `REACT_APP_EMAILJS_TEMPLATE_ID` | Template ID de EmailJS | Para recordatorios |

### 3.2 Autenticación

- **Firebase Auth**: Email/password para admins y docentes
- **Sync API**: Header `X-API-Secret` para endpoints REST
- **Secondary App**: Instancia separada de Firebase Auth para registro de docentes sin afectar sesión de admin

### 3.3 Configuración de Seguridad

```bash
# 1. Copiar .env.example a .env
cp .env.example .env

# 2. Configurar variables reales en .env
# 3. Generar clave secreta para sync API
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 4. Agregar la clave a REACT_APP_SYNC_API_SECRET en .env
# 5. Agregar la misma clave a SYNC_API_SECRET en sync-server.js env
```

## 4. Control de Versiones

### 4.1 Repositorio Git

- **Frontend**: Repositorio en raíz del proyecto
- **Backend**: `jarvis-backend/` tiene su propio repositorio
- **Branching**: Se recomienda Git Flow (main, develop, feature/*)

### 4.2 Archivos Ignorados

- `.env` y variantes (credenciales)
- `node_modules/` (dependencias)
- `build/` (output de producción)
- `*.bak` (backups de SQL)
- `.firebase/` (cache local)

## 5. Despliegue

### 5.1 Frontend (Firebase Hosting)

```bash
npm run build
firebase deploy --only hosting
```

### 5.2 Sync Server

```bash
# Requiere: Node.js, SQL Server, sqlcmd
node sync-server.js

# O con variables de entorno
SYNC_API_SECRET=tu-clave-secreta node sync-server.js
```

### 5.3 Cloudflare Tunnel (para acceso externo)

```bash
cloudflared tunnel --url http://localhost:3333
```

## 6. Estructura del Proyecto

```
react-gestion-docente/
├── src/
│   ├── components/          # Componentes React
│   │   ├── AdminPanel.jsx   # Panel de administración
│   │   ├── DocentePanel.jsx # Panel de docente
│   │   ├── Home.jsx         # Página de inicio
│   │   ├── Login.jsx        # Login unificado
│   │   ├── ErrorBoundary.jsx # Captura de errores
│   │   └── styles/          # CSS por componente
│   ├── services/            # Capa de servicios
│   │   ├── DualWriteService.js    # Sync Firebase→SQL
│   │   ├── ReminderService.js     # Recordatorios email
│   │   ├── AIService.js           # Integración Ollama
│   │   ├── ChatBotService.js      # Chatbot
│   │   └── InstitutionConfigService.js # Theming
│   ├── firebase/
│   │   └── config.js        # Configuración Firebase
│   ├── context/
│   │   └── InstitutionContext.js # Contexto de institución
│   └── App.js               # Componente raíz
├── sync-server.js           # Servidor REST para sync SQL
├── sync-from-firebase.js    # Script de migración one-time
├── .env                     # Variables de entorno (NO COMMIT)
├── .env.example             # Plantilla de variables
└── package.json             # Dependencias y scripts
```

## 7. Dependencias Principales

| Paquete | Versión | Uso |
|---------|---------|-----|
| react | ^18.2.0 | Framework UI |
| firebase | ^10.12.5 | Backend as a Service |
| @emailjs/browser | ^4.4.1 | Envío de emails |
| chart.js | ^3.9.1 | Gráficos estadísticos |
| jspdf | ^3.0.3 | Generación de PDFs |
| react-router-dom | ^6.8.1 | Enrutamiento |
| microsoft-cognitiveservices-speech-sdk | ^1.49.0 | Agente de voz IA |
