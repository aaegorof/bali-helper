import {
  PermataRawTransaction,
  ReqTransactions,
  RespPostTransactions,
} from '@/app/api/transactions/route';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { useTransactionsContext } from './transactions-context';

const parseCSV = (csvText: string): PermataRawTransaction[] => {
  const lines = csvText.split('\n');
  const headers: (keyof PermataRawTransaction)[] = lines[2]
    .split(',')
    .map((header: string) => header.trim() as keyof PermataRawTransaction);
  const data: PermataRawTransaction[] = [];

  for (let i = 3; i < lines.length; i++) {
    const values = lines[i].split(',').map((value) => value.trim());
    if (values.length !== headers.length) continue; // Skip incomplete lines

    const entry: Partial<PermataRawTransaction> = {};
    for (let j = 0; j < headers.length; j++) {
      entry[headers[j]] = values[j];
    }
    data.push(entry as PermataRawTransaction);
  }

  return data;
};

const saveTransactionsToDatabase = async (
  transactions: PermataRawTransaction[],
  userId: number
) => {
  try {
    const response = await fetch('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({ transactions, userId } as ReqTransactions),
    });
    const data = (await response.json()) as RespPostTransactions;
    return data;
  } catch (error) {
    console.error('Ошибка при сохранении транзакций:', error);
    throw error;
  }
};

const TransactionUploader = () => {
  const { data: session } = useSession();
  const currentUser = session?.user;

  const { setTransactions } = useTransactionsContext();
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    let allParsedData: PermataRawTransaction[] = [];

    if (!currentUser) {
      console.error('No user logged in');
      return;
    }

    for (const file of files ?? []) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'csv') {
        const text = await file.text();
        const parsedData = parseCSV(text);
        allParsedData = allParsedData.concat(parsedData);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0]; // Take the first sheet
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as PermataRawTransaction[];
        allParsedData = allParsedData.concat(jsonData);
      }
    }
    try {
      setIsLoading(true);
      const res = await saveTransactionsToDatabase(allParsedData, Number(currentUser.id));
      setTransactions(res.data?.transactions ?? []);
    } catch (error) {
      console.error('Ошибка при сохранении транзакций:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Transactions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-8">
        <div className="text-xs">
          <p>
            You can upload a file from Permata Bank export, it will automatically save these
            transactions to the database.
          </p>
          <p>
            After uploading, you will see ulpoaded transactions. If you want to see all
            transactions, you can click on the "All Transactions" button.
          </p>
          <p>
            Transactions will be unique by hash, so if you upload the same file multiple times, it
            will not add the same transactions again.
          </p>
        </div>
        <Input
          type="file"
          accept=".csv, .xlsx, .xls"
          multiple
          className="cursor-pointer bg-accent"
          onChange={handleFileUpload}
        />
        {isLoading && <p>Loading...</p>}
      </CardContent>
    </Card>
  );
};

export default TransactionUploader;
