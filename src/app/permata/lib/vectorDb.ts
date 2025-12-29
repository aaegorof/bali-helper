import { createClient } from '@/app/lib/supabase/server';
import { catKeywords, transactionCategories } from '@/app/permata/categories';
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { embed, generateText } from 'ai';

// Initialize the Anthropic client using the new SDK
const MODEL = 'claude-3-5-sonnet-20241022';
// const EMBEDDING_MODEL = "voyage-3-lite";
const EMBEDDING_MODEL_OPENAI = 'text-embedding-3-small';

// const embeddingModel = voyage.textEmbeddingModel(EMBEDDING_MODEL);
const embeddingModel = openai.embedding(EMBEDDING_MODEL_OPENAI);

// Интерфейсы для типизации
export interface TransactionEmbedding {
  description: string;
  category: string;
  embedding: string;
  last_used_at: string;
  usage_count: number;
}

export interface SimilarTransaction {
  description: string;
  category: string;
  similarity: number;
  usage_count: number;
}

// Функция для создания embedding из описания транзакции с использованием @ai-sdk/anthropic
async function createEmbedding(description: string): Promise<number[]> {
  try {
    const { embedding } = await embed({
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

    const { text } = await generateText({
      model: anthropic(MODEL),
      maxTokens: 1500,
      system:
        'Ты - помощник, который определяет категории банковских транзакций. Отвечай только названием категории из предложенного списка, без дополнительных пояснений.',
      prompt: prompt,
    });

    // Извлекаем ответ и очищаем его от лишних пробелов
    const category = text.trim();

    // Проверяем, что категория входит в список допустимых категорий
    if (transactionCategories.includes(category as (typeof transactionCategories)[number])) {
      return category;
    } else {
      console.log(
        `AI предложил категорию "${category}", которая не входит в список допустимых категорий`
      );
      return '';
    }
  } catch (error) {
    console.error('Ошибка при определении категории с помощью AI:', error);
    return '';
  }
}

// Функция для сохранения embedding в базу данных
async function saveEmbedding(
  description: string,
  category: string,
  embedding: number[]
): Promise<void> {
  try {
    const supabase = await createClient();
    const embeddingJson = JSON.stringify(embedding);

    // Сначала проверяем существующую запись
    const { data: existingRecord, error: selectError } = await supabase
      .from('transaction_embeddings')
      .select('category, usage_count')
      .eq('description', description)
      .maybeSingle();

    if (selectError) {
      console.error('Ошибка при проверке существующей записи:', selectError);
      throw selectError;
    }

    // Если запись существует и категория отличается, обновляем только категорию
    if (existingRecord && existingRecord.category !== category) {
      const { error: updateError } = await supabase
        .from('transaction_embeddings')
        .update({
          category,
          last_used_at: new Date().toISOString(),
          usage_count: (existingRecord.usage_count || 0) + 1,
        })
        .eq('description', description);

      if (updateError) {
        console.error('Ошибка при обновлении категории:', updateError);
        throw updateError;
      }
    } else {
      // Если записи нет или категория та же, используем upsert
      const { error: upsertError } = await supabase.from('transaction_embeddings').upsert(
        {
          description,
          category,
          embedding: embeddingJson,
          last_used_at: new Date().toISOString(),
          usage_count: 1,
        },
        {
          onConflict: 'description',
        }
      );

      if (upsertError) {
        console.error('Ошибка при сохранении embedding:', upsertError);
        throw upsertError;
      }
    }
  } catch (error) {
    console.error('Ошибка при работе с базой данных:', error);
    throw error;
  }
}

// Функция для поиска похожих транзакций
async function findSimilarTransactions(
  description: string,
  limit = 5,
  threshold = 0.85
): Promise<SimilarTransaction[]> {
  try {
    const queryEmbedding = await createEmbedding(description);
    const supabase = await createClient();

    // Получаем записи, сортируя по частоте использования и времени последнего использования
    // const { data: rows, error } = await supabase
    //   .from('transaction_embeddings')
    //   .select('description, category, embedding, usage_count')
    //   .order('usage_count', { ascending: false })
    //   .order('last_used_at', { ascending: false })
    //   .limit(limit);

    // if (error) {
    //   console.error('Ошибка при получении embeddings:', error);
    //   throw error;
    // }

    const { data: rows, error } = await supabase.rpc('get_similar_transactions_by_embedding', {
      query_embedding: JSON.stringify(queryEmbedding),
      limit_count: limit,
      similarity_threshold: threshold,
    });

    if (error) throw error;

    if (!rows) {
      return [];
    }

    // Предварительно парсим все embeddings и вычисляем сходство
    // const similarities = rows.map((row) => {
    //   const rowEmbedding = JSON.parse(row.embedding || '[]');
    //   return {
    //     description: row.description,
    //     category: row.category || '',
    //     similarity: cosineSimilarity(queryEmbedding, rowEmbedding),
    //     usage_count: row.usage_count || 0,
    //   };
    // });

    // Используем partial sort для оптимизации
    // const topK = similarities.sort((a, b) => b.similarity - a.similarity).slice(0, limit);

    return rows as SimilarTransaction[];
  } catch (error) {
    console.error('Ошибка при поиске похожих транзакций:', error);
    return [];
  }
}

// Функция для определения категории с помощью RAG
async function determineCategoryWithRAG(
  description: string,
  similarityThreshold = 0.85
): Promise<string> {
  try {
    // Ищем похожие транзакции
    const similarTransactions = await findSimilarTransactions(description, 3, similarityThreshold);

    // Если нет похожих транзакций, возвращаем пустую строку
    if (similarTransactions.length === 0) {
      return '';
    }
    console.log(similarTransactions);

    // Берем категорию самой похожей транзакции, если сходство выше порога
    const mostSimilar = similarTransactions[0];
    if (mostSimilar.similarity > similarityThreshold) {
      return mostSimilar.category;
    }

    return '';
  } catch (error) {
    console.error('Ошибка при определении категории с помощью RAG:', error);
    return '';
  }
}

/**
 * Counts the number of matching words between a string and an array of keywords
 * @param description The string to check for matches
 * @param keywords Array of keywords to match against
 * @returns The number of matching keywords found in the description
 */
function countMatchingKeywords(description: string, keywords: string[]): number {
  if (!description || !keywords.length) return 0;

  const lowerDesc = description.toLowerCase();
  let matchCount = 0;

  for (const keyword of keywords) {
    if (lowerDesc.includes(keyword.toLowerCase())) {
      matchCount++;
    }
  }

  return matchCount;
}

function determineKeywordCategory(description: string): string {
  if (!description) return '';

  const lowerDesc = description.toLowerCase();

  // Находим группу с наибольшим количеством совпадений
  let maxMatchCount = 0;
  let bestMatchGroup = '';

  for (const [group, keywords] of Object.entries(catKeywords)) {
    const matchCount = countMatchingKeywords(lowerDesc, keywords);
    if (matchCount > maxMatchCount) {
      maxMatchCount = matchCount;
      bestMatchGroup = group;
    }
  }

  return bestMatchGroup;
}

async function determineCategory(description: string | null): Promise<string> {
  if (!description || description === null) return '';

  try {
    // Сначала пробуем определить категорию с помощью AI
    // const aiCategory = await determineCategoryWithAI(description);

    // // Если AI вернул категорию, используем ее
    // if (aiCategory) {
    //   console.log(`AI определил категорию "${aiCategory}" для "${description}"`);
    //   return aiCategory;
    // }

    // Затем пробуем определить категорию с помощью RAG
    const ragCategory = await determineCategoryWithRAG(description);

    // Если RAG вернул категорию, используем ее
    if (ragCategory) {
      console.log(`RAG определил категорию "${ragCategory}" для "${description}"`);
    }
    // Иначе используем определение по ключевым словам
    const keywordCategory = determineKeywordCategory(description);

    return ragCategory || keywordCategory;
  } catch (error) {
    console.error('Ошибка при определении категории:', error);
    // В случае ошибки используем определение по ключевым словам
    return determineKeywordCategory(description);
  }
}

export {
  createEmbedding,
  determineCategory,
  determineCategoryWithAI,
  determineCategoryWithRAG,
  determineKeywordCategory,
  findSimilarTransactions,
  saveEmbedding,
};
