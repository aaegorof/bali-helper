import { useAuth } from '@/app/lib/auth';
import { AVAILABLE_ADAPTERS, getAdapterById, NormalizedTransaction } from '@/app/permata/adapters';
import { saveTransactions } from '@/app/permata/lib/transactions-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { useTransactionsContext } from './transactions-context';

const saveTransactionsToDatabase = async (
  transactions: NormalizedTransaction[],
) => {
  try {
    const result = await saveTransactions({ transactions });

    if (result.success) {
      toast.success(result.data?.message);
    } else {
      toast.error('Error saving transactions: ' + result.details);
    }
    return result;
  } catch (error) {
    console.error('Error saving transactions:', error);
    throw error;
  }
};

const TransactionUploader = () => {
  const { user: currentUser } = useAuth();
  const { setTransactions } = useTransactionsContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedAdapterId, setSelectedAdapterId] = useState<string>(
    AVAILABLE_ADAPTERS[0]?.id || ''
  );

  const handleFileUpload = async (formData: FormData) => {
    const files = formData.getAll('file') as File[];
    let allParsedData: NormalizedTransaction[] = [];

    if (!currentUser) {
      toast.error('No user logged in');
      return;
    }

    const adapter = getAdapterById(selectedAdapterId);
    if (!adapter) {
      toast.error('Please select a valid bank adapter');
      return;
    }

    if (files.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    try {
      // Parse all files using the selected adapter
      for (const file of files) {
        try {
          // Validate file format
          if (adapter.validate && !(await adapter.validate(file))) {
            toast.error(`Invalid file format for ${file.name}`);
            continue;
          }

          const parsedData = await adapter.parse(file);
          allParsedData = allParsedData.concat(parsedData);
        } catch (error) {
          console.error(`Error parsing file ${file.name}:`, error);
          toast.error(
            `Failed to parse ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      if (allParsedData.length === 0) {
        toast.error('No valid transactions found in the uploaded files');
        return;
      }
      
      setIsLoading(true);
      // Save to database
      const res = await saveTransactionsToDatabase(allParsedData);
      if (res.success && res.data?.inserted_rows) {
        setTransactions(res.data.inserted_rows);
      }
    } catch (error) {
      console.error('Error processing transactions:', error);
      toast.error('Failed to process transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedAdapter = getAdapterById(selectedAdapterId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Transactions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {/* Adapter Selection */}
        <div className="space-y-2">
          <Label htmlFor="adapter-select">Select Bank</Label>
          <Select value={selectedAdapterId} onValueChange={setSelectedAdapterId}>
            <SelectTrigger id="adapter-select">
              <SelectValue placeholder="Select a bank" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_ADAPTERS.map((adapter) => (
                <SelectItem key={adapter.id} value={adapter.id}>
                  {adapter.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedAdapter && (
            <div className="text-xs text-muted-foreground">{selectedAdapter.description}</div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-xs space-y-2">
          <p>
            Upload transaction files from your selected bank. The system will automatically parse
            and save transactions to the database.
          </p>
          <p>After uploading, you will see the imported transactions below.</p>
          <p>
            Transactions are unique by hash - uploading the same file multiple times won&apos;t
            create duplicates.
          </p>
          {selectedAdapter && (
            <p>
              <strong>Supported formats:</strong> {selectedAdapter.supportedFormats.join(', ')}
            </p>
          )}
        </div>

        {/* File Upload */}
        <form
          action={(formData) => startTransition(() => handleFileUpload(formData))}
          className="pt-3 flex gap-2 relative"
        >
          <Label htmlFor="file-upload" className="absolute -top-2">
            Upload Files <span className="text-xs text-muted-foreground">(multiple supported)</span>
          </Label>
          <Input
            id="file-upload"
            name="file"
            type="file"
            accept={selectedAdapter?.supportedFormats.join(', ') || '.csv, .xlsx, .xls'}
            multiple
            className="cursor-pointer bg-accent"
            disabled={isPending || !selectedAdapter}
          />
          <Button type="submit" disabled={isPending || !selectedAdapter}>
            {isPending ? 'Uploading...' : 'Upload'}
          </Button>
        </form>

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Processing transactions...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionUploader;
