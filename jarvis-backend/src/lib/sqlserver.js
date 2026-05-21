const { execSync } = require('child_process');

const dbName = 'GestionDocente';
const ALLOWED_TABLES = ['docentes', 'cursos', 'administradores'];

function sanitizeValue(value) {
  if (value === null || value === undefined) return { sql: 'NULL', type: 'null' };
  if (typeof value === 'number') return { sql: String(value), type: 'number' };
  if (typeof value === 'boolean') return { sql: value ? '1' : '0', type: 'boolean' };
  const sanitized = String(value).replace(/'/g, "''").replace(/\\/g, '\\\\');
  return { sql: `'${sanitized}'`, type: 'string' };
}

function validateTable(table) {
  if (!ALLOWED_TABLES.includes(table)) {
    throw new Error(`Tabla no permitida: ${table}. Tablas permitidas: ${ALLOWED_TABLES.join(', ')}`);
  }
  return table;
}

function run(query) {
  try {
    const escapedQuery = query.replace(/"/g, '\\"');
    const result = execSync(`sqlcmd -S localhost -E -d ${dbName} -Q "${escapedQuery}"`, { 
      stdio: 'pipe', 
      timeout: 10000,
      encoding: 'utf8'
    });
    return { success: true, result: result.trim() };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function query(text, params = []) {
  let sql = text;
  if (params.length > 0) {
    params.forEach((param, i) => {
      const key = param.name || `p${i}`;
      const sanitized = sanitizeValue(param.value);
      sql = sql.replace(new RegExp(`@${key}\\b`, 'g'), sanitized.sql);
    });
  }
  return run(sql);
}

async function upsert(table, firebaseKey, data) {
  validateTable(table);
  
  const sanitizedKey = sanitizeValue(firebaseKey);
  const checkSql = `IF NOT EXISTS (SELECT 1 FROM ${table} WHERE firebase_key = ${sanitizedKey.sql}) SELECT 'INSERT' as action ELSE SELECT 'UPDATE' as action`;
  
  let action = 'INSERT';
  try {
    const checkResult = execSync(`sqlcmd -S localhost -E -d ${dbName} -Q "${checkSql.replace(/"/g, '\\"')}"`, { stdio: 'pipe', encoding: 'utf8' });
    action = checkResult.includes('INSERT') ? 'INSERT' : 'UPDATE';
  } catch (e) {
    action = 'INSERT';
  }

  if (action === 'UPDATE') {
    const sets = Object.keys(data).map(k => `[${k}] = ${sanitizeValue(data[k]).sql}`);
    const sql = `UPDATE ${table} SET ${sets.join(', ')} WHERE firebase_key = ${sanitizedKey.sql}`;
    return run(sql);
  } else {
    const keys = ['firebase_key', ...Object.keys(data)];
    const vals = keys.map(k => k === 'firebase_key' ? sanitizedKey.sql : sanitizeValue(data[k]).sql);
    const sql = `INSERT INTO ${table} (${keys.map(k => `[${k}]`).join(', ')}) VALUES (${vals.join(', ')})`;
    return run(sql);
  }
}

const sql = {
  NVarChar: () => 'text',
  Int: () => 'number'
};

module.exports = { query, upsert, sql, sanitizeValue, validateTable };
