# Design: Project Overview File + Transaction Source Field

**Date:** 2026-06-05  
**Scope:** `src/app/permata/`

---

## Task 1 — Project Overview File

Create `docs/PROJECT_OVERVIEW.md` — короткий ориентир по структуре проекта для агентов и разработчиков. Добавить ссылку на него в `AGENTS.md`.

### Содержимое файла

- **Верхний уровень `src/app/`** — перечень всех приложений/страниц с однострочным описанием
- **`permata/` — детальнее**: структура папок, роль каждой части (adapters, actions, components, lib)
- **Ключевые shared-зависимости**: `src/app/types/`, `src/components/ui/`, `src/app/lib/`

### Ссылка в AGENTS.md

В секцию "Project structure" добавить одну строку:
```
See [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) for a map of all app sections.
```

---

## Task 2 — Transaction Source Field

Цель: хранить в каждой транзакции источник загрузки (адаптер), чтобы в будущем сравнивать транзакции из разных источников.

---

### 2.1 Supabase Migration

**Новый enum:**
```sql
CREATE TYPE adapter_source AS ENUM ('permata', 'deel');
```

**Новый столбец в `transactions`:**
```sql
ALTER TABLE transactions ADD COLUMN source adapter_source NULL;
```
Nullable — существующие строки не имеют source, это нормально.

**Обновление составного типа `transaction_input`:**
```sql
ALTER TYPE transaction_input ADD ATTRIBUTE source adapter_source;
```
*(или пересоздание типа, если Postgres версия не поддерживает ALTER TYPE ADD ATTRIBUTE)*

**Обновление функции `insert_unique_transactions`:**  
Добавить поле `source` в INSERT внутри тела функции.

После миграции: `npm run types` → регенерация `src/app/types/supabase.ts` и актуализация `supabase-extended.ts`.

---

### 2.2 Типы — `base-adapter.ts`

Добавить `source` в `NormalizedTransaction` (после регенерации типов `EnumAdapterSource` появится из `supabase-extended.ts`):

```ts
export interface NormalizedTransaction extends InsertUniqueTransactionsReq {
  credit_debit: 'Credit' | 'Debit' | null;
  currency: CurrencyCode;
  date: string;
  source: 'permata' | 'deel'; // будет заменено на EnumAdapterSource после типов
}
```

Адаптеры (`PermataAdapter`, `DeelAdapter`) **не меняются** — они не выставляют `source` сами.

---

### 2.3 Загрузчик — `transaction-uploader.tsx`

После `adapter.parse(file)` проставлять `source` через `adapter.id`:

```ts
const parsed = await adapter.parse(file);
const parsedWithSource = parsed.map(t => ({ ...t, source: adapter.id as EnumAdapterSource }));
allParsedData = allParsedData.concat(parsedWithSource);
```

`adapter.id` уже строго типизирован через интерфейс `BankAdapter`, каждый адаптер объявляет его явно (`'permata'`, `'deel'`).

---

### 2.4 Фильтрация — `aggregated-data.ts` (`filterQuery`)

Добавить кейс для `source` (multi-select, аналогично `category`):

```ts
if (filter.id === 'source' && Array.isArray(filter.value) && filter.value.length > 0) {
  query.in('source', filter.value);
}
```

---

### 2.5 UI фильтра — `transaction-filters-new.tsx`

Новый компонент `FilterSource` — multi-select, опции берёт из `AVAILABLE_ADAPTERS`:

```ts
export const FilterSource = ({ column }: { column: Column<TransactionDb> }) => {
  const val = column?.getFilterValue() as string[] | undefined;
  const options = AVAILABLE_ADAPTERS.map(a => ({ label: a.name, value: a.id }));
  // MultiSelect компонент (аналог MultiFilterCategory)
};
```

Динамические опции из реестра адаптеров — при добавлении нового адаптера в `AVAILABLE_ADAPTERS` фильтр обновится автоматически.

---

### 2.6 Контекст — `transactions-context.tsx`

Добавить в `defaultFilters`:
```ts
{ id: 'source', value: null },
```

---

### 2.7 Колонка в таблице — `transaction-columns-copy.tsx`

Добавить колонку `source` через `columnHelper.accessor`, импортировать `FilterSource`:

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

Колонку разместить после `currency` или между `type` и `category` — на усмотрение.

---

## Затронутые файлы

| Файл | Действие |
|------|----------|
| Supabase Dashboard / migration | Новый enum, столбец, изменение типа и функции |
| `src/app/types/supabase.ts` | Регенерация (`npm run types`) |
| `src/app/types/supabase-extended.ts` | Экспорт `EnumAdapterSource` |
| `docs/PROJECT_OVERVIEW.md` | Создать |
| `AGENTS.md` | Добавить ссылку |
| `src/app/permata/adapters/base-adapter.ts` | Добавить `source` в `NormalizedTransaction` |
| `src/app/permata/components/transaction-uploader.tsx` | Проставлять `source: adapter.id` |
| `src/app/permata/actions/aggregated-data.ts` | Добавить кейс `source` в `filterQuery` |
| `src/app/permata/components/transaction-filters-new.tsx` | Новый `FilterSource` компонент |
| `src/app/permata/components/transactions-context.tsx` | `source` в `defaultFilters` |
| `src/app/permata/components/transaction-columns-copy.tsx` | Добавить колонку `source` с `FilterSource` |

---

## Не в scope

- Обновление уже существующих транзакций в БД (`source = NULL` для старых — допустимо)
- Изменение логики дедупликации (хеш не включает source)
- Фильтрация по `source` в агрегированных данных (графики) — за рамками задачи
