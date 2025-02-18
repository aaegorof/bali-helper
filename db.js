const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Создаем или открываем базу данных
const db = new sqlite3.Database(path.join(__dirname, 'transactions.db'), (err) => {
    if (err) {
        console.error('Ошибка при подключении к базе данных:', err.message);
    } else {
        console.log('Подключение к базе данных успешно');
        // Создаем таблицу, если она не существует
        db.run(`CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            posted_date TEXT,
            description TEXT,
            credit_debit TEXT,
            amount REAL,
            time TEXT,
            transaction_hash TEXT UNIQUE
        )`);
    }
});

module.exports = db;