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

interface BulkEditDialogProps {
  ids: number[];
  onSave?: () => Promise<void>;
}

export function BulkEditDialog({ ids, onSave }: BulkEditDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
        <BulkEdit 
          ids={ids} 
          onSave={async () => {
            console.log("onSave");
            await onSave?.();
            setOpen(false);
          }} 
        />
      </DialogContent>
    </Dialog>
  );
} 