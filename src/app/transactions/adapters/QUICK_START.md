# Quick Start: Добавление нового банка

## За 5 минут

### Шаг 1: Создайте файл адаптера

```bash
# Создайте файл для вашего банка
touch src/app/transactions/adapters/bca-adapter.ts
```

### Шаг 2: Скопируйте базовую структуру

```typescript
import * as XLSX from 'xlsx';
import { BankAdapter, NormalizedTransaction } from './base-adapter';

// 1️⃣ Определите RAW формат вашего банка
interface BCATransaction {
  Date: string; // например: "11/12/2024"
  Description: string; // описание
  Type: string; // "DR" или "CR"
  Amount: string; // "1,234.56"
}

// 2️⃣ Создайте функцию нормализации
const normalizeBCATransaction = (raw: BCATransaction): NormalizedTransaction => {
  return {
    date: raw.Date,
    description: raw.Description,
    credit_debit: raw.Type === 'CR' ? 'C' : 'D',
    amount: parseFloat(raw.Amount.replace(/,/g, '')),
  };
};

// 3️⃣ Создайте класс адаптера
export class BCAAdapter implements BankAdapter {
  id = 'bca';
  name = 'BCA Bank';
  description = 'Import transactions from BCA ClickBanking';
  supportedFormats = ['.csv', '.xlsx'];

  async parse(file: File): Promise<NormalizedTransaction[]> {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    let rawTransactions: BCATransaction[] = [];

    if (fileExtension === 'csv') {
      const text = await file.text();
      rawTransactions = this.parseCSV(text);
    } else if (fileExtension === 'xlsx') {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      rawTransactions = XLSX.utils.sheet_to_json(worksheet);
    }

    return rawTransactions.map(normalizeBCATransaction);
  }

  private parseCSV(csvText: string): BCATransaction[] {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map((h) => h.trim());
    const data: BCATransaction[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      if (values.length !== headers.length) continue;

      data.push({
        Date: values[0],
        Description: values[1],
        Type: values[2],
        Amount: values[3],
      });
    }

    return data;
  }

  async validate(file: File): Promise<boolean> {
    const ext = file.name.split('.').pop()?.toLowerCase();
    return this.supportedFormats.some((f) => f === `.${ext}`);
  }
}
```

### Шаг 3: Зарегистрируйте адаптер

Откройте `src/app/transactions/adapters/index.ts`:

```typescript
import { BankAdapter } from './base-adapter';
import { PermataAdapter } from './permata-adapter';
import { BCAAdapter } from './bca-adapter'; // ← добавьте

export const AVAILABLE_ADAPTERS: BankAdapter[] = [
  new PermataAdapter(),
  new BCAAdapter(), // ← добавьте
];

// ...
export * from './bca-adapter'; // ← добавьте
```

### Шаг 4: Готово! 🎉

Теперь:

- Откройте страницу импорта
- В селекторе появится "BCA Bank"
- Загрузите файл
- Система автоматически использует ваш адаптер

## Адаптация под ваш формат

### CSV с нестандартными заголовками

```typescript
private parseCSV(csvText: string): YourBankTransaction[] {
  const lines = csvText.split('\n');

  // Если заголовки начинаются не с первой строки
  const headers = lines[2].split(','); // строка 3

  // Если есть footer
  const dataLines = lines.slice(3, -2); // пропустить последние 2 строки

  // ...
}
```

### Особый формат даты

```typescript
const normalizeBCATransaction = (raw: BCATransaction): NormalizedTransaction => {
  return {
    // DD-MM-YYYY → MM/DD/YYYY
    date: convertDate(raw.Date),
    // ...
  };
};

function convertDate(dateStr: string): string {
  const [day, month, year] = dateStr.split('-');
  return `${month}/${day}/${year}`;
}
```

### Сумма с валютой

```typescript
const normalizeBCATransaction = (raw: BCATransaction): NormalizedTransaction => {
  return {
    // "Rp 1.234.567,89" → 1234567.89
    amount: parseAmount(raw.Amount),
    // ...
  };
};

function parseAmount(amountStr: string): number {
  return parseFloat(
    amountStr
      .replace(/Rp\s?/, '') // удалить валюту
      .replace(/\./g, '') // удалить разделители тысяч
      .replace(/,/, '.') // заменить запятую на точку
  );
}
```

### Тип транзакции текстом

```typescript
const normalizeBCATransaction = (raw: BCATransaction): NormalizedTransaction => {
  return {
    // "Debit" / "Credit" → "D" / "C"
    credit_debit: raw.Type.toLowerCase().startsWith('cr') ? 'C' : 'D',
    // ...
  };
};
```

## Тестирование

### Простой тест

```typescript
// test.ts
import { BCAAdapter } from './bca-adapter';

const adapter = new BCAAdapter();

// Создайте тестовый файл
const testFile = new File(['Date,Description,Type,Amount\n11/12/2024,Test,CR,100'], 'test.csv', {
  type: 'text/csv',
});

// Протестируйте
const result = await adapter.parse(testFile);
console.log(result);
// [{ date: '11/12/2024', description: 'Test', credit_debit: 'C', amount: 100 }]
```

## Чек-лист

Перед коммитом проверьте:

- [ ] Адаптер реализует интерфейс `BankAdapter`
- [ ] Метод `parse()` возвращает `NormalizedTransaction[]`
- [ ] `date` в формате `mm/dd/yyyy`
- [ ] `amount` это число (не строка!)
- [ ] `credit_debit` это 'C' или 'D'
- [ ] Адаптер зарегистрирован в `AVAILABLE_ADAPTERS`
- [ ] Адаптер экспортирован в `index.ts`
- [ ] Нет ошибок линтера

## Частые ошибки

### ❌ Возвращается неправильный тип

```typescript
// НЕПРАВИЛЬНО
async parse(file: File): Promise<BCATransaction[]> { // ❌
  return rawTransactions;
}

// ПРАВИЛЬНО
async parse(file: File): Promise<NormalizedTransaction[]> { // ✅
  return rawTransactions.map(normalize);
}
```

### ❌ Amount остается строкой

```typescript
// НЕПРАВИЛЬНО
amount: raw.Amount; // "100" - строка! ❌

// ПРАВИЛЬНО
amount: parseFloat(raw.Amount.replace(/[^0-9.-]/g, '')); // 100 - число! ✅
```

### ❌ Неверный формат даты

```typescript
// НЕПРАВИЛЬНО
date: '2024-12-11'; // yyyy-mm-dd ❌

// ПРАВИЛЬНО
date: '12/11/2024'; // mm/dd/yyyy ✅
```

### ❌ Забыли зарегистрировать

```typescript
// Не забудьте добавить в AVAILABLE_ADAPTERS!
export const AVAILABLE_ADAPTERS: BankAdapter[] = [
  new PermataAdapter(),
  new YourBankAdapter(), // ← не забыть!
];
```

## Получение помощи

- 📖 [README.md](./README.md) - подробная документация
- 🏗️ [ARCHITECTURE.md](../ARCHITECTURE.md) - архитектура системы
- 📝 [example-adapter.ts.template](./example-adapter.ts.template) - полный шаблон
- 🔄 [MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md) - руководство по миграции

## Примеры форматов

### BCA Bank

```csv
Date,Description,Type,Amount
11/12/2024,ATM Withdrawal,DR,500000
12/12/2024,Salary,CR,10000000
```

### Mandiri Bank

```csv
Tanggal;Keterangan;Jenis;Jumlah
11-12-2024;Transfer;D;Rp 500.000
12-12-2024;Gaji;K;Rp 10.000.000
```

### BNI Bank

```csv
"Transaction Date","Description","Debit","Credit"
"11/12/2024","ATM WDL","500,000.00",""
"12/12/2024","SALARY","","10,000,000.00"
```

Каждый из этих форматов легко поддерживается через свой адаптер!

## Следующие шаги

1. ✅ Создали адаптер
2. ✅ Зарегистрировали
3. 🚀 Протестируйте с реальным файлом
4. 📊 Проверьте в UI
5. 🎯 Готово к продакшену!
