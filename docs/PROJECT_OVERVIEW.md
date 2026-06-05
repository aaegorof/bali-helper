# Project Overview

Quick map of the codebase for agents and developers.

---

## Top-level apps (`src/app/`)

| Path | Description |
|------|-------------|
| `/` (`page.tsx`) | Home — grid of module cards, reads from `src/components/menuItems.tsx` |
| `/permata` | **Main working project.** Financial transaction manager — import, categorize, analyze. See below. |
| `/trading-analyser` | Bybit trading history analysis and performance charts |
| `/apy-calculation` | APY/investment return calculator |
| `/mantlescanner` | Mantle blockchain transaction scanner |
| `/notion` | Notion page/database renderer |
| `/login` | Auth page (Supabase Auth) |
| `/hexagons` | UI experiment / standalone visual |

**Shared infrastructure:**
- `src/app/lib/` — Supabase client (server/client), auth helpers, currencies, utils
- `src/app/types/` — Generated Supabase types (`supabase.ts`) + hand-written extensions (`supabase-extended.ts`)
- `src/app/hooks/` — Shared React hooks
- `src/components/ui/` — shadcn/ui components (can be modified — check before overwriting)
- `src/components/` — App-wide agnostic components

---

## `/permata` — Detailed Structure

Transaction manager: import CSV/XLSX files from multiple banks, auto-categorize via embeddings, filter and analyze.

```
src/app/permata/
├── page.tsx                        # Entry point — layout, TransactionsProvider
├── categories.ts                   # Enum values for transaction_category
│
├── adapters/
│   ├── base-adapter.ts             # BankAdapter interface + NormalizedTransaction type
│   ├── index.ts                    # AVAILABLE_ADAPTERS registry + getAdapterById()
│   ├── permata-adapter.tsx         # Permata Bank CSV/XLSX parser
│   ├── deel-adapter.tsx            # Deel CSV parser
│   └── examples/                  # Sample files and docs for each adapter
│
├── actions/                        # Next.js Server Actions
│   ├── fetch-transactions-supabase.ts  # fetchDataForTableView, fetchTotalCount
│   ├── aggregated-data.ts          # fetchAggregatedData + filterQuery (reusable filter builder)
│   ├── update-category.ts          # Update transaction category
│   └── suggest.ts                  # AI category suggestion via embeddings
│
├── lib/
│   ├── transactions-service.ts     # saveTransactions, deleteTransactions (calls Supabase RPC)
│   ├── TransactionParseResult.ts   # Parsing helpers (date/time extraction)
│   └── vectorDb.ts                 # Embedding creation + similarity search
│
└── components/
    ├── transactions-context.tsx    # Global state: filters, pagination, sorting, data fetching
    ├── transactions.tsx            # Main table component (TanStack Table)
    ├── transaction-columns-copy.tsx # Column definitions + filter component wiring
    ├── transaction-filters-new.tsx # Filter UI components (FilterDates, FilterText, etc.)
    ├── transaction-uploader.tsx    # File upload + adapter selection UI
    ├── bulk-edit.tsx / bulk-edit-dialog.tsx  # Multi-row category editing
    ├── graph.tsx                   # Monthly stats chart
    ├── category-analyzer.tsx       # Category spending chart
    ├── total-amounts.tsx           # Summary totals
    └── pagination.tsx              # Pagination controls
```

### Data flow

1. User selects adapter + uploads file → `transaction-uploader.tsx`
2. `adapter.parse(file)` → `NormalizedTransaction[]`
3. Uploader stamps `source: adapter.id` on each transaction
4. `saveTransactions()` → `insert_unique_transactions` RPC (deduplicates by hash)
5. Embeddings created for new transactions (auto-categorization)
6. `TransactionsContext` fetches updated data → `transactions.tsx` renders table

### Supabase schema (key tables)

- `transactions` — main table, per-user, filtered server-side
- `transaction_embeddings` — for similarity-based category suggestions
- RPC `insert_unique_transactions(_txns: transaction_input[])` — upsert with dedup
