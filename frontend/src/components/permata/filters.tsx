import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "../ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "../ui/select";
import { FilterX } from "lucide-react";
import { transactionCategories } from "@/lib/constants";

const FilterType = ({ column }) => {
  const val = column?.getFilterValue() ?? [true, true];
  return (
    <div className="flex gap-2">
      <Checkbox
        id="includeDebit"
        checked={val.at(0)}
        onCheckedChange={(v) => {
          column.setFilterValue(([a, b]) => [v, b]);
        }}
      />
      <label
        htmlFor="includeDebit"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Debit
      </label>
      <Checkbox
        id="includeCredit"
        checked={val.at(1)}
        onCheckedChange={(v) => {
          column.setFilterValue(([a, b]) => [a, v]);
        }}
      />
      <label
        htmlFor="includeCredit"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Credit
      </label>
    </div>
  );
};

const FilterText = ({ column }) => {
  const val = column?.getFilterValue() ?? "";
  return (
    <Input
      type="search"
      placeholder="Search..."
      value={val}
      onChange={(e) => {
        column.setFilterValue(e.target.value);
      }}
    />
  );
};

const FilterCategory = ({ column }) => {
  const val = column?.getFilterValue() ?? "";
  return (
    <Select value={val} onValueChange={(value) => column.setFilterValue(value)}>
      <SelectTrigger>
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem key={"All"} value={null}>
            All
          </SelectItem>
          {transactionCategories.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

const FilterAmount = ({ column, reset }) => {
  const [min, max] = column?.getFilterValue() ?? ["", ""];
  return (
    <div className="flex gap-2">
      <div className="flex gap-2">
        <Input
          type="number"
          placeholder="Min"
          value={min}
          step={100000}
          onChange={(e) => column.setFilterValue([Number(e.target.value), max])}
        />
        <Input
          type="number"
          placeholder="Max"
          value={max}
          step={100000}
          onChange={(e) => column.setFilterValue([min, Number(e.target.value)])}
        />
      </div>
      <Button
        variant="ghost"
        className="w-10 aspect-square"
        onClick={() => {
          reset();
        }}
      >
        <FilterX />
      </Button>
    </div>
  );
};

const FilterDates = ({ column }) => {
  const [start, end] = column?.getFilterValue();
  return (
    <div className="flex gap-2">
      <div className="flex items-center space-x-2">
        <Input
          type="date"
          value={start}
          onChange={(e) =>
            column.setFilterValue(([a, b]) => [e.target.value, b])
          }
        />
      </div>
      <div className="flex items-center space-x-2">
        <Input
          type="date"
          value={end}
          onChange={(e) =>
            column.setFilterValue(([a, b]) => [a, e.target.value])
          }
        />
        {/* <DatePicker
    mode="single"
    selected={endDate}
    onSelect={setEndDate}
    placeholderText="End Date"
    className="w-full"
  /> */}
        {/* <CalendarIcon className="w-4 h-4 opacity-50" /> */}
      </div>
    </div>
  );
};

export { FilterType, FilterText, FilterDates, FilterAmount, FilterCategory };
