import { transactionCategories } from '@/app/transactions/categories';
import { embeddingModel, saveManyEmbeddings } from '@/app/transactions/lib/vectorDb';
import { embedMany } from 'ai';

// 20 items per chunk × 300ms delay ≈ 4,000 RPM sustained — safe for text-embedding-3-small (3,000 RPM free / 1M TPM paid)
const DEFAULT_BATCH_SIZE = 20;
const DEFAULT_DELAY_MS = 300;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function processEmbeddingsInBatches(
  items: Array<{ description: string; category: string }>,
  batchSize: number = DEFAULT_BATCH_SIZE,
  delayMs: number = DEFAULT_DELAY_MS
): Promise<{ processed: number; failed: number }> {
  let processed = 0;
  let failed = 0;

  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);

    try {
      // One API call for the whole chunk — embedMany keeps embeddings in the same order as values
      const { embeddings } = await embedMany({
        model: embeddingModel,
        values: chunk.map((item) => item.description),
      });

      // One bulk upsert for the whole chunk
      await saveManyEmbeddings(
        chunk.map((item, j) => ({
          description: item.description,
          category: item.category as (typeof transactionCategories)[number],
          embedding: embeddings[j],
        }))
      );
      processed += chunk.length;
    } catch (err) {
      // embedMany call itself failed (e.g. 429) — count whole chunk as failed
      console.warn(`embedMany failed for chunk starting at index ${i}:`, err);
      failed += chunk.length;
    }

    // Delay between chunks to stay within OpenAI RPM limits (skip after last chunk)
    if (i + batchSize < items.length) {
      await sleep(delayMs);
    }
  }

  return { processed, failed };
}
