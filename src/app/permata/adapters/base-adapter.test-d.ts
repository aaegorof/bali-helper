/* eslint-disable @typescript-eslint/no-unused-vars */

import { Json } from '@/app/types/supabase';
import {
  AdapterParseResult,
  AdapterUnprocessedTransaction,
  NormalizedTransaction,
} from './base-adapter';

type Assert<T extends true> = T;

type _normalizedDoesNotCarryRaw = Assert<
  'raw_transaction' extends keyof NormalizedTransaction ? false : true
>;

type _unprocessedCarriesRaw = Assert<
  AdapterUnprocessedTransaction extends { raw: Json; reason: string; rowNumber: number | null }
    ? true
    : false
>;

type _parseResultHasBothLists = Assert<
  AdapterParseResult extends {
    transactions: Omit<NormalizedTransaction, 'source'>[];
    unprocessed: AdapterUnprocessedTransaction[];
  }
    ? true
    : false
>;
