const db = require('./db');

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1. Создаем таблицу пользователей
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating users table:', err);
          reject(err);
        }
      });

      // 2. Проверяем существование колонки user_id
      db.get(`PRAGMA table_info(transactions)`, (err, rows) => {
        if (err) {
          console.error('Error checking table info:', err);
          reject(err);
        }

        // 3. Добавляем колонку user_id, если её нет
        db.run(`
          ALTER TABLE transactions 
          ADD COLUMN user_id INTEGER REFERENCES users(id)
        `, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('Error adding user_id column:', err);
            reject(err);
          }
        });

        // 4. Создаем индексы
        db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_posted_date ON transactions(posted_date)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(transaction_hash)`);
      });
    });

    resolve();
  });
}

module.exports = { initializeDatabase };