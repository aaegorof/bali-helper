import { AdapterUnprocessedTransaction } from '@/app/transactions/adapters';
import {
  SaveTransactionImportErrorsRequest,
  SaveTransactionImportErrorsResult,
} from './transaction-import-errors-service';

const request = {
  source: 'permata',
  fileNames: ['transactions.csv'],
  errors: [
    {
      fileName: 'transactions.csv',
      rowNumber: 3,
      reason: 'Invalid amount',
      raw: { Amount: 'abc' },
    },
  ] satisfies AdapterUnprocessedTransaction[],
} satisfies SaveTransactionImportErrorsRequest;

declare const result: SaveTransactionImportErrorsResult;

if (result.success) {
  result.data.id satisfies string;
  result.data.error_count satisfies number;
} else {
  result.error satisfies string;
}

request.source satisfies 'permata' | 'deel';
