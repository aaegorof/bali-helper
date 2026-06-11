import { CURRENCIES } from '@/app/lib/currencies';
import { format, isValid, parse } from 'date-fns';
import * as XLSX from 'xlsx';
import { parseTimeFromDescription } from '../lib/TransactionParseResult';
import {
  AdapterParseResult,
  AdapterUnprocessedTransaction,
  BankAdapter,
  NormalizedTransaction,
  toJson,
} from './base-adapter';

export interface PermataRawTransaction {
  [key: string]: string;
  'Posted Date (mm/dd/yyyy)': string;
  Description: string;
  'Credit/Debit': 'Credit' | 'Debit';
  Amount: string;
}

const parseCSV = (csvText: string): PermataRawTransaction[] => {
  const lines = csvText.split('\n');
  const headers: (keyof PermataRawTransaction)[] = lines[2]
    .split(',')
    .map((header: string) => header.trim() as keyof PermataRawTransaction);
  const data: PermataRawTransaction[] = [];

  for (let i = 3; i < lines.length; i++) {
    const values = lines[i].split(',').map((value) => value.trim());
    if (values.length !== headers.length) continue;

    const entry: Partial<PermataRawTransaction> = {};
    for (let j = 0; j < headers.length; j++) {
      entry[headers[j]] = values[j];
    }
    data.push(entry as PermataRawTransaction);
  }

  return data;
};

const normalizePermataTransaction = (
  raw: PermataRawTransaction
): Omit<NormalizedTransaction, 'source'> => {
  const { time, cleanDescription } = parseTimeFromDescription(raw.Description || '');
  const postedDate = raw['Posted Date (mm/dd/yyyy)'] ?? '';
  const parsedDate = parse(`${postedDate} ${time ?? '00:00:00'}`, 'MM/dd/yyyy HH:mm:ss', new Date());

  if (!postedDate || !isValid(parsedDate)) {
    throw new Error('Invalid posted date');
  }

  if (raw['Credit/Debit'] !== 'Credit' && raw['Credit/Debit'] !== 'Debit') {
    throw new Error('Invalid credit/debit value');
  }

  const amount = parseFloat(
    raw.Amount.replace(/[^0-9.-]+/g, '')
      ?.split('.')
      ?.at(0) ?? '0'
  );

  if (!Number.isFinite(amount)) {
    throw new Error('Invalid amount');
  }

  return {
    description: cleanDescription ?? '',
    credit_debit: raw['Credit/Debit'],
    amount,
    currency: CURRENCIES.IDR.code,
    date: format(parsedDate, "yyyy-MM-dd'T'HH:mm:ss"),
    category: null,
  };
};

export class PermataAdapter implements BankAdapter {
  id = 'permata' as const;
  name = 'Permata Bank';
  description = (
    <p>
      Import transactions from{' '}
      <a href="https://www.permatanet.com/pnet/" target="_blank">
        Permata Bank export
      </a>{' '}
      CSV or Excel export
    </p>
  );
  supportedFormats = ['.csv', '.xlsx', '.xls'];

  async parse(file: File): Promise<AdapterParseResult> {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    let rawTransactions: PermataRawTransaction[] = [];

    if (fileExtension === 'csv') {
      const text = await file.text();
      rawTransactions = parseCSV(text);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      rawTransactions = XLSX.utils.sheet_to_json(worksheet) as PermataRawTransaction[];
    } else {
      throw new Error(`Unsupported file format: ${fileExtension}`);
    }

    const transactions: Omit<NormalizedTransaction, 'source'>[] = [];
    const unprocessed: AdapterUnprocessedTransaction[] = [];

    rawTransactions.forEach((raw, index) => {
      try {
        transactions.push(normalizePermataTransaction(raw));
      } catch (error) {
        unprocessed.push({
          fileName: file.name,
          rowNumber: index + 1,
          reason: error instanceof Error ? error.message : 'Unknown parsing error',
          raw: toJson(raw),
        });
      }
    });

    return { transactions, unprocessed };
  }

  async validate(file: File) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return this.supportedFormats.some((format) => format === `.${extension}`);
  }
}
