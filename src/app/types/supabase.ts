export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5';
  };
  public: {
    Tables: {
      spottrades: {
        Row: {
          created_at: string | null;
          id: number;
          order_id: string;
          price: number;
          quantity: number;
          side: string;
          symbol: string;
          timestamp: number;
          user_id: number | null;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          order_id: string;
          price: number;
          quantity: number;
          side: string;
          symbol: string;
          timestamp: number;
          user_id?: number | null;
        };
        Update: {
          created_at?: string | null;
          id?: number;
          order_id?: string;
          price?: number;
          quantity?: number;
          side?: string;
          symbol?: string;
          timestamp?: number;
          user_id?: number | null;
        };
        Relationships: [];
      };
      transaction_embeddings: {
        Row: {
          category: string | null;
          description: string;
          embedding: string | null;
          last_used_at: string | null;
          usage_count: number | null;
        };
        Insert: {
          category?: string | null;
          description: string;
          embedding?: string | null;
          last_used_at?: string | null;
          usage_count?: number | null;
        };
        Update: {
          category?: string | null;
          description?: string;
          embedding?: string | null;
          last_used_at?: string | null;
          usage_count?: number | null;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          amount: number | null;
          category: string | null;
          created_at: string | null;
          credit_debit: string | null;
          description: string | null;
          id: number;
          posted_date: string | null;
          time: string | null;
          transaction_hash: string | null;
          user_id: string | null;
        };
        Insert: {
          amount?: number | null;
          category?: string | null;
          created_at?: string | null;
          credit_debit?: string | null;
          description?: string | null;
          id?: number;
          posted_date?: string | null;
          time?: string | null;
          transaction_hash?: string | null;
          user_id?: string | null;
        };
        Update: {
          amount?: number | null;
          category?: string | null;
          created_at?: string | null;
          credit_debit?: string | null;
          description?: string | null;
          id?: number;
          posted_date?: string | null;
          time?: string | null;
          transaction_hash?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      binary_quantize: {
        Args: { '': string } | { '': unknown };
        Returns: unknown;
      };
      get_monthly_stats: {
        Args: { user_id_param: string };
        Returns: {
          month: string;
          total_credit: number;
          total_debit: number;
          transaction_count: number;
        }[];
      };
      get_similar_transactions_by_embedding: {
        Args: {
          limit_count?: number;
          query_embedding: string;
          similarity_threshold?: number;
        };
        Returns: {
          category: string;
          description: string;
          similarity: number;
          usage_count: number;
        }[];
      };
      halfvec_avg: {
        Args: { '': number[] };
        Returns: unknown;
      };
      halfvec_out: {
        Args: { '': unknown };
        Returns: unknown;
      };
      halfvec_send: {
        Args: { '': unknown };
        Returns: string;
      };
      halfvec_typmod_in: {
        Args: { '': unknown[] };
        Returns: number;
      };
      hnsw_bit_support: {
        Args: { '': unknown };
        Returns: unknown;
      };
      hnsw_halfvec_support: {
        Args: { '': unknown };
        Returns: unknown;
      };
      hnsw_sparsevec_support: {
        Args: { '': unknown };
        Returns: unknown;
      };
      hnswhandler: {
        Args: { '': unknown };
        Returns: unknown;
      };
      insert_transactions_batch: {
        Args: { batch: Json };
        Returns: Json;
      };
      insert_transactions_batch_with_rows: {
        Args: {
          transactions_to_insert: Database['public']['CompositeTypes']['transactions_input_type'][];
        };
        Returns: Json;
      };
      insert_unique_transactions: {
        Args: {
          _txns: Database['public']['CompositeTypes']['transaction_input'][];
        };
        Returns: Database['public']['CompositeTypes']['insert_unique_transactions_result'];
      };
      ivfflat_bit_support: {
        Args: { '': unknown };
        Returns: unknown;
      };
      ivfflat_halfvec_support: {
        Args: { '': unknown };
        Returns: unknown;
      };
      ivfflathandler: {
        Args: { '': unknown };
        Returns: unknown;
      };
      l2_norm: {
        Args: { '': unknown } | { '': unknown };
        Returns: number;
      };
      l2_normalize: {
        Args: { '': string } | { '': unknown } | { '': unknown };
        Returns: unknown;
      };
      sparsevec_out: {
        Args: { '': unknown };
        Returns: unknown;
      };
      sparsevec_send: {
        Args: { '': unknown };
        Returns: string;
      };
      sparsevec_typmod_in: {
        Args: { '': unknown[] };
        Returns: number;
      };
      vector_avg: {
        Args: { '': number[] };
        Returns: string;
      };
      vector_dims: {
        Args: { '': string } | { '': unknown };
        Returns: number;
      };
      vector_norm: {
        Args: { '': string };
        Returns: number;
      };
      vector_out: {
        Args: { '': string };
        Returns: unknown;
      };
      vector_send: {
        Args: { '': string };
        Returns: string;
      };
      vector_typmod_in: {
        Args: { '': unknown[] };
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      insert_unique_transactions_result: {
        total_count: number | null;
        inserted_count: number | null;
        duplicate_count: number | null;
        inserted_rows: Database['public']['Tables']['transactions']['Row'][] | null;
      };
      transaction_input: {
        posted_date: string | null;
        description: string | null;
        credit_debit: string | null;
        amount: number | null;
        time: string | null;
        category: string | null;
        user_id: string | null;
      };
      transactions_input_type: {
        created_at: string | null;
        posted_date: string | null;
        description: string | null;
        credit_debit: string | null;
        amount: number | null;
        time: string | null;
        transaction_hash: string | null;
        category: string | null;
        user_id: string | null;
      };
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
