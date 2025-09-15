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

import { UpdateCategoriesResponse } from '@/app/permata/api/update/route';
import { transactionCategories } from '@/app/permata/categories';
import { toast } from 'sonner';

type BulkEditProps = {
  ids: number[];
  onSave: () => void;
};

const BulkEdit = ({ ids, onSave }: BulkEditProps) => {
  const [category, setCategory] = useState('');

  const save = useCallback(async () => {
    const res = await fetch('/permata/api/update', {
      method: 'POST',
      body: JSON.stringify({ ids, category }),
    });
    const data = (await res.json()) as UpdateCategoriesResponse;
    if (data.success) {
      toast.success(`Category updated for ${data.data?.updatedCount} transactions`);
      onSave();
    } else {
      toast.error(`Failed to update categories: ${data.error}`);
    }
  }, [ids, category]);

  const remove = async (ids: number[]) => {
    const res = await fetch('/permata/api', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success(data?.data?.message);
      onSave();
    }
  };

  return (
    <div className="grid gap-4">
      <Select onValueChange={(value) => setCategory(value)}>
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
