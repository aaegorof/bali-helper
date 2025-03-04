import sqlite3 from 'sqlite3';
import path from 'path';
import { anthropic } from "@ai-sdk/anthropic";
import { cosineSimilarity, embed, generateText } from 'ai';
import { transactionCategories } from './categories';
import { openai } from '@ai-sdk/openai';

// Исправляем путь к базе данных
const DB_PATH = path.join(process.cwd(), '../transactions.db');

// Initialize the Anthropic client using the new SDK
const MODEL = "claude-3-5-sonnet-20241022";
// const EMBEDDING_MODEL = "voyage-3-lite";
const EMBEDDING_MODEL_OPENAI = "text-embedding-3-small";

// const embeddingModel = voyage.textEmbeddingModel(EMBEDDING_MODEL);
const embeddingModel = openai.embedding(EMBEDDING_MODEL_OPENAI);

// Интерфейсы для типизации
interface TransactionEmbedding {
  id: number;
  transaction_id: number;
  description: string;
  category: string;
  embedding: string;
  created_at: string;
}

interface SimilarTransaction {
  transaction_id: number;
  description: string;
  category: string;
  similarity: number;
}

// Создаем подключение к базе данных
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Ошибка при подключении к векторной базе данных:', err.message);
    process.exit(1);
  }
  console.log('Подключение к векторной базе данных успешно');
});

// Инициализация таблиц для векторной базы данных
async function initializeVectorTables(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      try {
        // Создаем таблицу для хранения embeddings транзакций
        db.run(`CREATE TABLE IF NOT EXISTS transaction_embeddings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          transaction_id INTEGER,
          description TEXT,
          category TEXT,
          embedding TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
        )`);

        // Индексы
        db.run(`CREATE INDEX IF NOT EXISTS idx_transaction_embeddings_transaction_id 
                ON transaction_embeddings(transaction_id)`);

        resolve();
      } catch (error) {
        console.error('Ошибка при инициализации векторных таблиц:', error);
        reject(error);
      }
    });
  });
}

// Функция для создания embedding из описания транзакции с использованием @ai-sdk/anthropic
async function createEmbedding(description: string): Promise<number[]> {
  try {
    const {embedding} = await embed({
      model: embeddingModel,
      value: description,
    });
    
    return embedding;
  } catch (error) {
    console.error('Ошибка при создании embedding:', error);
    throw error;
  }
}

// Новая функция для определения категории с помощью AI
async function determineCategoryWithAI(description: string): Promise<string> {
  try {
    const prompt = `
    Я хочу, чтобы ты определил категорию для банковской транзакции. 
    Транзакции происходят на территории Бали Индонезия.
    Старайся учитывать наиболее известные места для посещения, включая рестораны, отели, магазины и т.д.
    
    Описание транзакции: "${description}"
    
    Доступные категории:
    ${transactionCategories.join(', ')}
    
    Пожалуйста, выбери ТОЛЬКО ОДНУ категорию из списка выше, которая лучше всего подходит для этой транзакции.
    Ответь только названием категории, без дополнительных пояснений.
    `;
    
    const {text} = await generateText({
      model: anthropic(MODEL),
      maxTokens: 1500,
      system: "Ты - помощник, который определяет категории банковских транзакций. Отвечай только названием категории из предложенного списка, без дополнительных пояснений.",
      prompt: prompt
    });
    
    // Извлекаем ответ и очищаем его от лишних пробелов
    const category = text.trim();
    
    // Проверяем, что категория входит в список допустимых категорий
    if (transactionCategories.includes(category as (typeof transactionCategories)[number])) {
      return category;
    } else {
      console.log(`AI предложил категорию "${category}", которая не входит в список допустимых категорий`);
      return "";
    }
  } catch (error) {
    console.error('Ошибка при определении категории с помощью AI:', error);
    return "";
  }
}

// Функция для сохранения embedding в базу данных
async function saveEmbedding(
  transactionId: number, 
  description: string, 
  category: string, 
  embedding: number[]
): Promise<number> {
  return new Promise((resolve, reject) => {
    // Сохраняем embedding как JSON строку
    const embeddingJson = JSON.stringify(embedding);
    
    db.run(
      `INSERT INTO transaction_embeddings (transaction_id, description, category, embedding) 
       VALUES (?, ?, ?, ?)`,
      [transactionId, description, category, embeddingJson],
      function(this: { lastID: number }, err: Error | null) {
        if (err) {
          console.error('Ошибка при сохранении embedding:', err);
          return reject(err);
        }
        
        resolve(this.lastID);
      }
    );
  });
}

// Функция для поиска похожих транзакций
async function findSimilarTransactions(description: string, limit = 5): Promise<SimilarTransaction[]> {
  try {
    const queryEmbedding = await createEmbedding(description);
    
    return new Promise((resolve, reject) => {
      // Добавляем индекс для оптимизации, если его еще нет
      db.run(`CREATE INDEX IF NOT EXISTS idx_transaction_embeddings_created_at 
              ON transaction_embeddings(created_at DESC)`);
      
      // Получаем только последние N записей для сравнения
      db.all(
        `SELECT transaction_id, description, category, embedding 
         FROM transaction_embeddings 
         ORDER BY created_at DESC 
         LIMIT 1000`,  // Ограничиваем выборку последними 1000 записями
        [],
        (err: Error | null, rows: TransactionEmbedding[]) => {
          if (err) {
            console.error('Ошибка при получении embeddings:', err);
            return reject(err);
          }
          
          // Предварительно парсим все embeddings
          const similarities = rows.map(row => {
            const rowEmbedding = JSON.parse(row.embedding);
            return {
              transaction_id: row.transaction_id,
              description: row.description,
              category: row.category,
              similarity: cosineSimilarity(queryEmbedding, rowEmbedding)
            };
          });
          
          // Используем partial sort для оптимизации
          const topK = similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
          
          resolve(topK);
        }
      );
    });
  } catch (error) {
    console.error('Ошибка при поиске похожих транзакций:', error);
    return [];
  }
}

// Функция для определения категории с помощью RAG
async function determineCategoryWithRAG(description: string): Promise<string> {
  try {
    // Ищем похожие транзакции
    const similarTransactions = await findSimilarTransactions(description, 3);
    
    // Если нет похожих транзакций, возвращаем пустую строку
    if (similarTransactions.length === 0) {
      return "";
    }
    console.log(similarTransactions)
    
    // Берем категорию самой похожей транзакции, если сходство выше порога
    const mostSimilar = similarTransactions[0];
    if (mostSimilar.similarity > 0.85) {
      return mostSimilar.category;
    }
    
    return "";
  } catch (error) {
    console.error('Ошибка при определении категории с помощью RAG:', error);
    return "";
  }
}

export {
  db,
  initializeVectorTables,
  createEmbedding,
  saveEmbedding,
  findSimilarTransactions,
  determineCategoryWithAI,
  determineCategoryWithRAG
}; 