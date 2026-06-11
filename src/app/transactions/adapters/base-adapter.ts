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
