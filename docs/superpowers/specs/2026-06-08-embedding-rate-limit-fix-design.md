# Embedding Rate Limit Fix & Backfill Design

**Date:** 2026-06-08  
**Status:** Approved

---

## Problem

When uploading a file with many transactions, `transactions-service.ts` fires all OpenAI embedding API calls simultaneously via `Promise.all`. This causes:

1. **Rate limit errors (429)** — OpenAI's `text-embedding-3-small` has a requests-per-minute cap. A single upload of 50+ transactions triggers 50+ concurrent requests and immediately hits it.
2. **Upload failures from embedding errors** — any thrown error inside `Promise.all(embeddingPromises)` propagates to the outer catch in `saveTransactions`, returning `{ success: false }` even though the transactions were already committed to the DB.
3. **No backfill path** — there is no way to generate embeddings for transactions that exist in the DB but have no corresponding entry in `transaction_embeddings`.

---

## Constraints

- `transaction_embeddings` table schema must not change (1536-dim `vector`, keyed by `description`)
- Model stays as `text-embedding-3-small` — all 960 existing embeddings remain valid
- `get_similar_transactions_by_embedding` RPC is unchanged
- RAG lookup logic in `vectorDb.ts` is unchanged
- No new Supabase infrastructure (no Edge Functions, no `pg_net`)

---

## Solution: Option B — Controlled Batching + Error Isolation + Backfill

### Part 1 — Batch utility (`embedding-batch.ts`)

Create `src/app/permata/lib/embedding-batch.ts` with a single exported function:

```ts
processEmbeddingsInBatches(
  items: Array<{ description: string; category: string }>,
  batchSize: number = 5,
  delayMs: number = 300
): Promise<{ processed: number; failed: number }>
```

**Behaviour:**
- Splits `items` into chunks of `batchSize`
- Processes each chunk sequentially (not concurrently)
- Within a chunk, calls `createEmbedding` + `saveEmbedding` per item
- Catches errors per item — one failure logs a warning but does not throw
- Waits `delayMs` between chunks to stay within OpenAI rate limits
- Returns a summary `{ processed, failed }`

**Why batch size 5, delay 300ms:**  
`text-embedding-3-small` allows 3,000 RPM on the free tier (1,500 on Tier 0). 5 items per 300ms = ~1,000 RPM sustained — safe margin with headroom for other calls. This can be tuned via constants at the top of the file.

---

### Part 2 — Error isolation in `saveTransactions`

In `transactions-service.ts`, the embedding block after `insert_unique_transactions` must be wrapped so it never causes `saveTransactions` to return `{ success: false }` when transactions were already inserted.

**Current (broken):**
```ts
// This throws into the outer catch if any embedding fails
await Promise.all(embeddingPromises); // ← kills the response
```

**Fixed:**
```ts
// Fire-and-don't-crash: embeddings are best-effort
try {
  await processEmbeddingsInBatches(insertedRows);
} catch (err) {
  console.error('Embedding batch failed (non-fatal):', err);
}
// Return success regardless
```

The `saveTransactions` response already has the correct transaction counts at this point — embedding failures are a background concern and must not pollute the user-facing result.

---

### Part 3 — `prepareTransactions` batching

`prepareTransactions` also calls `determineCategory` → `determineCategoryWithRAG` → `createEmbedding` for every uncategorized transaction — currently also in a `Promise.all`. This should use the same batch pattern.

The category determination step is slightly different: it's a read-only embedding lookup (not a write), and a failure means the transaction gets the keyword-fallback category instead. The existing `try/catch` inside `determineCategory` already handles this gracefully — the fix here is just replacing the outer `Promise.all` with sequential processing to avoid rate limits on the query side too.

**Change:** Replace `Promise.all(transactions.map(...))` in `prepareTransactions` with a sequential `for...of` loop. Category determination blocks the upload response, so it must complete before `saveTransactions` proceeds — but sequential is fine since each call is fast when the embedding DB has good coverage.

---

### Part 4 — Backfill server action

Add `backfillEmbeddings()` to `transactions-service.ts`:

```ts
export async function backfillEmbeddings(): Promise<{
  success: boolean;
  processed?: number;
  failed?: number;
  error?: string;
}>
```

**Logic:**
1. Query all `transactions` rows where `description IS NOT NULL`
2. Query all `description` values from `transaction_embeddings`
3. Compute the set difference: transactions without an embedding entry
4. Run `processEmbeddingsInBatches` on the missing set (using `category` from the transaction row)
5. Return the summary

**UI:** Add a "Regenerate Embeddings" button to the `TransactionUploader` card. It shows a loading spinner, calls `backfillEmbeddings()`, and shows a toast with the result (`processed X, failed Y`). The button is only shown to authenticated users (already gated by the card's parent).

---

## File Changes

| File | Change |
|------|--------|
| `src/app/permata/lib/embedding-batch.ts` | **Create** — batch utility |
| `src/app/permata/lib/transactions-service.ts` | **Modify** — use batch utility in `saveTransactions` and `prepareTransactions`, add `backfillEmbeddings` |
| `src/app/permata/components/transaction-uploader/transaction-uploader.tsx` | **Modify** — add Backfill button |

No DB migrations. No schema changes. No new Supabase resources.

---

## Data Compatibility

| Concern | Status |
|---------|--------|
| Existing 960 embeddings | Fully compatible — same model, same dims |
| `transaction_embeddings` schema | Unchanged |
| `get_similar_transactions_by_embedding` RPC | Unchanged |
| RAG + keyword fallback logic | Unchanged |
| New embeddings generated by this fix | Identical format to existing ones |

---

## Success Criteria

1. Upload of 100+ transactions completes without a 429 error
2. If an individual embedding call fails, the upload still returns `success: true` with correct transaction counts
3. Running `backfillEmbeddings()` populates `transaction_embeddings` for all transactions that are missing entries
4. No existing embedding records are modified or deleted during backfill
