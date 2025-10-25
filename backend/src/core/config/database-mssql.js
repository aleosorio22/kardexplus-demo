const sql = require('mssql');
require('dotenv').config();

require('dotenv').config();

console.log('=== DEBUG CONEXIÓN ===');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_ENCRYPT:', process.env.DB_ENCRYPT);
console.log('DB_TRUST_CERT:', process.env.DB_TRUST_CERT);
console.log('======================');

// Configuración mínima para mssql/tedious. Ajustar según entorno.
const config = {
  user: process.env.DB_USER || undefined,
  password: process.env.DB_PASSWORD || undefined,
  server: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || undefined,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true' || false,
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true' || true,
    enableArithAbort: true,
    useUTC: false,
    // Configuración de codificación para manejar correctamente caracteres especiales
    // Tedious usa UTF-16 LE internamente, pero debemos asegurar que recibe/envía UTF-8
    rowCollectionOnRequestCompletion: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect()
  .then(() => console.log('Conexión exitosa a SQL Server'))
  .catch(err => console.error('Error al conectar a SQL Server:', err && err.message ? err.message : err));

// Convierte placeholders '?' a parámetros nombrados @p1, @p2, ...
function transformPlaceholders(query) {
  let i = 0;
  return query.replace(/\?/g, () => `@p${++i}`);
}

// Ejecuta una query con parámetros tipo array (compatibilidad con mysql2.execute)
async function execute(queryText, params = []) {
  await poolConnect;
  const transformed = transformPlaceholders(queryText);
  const request = pool.request();

  if (Array.isArray(params)) {
    params.forEach((value, idx) => {
      const name = `p${idx + 1}`; // p1, p2, ...
      // Si el valor es string, usar NVarChar para Unicode correcto
      if (typeof value === 'string') {
        request.input(name, sql.NVarChar, value);
      } else {
        request.input(name, value);
      }
    });
  } else if (params && typeof params === 'object') {
    // Si llaman con objeto de parámetros named: bindearlos directamente
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (typeof value === 'string') {
        request.input(key, sql.NVarChar, value);
      } else {
        request.input(key, value);
      }
    });
  }

  const result = await request.query(transformed);
  // Para compatibilidad con mysql2: devolver [rows, meta]
  // El segundo elemento debe tener rowsAffected para queries UPDATE/DELETE
  const meta = {
    ...result,
    affectedRows: result.rowsAffected, // Compatibilidad con MySQL
    rowsAffected: result.rowsAffected
  };
  return [result.recordset, meta];
}

// getConnection: devuelve un "connection-like" con execute y release para compatibilidad
async function getConnection() {
  await poolConnect;
  return {
    execute: async (q, params) => execute(q, params),
    query: async (q, params) => {
      const [rows] = await execute(q, params);
      return rows;
    },
    release: () => { /* no-op: pool maneja conexiones */ }
  };
}

function close() {
  return pool.close();
}

module.exports = {
  execute,
  getConnection,
  close,
  sql // exportamos el objeto sql por si se necesita acceso a tipos u utilidades
};
