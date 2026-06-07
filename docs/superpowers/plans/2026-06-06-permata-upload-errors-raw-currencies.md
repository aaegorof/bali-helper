# Permata Upload Errors And Currency Enum Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show adapter-level unprocessed transaction rows after upload, persist those error records with user/time/content, add Vietnam/Malaysia/China/Thailand/UAE currencies, and refresh the Supabase-backed transaction table after successful inserts.

**Architecture:** Successful `transactions` rows do not store raw source data. Each adapter returns normalized transactions plus `unprocessed` row errors; the uploader shows all unprocessed records in a toast and saves them to `transaction_import_errors` with RLS. Currency changes are made in Supabase first, then generated types and the local currency map are updated.

**Tech Stack:** Next.js App Router, TypeScript, Supabase PostgreSQL, Supabase generated types, TanStack Table, shadcn/ui, `sonner`, `xlsx`, `papaparse`.

---

## Scope Decisions

- Do not add `raw_transaction` to `transactions`.
- Do not change `transaction_input`.
- Do not edit `insert_unique_transactions` for raw data.
- Store only failed/unprocessed adapter records in `transaction_import_errors`.
- Add select/delete RLS for import errors so a future UI can view and clear them, but do not build that history UI in this plan.
- Do not commit during execution unless the user explicitly asks for a commit.

## File Structure

- Modify via Supabase Dashboard SQL Editor: `public.currency_code`, new `public.transaction_import_errors`.
- Regenerate: `src/app/types/supabase.ts`.
- Modify: `src/app/types/supabase-extended.ts`.
- Modify: `src/app/lib/currencies.ts`.
- Create: `src/app/lib/currencies.test-d.ts`.
- Modify: `src/app/permata/adapters/base-adapter.ts`.
- Modify: `src/app/permata/adapters/permata-adapter.tsx`.
- Modify: `src/app/permata/adapters/deel-adapter.tsx`.
- Create: `src/app/permata/adapters/base-adapter.test-d.ts`.
- Create: `src/app/permata/lib/transaction-import-errors-service.ts`.
- Create: `src/app/permata/lib/transaction-import-errors-service.test-d.ts`.
- Modify: `src/app/permata/components/transactions-context.tsx`.
- Move: `src/app/permata/components/transaction-uploader.tsx` to `src/app/permata/components/transaction-uploader/transaction-uploader.tsx`.
- Create: `src/app/permata/components/transaction-uploader/unprocessed-transactions-toast.tsx`.
- Modify: `src/app/permata/page.tsx`.

---

### Task 1: Supabase Schema For Currencies And Import Errors

**Files:**
- Modify via Supabase Dashboard SQL Editor.
- Regenerate: `src/app/types/supabase.ts`.

- [ ] **Step 1: Verify current schema**

Run this SQL in Supabase Dashboard SQL Editor:

```sql
select enumlabel
from pg_enum
where enumtypid = 'public.currency_code'::regtype
order by enumsortorder;

select column_name, data_type, udt_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'transaction_import_errors'
order by ordinal_position;
```

Expected before the schema change:

- `currency_code` does not include `VND`, `MYR`, `CNY`, `THB`, or `AED`.
- `transaction_import_errors` may not exist.

- [ ] **Step 2: Apply enum values and create the error table**

Run this SQL in Supabase Dashboard SQL Editor:

```sql
create extension if not exists pgcrypto;

alter type public.currency_code add value if not exists 'VND';
alter type public.currency_code add value if not exists 'MYR';
alter type public.currency_code add value if not exists 'CNY';
alter type public.currency_code add value if not exists 'THB';
alter type public.currency_code add value if not exists 'AED';

create table if not exists public.transaction_import_errors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source public.adapter_source not null,
  file_names text[] not null default '{}',
  error_count integer not null default 0,
  errors jsonb not null default '[]'::jsonb,
  constraint transaction_import_errors_errors_is_array check (jsonb_typeof(errors) = 'array'),
  constraint transaction_import_errors_error_count_nonnegative check (error_count >= 0)
);

alter table public.transaction_import_errors enable row level security;

drop policy if exists transaction_import_errors_select_own
  on public.transaction_import_errors;

create policy transaction_import_errors_select_own
  on public.transaction_import_errors
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists transaction_import_errors_insert_own
  on public.transaction_import_errors;

create policy transaction_import_errors_insert_own
  on public.transaction_import_errors
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists transaction_import_errors_delete_own
  on public.transaction_import_errors;

create policy transaction_import_errors_delete_own
  on public.transaction_import_errors
  for delete
  to authenticated
  using (user_id = auth.uid());
```

Expected result: SQL succeeds. If Postgres reports that new enum values must be committed before reuse, rerun only the `create table` and policy block in a fresh SQL Editor execution.

- [ ] **Step 3: Verify schema shape after SQL changes**

Run this SQL:

```sql
select enumlabel
from pg_enum
where enumtypid = 'public.currency_code'::regtype
order by enumsortorder;

select column_name, data_type, udt_name, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'transaction_import_errors'
order by ordinal_position;
```

Expected result:

- `currency_code` includes `VND`, `MYR`, `CNY`, `THB`, `AED`.
- `transaction_import_errors` exists with `id`, `created_at`, `user_id`, `source`, `file_names`, `error_count`, `errors`.
- There is no required `raw_transaction` column on `transactions`.

- [ ] **Step 4: Regenerate Supabase types**

Run:

```bash
npm run types
```

Expected result:

- Command exits with code 0.
- `src/app/types/supabase.ts` has `currency_code: 'RUB' | 'USD' | 'AUD' | 'GBP' | 'IDR' | 'EUR' | 'VND' | 'MYR' | 'CNY' | 'THB' | 'AED'`.
- `src/app/types/supabase.ts` has a `transaction_import_errors` table entry.
- `transactions.Row` does not need a `raw_transaction` field for this plan.

---

### Task 2: Currency Type Coverage And Local Currency Map

**Files:**
- Create: `src/app/lib/currencies.test-d.ts`.
- Modify: `src/app/lib/currencies.ts`.

- [ ] **Step 1: Write the failing type coverage test**

Create `src/app/lib/currencies.test-d.ts`:

```ts
import { CURRENCIES, CurrencyCode } from './currencies';

type Assert<T extends true> = T;
type Includes<Union, Member> = Member extends Union ? true : false;

type _vndIsSupabaseCurrency = Assert<Includes<CurrencyCode, 'VND'>>;
type _myrIsSupabaseCurrency = Assert<Includes<CurrencyCode, 'MYR'>>;
type _cnyIsSupabaseCurrency = Assert<Includes<CurrencyCode, 'CNY'>>;
type _thbIsSupabaseCurrency = Assert<Includes<CurrencyCode, 'THB'>>;
type _aedIsSupabaseCurrency = Assert<Includes<CurrencyCode, 'AED'>>;

const requiredCurrencyCodes = [
  CURRENCIES.VND.code,
  CURRENCIES.MYR.code,
  CURRENCIES.CNY.code,
  CURRENCIES.THB.code,
  CURRENCIES.AED.code,
] satisfies CurrencyCode[];
```

- [ ] **Step 2: Run the type check and verify it fails**

Run:

```bash
npx tsc --noEmit --pretty false
```

Expected failure before `currencies.ts` is updated:

```text
Property 'VND' does not exist
```

If Task 1 types were not regenerated, the type check also fails with:

```text
Type 'false' does not satisfy the constraint 'true'
```

- [ ] **Step 3: Add the new currencies to the local map**

In `src/app/lib/currencies.ts`, keep the existing currencies and add these entries before `} as const;`:

```ts
  VND: {
    code: 'VND' as CurrencyCode,
    name: 'Vietnamese Dong',
    symbol: '₫',
    locale: 'vi-VN',
  },
  MYR: {
    code: 'MYR' as CurrencyCode,
    name: 'Malaysian Ringgit',
    symbol: 'RM',
    locale: 'ms-MY',
  },
  CNY: {
    code: 'CNY' as CurrencyCode,
    name: 'Chinese Yuan',
    symbol: '¥',
    locale: 'zh-CN',
  },
  THB: {
    code: 'THB' as CurrencyCode,
    name: 'Thai Baht',
    symbol: '฿',
    locale: 'th-TH',
  },
  AED: {
    code: 'AED' as CurrencyCode,
    name: 'UAE Dirham',
    symbol: 'د.إ',
    locale: 'ar-AE',
  },
```

- [ ] **Step 4: Run the type check and verify it passes for currencies**

Run:

```bash
npx tsc --noEmit --pretty false
```

Expected result: no errors from `src/app/lib/currencies.test-d.ts`.

---

### Task 3: Adapter Contract Returns Unprocessed Rows

**Files:**
- Create: `src/app/permata/adapters/base-adapter.test-d.ts`.
- Modify: `src/app/permata/adapters/base-adapter.ts`.

- [ ] **Step 1: Write the failing adapter contract test**

Create `src/app/permata/adapters/base-adapter.test-d.ts`:

```ts
import { Json } from '@/app/types/supabase';
import {
  AdapterParseResult,
  AdapterUnprocessedTransaction,
  NormalizedTransaction,
} from './base-adapter';

type Assert<T extends true> = T;

type _normalizedDoesNotCarryRaw = Assert<
  'raw_transaction' extends keyof NormalizedTransaction ? false : true
>;

type _unprocessedCarriesRaw = Assert<
  AdapterUnprocessedTransaction extends { raw: Json; reason: string; rowNumber: number | null }
    ? true
    : false
>;

type _parseResultHasBothLists = Assert<
  AdapterParseResult extends {
    transactions: Omit<NormalizedTransaction, 'source'>[];
    unprocessed: AdapterUnprocessedTransaction[];
  }
    ? true
    : false
>;
```

- [ ] **Step 2: Run the type check and verify it fails**

Run:

```bash
npx tsc --noEmit --pretty false
```

Expected failure before `base-adapter.ts` is updated:

```text
Module '"./base-adapter"' has no exported member 'AdapterParseResult'
```

- [ ] **Step 3: Update the base adapter contract**

Replace `src/app/permata/adapters/base-adapter.ts` with:

```ts
import { CurrencyCode } from '@/app/lib/currencies';
import { Json } from '@/app/types/supabase';
import { EnumAdapterSource, InsertUniqueTransactionsReq } from '@/app/types/supabase-extended';

export interface AdapterUnprocessedTransaction {
  fileName: string;
  rowNumber: number | null;
  reason: string;
  raw: Json;
}

export interface AdapterParseResult {
  transactions: Omit<NormalizedTransaction, 'source'>[];
  unprocessed: AdapterUnprocessedTransaction[];
}

export interface NormalizedTransaction extends InsertUniqueTransactionsReq {
  // rewrited to make sure they are not nulled. please dont remove this comment
  credit_debit: 'Credit' | 'Debit' | null;
  currency: CurrencyCode;
  date: string;
  source: EnumAdapterSource;
}

export function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value ?? null)) as Json;
}

export interface BankAdapter {
  /**
   * Уникальный идентификатор адаптера
   */
  id: EnumAdapterSource;

  /**
   * Название банка для отображения в UI
   */
  name: string;

  /**
   * Описание формата файла
   */
  description: React.ReactNode;

  /**
   * Поддерживаемые форматы файлов
   */
  supportedFormats: string[];

  /**
   * Парсит файл и возвращает нормализованные транзакции и необработанные строки
   */
  parse(file: File): Promise<AdapterParseResult>;

  /**
   * Опциональная валидация файла перед парсингом
   */
  validate?(file: File): Promise<boolean>;
}
```

- [ ] **Step 4: Run the type check**

Run:

```bash
npx tsc --noEmit --pretty false
```

Expected result: adapter implementations fail because they still return arrays. Task 4 updates them.

---

### Task 4: Permata Adapter Collects Unprocessed Rows

**Files:**
- Modify: `src/app/permata/adapters/permata-adapter.tsx`.

- [ ] **Step 1: Update imports**

In `src/app/permata/adapters/permata-adapter.tsx`, replace the adapter import with:

```ts
import {
  AdapterParseResult,
  AdapterUnprocessedTransaction,
  BankAdapter,
  NormalizedTransaction,
  toJson,
} from './base-adapter';
```

Also add `isValid` to the `date-fns` import:

```ts
import { format, isValid, parse } from 'date-fns';
```

- [ ] **Step 2: Make normalization fail explicitly per row**

Replace `normalizePermataTransaction` with:

```ts
const normalizePermataTransaction = (
  raw: PermataRawTransaction
): Omit<NormalizedTransaction, 'source'> => {
  const { time, cleanDescription } = parseTimeFromDescription(raw.Description || '');
  const postedDate = raw['Posted Date (mm/dd/yyyy)'] ?? '';
  const parsedDate = parse(`${postedDate} ${time ?? '00:00:00'}`, 'MM/dd/yyyy HH:mm:ss', new Date());

  if (!postedDate || !isValid(parsedDate)) {
    throw new Error('Invalid posted date');
  }

  if (raw['Credit/Debit'] !== 'Credit' && raw['Credit/Debit'] !== 'Debit') {
    throw new Error('Invalid credit/debit value');
  }

  const amount = parseFloat(
    raw.Amount.replace(/[^0-9.-]+/g, '')
      ?.split('.')
      ?.at(0) ?? '0'
  );

  if (!Number.isFinite(amount)) {
    throw new Error('Invalid amount');
  }

  return {
    description: cleanDescription ?? '',
    credit_debit: raw['Credit/Debit'],
    amount,
    currency: CURRENCIES.IDR.code,
    date: format(parsedDate, "yyyy-MM-dd'T'HH:mm:ss"),
    category: null,
  };
};
```

- [ ] **Step 3: Return both normalized transactions and unprocessed rows**

Replace the `parse(file: File)` method with:

```ts
  async parse(file: File): Promise<AdapterParseResult> {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    let rawTransactions: PermataRawTransaction[] = [];

    if (fileExtension === 'csv') {
      const text = await file.text();
      rawTransactions = parseCSV(text);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      rawTransactions = XLSX.utils.sheet_to_json(worksheet) as PermataRawTransaction[];
    } else {
      throw new Error(`Unsupported file format: ${fileExtension}`);
    }

    const transactions: Omit<NormalizedTransaction, 'source'>[] = [];
    const unprocessed: AdapterUnprocessedTransaction[] = [];

    rawTransactions.forEach((raw, index) => {
      try {
        transactions.push(normalizePermataTransaction(raw));
      } catch (error) {
        unprocessed.push({
          fileName: file.name,
          rowNumber: index + 1,
          reason: error instanceof Error ? error.message : 'Unknown parsing error',
          raw: toJson(raw),
        });
      }
    });

    return { transactions, unprocessed };
  }
```

- [ ] **Step 4: Run the type check**

Run:

```bash
npx tsc --noEmit --pretty false
```

Expected result: no errors from `permata-adapter.tsx`. `deel-adapter.tsx` may still fail until Task 5.

---

### Task 5: Deel Adapter Collects Unprocessed Rows

**Files:**
- Modify: `src/app/permata/adapters/deel-adapter.tsx`.

- [ ] **Step 1: Update imports**

In `src/app/permata/adapters/deel-adapter.tsx`, replace the base-adapter import with:

```ts
import {
  AdapterParseResult,
  AdapterUnprocessedTransaction,
  BankAdapter,
  NormalizedTransaction,
  toJson,
} from './base-adapter';
```

- [ ] **Step 2: Make normalization fail explicitly per row**

Inside `normalizeDeelTransaction`, after `const originalAmount = parseFloat(raw.originalAmount || '0');`, add:

```ts
  if (!Number.isFinite(originalAmount)) {
    throw new Error('Invalid original amount');
  }
```

After the timestamp parse block, add:

```ts
  if (!timestamp) {
    throw new Error('Invalid transaction date');
  }
```

Keep the existing `if (raw.status === 'DECLINED') return null;` behavior. Declined rows are intentionally skipped, not saved as adapter errors.

- [ ] **Step 3: Return both normalized transactions and unprocessed rows**

Replace the `parse(file: File)` method with:

```ts
  async parse(file: File): Promise<AdapterParseResult> {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    let rawTransactions: DeelRawTransaction[] = [];

    if (fileExtension === 'csv') {
      const text = await file.text();
      rawTransactions = parseCSV(text);
    } else {
      throw new Error(`Unsupported file format: ${fileExtension}`);
    }

    const transactions: Omit<NormalizedTransaction, 'source'>[] = [];
    const unprocessed: AdapterUnprocessedTransaction[] = [];

    rawTransactions.forEach((raw, index) => {
      try {
        const transaction = normalizeDeelTransaction(raw);
        if (transaction) {
          transactions.push(transaction);
        }
      } catch (error) {
        unprocessed.push({
          fileName: file.name,
          rowNumber: index + 1,
          reason: error instanceof Error ? error.message : 'Unknown parsing error',
          raw: toJson(raw),
        });
      }
    });

    return { transactions, unprocessed };
  }
```

- [ ] **Step 4: Run the type check**

Run:

```bash
npx tsc --noEmit --pretty false
```

Expected result: no errors from adapter files.

---

### Task 6: Supabase Extended Types For Import Errors

**Files:**
- Modify: `src/app/types/supabase-extended.ts`.

- [ ] **Step 1: Export import-error table aliases**

In `src/app/types/supabase-extended.ts`, add these aliases next to the existing table aliases:

```ts
export type TransactionImportError =
  Database['public']['Tables']['transaction_import_errors']['Row'];
```

Add this insert alias next to existing insert aliases:

```ts
export type TransactionImportErrorInsert =
  Database['public']['Tables']['transaction_import_errors']['Insert'];
```

Add this update alias next to existing update aliases:

```ts
export type TransactionImportErrorUpdate =
  Database['public']['Tables']['transaction_import_errors']['Update'];
```

- [ ] **Step 2: Run the type check**

Run:

```bash
npx tsc --noEmit --pretty false
```

Expected result: no errors from `src/app/types/supabase-extended.ts`.

---

### Task 7: Persist Unprocessed Import Errors

**Files:**
- Create: `src/app/permata/lib/transaction-import-errors-service.test-d.ts`.
- Create: `src/app/permata/lib/transaction-import-errors-service.ts`.

- [ ] **Step 1: Write the failing service type test**

Create `src/app/permata/lib/transaction-import-errors-service.test-d.ts`:

```ts
import { AdapterUnprocessedTransaction } from '@/app/permata/adapters';
import {
  SaveTransactionImportErrorsRequest,
  SaveTransactionImportErrorsResult,
} from './transaction-import-errors-service';

const request = {
  source: 'permata',
  fileNames: ['transactions.csv'],
  errors: [
    {
      fileName: 'transactions.csv',
      rowNumber: 3,
      reason: 'Invalid amount',
      raw: { Amount: 'abc' },
    },
  ] satisfies AdapterUnprocessedTransaction[],
} satisfies SaveTransactionImportErrorsRequest;

declare const result: SaveTransactionImportErrorsResult;

if (result.success) {
  result.data.id satisfies string;
  result.data.error_count satisfies number;
} else {
  result.error satisfies string;
}

request.source satisfies 'permata' | 'deel';
```

- [ ] **Step 2: Run the type check and verify it fails**

Run:

```bash
npx tsc --noEmit --pretty false
```

Expected failure before the service exists:

```text
Cannot find module './transaction-import-errors-service'
```

- [ ] **Step 3: Create the import-error persistence service**

Create `src/app/permata/lib/transaction-import-errors-service.ts`:

```ts
'use server';

import { createClient } from '@/app/lib/supabase/server';
import { AdapterUnprocessedTransaction } from '@/app/permata/adapters';
import { Json } from '@/app/types/supabase';
import {
  EnumAdapterSource,
  TransactionImportErrorInsert,
} from '@/app/types/supabase-extended';

export type SaveTransactionImportErrorsRequest = {
  source: EnumAdapterSource;
  fileNames: string[];
  errors: AdapterUnprocessedTransaction[];
};

export type SaveTransactionImportErrorsResult =
  | {
      success: true;
      data: {
        id: string;
        error_count: number;
      };
    }
  | {
      success: false;
      error: string;
      details?: string;
    };

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value ?? null)) as Json;
}

export async function saveTransactionImportErrors({
  errors,
  fileNames,
  source,
}: SaveTransactionImportErrorsRequest): Promise<SaveTransactionImportErrorsResult> {
  if (errors.length === 0) {
    return {
      success: false,
      error: 'No import errors to save',
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: 'User is not authenticated',
      };
    }

    const payload: TransactionImportErrorInsert = {
      user_id: user.id,
      source,
      file_names: fileNames,
      error_count: errors.length,
      errors: toJson(errors),
    };

    const { data, error } = await supabase
      .from('transaction_import_errors')
      .insert(payload)
      .select('id, error_count')
      .single();

    if (error) {
      return {
        success: false,
        error: 'Failed to save import errors',
        details: error.message,
      };
    }

    return {
      success: true,
      data: {
        id: data.id,
        error_count: data.error_count,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to save import errors',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

- [ ] **Step 4: Run the type check**

Run:

```bash
npx tsc --noEmit --pretty false
```

Expected result: no errors from `transaction-import-errors-service.ts` or its type test.

---

### Task 8: Refresh The Current Supabase View After Uploads

**Files:**
- Modify: `src/app/permata/components/transactions-context.tsx`.

- [ ] **Step 1: Add `refreshCurrentView` to the context type**

In `TransactionsContextType`, add:

```ts
  refreshCurrentView: () => Promise<void>;
```

- [ ] **Step 2: Convert fetchers to stable callbacks and add refresh**

In `src/app/permata/components/transactions-context.tsx`, replace the current `fetchTransactions`, `fetchMonthlyStats`, `fetchTotals`, and `useEffect` block with:

```ts
  const fetchTransactions = useCallback(
    async ({
      pagination,
      filters,
      sorting,
    }: {
      pagination: PaginationState;
      filters: ColumnFiltersState;
      sorting: SortingState;
    }) => {
      try {
        if (!user?.id) {
          return [];
        }

        const response = await fetchDataForTableView({
          userId: user.id,
          pagination,
          filters,
          sorting,
        });
        const { transactions, count } = response;

        setTransactions(transactions || []);
        setCount(count || 0);
        return transactions || [];
      } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }
    },
    [user?.id]
  );

  const fetchMonthlyStats = useCallback(
    async (filters: ColumnFiltersState) => {
      if (!user?.id) return;

      try {
        const data = await fetchAggregatedData({ userId: user.id, filters });
        setMonthlyStats(data.monthly);
        setCategoryStats(data.category);
      } catch (err) {
        console.error('Error fetching monthly stats:', err);
      }
    },
    [user?.id]
  );

  const fetchTotals = useCallback(async () => {
    if (!user?.id) return;
    const data = await fetchTotalCount();
    setTotalCount(data);
  }, [user?.id]);

  const refreshCurrentView = useCallback(async () => {
    await Promise.all([
      fetchTransactions({ pagination, filters, sorting }),
      fetchMonthlyStats(filters),
      fetchTotals(),
    ]);
  }, [fetchMonthlyStats, fetchTotals, fetchTransactions, filters, pagination, sorting]);

  useEffect(() => {
    refreshCurrentView();
  }, [refreshCurrentView]);
```

- [ ] **Step 3: Add `refreshCurrentView` to the provider value**

In the `TransactionsContext.Provider` value object, add:

```ts
        refreshCurrentView,
```

- [ ] **Step 4: Run the type check**

Run:

```bash
npx tsc --noEmit --pretty false
```

Expected result: no errors from `transactions-context.tsx`.

---

### Task 9: Uploader Toasts And Saves Unprocessed Rows

**Files:**
- Create: `src/app/permata/components/transaction-uploader/unprocessed-transactions-toast.tsx`.
- Move/Modify: `src/app/permata/components/transaction-uploader.tsx` -> `src/app/permata/components/transaction-uploader/transaction-uploader.tsx`.
- Modify: `src/app/permata/page.tsx`.

- [ ] **Step 1: Create the toast helper**

Create `src/app/permata/components/transaction-uploader/unprocessed-transactions-toast.tsx`:

```tsx
import { AdapterUnprocessedTransaction } from '@/app/permata/adapters';
import { toast } from 'sonner';

export function showUnprocessedTransactionsToast(options: {
  errors: AdapterUnprocessedTransaction[];
  referenceId?: string;
}) {
  const { errors, referenceId } = options;

  if (errors.length === 0) {
    return;
  }

  toast.error(
    <div className="flex max-h-96 flex-col gap-3 overflow-auto">
      <div className="flex flex-col gap-1">
        <span className="font-medium">{errors.length} transactions were not imported</span>
        {referenceId && (
          <span className="text-xs text-muted-foreground">Saved error reference: {referenceId}</span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {errors.map((error, index) => (
          <div key={`${error.fileName}-${error.rowNumber ?? index}-${index}`} className="text-xs">
            <div className="font-medium">
              {error.fileName}
              {error.rowNumber ? `, row ${error.rowNumber}` : ''}
            </div>
            <div className="text-muted-foreground">{error.reason}</div>
            <pre className="mt-1 whitespace-pre-wrap rounded border p-2">
              {JSON.stringify(error.raw, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>,
    {
      duration: 15000,
    }
  );
}
```

- [ ] **Step 2: Move the uploader file**

Run:

```bash
mkdir -p src/app/permata/components/transaction-uploader
mv src/app/permata/components/transaction-uploader.tsx src/app/permata/components/transaction-uploader/transaction-uploader.tsx
```

- [ ] **Step 3: Update uploader imports**

In `src/app/permata/components/transaction-uploader/transaction-uploader.tsx`, add:

```ts
import {
  AdapterUnprocessedTransaction,
  AVAILABLE_ADAPTERS,
  getAdapterById,
  NormalizedTransaction,
} from '@/app/permata/adapters';
import { saveTransactionImportErrors } from '@/app/permata/lib/transaction-import-errors-service';
import { showUnprocessedTransactionsToast } from './unprocessed-transactions-toast';
```

Remove the old import that imported `AVAILABLE_ADAPTERS`, `getAdapterById`, and `NormalizedTransaction` without `AdapterUnprocessedTransaction`.

- [ ] **Step 4: Use `refreshCurrentView` instead of `setTransactions`**

Replace:

```ts
  const { setTransactions } = useTransactionsContext();
```

with:

```ts
  const { refreshCurrentView } = useTransactionsContext();
```

- [ ] **Step 5: Save and toast adapter errors after parsing**

Inside `handleFileUpload`, after `let allParsedData: NormalizedTransaction[] = [];`, add:

```ts
    let allUnprocessed: AdapterUnprocessedTransaction[] = [];
```

Replace:

```ts
          const parsedData = await adapter.parse(file);
          const parsedWithSource = parsedData.map((t) => ({
            ...t,
            source: adapter.id,
          }));
          allParsedData = allParsedData.concat(parsedWithSource);
```

with:

```ts
          const parsedData = await adapter.parse(file);
          const parsedWithSource = parsedData.transactions.map((t) => ({
            ...t,
            source: adapter.id,
          }));
          allParsedData = allParsedData.concat(parsedWithSource);
          allUnprocessed = allUnprocessed.concat(parsedData.unprocessed);
```

Replace the per-file `catch` block body with:

```ts
          console.error(`Error parsing file ${file.name}:`, error);
          allUnprocessed.push({
            fileName: file.name,
            rowNumber: null,
            reason: error instanceof Error ? error.message : 'Unknown file parsing error',
            raw: file.name,
          });
```

After the file loop and before `if (allParsedData.length === 0)`, add:

```ts
      if (allUnprocessed.length > 0) {
        const savedErrors = await saveTransactionImportErrors({
          source: adapter.id,
          fileNames: files.map((file) => file.name),
          errors: allUnprocessed,
        });

        showUnprocessedTransactionsToast({
          errors: allUnprocessed,
          referenceId: savedErrors.success ? savedErrors.data.id : undefined,
        });

        if (!savedErrors.success) {
          toast.error(savedErrors.details ?? savedErrors.error);
        }
      }
```

- [ ] **Step 6: Refresh after successful database save**

Replace:

```ts
      if (res.success && res.data?.inserted_rows) {
        setTransactions(res.data.inserted_rows);
      }
```

with:

```ts
      if (res.success) {
        await refreshCurrentView();
      }
```

- [ ] **Step 7: Update the page import**

In `src/app/permata/page.tsx`, replace:

```ts
import TransactionUploader from './components/transaction-uploader';
```

with:

```ts
import TransactionUploader from './components/transaction-uploader/transaction-uploader';
```

- [ ] **Step 8: Run the type check**

Run:

```bash
npx tsc --noEmit --pretty false
```

Expected result: no errors from uploader files.

---

### Task 10: Verification

**Files:**
- No new files.

- [ ] **Step 1: Run generated type validation**

Run:

```bash
npm run types
```

Expected result: command exits with code 0 and keeps the generated currency enum and `transaction_import_errors` table types.

- [ ] **Step 2: Run full TypeScript validation**

Run:

```bash
npx tsc --noEmit --pretty false
```

Expected result: command exits with code 0.

- [ ] **Step 3: Run lint**

Run:

```bash
npm run lint
```

Expected result: command exits with code 0, or only reports pre-existing lint errors unrelated to files in this plan. If lint reports errors in files from this plan, fix those files and rerun this command.

- [ ] **Step 4: Start the dev server**

Run:

```bash
npm run dev
```

Expected result:

```text
Local: http://localhost:3000
```

If port 3000 is busy, Next.js prints the alternate local URL. Use that URL in Step 5.

- [ ] **Step 5: Verify unprocessed rows are shown and persisted**

In the browser:

1. Open `/permata`.
2. Upload a file with at least one row that the selected adapter cannot process, for example a Permata CSV row with an invalid amount.
3. Confirm the toast shows the list of unprocessed records with file name, row number, reason, and original row content.
4. Confirm valid rows from the same file still import.
5. Confirm the table refreshes from Supabase after the successful insert.

Then run this SQL in Supabase Dashboard SQL Editor, replacing the UUID from the toast if present:

```sql
select id, created_at, user_id, source, file_names, error_count, errors
from public.transaction_import_errors
where id = '00000000-0000-0000-0000-000000000000';
```

Expected result: exactly one row with the uploaded file names, user id, timestamp, error count, and the unprocessed row content.

---

## Self-Review

- Spec coverage: unprocessed adapter records are shown in a toast, saved with user/time/content, and valid uploaded transactions refresh the UI from Supabase. New currencies are added to Supabase and the local map.
- Placeholder scan: no placeholder strings or incomplete task bodies remain.
- Type consistency: `NormalizedTransaction` does not carry raw source data; `AdapterParseResult.unprocessed` carries only failed row content; `transaction_import_errors.errors` stores those failed records as JSON.
