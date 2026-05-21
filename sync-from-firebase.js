const { execSync } = require('child_process');
const FIREBASE_URL = 'https://gestioncursodocente-default-rtdb.firebaseio.com';
const DB = 'GestionDocente';

function esc(v) {
  if (v == null) return 'NULL';
  return "'" + String(v).replace(/'/g, "''") + "'";
}

function sqlRun(query) {
  try {
    return execSync(`sqlcmd -S localhost -E -d ${DB} -Q "${query.replace(/"/g, '\\"')}"`, { stdio: 'pipe', encoding: 'utf8', timeout: 5000 });
  } catch (e) {
    console.error('SQL Error:', e.message);
    return '';
  }
}

async function fetchAll(path) {
  const res = await fetch(`${FIREBASE_URL}/${path}.json`);
  return res.json();
}

function upsert(table, key, data) {
  const check = sqlRun(`IF NOT EXISTS (SELECT 1 FROM ${table} WHERE firebase_key = ${esc(key)}) SELECT 'INSERT' as a ELSE SELECT 'UPDATE' as a`);
  const isInsert = check.includes('INSERT');
  if (isInsert) {
    const keys = ['firebase_key', ...Object.keys(data)];
    const vals = keys.map(k => k === 'firebase_key' ? esc(key) : esc(data[k]));
    sqlRun(`INSERT INTO ${table} (${keys.map(k => `[${k}]`).join(', ')}) VALUES (${vals.join(', ')})`);
  } else {
    const sets = Object.keys(data).map(k => `[${k}] = ${esc(data[k])}`);
    sqlRun(`UPDATE ${table} SET ${sets.join(', ')} WHERE firebase_key = ${esc(key)}`);
  }
}

async function run() {
  console.log('Sincronizando docentes...');
  const docentes = await fetchAll('docentes');
  let count = 0;
  for (const [key, val] of Object.entries(docentes)) {
    upsert('docentes', key, { nombre: val.nombre || '', apellidos: val.apellidos || '', email: val.email || '', area: val.area || 'No especificada' });
    count++;
  }
  console.log(`  ${count} docentes sincronizados`);

  console.log('Sincronizando cursos...');
  const cursos = await fetchAll('cursos');
  count = 0;
  for (const [key, val] of Object.entries(cursos)) {
    upsert('cursos', key, { nombre: val.nombre || '', tipo: val.tipo || '', fecha: val.fecha || 'Sin fecha', modalidad: val.url ? 'En linea' : 'Presencial', url: val.url || null });
    count++;
  }
  console.log(`  ${count} cursos sincronizados`);

  console.log('Sincronizando administradores...');
  const admins = await fetchAll('administradores');
  count = 0;
  for (const [key, val] of Object.entries(admins)) {
    upsert('administradores', key, { email: val.email || '', nombre: val.nombre || '', apellidos: val.apellidos || '', rol: val.rol || 'administrador', uid: val.uid || '' });
    count++;
  }
  console.log(`  ${count} administradores sincronizados`);
  console.log('\nListo! Tu SQL esta actualizado con Firebase.');
}

run().catch(e => console.error('Error:', e.message));