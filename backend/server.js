const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { db, initializeTables } = require('./db');
const { determineCategory } = require('./helpers');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Запускаем миграции при старте сервера
initializeTables()

app.post('/api/auth/login', async (req, res) => {
  const { email } = req.body;
  
  try {
    // Ищем пользователя или создаем нового
    const findUserQuery = 'SELECT * FROM users WHERE email = ?';
    
    db.get(findUserQuery, [email], (err, user) => {
      if (err) {
        console.error('Error finding user:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (user) {
        // Пользователь найден
        return res.json({ id: user.id, email: user.email });
      } else {
        // Создаем нового пользователя
        const createUserQuery = 'INSERT INTO users (email) VALUES (?)';
        db.run(createUserQuery, [email], function(err) {
          if (err) {
            console.error('Error creating user:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          const newUser = {
            id: this.lastID,
            email: email
          };
          
          res.json({ user: newUser });
        });
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/transactions', (req, res) => {
  const { startDate, endDate, creditDebit, userId } = req.query;

  let query = `SELECT * FROM transactions`;
  const params = [];
  const conditions = [];

  // Добавляем обязательную фильтрацию по пользователю
  if (userId) {
    conditions.push('user_id = ?');
    params.push(userId);
  }
  
  if (startDate) {
    conditions.push('posted_date >= ?');
    params.push(startDate);
  }

  if (endDate) {
    conditions.push('posted_date <= ?');
    params.push(endDate);
  }

  if (creditDebit) {
    conditions.push('credit_debit = ?');
    params.push(creditDebit);
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ` ORDER BY posted_date DESC`;

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching transactions:', err);
      return res.status(500).json({
        error: 'Error fetching transactions',
        details: err.message
      });
    }
    
    res.status(200).json(rows);
  });
});

app.post('/api/transactions', (req, res) => {
  const { transactions, userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const query = `INSERT OR REPLACE INTO transactions 
    (posted_date, description, credit_debit, amount, time, transaction_hash, category, user_id) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  const parseTimeFromDescription = (description) => {
    if (!description) return { time: null, cleanDescription: '' };
    
    const timeRegex = /(\d{2}:\d{2}:\d{2})/;
    const match = description.match(timeRegex);
    if (match) {
      return {
        time: match[1],
        cleanDescription: description.replace(timeRegex, '').trim()
      };
    }
    return {
      time: null,
      cleanDescription: description
    };
  };

  const createTransactionHash = (transaction) => {
    if (!transaction.posted_date || !transaction.description || transaction.amount === undefined) {
      console.error('Invalid transaction data:', transaction);
      return '';
    }
    // Create a unique hash based on transaction properties
    return Buffer.from(
      `${transaction.posted_date}_${transaction.description}_${transaction.amount}`
    ).toString('base64');
  };

  const processedTransactions = transactions.map(transaction => {
    // Проверяем и очищаем входные данные
    const safeTransaction = {
      posted_date: transaction.posted_date || '',
      description: transaction.description || '',
      credit_debit: transaction.credit_debit || '',
      amount: typeof transaction.amount === 'number' ? transaction.amount : 0
    };

    const { time, cleanDescription } = parseTimeFromDescription(safeTransaction.description);
    const transactionHash = createTransactionHash(safeTransaction);
    const category = determineCategory(cleanDescription);

    return {
      ...safeTransaction,
      time: time,
      hash: transactionHash,
      category: category,
      user_id: userId
    };
  });

  const promises = processedTransactions.map(transaction => {
    return new Promise((resolve, reject) => {
      db.run(query, [
        transaction.posted_date,
        transaction.description,
        transaction.credit_debit,
        transaction.amount,
        transaction.time,
        transaction.hash,
        transaction.category,
        transaction.user_id
      ], (err) => {
        if (err) {
          console.error('Error inserting transaction:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });

  Promise.all(promises)
    .then(() => {
      res.status(201).json({
        message: 'Transactions saved successfully',
        transactions: processedTransactions
      });
    })
    .catch(err => {
      console.error('Error saving transactions:', err);
      res.status(500).json({
        error: 'Error saving transactions',
        details: err.message
      });
    });
});

app.post('/api/transactions/update-category', (req, res) => {
    const { ids, category } = req.body;
    console.log(ids, category, req.body, req);
    if (!Array.isArray(ids) || !category) {
        return res.status(400).json({
            error: 'Invalid input - ids must be an array and category must be specified'
        });
    }

    const placeholders = ids.map(() => '?').join(',');
    const query = `UPDATE transactions SET category = ? WHERE id IN (${placeholders})`;
    // transactionIds передаются в params для подстановки в SQL запрос
    // они заменят плейсхолдеры (?) в условии WHERE id IN (?)
    // например, если transactionIds = [1,2,3], то запрос будет:
    // UPDATE transactions SET category = 'some_category' WHERE id IN (1,2,3)
    const params = [category, ...ids];

    db.run(query, params, function(err) {
        if (err) {
            console.error('Error updating categories:', err);
            return res.status(500).json({
                error: 'Error updating categories',
                details: err.message
            });
        }

        console.log(`Updated ${this.changes} transactions`);
        res.status(200).json({
            success: true,
            updatedCount: this.changes
        });
    });
});


const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});