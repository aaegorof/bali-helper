import { AdapterUnprocessedTransaction } from '@/app/transactions/adapters';
import { toast } from 'sonner';

export function showUnprocessedTransactionsToast(options: {
  errors: AdapterUnprocessedTransaction[];
  referenceId?: string;
}) {
  const { errors, referenceId } = options;

  if (errors.length === 0) {
    return;
  }

  toast.error(
    <div className="flex max-h-96 flex-col gap-3 overflow-auto">
      <div className="flex flex-col gap-1">
        <span className="font-medium">{errors.length} transactions were not imported</span>
        {referenceId && (
          <span className="text-xs text-muted-foreground">Saved error reference: {referenceId}</span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {errors.map((error, index) => (
          <div key={`${error.fileName}-${error.rowNumber ?? index}-${index}`} className="text-xs">
            <div className="font-medium">
              {error.fileName}
              {error.rowNumber ? `, row ${error.rowNumber}` : ''}
            </div>
            <div className="text-muted-foreground">{error.reason}</div>
            <pre className="mt-1 whitespace-pre-wrap rounded border p-2">
              {JSON.stringify(error.raw, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>,
    {
      duration: 15000,
    }
  );
}
