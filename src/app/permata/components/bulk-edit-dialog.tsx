import { useCallback, useEffect, useState } from 'react';

import { RespSuggestCategories } from '@/app/permata/api/suggest/route';
import { TransactionDb } from '@/app/permata/api/transactions/route';
import { UpdateCategoriesResponse } from '@/app/permata/api/update/route';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoaderPinwheel } from 'lucide-react';
import { toast } from 'sonner';
import { transactionCategories } from '../categories';

interface BulkEditDialogProps {
  ids: number[];
  onSave?: () => Promise<void>;
  transactions?: TransactionDb[];
}

type TransForEdit = TransactionDb & { suggested: null | RespSuggestCategories['categories'][0] };

export function BulkEditDialog({ ids, onSave, transactions }: BulkEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [transForEdit, setTransForEdit] = useState<Map<number, TransForEdit>>();
  const [loading, setLoading] = useState<Map<'sug' | 'upd', boolean>>(new Map());
  const [category, setCategory] = useState('');

  const onClickSuggest = async () => {
    toast.success(`Suggesting categories...`);
    setLoading(loading.set('sug', true));

    const resp = await fetch(`/permata/api/suggest`, {
      method: 'POST',
      body: JSON.stringify({ transactions }),
    });

    setLoading(loading.set('sug', false));

    const data = (await resp.json()) as RespSuggestCategories;
    if (!data.categories.some((cat) => cat.category || cat.keywordCategory)) {
      toast.error('No suggestions for categories found');
      return;
    }
    setTransForEdit((prev) => {
      const newMap = new Map(prev);
      data.categories.forEach((cat) => {
        newMap.set(cat.id, { ...prev?.get(cat.id)!, suggested: cat });
      });
      return newMap;
    });
  };

  const onClickUpdate = async (idsToUpdate: number[], category: string) => {
    setLoading(loading.set('upd', true));

    const resp = await fetch(`/permata/api/update`, {
      method: 'POST',
      body: JSON.stringify({ ids: idsToUpdate, category }),
    });

    const data = (await resp.json()) as UpdateCategoriesResponse;

    if (data.success) {
      toast.success(`Category updated for ${data.data?.updatedCount} transactions`);
      setTransForEdit((prev) => {
        const newMap = new Map(prev);
        if (prev) {
          idsToUpdate.forEach((id) => {
            newMap.delete(id);
          });
        }
        return newMap;
      });
      setLoading(loading.set('upd', false));

      if (idsToUpdate.length === ids.length) {
        onSave?.();
      }
    }
  };

  const remove = useCallback(async () => {
    setLoading(new Map().set('upd', true));
    const res = await fetch('/permata/api', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success(data?.data?.message);
      onSave?.();
    }
    setLoading(new Map().set('upd', false));
  }, [ids, onSave]);

  useEffect(() => {
    if (open) {
      setTransForEdit(new Map(transactions?.map((t) => [t.id!, { ...t, suggested: null }]) || []));
    }
  }, [open, transactions]);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        setTransForEdit(new Map());
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" disabled={ids.length === 0} className="w-[13ch]">
          Bulk Edit ({ids.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[60rem] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Edit Transactions ({transForEdit?.size})</DialogTitle>
        </DialogHeader>

        {transForEdit && transForEdit?.size > 0 && (
          <ul className="list-disc pl-2">
            {Array.from(transForEdit?.entries() || []).map(([id, trans]) => (
              <li key={id} className="list-item">
                <div className="flex items-center gap-2 text-xs ">
                  <div>{trans.description}</div>
                  <div className="inline-flex items-center gap-2 ml-auto">
                    {trans.suggested?.category && (
                      <Button
                        size="none"
                        variant="link"
                        onClick={() => {
                          onClickUpdate([id], trans.suggested?.category || '');
                        }}
                        disabled={loading.get('upd')}
                      >
                        {trans.suggested.category}
                      </Button>
                    )}
                    {trans?.suggested?.keywordCategory &&
                      trans?.suggested?.keywordCategory !== trans?.suggested?.category && (
                        <Button
                          size="none"
                          variant="link"
                          onClick={() => {
                            onClickUpdate([id], trans?.suggested?.keywordCategory);
                          }}
                          disabled={loading.get('upd')}
                        >
                          {trans.suggested?.keywordCategory}
                        </Button>
                      )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="grid gap-4">
          <div className="flex gap-2">
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
            <Button variant="outline" onClick={onClickSuggest} disabled={loading.get('sug')}>
              Suggest Categories{' '}
              {loading.get('sug') && <LoaderPinwheel className="w-4 h-4 ml-2 animate-spin" />}
            </Button>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              disabled={loading.get('upd')}
              variant="destructive"
              onClick={() => {
                if (confirm('Are you sure you want to remove these transactions?')) {
                  remove()
                    .then(() => {
                      toast.success(`Successfully removed ${ids.length} transactions`);
                      onSave?.();
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
              disabled={loading.get('upd')}
              onClick={() => {
                onClickUpdate(ids, category);
                setOpen(false);
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
