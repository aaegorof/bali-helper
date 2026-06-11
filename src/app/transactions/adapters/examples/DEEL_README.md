# Deel Card Adapter

Адаптер для импорта транзакций из Deel Card CSV export.

## Как получить CSV файл из Deel

1. Зайдите на [Deel Dashboard](https://app.deel.com/)
2. Перейдите в раздел "Cards" или "Transactions"
3. Выберите период транзакций
4. Нажмите "Export" или "Download CSV"
5. Сохраните файл

## Формат данных

Адаптер поддерживает CSV файлы со следующими колонками:

- `originalCurrency` - Оригинальная валюта транзакции (IDR, GBP, USD, etc.)
- `originalAmount` - Сумма в оригинальной валюте
- `USDAmount` - Сумма в USD
- `date` - Дата и время транзакции (ISO 8601 format)
- `mcc` - Merchant Category Code
- `accountAmount` - Сумма на счете (+ для пополнений, - для расходов)
- `accountCurrency` - Валюта счета (обычно USD)
- `merchantName` - Название торговой точки
- `merchantCountry` - Страна
- `status` - Статус транзакции (APPROVED / DECLINED)
- `type` - Тип транзакции (POS_TX, DEPOSIT, WITHDRAWAL, REFUND, FEE)

## Особенности обработки

### Валюта
По умолчанию используется `accountCurrency` (обычно USD) и `accountAmount`. Это значит, что все транзакции будут конвертированы в USD.

### Credit/Debit
Автоматически определяется на основе:
- **Credit (Приход)**: DEPOSIT, REFUND, или положительный `accountAmount`
- **Debit (Расход)**: POS_TX, WITHDRAWAL, FEE, или отрицательный `accountAmount`

### Категории
Автоматически присваиваются на основе MCC кодов:

| MCC | Категория |
|-----|-----------|
| 5812 | Restaurants & Cafes |
| 5814 | Fast Food |
| 5499, 5411 | Grocery Stores |
| 5912 | Pharmacy |
| 7298 | Health & Beauty |
| 4722, 7011 | Travel & Accommodation |
| 4511 | Airlines |
| 5310, 5942 | Online Shopping |
| и другие... |

### Отклоненные транзакции
По умолчанию **включены** в импорт с пометкой `[DECLINED: причина]` в описании.

Чтобы **исключить** отклоненные транзакции, раскомментируйте строку в файле `deel-adapter.tsx`:

```typescript
if (raw.status === 'DECLINED') return null;
```

### Описание транзакций
Формируется автоматически:
- Для покупок: `"MERCHANT NAME (COUNTRY)"`
- Для депозитов: `"Deposit"`
- Для отклоненных: `"MERCHANT NAME (COUNTRY) [DECLINED: причина]"`

## Примеры транзакций

### Успешная покупка
```csv
IDR,116000.0000,7.0700,2025-12-12T07:46:02.974Z,5812,-7.0700,USD,NECTAR BALI HO,ID,APPROVED,...
```
Результат:
- Описание: `NECTAR BALI HO (ID)`
- Сумма: `7.07 USD`
- Тип: `Debit`
- Категория: `Restaurants & Cafes`

### Депозит
```csv
GBP,150.0000,197.4200,2025-12-01T14:39:08.185Z,,197.4200,USD,Deel Balance,,APPROVED,,,DEPOSIT,...
```
Результат:
- Описание: `Deposit`
- Сумма: `197.42 USD`
- Тип: `Credit`
- Категория: `null`

### Отклоненная транзакция
```csv
IDR,177000.0000,10.8000,2025-12-13T15:29:06.619Z,5499,-10.8000,USD,CK TUNJUNG MASUKA,ID,DECLINED,Insufficient funds,...
```
Результат:
- Описание: `CK TUNJUNG MASUKA (ID) [DECLINED: Insufficient funds]`
- Сумма: `10.80 USD`
- Тип: `Debit`
- Категория: `Grocery Stores`

## Настройка адаптера

### Использование оригинальной валюты
Если хотите хранить транзакции в оригинальной валюте, измените в `deel-adapter.tsx`:

```typescript
// Было:
const amount = Math.abs(accountAmount);
let currency: CurrencyCode = 'USD';

// Станет:
const amount = Math.abs(parseFloat(raw.originalAmount || '0'));
let currency: CurrencyCode = raw.originalCurrency as CurrencyCode || 'USD';
```

### Добавление новых MCC категорий
Добавьте в константу `MCC_CATEGORIES`:

```typescript
const MCC_CATEGORIES: Record<string, string> = {
  // ... существующие
  '1234': 'Ваша категория',
};
```

### Изменение формата описания
Измените функцию в `normalizeDeelTransaction`:

```typescript
// Пример: добавить тип транзакции
if (raw.merchantName && raw.merchantName.trim()) {
  description = `${getTypeDescription(raw.type)} - ${raw.merchantName}`;
  // ...
}
```

## Тестирование

Используйте файл `deel-transactions.csv` в папке `examples/` для тестирования адаптера.

## Troubleshooting

### Проблема: Транзакции не импортируются
**Решение**: Проверьте формат CSV файла. Убедитесь, что заголовки совпадают с ожидаемыми.

### Проблема: Неправильная валюта
**Решение**: Проверьте колонку `accountCurrency` в CSV. Убедитесь, что валюта поддерживается системой.

### Проблема: Категории не определяются
**Решение**: Проверьте колонку `mcc` в CSV. Добавьте нужные MCC коды в `MCC_CATEGORIES`.

## Поддержка

Если у вас возникли вопросы или проблемы:
1. Проверьте формат CSV файла
2. Посмотрите примеры в `deel-transactions.csv`
3. Изучите код адаптера в `deel-adapter.tsx`

