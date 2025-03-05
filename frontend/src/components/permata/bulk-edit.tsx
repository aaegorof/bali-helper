import React, { useState, useCallback } from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import { toast } from "sonner";
import { transactionCategories } from "../../../../backend/categories";
import { removeTransactions, updateCategories } from "@/services/api";

type BulkEditProps = {
  ids: number[];
  onSave: () => void;
}

const BulkEdit = ({ids, onSave}: BulkEditProps) => {
  const [category, setCategory] = useState("");

  const save = useCallback(() => {
   updateCategories(ids, category).then((res) => {
      if (res.success) {
        toast.success(`Category updated for ${ids.length} transactions`);
        onSave();
      } else {
        toast.error(`Failed to update categories: ${res.error}`);
      }
    }).catch((err) => {
      toast.error(`Failed to update categories: ${err}`);
    });
  }, [ids, category]);

  return <div className="grid gap-4">
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
    <div className="flex gap-2 justify-end">
    <Button variant="destructive" onClick={() => removeTransactions(ids)}>Remove</Button>
    <Button onClick={() => {
        save();
    }}>Save</Button>
    </div>
  </div>;
};

export default BulkEdit;
