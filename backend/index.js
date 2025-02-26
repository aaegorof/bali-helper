const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../../transactions.db');

// Создаем или открываем базу данных
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Ошибка при подключении к базе данных:', err.message);
        process.exit(1);
    }
    console.log('Подключение к базе данных успешно');
});

// Инициализация всех таблиц
function initializeTables() {
    db.serialize(() => {
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

        // Добавляем внешний ключ
        db.run(`PRAGMA foreign_keys = ON`);

        // Добавьте в функцию initializeTables()
        db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_posted_date ON transactions(posted_date)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(transaction_hash)`);
    });
}

// Запускаем инициализацию при старте
initializeTables();

module.exports = db; 