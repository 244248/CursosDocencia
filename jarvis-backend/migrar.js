const sql = require('mssql');
const { execSync } = require('child_process');

const FIREBASE_DB_URL = 'https://gestioncursodocente-default-rtdb.firebaseio.com';

const config = {
  server: 'localhost',
  database: 'GestionDocente',
  options: { trustServerCertificate: true, trustedConnection: true, encrypt: false }
};

// sqlcmd command prefix
const CMD = 'sqlcmd -S localhost -E -d GestionDocente -Q';

async function firebaseGet(path) {
  const url = `${FIREBASE_DB_URL}/${path}.json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Firebase fetch error: ${response.status}`);
  return response.json();
}

function esc(v) {
  if (v == null) return 'NULL';
  return '\'' + String(v).replace(/'/g, '\'\'') + '\'';
}

async function migrar() {
  console.log('=== INICIANDO MIGRACION Firebase -> SQL Server ===\n');

  // Migrar docentes
  console.log('--- DOCENTES ---');
  try {
    const docentes = await firebaseGet('docentes');
    if (docentes) {
      for (const [key, data] of Object.entries(docentes)) {
        const check = `IF NOT EXISTS (SELECT 1 FROM docentes WHERE firebase_key = '${key}') BEGIN INSERT INTO docentes (firebase_key, nombre, apellidos, email, area) VALUES (${esc(key)}, ${esc(data.nombre || '')}, ${esc(data.apellidos || '')}, ${esc(data.email || '')}, ${esc(data.area || 'No especificada')}) END ELSE BEGIN UPDATE docentes SET nombre=${esc(data.nombre || '')}, apellidos=${esc(data.apellidos || '')}, email=${esc(data.email || '')}, area=${esc(data.area || 'No especificada')} WHERE firebase_key=${esc(key)} END`;
        try {
          execSync(`${CMD} "${check}"`, { stdio: 'pipe' });
          console.log(`  [OK] docente: ${key}`);
        } catch (e) {
          console.log(`  [ERR] docente ${key}: ${e.message.substring(0, 80)}`);
        }
      }
    }
    console.log('  Docentes completado\n');
  } catch (e) {
    console.error('  Error docentes:', e.message);
  }

  // Migrar cursos
  console.log('--- CURSOS ---');
  try {
    const cursos = await firebaseGet('cursos');
    if (cursos) {
      for (const [key, data] of Object.entries(cursos)) {
        const modalidad = data.url ? 'En linea' : 'Presencial';
        const check = `IF NOT EXISTS (SELECT 1 FROM cursos WHERE firebase_key = '${key}') BEGIN INSERT INTO cursos (firebase_key, nombre, tipo, fecha, modalidad, url) VALUES (${esc(key)}, ${esc(data.nombre || '')}, ${esc(data.tipo || '')}, ${esc(data.fecha || 'Sin fecha')}, ${esc(modalidad)}, ${esc(data.url || null)}) END ELSE BEGIN UPDATE cursos SET nombre=${esc(data.nombre || '')}, tipo=${esc(data.tipo || '')}, fecha=${esc(data.fecha || 'Sin fecha')}, modalidad=${esc(modalidad)}, url=${esc(data.url || null)} WHERE firebase_key=${esc(key)} END`;
        try {
          execSync(`${CMD} "${check}"`, { stdio: 'pipe' });
          console.log(`  [OK] curso: ${key}`);
        } catch (e) {
          console.log(`  [ERR] curso ${key}: ${e.message.substring(0, 80)}`);
        }
      }
    }
    console.log('  Cursos completado\n');
  } catch (e) {
    console.error('  Error cursos:', e.message);
  }

  // Migrar administradores
  console.log('--- ADMINISTRADORES ---');
  try {
    const admins = await firebaseGet('administradores');
    if (admins) {
      for (const [key, data] of Object.entries(admins)) {
        const check = `IF NOT EXISTS (SELECT 1 FROM administradores WHERE firebase_key = '${key}') BEGIN INSERT INTO administradores (firebase_key, email, nombre, apellidos, rol, uid) VALUES (${esc(key)}, ${esc(data.email || '')}, ${esc(data.nombre || '')}, ${esc(data.apellidos || '')}, ${esc(data.rol || 'administrador')}, ${esc(data.uid || '')}) END ELSE BEGIN UPDATE administradores SET email=${esc(data.email || '')}, nombre=${esc(data.nombre || '')}, apellidos=${esc(data.apellidos || '')}, rol=${esc(data.rol || 'administrador')}, uid=${esc(data.uid || '')} WHERE firebase_key=${esc(key)} END`;
        try {
          execSync(`${CMD} "${check}"`, { stdio: 'pipe' });
          console.log(`  [OK] admin: ${key}`);
        } catch (e) {
          console.log(`  [ERR] admin ${key}: ${e.message.substring(0, 80)}`);
        }
      }
    }
    console.log('  Administradores completado\n');
  } catch (e) {
    console.error('  Error administradores:', e.message);
  }

  // Verificar
  console.log('=== VERIFICACION ===');
  const tables = ['docentes', 'cursos', 'administradores'];
  for (const table of tables) {
    try {
      const result = execSync(`${CMD} "SELECT COUNT(*) as total FROM ${table}"`, { stdio: 'pipe' });
      console.log(`  ${table}: ${result.toString().trim()}`);
    } catch (e) {
      console.log(`  ${table}: ERROR`);
    }
  }

  console.log('\n=== MIGRACION COMPLETADA ===');
}

migrar().catch(console.error);
