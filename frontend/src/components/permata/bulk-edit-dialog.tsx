import React, { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import BulkEdit from "./bulk-edit";
import { TransactionDb } from "@/pages/permata";
import { suggestCategory, removeTransactions, RespSuggestCategory, updateCategories } from "@/services/api";

interface BulkEditDialogProps {
  ids: number[];
  onSave?: () => Promise<void>;
  transactions?: TransactionDb[]
}

export function BulkEditDialog({ ids, onSave, transactions }: BulkEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [suggested, setSuggested] = useState<Array<RespSuggestCategory & {id: number}>>()

  const onClickSuggest = async () => {

    transactions.map(async trans => {
      const resp = await suggestCategory(trans)
      setSuggested(prev => [...prev, {id: trans.id,...resp}])
    })
  }

  const onClickUpdate = async (id: number, category: string) => {
    await updateCategories([id], category)
    setSuggested(prev => prev?.filter(s => s.id !== id))
  }

  return (
    <Dialog open={open} onOpenChange={isOpen => {
      setOpen(isOpen)
      setSuggested([])
    }}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          disabled={ids.length === 0}
        >
          Bulk Edit ({ids.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bulk Edit Transactions ({ids.length})</DialogTitle>
        </DialogHeader>
        <Button variant="outline" onClick={onClickSuggest}>Suggest Categories</Button>
        <div className="flex flex-col">
          {suggested?.map(s => (
            <div key={s.id} className="flex gap-2">
              <div>{s.id}</div>
              <div>{s.category}</div>
              <div>{s.keywordCategory}</div>
              {/* <div><Button variant="outline" onClick={() => {
                onClickUpdate(s.id, s.category)
              }}>Update</Button></div> */}
            </div>
          ))}
        </div>
        <BulkEdit 
          ids={ids} 
          onSave={async () => {
            await onSave?.();
            setOpen(false);
          }} 
        />
      </DialogContent>
    </Dialog>
  );
} 