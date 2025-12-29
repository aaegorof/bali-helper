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
          currency: Database['public']['Enums']['currency_code'] | null;
          date: string | null;
          description: string | null;
          id: number;
          month: string | null;
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
          currency?: Database['public']['Enums']['currency_code'] | null;
          date?: string | null;
          description?: string | null;
          id?: number;
          month?: string | null;
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
          currency?: Database['public']['Enums']['currency_code'] | null;
          date?: string | null;
          description?: string | null;
          id?: number;
          month?: string | null;
          posted_date?: string | null;
          time?: string | null;
          transaction_hash?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      transactions_by_month: {
        Row: {
          count: number | null;
          credit_debit: string | null;
          month: string | null;
          sum: number | null;
          user_id: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
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
      insert_transactions_batch: { Args: { batch: Json }; Returns: Json };
      insert_unique_transactions: {
        Args: {
          _txns: Database['public']['CompositeTypes']['transaction_input'][];
        };
        Returns: Database['public']['CompositeTypes']['insert_unique_transactions_result'];
        SetofOptions: {
          from: '*';
          to: 'insert_unique_transactions_result';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
    };
    Enums: {
      currency_code: 'RUB' | 'USD' | 'AUD' | 'GBP' | 'IDR' | 'EUR';
    };
    CompositeTypes: {
      insert_unique_transactions_result: {
        total_count: number | null;
        inserted_count: number | null;
        duplicate_count: number | null;
        inserted_rows: Database['public']['Tables']['transactions']['Row'][] | null;
      };
      transaction_input: {
        date: string | null;
        description: string | null;
        credit_debit: string | null;
        amount: number | null;
        currency: Database['public']['Enums']['currency_code'] | null;
        category: string | null;
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
    Enums: {
      currency_code: ['RUB', 'USD', 'AUD', 'GBP', 'IDR', 'EUR'],
    },
  },
} as const;
