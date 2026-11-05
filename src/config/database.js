import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let sequelize;

const dbDialect = process.env.DB_DIALECT || 'mysql';
const dbHost = process.env.DB_HOST || '127.0.0.1';
const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
const dbName = process.env.DB_NAME || 'the_ethnic_edit';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';

// Initialize Sequelize with fallback
export const initDatabase = async () => {
  if (dbDialect === 'mysql') {
    try {
      console.log(`[DB] Attempting MySQL connection to ${dbHost}:${dbPort}/${dbName}...`);
      
      // Attempt connection to MySQL server
      const mysql = await import('mysql2/promise');
      const connection = await mysql.createConnection({
        host: dbHost,
        port: dbPort,
        user: dbUser,
        password: dbPassword,
        connectTimeout: 2000
      });
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
      await connection.end();

      sequelize = new Sequelize(dbName, dbUser, dbPassword, {
        host: dbHost,
        port: dbPort,
        dialect: 'mysql',
        logging: false,
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      });

      await sequelize.authenticate();
      console.log('✓ [DB] Connected to MySQL successfully.');
      return sequelize;
    } catch (mysqlError) {
      console.warn('⚠️ [DB] MySQL connection failed or MySQL service is not running.');
      console.warn(`Reason: ${mysqlError.message}`);
      console.log('⚙️ [DB] Switching automatically to local SQLite database so server can run seamlessly.');
    }
  }

  // Fallback to SQLite
  const sqliteStorage = path.resolve(dataDir, 'the_ethnic_edit.sqlite');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: sqliteStorage,
    logging: false
  });

  await sequelize.authenticate();
  console.log(`✓ [DB] Connected to SQLite database: ${sqliteStorage}`);
  return sequelize;
};

// Default export placeholder until init is called
export const getSequelize = () => sequelize;
export default () => sequelize;

