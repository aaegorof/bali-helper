import React, { useState, useCallback } from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FilterCategory } from "./filters";
import { transactionCategories } from "@/lib/constants";
import { toast } from "sonner";

type BulkEditProps = {
  ids: number[];
  onSave: () => void;
}

const BulkEdit = ({ids, onSave}: BulkEditProps) => {
  const [category, setCategory] = useState("");

  const save = useCallback(() => {
    fetch(`http://localhost:5500/api/transactions/update-category`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids: [...ids], category }),
    }).then((res) => {
      if (res.ok) {
        toast.success("Category updated");
        onSave();
      } else {
        toast.error("Failed to update category");
      }
    }).catch((err) => {
      toast.error("Failed to update category");
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
    <div className="flex justify-end">
    <Button onClick={() => {
        save();
    }}>Save</Button>
    </div>
  </div>;
};

export default BulkEdit;
