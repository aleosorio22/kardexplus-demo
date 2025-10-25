require('dotenv').config();

// Selección de adaptador por variable de entorno DB_DIALECT (mysql | mssql)
const dialect = (process.env.DB_DIALECT || 'mysql').toLowerCase();

console.log(`[DB] Usando adaptador: ${dialect.toUpperCase()}`);

let db;
if (dialect === 'mssql') {
    // El adaptador mssql está en el mismo directorio
    db = require('./database-mssql');
} else {
    // Por defecto mantenemos la conexión mysql2 existente
    const mysql = require('mysql2');
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    }).promise();

    // Test de conexión
    pool.getConnection()
        .then(connection => {
            console.log('Conexión exitosa a la base de datos (MySQL)');
            connection.release();
        })
        .catch(err => {
            console.error('Error al conectar a la base de datos (MySQL):', err.message);
        });

    db = pool;
}

module.exports = db;