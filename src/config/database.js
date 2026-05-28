const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbName = process.env.DB_NAME || 'techstore_db';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || 3306;

async function ensureDatabaseExists() {
    try {
        const connection = await mysql.createConnection({
            host: dbHost,
            port: dbPort,
            user: dbUser,
            password: dbPassword,
        });
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        await connection.end();
        console.log(`✅ Base de datos "${dbName}" verificada/creada.`);
    } catch (error) {
        console.warn('⚠️ No se pudo verificar/crear la base de datos automáticamente:', error.message);
    }
}

// Ejecutar la verificación
ensureDatabaseExists();

const sequelize = new Sequelize(
    dbName,
    dbUser,
    dbPassword,
    {
        host: dbHost,
        dialect: 'mysql',
        logging: false,
        port: dbPort,
        timezone: '-03:00', // Sincronizado con America/Argentina/Buenos_Aires
        define: {
            timestamps: true,
            underscored: true,
        }
    }
);

module.exports = sequelize;
