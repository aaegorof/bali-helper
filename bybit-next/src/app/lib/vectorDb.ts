import sqlite3 from 'sqlite3';
import path from 'path';
import { anthropic } from "@ai-sdk/anthropic";
import { cosineSimilarity, embed, generateText } from 'ai';
import { transactionCategories } from '@/app/lib/categories';
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
  description: string;
  category: string;
  embedding: string;
  last_used_at: string;
  usage_count: number;
}

interface SimilarTransaction {
  description: string;
  category: string;
  similarity: number;
  usage_count: number;
}

// Создаем подключение к базе данных
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Ошибка при подключении к векторной базе данных:', err.message);
    process.exit(1);
  }
  console.log('Подключение к векторной базе данных успешно');
});

// Функция для удаления дубликатов и обновления структуры данных
async function removeDuplicateEmbeddings(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      try {
        // Создаем временную таблицу для хранения уникальных записей
        db.run(`CREATE TEMPORARY TABLE temp_embeddings AS
          SELECT 
            description,
            MAX(category) as category,
            MAX(embedding) as embedding,
            MAX(last_used_at) as last_used_at,
            SUM(usage_count) as usage_count
          FROM transaction_embeddings
          GROUP BY description`);

        // Удаляем все записи из основной таблицы
        db.run(`DELETE FROM transaction_embeddings`);

        // Копируем данные из временной таблицы обратно в основную
        db.run(`INSERT INTO transaction_embeddings 
          SELECT * FROM temp_embeddings`);

        // Удаляем временную таблицу
        db.run(`DROP TABLE temp_embeddings`);

        console.log('Дубликаты успешно удалены');
        resolve();
      } catch (error) {
        console.error('Ошибка при удалении дубликатов:', error);
        reject(error);
      }
    });
  });
}

// Обновляем функцию инициализации, чтобы она также удаляла дубликаты
async function initializeVectorTables(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      try {
        // Создаем таблицу для хранения embeddings транзакций
        db.run(`CREATE TABLE IF NOT EXISTS transaction_embeddings (
          description TEXT PRIMARY KEY,
          category TEXT,
          embedding TEXT,
          last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          usage_count INTEGER DEFAULT 1
        )`);

        // Удаляем дубликаты после создания таблицы
        removeDuplicateEmbeddings()
          .then(() => resolve())
          .catch((error) => reject(error));

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
  description: string,
  category: string, 
  embedding: number[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Сохраняем embedding как JSON строку
    const embeddingJson = JSON.stringify(embedding);
    
    // Сначала проверяем существующую запись
    db.get(
      `SELECT category FROM transaction_embeddings WHERE description = ?`,
      [description],
      (err: Error | null, row: { category: string } | undefined) => {
        if (err) {
          console.error('Ошибка при проверке существующей записи:', err);
          return reject(err);
        }

        // Если запись существует и категория отличается, обновляем только категорию
        if (row && row.category !== category) {
          db.run(
            `UPDATE transaction_embeddings 
             SET category = ?,
                 last_used_at = CURRENT_TIMESTAMP,
                 usage_count = usage_count + 1
             WHERE description = ?`,
            [category, description],
            function(err: Error | null) {
              if (err) {
                console.error('Ошибка при обновлении категории:', err);
                return reject(err);
              }
              resolve();
            }
          );
        } else {
          // Если записи нет или категория та же, используем INSERT OR REPLACE
          db.run(
            `INSERT OR REPLACE INTO transaction_embeddings 
             (description, category, embedding, last_used_at, usage_count)
             VALUES (?, ?, ?, CURRENT_TIMESTAMP, 1)`,
            [description, category, embeddingJson],
            function(err: Error | null) {
              if (err) {
                console.error('Ошибка при сохранении embedding:', err);
                return reject(err);
              }
              resolve();
            }
          );
        }
      }
    );
  });
}

// Функция для поиска похожих транзакций
async function findSimilarTransactions(description: string, limit = 5): Promise<SimilarTransaction[]> {
  try {
    const queryEmbedding = await createEmbedding(description);
    
    return new Promise((resolve, reject) => {
      // Получаем записи, сортируя по частоте использования и времени последнего использования
      db.all(
        `SELECT description, category, embedding, usage_count 
         FROM transaction_embeddings 
         ORDER BY usage_count DESC, last_used_at DESC 
         LIMIT 1000`,
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
              description: row.description,
              category: row.category,
              similarity: cosineSimilarity(queryEmbedding, rowEmbedding),
              usage_count: row.usage_count
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