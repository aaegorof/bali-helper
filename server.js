const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(bodyParser.json());


app.post('/api/transactions', (req, res) => {
    const transactions = req.body;

    const query = `INSERT OR REPLACE INTO transactions 
        (posted_date, description, credit_debit, amount, time, transaction_hash) 
        VALUES (?, ?, ?, ?, ?, ?)`;

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

        return {
            posted_date: safeTransaction.posted_date,
            description: cleanDescription,
            credit_debit: safeTransaction.credit_debit,
            amount: safeTransaction.amount,
            time: time,
            hash: transactionHash
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
                transaction.hash
            ], (err) => {
                if (err) {
                    console.error('Error inserting transaction:', err, transaction);
                    // Ignore unique constraint violations
                    if (err.code === 'SQLITE_CONSTRAINT') {
                        resolve();
                    } else {
                        reject(err);
                    }
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

app.get('/api/transactions', (req, res) => {
    const { startDate, endDate, creditDebit } = req.query;

    let query = `SELECT * FROM transactions`;
    const params = [];

    // Добавляем WHERE условия только если есть фильтры
    const conditions = [];
    
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

    // Добавляем WHERE только если есть условия
    if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Добавляем сортировку по дате
    query += ` ORDER BY posted_date DESC`;

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Ошибка при получении транзакций:', err);
            return res.status(500).send('Ошибка при получении транзакций');
        }
        res.status(200).json(rows || []);
    });
});


const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});