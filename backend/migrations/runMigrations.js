const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Путь к вашей базе данных
const DB_PATH = path.join(__dirname, '../../transactions.db');

// Создаем подключение к базе данных
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
    }
    console.log('Connected to database');
});

// Читаем и выполняем SQL миграцию
const migrationSQL = fs.readFileSync(
    path.join(__dirname, 'add_category_column.sql'),
    'utf8'
);

db.exec(migrationSQL, (err) => {
    if (err) {
        console.error('Error running migration:', err);
        process.exit(1);
    }
    console.log('Migration completed successfully');
    
    // Закрываем соединение с базой данных
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
            process.exit(1);
        }
        console.log('Database connection closed');
    });
}); 