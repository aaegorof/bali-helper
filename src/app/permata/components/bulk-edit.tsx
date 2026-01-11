import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCallback, useState } from 'react';

import { transactionCategories } from '@/app/permata/categories';
import { deleteTransactions } from '@/app/permata/lib/transactions-service';
import { toast } from 'sonner';
import { updateCategory } from '../actions/update-category';

type BulkEditProps = {
  ids: number[];
  onSave: () => void;
};

const BulkEdit = ({ ids, onSave }: BulkEditProps) => {
  const [category, setCategory] = useState<(typeof transactionCategories)[number] | ''>('');

  const save = useCallback(async () => {
    const { success, error, data } = await updateCategory(ids, category || null);
    if (success) {
      toast.success(`Category updated for ${data?.updatedCount} transactions`);
      onSave();
    } else {
      toast.error(`Failed to update categories: ${error}`);
    }
  }, [ids, category]);

  const remove = async (ids: number[]) => {
    try {
      const result = await deleteTransactions({ ids });

      if (result.success) {
        toast.success(result.data?.message);
        onSave();
      } else {
        toast.error(`Failed to delete transactions: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting transactions:', error);
      toast.error('Error deleting transactions');
    }
  };

  return (
    <div className="grid gap-4">
      <Select
        onValueChange={(value) => setCategory(value as (typeof transactionCategories)[number])}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {transactionCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <div className="flex justify-end gap-2">
        <Button
          variant="destructive"
          onClick={() => {
            if (confirm('Are you sure you want to remove these transactions?')) {
              remove(ids)
                .then(() => {
                  toast.success(`Successfully removed ${ids.length} transactions`);
                  onSave();
                })
                .catch((error) => {
                  toast.error(`Failed to remove transactions: ${error.message}`);
                });
            }
          }}
        >
          Remove
        </Button>
        <Button
          onClick={() => {
            save();
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );
};

export default BulkEdit;
