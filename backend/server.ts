import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';

// Загружаем переменные окружения из файла .env
dotenv.config();

// Импортируем типы для TypeScript
import type { Request, Response } from 'express';

import { db, initializeTables } from './db'
import { determineCategory, determineKeywordCategory } from './helpers';
import { createEmbedding, determineCategoryWithAI, determineCategoryWithRAG, saveEmbedding } from './vectorDb';

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Определяем интерфейсы для типизации
interface Transaction {
  id?: number;
  posted_date?: string;
  description?: string;
  credit_debit?: string;
  amount?: number;
  category?: string;
  time?: string | null;
  transaction_hash?: string;
  user_id?: number;
  created_at?: string;
  cleanDescription?: string;
}

interface User {
  id: number;
  email: string;
}

interface TransactionParseResult {
  time: string | null;
  cleanDescription: string;
}

interface TransactionQueryParams {
  startDate?: string;
  endDate?: string;
  creditDebit?: string;
  userId?: string;
}

// Интерфейс для SQLite колбэка с this
interface SQLiteRunResult {
  lastID: number;
  changes: number;
}

// Вспомогательная функция для извлечения времени из описания транзакции
const parseTimeFromDescription = (description: string): TransactionParseResult => {
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

// Вспомогательная функция для создания хеша транзакции
const createTransactionHash = (transaction: Transaction): string => {
  if (!transaction.posted_date || !transaction.description || transaction.amount === undefined) {
    console.error('Invalid transaction data:', transaction);
    return '';
  }
  // Create a unique hash based on transaction properties
  return Buffer.from(
    `${transaction.posted_date}_${transaction.description}_${transaction.amount}`
  ).toString('base64');
};

// Запускаем миграции при старте сервера
(async () => {
  try {
    await initializeTables();
    console.log('Таблицы успешно инициализированы');
  } catch (error) {
    console.error('Ошибка при инициализации таблиц:', error);
    process.exit(1);
  }
})();

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email } = req.body;
  
  try {
    // Ищем пользователя или создаем нового
    const findUserQuery = 'SELECT * FROM users WHERE email = ?';
    
    db.get(findUserQuery, [email], (err: Error | null, user: User | undefined) => {
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
        db.run(createUserQuery, [email], function(this: SQLiteRunResult, err: Error | null) {
          if (err) {
            console.error('Error creating user:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          const newUser = {
            id: this.lastID,
            email: email
          };
          
          res.json(newUser);
        });
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/transactions', (req: Request, res: Response) => {
  const { startDate, endDate, creditDebit, userId } = req.query as TransactionQueryParams;

  let query = `SELECT * FROM transactions`;
  const params: string[] = [];
  const conditions: string[] = [];

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

  db.all(query, params, (err: Error | null, rows: Transaction[]) => {
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

interface TransactionsRequestBody {
  transactions: Transaction[];
  userId: number;
}

app.post('/api/transactions', async (req: Request, res: Response) => {
  const { transactions, userId } = req.body as TransactionsRequestBody;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const query = `INSERT OR REPLACE INTO transactions 
    (posted_date, description, credit_debit, amount, time, transaction_hash, category, user_id) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  try {
    // Обрабатываем транзакции асинхронно
    const processedTransactions = await Promise.all(transactions.map(async (transaction) => {
      // Проверяем и очищаем входные данные
      const safeTransaction: Transaction = {
        posted_date: transaction.posted_date || '',
        description: transaction.description || '',
        credit_debit: transaction.credit_debit || '',
        amount: typeof transaction.amount === 'number' ? transaction.amount : 0
      };

      const { time, cleanDescription } = parseTimeFromDescription(safeTransaction.description || '');
      const transactionHash = createTransactionHash(safeTransaction);
      
      // Асинхронно определяем категорию с использованием AI
      const category = await determineCategory(cleanDescription);

      return {
        ...safeTransaction,
        time: time,
        hash: transactionHash,
        category: category,
        user_id: userId,
        description: cleanDescription
      };
    }));

    // Сохраняем транзакции в базу данных
    const savedTransactions: Transaction[] = [];
    
    for (const transaction of processedTransactions) {
      await new Promise<void>((resolve, reject) => {
        db.run(query, [
          transaction.posted_date,
          transaction.description,
          transaction.credit_debit,
          transaction.amount,
          transaction.time,
          transaction.hash,
          transaction.category,
          transaction.user_id
        ], function(this: SQLiteRunResult, err: Error | null) {
          if (err) {
            console.error('Error inserting transaction:', err);
            return reject(err);
          }
          
          // Сохраняем ID транзакции для последующего создания embedding
          transaction.id = this.lastID;
          savedTransactions.push(transaction);
          resolve();
        });
      });
    }
    
    // Создаем и сохраняем embeddings для новых транзакций
    const embeddingPromises = savedTransactions.map(async (transaction) => {
      try {
        // Создаем embedding только если есть описание и категория
        if (transaction.description && transaction.category) {
          const embedding = await createEmbedding(transaction.description);
          if (transaction.id !== undefined) {
            await saveEmbedding(transaction.id, transaction.description, transaction.category, embedding);
          }
          console.log(`Создан embedding для транзакции ID ${transaction.id}`);
        }
      } catch (error) {
        console.error('Ошибка при создании embedding для транзакции:', error);
        // Продолжаем выполнение даже при ошибке создания embedding
      }
    });
    
    // Ждем завершения создания всех embeddings
    await Promise.all(embeddingPromises);

    res.status(201).json({
      message: 'Transactions saved successfully',
      transactions: processedTransactions
    });
  } catch (err: any) {
    console.error('Error saving transactions:', err);
    res.status(500).json({
      error: 'Error saving transactions',
      details: err.message
    });
  }
});

app.delete('/api/transactions', async (req: Request, res: Response) => {
  const { ids } = req.body as { ids: number[] };
  
  if (!Array.isArray(ids)) {
    return res.status(400).json({
      error: 'Invalid input - ids must be an array'
    });
  } 

  try {
    const query = `DELETE FROM transactions WHERE id IN (${ids.map(() => '?').join(',')})`;
    db.run(query, ids, (err: Error | null) => {
      if (err) {
        console.error('Error deleting transactions:', err); 
        return res.status(500).json({
          error: 'Error deleting transactions',
          details: err.message
        });
      }
      
      res.status(200).json({ success: true });
    });
  } catch (err: any) {
    console.error('Error deleting transactions:', err);
    res.status(500).json({
      error: 'Error deleting transactions',
      details: err.message
    });
  }
});

interface UpdateCategoryRequestBody {
  ids: number[];
  category: string;
}

app.post('/api/transactions/update-categories', async (req: Request, res: Response) => {
    const { ids, category } = req.body as UpdateCategoryRequestBody;
    
    if (!Array.isArray(ids) || !category) {
        return res.status(400).json({
            error: 'Invalid input - ids must be an array and category must be specified'
        });
    }

    try {
        // Обновляем категорию в таблице транзакций
        const placeholders = ids.map(() => '?').join(',');
        const query = `UPDATE transactions SET category = ? WHERE id IN (${placeholders})`;
        const params = [category, ...ids];

        await new Promise<number>((resolve, reject) => {
            db.run(query, params, function(this: SQLiteRunResult, err: Error | null) {
                if (err) {
                    console.error('Error updating categories:', err);
                    return reject(err);
                }
                resolve(this.changes);
            });
        });
        
        // Получаем обновленные транзакции для создания новых embeddings
        const updatedTransactionsQuery = `SELECT id, description FROM transactions WHERE id IN (${placeholders})`;
        const updatedTransactions: Transaction[] = await new Promise((resolve, reject) => {
            db.all(updatedTransactionsQuery, ids, (err: Error | null, rows: Transaction[]) => {
                if (err) {
                    console.error('Error fetching updated transactions:', err);
                    return reject(err);
                }
                resolve(rows);
            });
        });
        
        // Обновляем embeddings для измененных транзакций
        const embeddingPromises = updatedTransactions.map(async (transaction) => {
            try {
                // Удаляем старые embeddings
                await new Promise<void>((resolve, reject) => {
                    db.run(
                        `DELETE FROM transaction_embeddings WHERE transaction_id = ?`,
                        [transaction.id],
                        (err: Error | null) => {
                            if (err) {
                                console.error('Error deleting old embedding:', err);
                                return reject(err);
                            }
                            resolve();
                        }
                    );
                });
                
                // Парсим время из описания
                const { cleanDescription } = parseTimeFromDescription(transaction?.description || '');
                
                // Создаем новый embedding
                if (cleanDescription) {
                    const embedding = await createEmbedding(cleanDescription);
                    if (transaction.id !== undefined) {
                        await saveEmbedding(transaction.id, cleanDescription, category, embedding);
                    }
                }
            } catch (error) {
                console.error('Error updating embedding:', error);
                // Продолжаем выполнение даже при ошибке обновления embedding
            }
        });
        
        // Ждем завершения обновления всех embeddings
        await Promise.all(embeddingPromises);

        res.status(200).json({
            success: true,
            updatedCount: updatedTransactions.length
        });
    } catch (err: any) {
        console.error('Error in update-category:', err);
        res.status(500).json({
            error: 'Error updating categories',
            details: err.message
        });
    }
});

interface SuggestCategoryRequestBody {
    description: string;
}

// Новый эндпоинт для получения рекомендаций по категории
app.post('/api/transactions/suggest-category', async (req: Request, res: Response) => {
    const { description } = req.body as SuggestCategoryRequestBody;
    
    if (!description) {
        return res.status(400).json({
            error: 'Description is required'
        });
    }
    
    try {
      const ragCategory = await determineCategoryWithRAG(description);
      const keywordCategory = determineKeywordCategory(description);
      // const aiCategory = await determineCategoryWithAI(description);
        
        res.status(200).json({
            success: true,
            category: ragCategory,
            keywordCategory,
            // aiCategory
        });
    } catch (err: any) {
        console.error('Error suggesting category:', err);
        res.status(500).json({
            error: 'Error suggesting category',
            details: err.message
        });
    }
});

interface UpdateSingleCategoryRequestBody {
    id: number;
    category: string;
}

// Новый эндпоинт для обновления категории одной транзакции
app.post('/api/transactions/update-single-category', async (req: Request, res: Response) => {
    const { id, category } = req.body as UpdateSingleCategoryRequestBody;
    
    if (!id || !category) {
        return res.status(400).json({
            error: 'Transaction ID and category are required'
        });
    }

    try {
        // Обновляем категорию в таблице транзакций
        await new Promise<number>((resolve, reject) => {
            db.run(
                `UPDATE transactions SET category = ? WHERE id = ?`,
                [category, id],
                function(this: SQLiteRunResult, err: Error | null) {
                    if (err) {
                        console.error('Error updating category:', err);
                        return reject(err);
                    }
                    resolve(this.changes);
                }
            );
        });
        
        // Получаем обновленную транзакцию для создания нового embedding
        const updatedTransaction: Transaction = await new Promise((resolve, reject) => {
            db.get(
                `SELECT id, description FROM transactions WHERE id = ?`,
                [id],
                (err: Error | null, row: Transaction) => {
                    if (err) {
                        console.error('Error fetching updated transaction:', err);
                        return reject(err);
                    }
                    resolve(row);
                }
            );
        });
        
        if (updatedTransaction && updatedTransaction?.description) {
            // Удаляем старый embedding
            await new Promise<void>((resolve, reject) => {
                db.run(
                    `DELETE FROM transaction_embeddings WHERE transaction_id = ?`,
                    [id],
                    (err: Error | null) => {
                        if (err) {
                            console.error('Error deleting old embedding:', err);
                            return reject(err);
                        }
                        resolve();
                    }
                );
            });
            
            // Парсим время из описания
            const { cleanDescription } = parseTimeFromDescription(updatedTransaction.description);
            
            // Создаем новый embedding
            if (cleanDescription) {
                const embedding = await createEmbedding(cleanDescription);
                if (updatedTransaction.id !== undefined) {
                    await saveEmbedding(updatedTransaction.id, cleanDescription, category, embedding);
                }
            }
        }
        
        res.status(200).json({
            success: true,
            message: 'Transaction category updated successfully'
        });
    } catch (err: any) {
        console.error('Error updating transaction category:', err);
        res.status(500).json({
            error: 'Error updating transaction category',
            details: err.message
        });
    }
});

const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});