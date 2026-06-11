'use server';

import { hasRequiredRole } from '@/app/lib/route-access-server';
import { processEmbeddingsInBatches } from '@/app/transactions/lib/embedding-batch';
import {
  EmbeddingBackfillItem,
  getMissingEmbeddings,
} from '@/app/transactions/lib/transactions-service';
import { revalidatePath } from 'next/cache';

const REQUIRED_ROLES = ['admin'] as const;

export async function handleGetMissingEmbeddings() {
  const hasAccess = await hasRequiredRole(REQUIRED_ROLES);

  if (!hasAccess) {
    return {
      success: false,
      error: 'Not allowed',
      data: [] as EmbeddingBackfillItem[],
    };
  }

  return getMissingEmbeddings();
}

export async function handleProcessEmbeddingsInBatches(items: EmbeddingBackfillItem[]) {
  const hasAccess = await hasRequiredRole(REQUIRED_ROLES);

  if (!hasAccess) {
    return {
      success: false,
      error: 'Not allowed',
      processed: 0,
      failed: items.length,
    };
  }

  try {
    const result = await processEmbeddingsInBatches(items);
    revalidatePath('/transactions/backfilling');

    return {
      success: true,
      ...result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      error: errorMessage,
      processed: 0,
      failed: items.length,
    };
  }
}
