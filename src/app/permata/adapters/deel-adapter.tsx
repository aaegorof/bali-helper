import { CurrencyCode } from '@/app/lib/currencies';
import { EnumTransactionCategory } from '@/app/types/supabase-extended';
import { format } from 'date-fns';
import Papa from 'papaparse';
import { BankAdapter, NormalizedTransaction } from './base-adapter';

/**
 * RAW формат данных из Deel CSV export
 */
export interface DeelRawTransaction {
  originalCurrency: string;
  originalAmount: string;
  USDAmount: string;
  date: string; // ISO 8601 format: "2025-12-13T15:29:06.619Z"
  mcc: string; // Merchant Category Code
  accountAmount: string; // Отрицательное для расходов, положительное для доходов
  accountCurrency: string;
  merchantName: string;
  merchantCountry: string;
  status: string; // "APPROVED" | "DECLINED"
  declineReason: string;
  authCode: string;
  type: string; // "POS_TX" | "DEPOSIT" | "WITHDRAWAL" | "REFUND" | "FEE"
  externalTxId: string;
  externalRootTxId: string;
  apiTransaction: string; // JSON string
  last4: string;
}

/**
 * Маппинг MCC кодов на категории из Supabase enum
 * Используем тип TransactionCategory для type safety
 *
 * Закомментированные категории - это те, где нужно добавить новую категорию в enum
 * или где маппинг неоднозначный
 */
const MCC_CATEGORIES: Record<string, EnumTransactionCategory> = {
  // Еда и напитки
  '5812': 'Cafe/Restaurant', // Eating places, restaurants
  '5814': 'Cafe/Restaurant', // Fast food restaurants

  // Продукты
  '5499': 'Groceries', // Miscellaneous food stores
  '5411': 'Groceries', // Grocery stores, supermarkets

  // Здоровье и велнес
  '5912': 'Health', // Drug stores and pharmacies
  '7298': 'Wellness', // Health and beauty spas

  // Покупки
  // '5993': 'Tobacco & Vape',    // TODO: добавить категорию или использовать 'Shopping'
  '5199': 'Shopping', // Nondurable goods (retail)
  '5942': 'Shopping', // Book stores
  '5947': 'Shopping', // Gift, card, novelty, and souvenir shops
  '5691': 'Shopping', // Men's and women's clothing stores

  // Путешествия
  '4722': 'Tourism', // Tourism или Accommodations?
  '7011': 'Accommodations', // Lodging - hotels, motels, resorts
  '4511': 'Tourism', // Airlines, air carriers

  // Услуги и онлайн
  '4814': 'Utilities', // Telecommunication services
  '5817': 'Online', // Digital goods - media, books, movies, music
  // '7399': 'Services',          // TODO: добавить категорию 'Services' или использовать 'Bills'
  '5310': 'Online', // Discount stores, online shopping
  '4899': 'Utilities', // Cable and other pay TV, subscriptions

  // Дом
  '5712': 'Home', // Furniture, home furnishings

  // Развлечения
  '7929': 'Entertainment', // Bands, orchestras, entertainers
};

/**
 * Парсит CSV файл Deel используя PapaParse
 * Автоматически обрабатывает quoted fields, escape-последовательности и edge cases
 */
const parseCSV = (csvText: string): DeelRawTransaction[] => {
  const result = Papa.parse<DeelRawTransaction>(csvText, {
    header: true, // Первая строка - заголовки
    skipEmptyLines: true, // Пропускаем пустые строки
    transformHeader: (header) => header.trim(), // Убираем пробелы из заголовков
    transform: (value) => value.trim(), // Убираем пробелы из значений
  });

  if (result.errors.length > 0) {
    console.warn('CSV parsing warnings:', result.errors);
  }

  return result.data;
};

/**
 * Нормализует транзакцию Deel в общий формат
 */
const normalizeDeelTransaction = (raw: DeelRawTransaction): NormalizedTransaction | null => {
  // Пропускаем отклоненные транзакции (опционально)
  // Раскомментируйте следующую строку, если не хотите импортировать DECLINED транзакции:
  if (raw.status === 'DECLINED') return null;

  // Определяем Credit/Debit на основе типа и суммы
  let creditDebit: NormalizedTransaction['credit_debit'] = 'Debit';
  const originalAmount = parseFloat(raw.originalAmount || '0');

  if (raw.type === 'DEPOSIT' || raw.type === 'REFUND') {
    creditDebit = 'Credit';
  } 
  if (
    raw.type === 'POS_TX' ||
    raw.type === 'WITHDRAWAL' ||
    raw.type === 'FEE'
  ) {
    creditDebit = 'Debit';
  }

  // Формируем описание
  const description = (raw.merchantName && raw.merchantName.trim()) ?? '';

  // Парсим дату из ISO 8601 в нужный формат
  let timestamp = '';
  try {
    if (raw.date) {
      const dateObj = new Date(raw.date);
      timestamp = format(dateObj, "yyyy-MM-dd'T'HH:mm:ss");
    }
  } catch (error) {
    console.error('Error parsing date:', raw.date, error);
  }
  
    // Fallback на оригинальную валюту если accountCurrency не найдена
   const currency = raw.originalCurrency as CurrencyCode;


  // Используем accountAmount (в валюте счета)
  const amount = Math.abs(originalAmount);

  // Пытаемся определить категорию по MCC коду
  let category = null;
  if (raw.mcc && raw.mcc in MCC_CATEGORIES) {
    category = MCC_CATEGORIES[raw.mcc];
  }

  return {
    description,
    credit_debit: creditDebit,
    amount,
    currency,
    date: timestamp,
    category,
  };
};

export class DeelAdapter implements BankAdapter {
  id = 'deel';
  name = 'Deel Card';
  description = (
    <div>
      <p>
        Import transactions from{' '}
        <a href="https://app.deel.com/" target="_blank" rel="noopener noreferrer">
          Deel Card
        </a>{' '}
        CSV export
      </p>
    </div>
  );
  supportedFormats = ['.csv'];

  async parse(file: File): Promise<NormalizedTransaction[]> {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    let rawTransactions: DeelRawTransaction[] = [];

    if (fileExtension === 'csv') {
      const text = await file.text();
      rawTransactions = parseCSV(text);
    } else {
      throw new Error(`Unsupported file format: ${fileExtension}`);
    }

    // Фильтруем null значения (отклоненные транзакции если настроено)
    return rawTransactions
      .map(normalizeDeelTransaction)
      .filter((t): t is NormalizedTransaction => t !== null);
  }

  async validate(file: File): Promise<boolean> {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return this.supportedFormats.some((format) => format === `.${extension}`);
  }
}
