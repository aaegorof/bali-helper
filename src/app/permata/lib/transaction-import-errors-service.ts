'use server';

import { createClient } from '@/app/lib/supabase/server';
import { AdapterUnprocessedTransaction } from '@/app/permata/adapters';
import { Json } from '@/app/types/supabase';
import {
  EnumAdapterSource,
  TransactionImportErrorInsert,
} from '@/app/types/supabase-extended';

export type SaveTransactionImportErrorsRequest = {
  source: EnumAdapterSource;
  fileNames: string[];
  errors: AdapterUnprocessedTransaction[];
};

export type SaveTransactionImportErrorsResult =
  | {
      success: true;
      data: {
        id: string;
        error_count: number;
      };
    }
  | {
      success: false;
      error: string;
      details?: string;
    };

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value ?? null)) as Json;
}

export async function saveTransactionImportErrors({
  errors,
  fileNames,
  source,
}: SaveTransactionImportErrorsRequest): Promise<SaveTransactionImportErrorsResult> {
  if (errors.length === 0) {
    return {
      success: false,
      error: 'No import errors to save',
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: 'User is not authenticated',
      };
    }

    const payload: TransactionImportErrorInsert = {
      user_id: user.id,
      source,
      file_names: fileNames,
      error_count: errors.length,
      errors: toJson(errors),
    };

    const { data, error } = await supabase
      .from('transaction_import_errors')
      .insert(payload)
      .select('id, error_count')
      .single();

    if (error) {
      return {
        success: false,
        error: 'Failed to save import errors',
        details: error.message,
      };
    }

    return {
      success: true,
      data: {
        id: data.id,
        error_count: data.error_count,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to save import errors',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
