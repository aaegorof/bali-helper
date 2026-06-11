'use client';

import { handleProcessEmbeddingsInBatches } from '@/app/permata/backfilling/actions';
import type { EmbeddingBackfillItem } from '@/app/permata/lib/transactions-service';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';

type BackfillingTableProps = {
  items: EmbeddingBackfillItem[];
};

export function BackfillingTable({ items: initialItems }: BackfillingTableProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [selectedDescriptions, setSelectedDescriptions] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const selectedItems = useMemo(
    () => items.filter((item) => selectedDescriptions.has(item.description)),
    [items, selectedDescriptions]
  );

  const someSelected = selectedDescriptions.size > 0 && selectedDescriptions.size < items.length;
  const allSelected = items.length > 0 && selectedDescriptions.size === items.length;

  const toggleItem = (description: string, checked: boolean) => {
    setSelectedDescriptions((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(description);
      } else {
        next.delete(description);
      }

      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    setSelectedDescriptions(checked ? new Set(items.map((item) => item.description)) : new Set());
  };

  const handleProcessSelected = () => {
    if (selectedItems.length === 0) {
      toast.error('Select at least one row');
      return;
    }

    startTransition(async () => {
      const result = await handleProcessEmbeddingsInBatches(selectedItems);

      if (!result.success) {
        toast.error(result.error ?? 'Embedding update failed');
        return;
      }

      toast.success(`Embeddings updated: ${result.processed} processed, ${result.failed} failed`);

      const processedDescriptions = new Set(selectedItems.map((item) => item.description));
      setItems((current) => current.filter((item) => !processedDescriptions.has(item.description)));
      setSelectedDescriptions(new Set());
      router.refresh();
    });
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          Selected {selectedItems.length} of {items.length}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => (allSelected || someSelected ? toggleAll(false) : toggleAll(true))}
            disabled={items.length === 0 || isPending}
          >
            {allSelected || someSelected ? 'Clear all' : 'Select all'}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleProcessSelected}
            disabled={selectedItems.length === 0 || isPending}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 animate-spin" />
                Updating
              </span>
            ) : (
              'Update selected'
            )}
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                onCheckedChange={() => (allSelected || someSelected ? toggleAll(false) : toggleAll(true))}
                aria-label="Select all missing embeddings"
              />
            </TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="w-64">Category</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                No missing embeddings found.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.description + item.date}>
                <TableCell>
                  <Checkbox
                    checked={selectedDescriptions.has(item.description)}
                    onCheckedChange={(checked) => toggleItem(item.description, checked === true)}
                    aria-label={`Select ${item.description}`}
                  />
                </TableCell>
                <TableCell className="max-w-[720px] whitespace-normal">
                  {item.description}
                </TableCell>
                <TableCell>{format(new Date(item.date), 'dd MMM yyyy HH:mm:ss')}</TableCell>
                <TableCell>{item.category}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
