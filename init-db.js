const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Создаем подключение к базе данных
const db = new sqlite3.Database(path.join(__dirname, 'transactions.db'), (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database successfully');
});

// Удаляем существующую таблицу если она есть
const dropTable = `DROP TABLE IF EXISTS transactions`;

// SQL для создания новой таблицы
const createTable = `
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    posted_date TEXT,
    description TEXT,
    credit_debit TEXT,
    amount REAL,
    time TEXT,
    transaction_hash TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`;

// Выполняем последовательно операции
db.serialize(() => {
    db.run(dropTable, (err) => {
        if (err) {
            console.error('Error dropping table:', err);
            return;
        }
        console.log('Existing table dropped successfully');
    });

    db.run(createTable, (err) => {
        if (err) {
            console.error('Error creating table:', err);
            return;
        }
        console.log('New table created successfully');
    });
});

// Закрываем соединение с базой данных
db.close((err) => {
    if (err) {
        console.error('Error closing database:', err);
        return;
    }
    console.log('Database connection closed');
}); 