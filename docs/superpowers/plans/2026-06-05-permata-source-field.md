# Permata: Source Field + Project Overview — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить поле `source` в транзакции (адаптер-источник), фильтр по нему, и создать файл-ориентир по структуре проекта.

**Architecture:** Postgres enum `adapter_source` хранит идентификатор адаптера. Загрузчик проставляет `source: adapter.id` после парсинга. Фильтрация — multi-select через существующий механизм `filterQuery`. Проектный обзор — markdown файл в `docs/`.

**Tech Stack:** Next.js App Router, TypeScript, Supabase (PostgreSQL), TanStack Table, shadcn/ui, `supabase-js`

---

## Task 1: Project Overview File

**Files:**
- Create: `docs/PROJECT_OVERVIEW.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: Создать `docs/PROJECT_OVERVIEW.md`**

Создать файл со следующим содержимым:

```markdown
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
```

- [ ] **Step 2: Добавить ссылку в `AGENTS.md`**

В `AGENTS.md` найти секцию `## 3. Project structure` и добавить первой строкой после заголовка:

```markdown
> See [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) for a full map of all app sections and the permata project internals.
```

---

## Task 2: Supabase Migration

**Files:**
- Apply via Supabase Dashboard → SQL Editor (нет локальных migrations в проекте)

Выполнить SQL в Supabase Dashboard → SQL Editor для своего проекта:

- [ ] **Step 1: Создать enum `adapter_source`**

```sql
CREATE TYPE adapter_source AS ENUM ('permata', 'deel');
```

- [ ] **Step 2: Добавить столбец `source` в `transactions`**

```sql
ALTER TABLE transactions ADD COLUMN source adapter_source NULL;
```

NULL разрешён — существующие строки без источника, это нормально.

- [ ] **Step 3: Обновить составной тип `transaction_input`**

Postgres позволяет добавить атрибут в composite type:

```sql
ALTER TYPE transaction_input ADD ATTRIBUTE source adapter_source;
```

Если получаем ошибку (тип используется в функции), сначала дропаем функцию, потом меняем тип, потом пересоздаём функцию (см. Step 4–5).

- [ ] **Step 4: Посмотреть текущее тело `insert_unique_transactions`**

В Supabase Dashboard → Database → Functions найти `insert_unique_transactions` и скопировать полное тело функции. Нужно знать текущий INSERT statement.

- [ ] **Step 5: Обновить функцию `insert_unique_transactions`**

В теле функции найти INSERT в таблицу `transactions` и добавить поле `source`:

```sql
-- В SELECT из _txns добавить: t.source
-- В INSERT INTO transactions добавить: source
-- В VALUES добавить: t.source

-- Пример изменения (адаптировать к реальному телу):
-- Было: INSERT INTO transactions (..., category) ... SELECT ..., t.category FROM ...
-- Стало: INSERT INTO transactions (..., category, source) ... SELECT ..., t.category, t.source FROM ...
```

Применить через SQL Editor или через кнопку Edit в Database → Functions.

- [ ] **Step 6: Регенерировать TypeScript типы**

```bash
npm run types
```

Ожидаемый результат: в `src/app/types/supabase.ts` появится:
- В `transactions.Row` поле `source: Database['public']['Enums']['adapter_source'] | null`
- В `transactions.Insert` поле `source?: Database['public']['Enums']['adapter_source'] | null`
- В `Enums` новый тип `adapter_source: 'permata' | 'deel'`
- В `CompositeTypes.transaction_input` поле `source: Database['public']['Enums']['adapter_source'] | null`

---

## Task 3: Экспорт типа в `supabase-extended.ts`

**Files:**
- Modify: `src/app/types/supabase-extended.ts`

- [ ] **Step 1: Добавить экспорт `EnumAdapterSource`**

Открыть `src/app/types/supabase-extended.ts`. В секцию `// Export enum types` добавить строку:

```ts
// Export enum types
export type EnumTransactionCategory = Database['public']['Enums']['transaction_category'];
export type EnumCurrencyCode = Database['public']['Enums']['currency_code'];
export type EnumAdapterSource = Database['public']['Enums']['adapter_source']; // добавить
```

- [ ] **Step 2: Проверить компиляцию**

```bash
npx tsc --noEmit
```

Ожидаемый результат: 0 ошибок (или только уже существующие до этого изменения).

---

## Task 4: `NormalizedTransaction` — добавить `source`

**Files:**
- Modify: `src/app/permata/adapters/base-adapter.ts`

- [ ] **Step 1: Добавить импорт и поле**

Открыть `src/app/permata/adapters/base-adapter.ts`. Добавить импорт `EnumAdapterSource` и поле `source`:

```ts
import { CurrencyCode } from "@/app/lib/currencies";
import { EnumAdapterSource, InsertUniqueTransactionsReq } from "@/app/types/supabase-extended";

export interface NormalizedTransaction extends InsertUniqueTransactionsReq {
  credit_debit: 'Credit' | 'Debit' | null;
  currency: CurrencyCode;
  date: string;
  source: EnumAdapterSource;
}
```

- [ ] **Step 2: Проверить компиляцию**

```bash
npx tsc --noEmit
```

Ожидаемый результат: ошибки в адаптерах (PermataAdapter, DeelAdapter) — они вернут объекты без `source`. Это нормально — исправим в Task 5.

---

## Task 5: Загрузчик — проставлять `source`

**Files:**
- Modify: `src/app/permata/components/transaction-uploader.tsx`

- [ ] **Step 1: Добавить импорт типа**

В начало файла добавить импорт:

```ts
import { EnumAdapterSource } from '@/app/types/supabase-extended';
```

- [ ] **Step 2: Проставлять `source` после парсинга**

Найти в `handleFileUpload` строку:
```ts
const parsedData = await adapter.parse(file);
allParsedData = allParsedData.concat(parsedData);
```

Заменить на:
```ts
const parsedData = await adapter.parse(file);
const parsedWithSource = parsedData.map((t) => ({
  ...t,
  source: adapter.id as EnumAdapterSource,
}));
allParsedData = allParsedData.concat(parsedWithSource);
```

- [ ] **Step 3: Проверить компиляцию**

```bash
npx tsc --noEmit
```

Ожидаемый результат: ошибки по `source` в `base-adapter.ts` должны уйти. Если остались ошибки в адаптерах из-за того что parse() возвращает объекты без source — это нормально, адаптеры возвращают `NormalizedTransaction[]` но без source, а source добавляется снаружи. TypeScript может ругаться что возвращаемый тип не соответствует. Если да — поправить тип возврата `parse()` в интерфейсе BankAdapter:

```ts
// В BankAdapter interface:
parse(file: File): Promise<Omit<NormalizedTransaction, 'source'>[]>;
```

И в `transaction-uploader.tsx` типизировать промежуточный тип явно. Проверить что ошибок нет.

---

## Task 6: Фильтр в `filterQuery`

**Files:**
- Modify: `src/app/permata/actions/aggregated-data.ts`

- [ ] **Step 1: Добавить кейс `source` в `filterQuery`**

Найти в функции `filterQuery` блок `if (filter.id === 'currency')` и добавить после него:

```ts
if (filter.id === 'source' && Array.isArray(filter.value) && filter.value.length > 0) {
  query.in('source', filter.value);
}
```

- [ ] **Step 2: Проверить компиляцию**

```bash
npx tsc --noEmit
```

Ожидаемый результат: 0 новых ошибок.

---

## Task 7: Компонент фильтра `FilterSource`

**Files:**
- Modify: `src/app/permata/components/transaction-filters-new.tsx`

- [ ] **Step 1: Добавить импорт `AVAILABLE_ADAPTERS`**

В начало `transaction-filters-new.tsx` добавить импорт:

```ts
import { AVAILABLE_ADAPTERS } from '@/app/permata/adapters/index';
```

- [ ] **Step 2: Добавить компонент `FilterSource`**

В конец файла (после `FilterCurrency`) добавить:

```tsx
export const FilterSource = ({ column }: { column: Column<TransactionDb> }) => {
  const val = column?.getFilterValue() as string[] | undefined;

  const options = AVAILABLE_ADAPTERS.map((adapter) => ({
    label: adapter.name,
    value: adapter.id,
  }));

  const debouncedSetFilter = useDebounceCallback<typeof column.setFilterValue>((values) => {
    column.setFilterValue(values);
  }, 1200);

  return (
    <MultiSelect
      options={options}
      defaultValue={val}
      value={val}
      onValueChange={debouncedSetFilter}
      placeholder="Select source..."
      maxCount={1}
      className="min-w-[16ch] flex-1"
    />
  );
};
```

- [ ] **Step 3: Проверить компиляцию**

```bash
npx tsc --noEmit
```

Ожидаемый результат: 0 новых ошибок.

---

## Task 8: `defaultFilters` — добавить `source`

**Files:**
- Modify: `src/app/permata/components/transactions-context.tsx`

- [ ] **Step 1: Добавить `source` в `defaultFilters`**

Найти:
```ts
export const defaultFilters: TransactionsContextType['filters'] = [
  { id: 'currency', value: null },
  { id: 'credit_debit', value: null },
];
```

Заменить на:
```ts
export const defaultFilters: TransactionsContextType['filters'] = [
  { id: 'currency', value: null },
  { id: 'credit_debit', value: null },
  { id: 'source', value: null },
];
```

---

## Task 9: Колонка `source` в таблице

**Files:**
- Modify: `src/app/permata/components/transaction-columns-copy.tsx`

- [ ] **Step 1: Добавить импорт `FilterSource`**

Найти строку с импортами из `transaction-filters-new`:
```ts
import {
  DebitCreditFilter,
  FilterAmount,
  FilterCurrency,
  FilterDates,
  FilterText,
  MultiFilterCategory,
} from './transaction-filters-new';
```

Добавить `FilterSource` в список:
```ts
import {
  DebitCreditFilter,
  FilterAmount,
  FilterCurrency,
  FilterDates,
  FilterSource,
  FilterText,
  MultiFilterCategory,
} from './transaction-filters-new';
```

- [ ] **Step 2: Добавить колонку `source`**

После колонки `currency` добавить:

```ts
columnHelper.accessor('source', {
  header: 'Source',
  cell: ({ getValue }) => getValue() ?? '—',
  meta: {
    Filter: FilterSource,
    className: 'w-[10ch]',
  },
}),
```

- [ ] **Step 3: Финальная проверка компиляции**

```bash
npx tsc --noEmit
```

Ожидаемый результат: 0 ошибок.

- [ ] **Step 4: Проверить в браузере**

1. Открыть `/permata`
2. Загрузить файл через Permata адаптер
3. В таблице должна появиться колонка Source со значением `permata`
4. В строке фильтров над таблицей должен появиться multi-select "Select source..."
5. Выбрать `Deel` — таблица должна обновиться (или стать пустой если нет deel транзакций)
