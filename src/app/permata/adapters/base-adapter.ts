import { CurrencyCode } from "@/app/lib/currencies";
import { InsertUniqueTransactionsReq } from "@/app/types/supabase-extended";

export interface NormalizedTransaction extends InsertUniqueTransactionsReq {
  credit_debit: 'Credit' | 'Debit' | null
  currency: CurrencyCode;
  date: string; // mm/dd/yyyy format
}

export interface BankAdapter {
  /**
   * Уникальный идентификатор адаптера
   */
  id: string;

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
   * Парсит файл и возвращает нормализованные транзакции
   */
  parse(file: File): Promise<NormalizedTransaction[]>;

  /**
   * Опциональная валидация файла перед парсингом
   */
  validate?(file: File): Promise<boolean>;
}