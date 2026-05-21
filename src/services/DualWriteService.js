const API_BASE = process.env.REACT_APP_SYNC_API || 'https://diabetes-increased-trigger-bid.trycloudflare.com';
const API_SECRET = process.env.REACT_APP_SYNC_API_SECRET || '';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };
      if (API_SECRET) {
        headers['X-API-Secret'] = API_SECRET;
      }

      const response = await fetch(url, { ...options, headers });

      if (!response.ok && attempt < retries) {
        const delayMs = BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(`[DualWrite] Intento ${attempt + 1}/${retries} fallido para ${url}, reintentando en ${delayMs}ms`);
        await delay(delayMs);
        continue;
      }

      if (!response.ok) {
        console.error(`[DualWrite] Error final para ${url}: ${response.status}`);
        return null;
      }

      return response.json();
    } catch (error) {
      if (attempt < retries) {
        const delayMs = BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(`[DualWrite] Intento ${attempt + 1}/${retries} fallido para ${url}: ${error.message}, reintentando en ${delayMs}ms`);
        await delay(delayMs);
      } else {
        console.error(`[DualWrite] Todos los intentos fallidos para ${url}: ${error.message}`);
        return null;
      }
    }
  }
  return null;
}

const DualWriteService = {
  async saveDocente(firebaseKey, docenteData) {
    return fetchWithRetry(`${API_BASE}/sync/docente`, {
      method: 'POST',
      body: JSON.stringify({ key: firebaseKey, ...docenteData })
    });
  },

  async saveCurso(firebaseKey, cursoData) {
    return fetchWithRetry(`${API_BASE}/sync/curso`, {
      method: 'POST',
      body: JSON.stringify({ key: firebaseKey, ...cursoData })
    });
  },

  async saveAdmin(firebaseKey, adminData) {
    return fetchWithRetry(`${API_BASE}/sync/admin`, {
      method: 'POST',
      body: JSON.stringify({ key: firebaseKey, ...adminData })
    });
  },

  async getEstadisticas() {
    return fetchWithRetry(`${API_BASE}/sync/estadisticas`, { method: 'GET' });
  },

  async migrarTodo() {
    try {
      const headers = {};
      if (API_SECRET) {
        headers['X-API-Secret'] = API_SECRET;
      }
      const response = await fetch(`${API_BASE}/sync/migrar`, {
        method: 'POST',
        headers
      });
      return response.json();
    } catch (error) {
      console.error('[DualWrite] Error en migracion:', error.message);
      return { success: false, error: error.message };
    }
  }
};

export default DualWriteService;
