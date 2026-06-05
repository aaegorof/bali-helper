import { Database } from './supabase';

export type SpotTrade = Database['public']['Tables']['spottrades']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type TransactionEmbedding = Database['public']['Tables']['transaction_embeddings']['Row'];

// Export insert types
export type SpotTradeInsert = Database['public']['Tables']['spottrades']['Insert'];
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
export type TransactionEmbeddingInsert =
  Database['public']['Tables']['transaction_embeddings']['Insert'];

export type InsertUniqueTransactionsReq = Database['public']['CompositeTypes']['transaction_input'];
export type InsertUniqueTransactionsResult =
  Database['public']['CompositeTypes']['insert_unique_transactions_result'];

// Export update types
export type SpotTradeUpdate = Database['public']['Tables']['spottrades']['Update'];
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];
export type TransactionEmbeddingUpdate =
  Database['public']['Tables']['transaction_embeddings']['Update'];

// Export enum types
export type EnumTransactionCategory = Database['public']['Enums']['transaction_category'];
export type EnumCurrencyCode = Database['public']['Enums']['currency_code'];
export type EnumAdapterSource = Database['public']['Enums']['adapter_source'];
