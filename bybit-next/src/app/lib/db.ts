import sqlite3 from 'sqlite3';
import path from 'path';
import { initializeVectorTables } from '@/app/lib/vectorDb';

// Исправляем путь к базе данных
const DB_PATH = path.join(process.cwd(), '../transactions.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Ошибка при подключении к базе данных:', err.message);
        process.exit(1);
    }
    console.log('Подключение к базе данных успешно');
});

async function initializeTables(): Promise<void> {
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

                // Индексы
                db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)`);
                db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_posted_date ON transactions(posted_date)`);
                db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(transaction_hash)`);

                // Внешние ключи
                db.run(`PRAGMA foreign_keys = ON`);

                // После создания основных таблиц, инициализируем векторные таблицы
                initializeVectorTables()
                    .then(() => {
                        console.log('Векторные таблицы успешно инициализированы');
                        resolve();
                    })
                    .catch(error => {
                        console.error('Ошибка при инициализации векторных таблиц:', error);
                        reject(error);
                    });
            } catch (error) {
                reject(error);
            }
        });
    });
}

export { db, initializeTables };