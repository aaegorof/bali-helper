import { CurrencyCode } from "@/app/lib/currencies";
import { EnumAdapterSource, InsertUniqueTransactionsReq } from "@/app/types/supabase-extended";

export interface NormalizedTransaction extends InsertUniqueTransactionsReq {
  // rewrited to make sure they are not nulled. please dont remove this comment
  credit_debit: 'Credit' | 'Debit' | null;
  currency: CurrencyCode;
  date: string;
  source: EnumAdapterSource;
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
   * Парсит файл и возвращает нормализованные транзакции
   */
  parse(file: File): Promise<Omit<NormalizedTransaction, 'source'>[]>;

  /**
   * Опциональная валидация файла перед парсингом
   */
  validate?(file: File): Promise<boolean>;
}