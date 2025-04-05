import { initializeVectorTables } from '@/app/lib/vectorDb';
import path from 'path';
import sqlite3 from 'sqlite3';

// Используем глобальную переменную для хранения подключения к БД
let dbInstance: sqlite3.Database | null = null;

// Путь к базе данных относительно корня проекта
const DB_PATH = path.join(process.cwd(), 'transactions.db');

// Функция для получения инстанса базы данных
function getDb(): sqlite3.Database {
  if (!dbInstance) {
    dbInstance = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Ошибка при подключении к базе данных:', err.message);
        process.exit(1);
      }
      console.log('Подключение к базе данных успешно');
    });
  }
  return dbInstance;
}

// Функция для закрытия соединения с базой данных
function closeDb(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      dbInstance.close((err) => {
        if (err) {
          console.error('Ошибка при закрытии базы данных:', err.message);
          reject(err);
        } else {
          dbInstance = null;
          console.log('Соединение с базой данных закрыто');
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

// Функция инициализации таблиц
async function initializeTables(): Promise<void> {
  const db = getDb();

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      try {
        // Основная таблица транзакций
        db.run(`CREATE TABLE IF NOT EXISTS transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    posted_date TEXT,
                    description TEXT,
                    credit_debit TEXT,
                    amount REAL,
                    time TEXT,
                    transaction_hash TEXT UNIQUE,
                    category TEXT,
                    user_id INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

        // Таблица пользователей
        db.run(`CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )`);

        // Таблица спот-сделок
        db.run(`CREATE TABLE IF NOT EXISTS spottrades (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    symbol TEXT NOT NULL,
                    side TEXT NOT NULL,
                    price REAL NOT NULL,
                    quantity REAL NOT NULL,
                    timestamp INTEGER NOT NULL,
                    order_id TEXT NOT NULL,
                    user_id INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(symbol, order_id)
                )`);

        // Индексы
        db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)`);
        db.run(
          `CREATE INDEX IF NOT EXISTS idx_transactions_posted_date ON transactions(posted_date)`
        );
        db.run(
          `CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(transaction_hash)`
        );
        db.run(`CREATE INDEX IF NOT EXISTS idx_spottrades_user_id ON spottrades(user_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_spottrades_symbol ON spottrades(symbol)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_spottrades_timestamp ON spottrades(timestamp)`);

        // Внешние ключи
        db.run(`PRAGMA foreign_keys = ON`);

        // После создания основных таблиц, инициализируем векторные таблицы
        initializeVectorTables()
          .then(() => {
            console.log('Векторные таблицы успешно инициализированы');
            resolve();
          })
          .catch((error) => {
            console.error('Ошибка при инициализации векторных таблиц:', error);
            reject(error);
          });
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Функция для проверки состояния базы данных
async function isDatabaseInitialized(): Promise<boolean> {
  const db = getDb();

  return new Promise((resolve) => {
    db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='transactions'",
      (err, row) => {
        if (err) {
          console.error('Ошибка при проверке состояния БД:', err);
          resolve(false);
        }
        
        if (!row) {
          resolve(false);
        } else {
          // Дополнительно проверяем наличие таблицы spottrades
          db.get(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='spottrades'",
            (err, spotTradesRow) => {
              if (err) {
                console.error('Ошибка при проверке таблицы spottrades:', err);
                resolve(false);
              }
              resolve(!!spotTradesRow);
            }
          );
        }
      }
    );
  });
}

// Экспортируем все функции
export { closeDb, getDb, initializeTables, isDatabaseInitialized };
