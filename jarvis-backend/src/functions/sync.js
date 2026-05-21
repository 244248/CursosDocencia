const { app } = require('@azure/functions');
const { upsert, query } = require('../lib/sqlserver');

const firebaseDbUrl = process.env["FIREBASE_DATABASE_URL"] || "https://gestioncursodocente-default-rtdb.firebaseio.com";

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
    docente_key: c.docente_key ? c.docente_key.substring(0, 128) : null,
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
async function firebasePush(path, data) {
  const url = `${firebaseDbUrl}/${path}.json`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}

async function firebasePut(path, data) {
  const url = `${firebaseDbUrl}/${path}.json`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}

async function firebaseGet(path) {
  const url = `${firebaseDbUrl}/${path}.json`;
  const response = await fetch(url);
  return response.json();
}

// ===================== ROUTES =====================
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
      
      await upsert('docentes', key, sqlData);
      await firebasePut(`docentes/${key}`, data);

      return { status: 200, jsonBody: { success: true, message: `Docente ${key} sincronizado en ambas bases` } };
    } catch (error) {
      context.error(`Error sync docente: ${error.message}`);
      return { status: 500, jsonBody: { error: 'Error interno del servidor' } };
    }
  }
});

app.post('sync-curso', {
  authLevel: 'anonymous',
  route: 'api/sync/curso',
  handler: async (request, context) => {
    try {
      const body = await request.json();
      const validationError = validateCurso(body);
      if (validationError) return { status: 400, jsonBody: { error: validationError } };

      const { key, ...data } = body;
      const sqlData = mapCurso(key, data);
      
      await upsert('cursos', key, sqlData);
      await firebasePut(`cursos/${key}`, data);

      return { status: 200, jsonBody: { success: true, message: `Curso ${key} sincronizado en ambas bases` } };
    } catch (error) {
      context.error(`Error sync curso: ${error.message}`);
      return { status: 500, jsonBody: { error: 'Error interno del servidor' } };
    }
  }
});

app.post('sync-admin', {
  authLevel: 'anonymous',
  route: 'api/sync/admin',
  handler: async (request, context) => {
    try {
      const body = await request.json();
      const validationError = validateAdmin(body);
      if (validationError) return { status: 400, jsonBody: { error: validationError } };

      const { key, ...data } = body;
      const sqlData = mapAdmin(key, data);
      
      await upsert('administradores', key, sqlData);
      await firebasePut(`administradores/${key}`, data);

      return { status: 200, jsonBody: { success: true, message: `Admin ${key} sincronizado en ambas bases` } };
    } catch (error) {
      context.error(`Error sync admin: ${error.message}`);
      return { status: 500, jsonBody: { error: 'Error interno del servidor' } };
    }
  }
});

app.get('sync-estadisticas', {
  authLevel: 'anonymous',
  route: 'api/sync/estadisticas',
  handler: async (request, context) => {
    try {
      const [cursos, docentes, admins] = await Promise.all([
        query('SELECT COUNT(*) as total FROM cursos'),
        query('SELECT COUNT(*) as total FROM docentes'),
        query('SELECT COUNT(*) as total FROM administradores')
      ]);

      const tipos = await query('SELECT tipo, COUNT(*) as cantidad FROM cursos GROUP BY tipo');

      return {
        status: 200,
        jsonBody: {
          totalCursos: cursos.recordset[0].total,
          totalDocentes: docentes.recordset[0].total,
          totalAdmins: admins.recordset[0].total,
          cursosPorTipo: Object.fromEntries(tipos.recordset.map(r => [r.tipo, r.cantidad]))
        }
      };
    } catch (error) {
      return { status: 500, jsonBody: { error: error.message } };
    }
  }
});

app.post('sync-migrar', {
  authLevel: 'anonymous',
  route: 'api/sync/migrar',
  handler: async (request, context) => {
    try {
      const resultados = { docentes: 0, cursos: 0, administradores: 0, errores: [] };

      try {
        const docentes = await firebaseGet('docentes');
        if (docentes) {
          for (const [key, data] of Object.entries(docentes)) {
            try {
              const sqlData = mapDocente(key, data);
              await upsert('docentes', key, sqlData);
              resultados.docentes++;
            } catch (e) { resultados.errores.push(`docente ${key}: ${e.message}`); }
          }
        }
      } catch (e) { context.error('Error migrando docentes:', e.message); }

      try {
        const cursos = await firebaseGet('cursos');
        if (cursos) {
          for (const [key, data] of Object.entries(cursos)) {
            try {
              const sqlData = mapCurso(key, data);
              await upsert('cursos', key, sqlData);
              resultados.cursos++;
            } catch (e) { resultados.errores.push(`curso ${key}: ${e.message}`); }
          }
        }
      } catch (e) { context.error('Error migrando cursos:', e.message); }

      try {
        const admins = await firebaseGet('administradores');
        if (admins) {
          for (const [key, data] of Object.entries(admins)) {
            try {
              const sqlData = mapAdmin(key, data);
              await upsert('administradores', key, sqlData);
              resultados.administradores++;
            } catch (e) { resultados.errores.push(`admin ${key}: ${e.message}`); }
          }
        }
      } catch (e) { context.error('Error migrando administradores:', e.message); }

      return { status: 200, jsonBody: { success: true, resultados } };
    } catch (error) {
      return { status: 500, jsonBody: { error: error.message } };
    }
  }
});
