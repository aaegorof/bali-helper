import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { DebounceInput, DebounceNumberInput } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '@/components/ui/select';
import { FilterX } from 'lucide-react';
import { transactionCategories } from '@/app/permata/categories';
import { MultiSelect } from '@/components/ui/multi-select';
import { DatePicker } from '@/components/ui/datepicker';
import { TransactionDb } from '@/app/api/transactions/route';
import { Column } from '@tanstack/react-table';

const FilterType = ({ column }: { column: Column<TransactionDb> }) => {
  const val = column?.getFilterValue() ?? [true, true];
  return (
    <div className="flex gap-2">
      <Checkbox
        id="includeDebit"
        checked={val?.at(0)}
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
        checked={val?.at(1)}
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

const FilterText = ({ column }: { column: Column<TransactionDb, string> }) => {
  const val = column?.getFilterValue() ?? '';
  return (
    <DebounceInput
      type="search"
      placeholder="Search..."
      value={val}
      onChange={(e) => {
        column.setFilterValue(e.target.value);
      }}
    />
  );
};

const FilterCategory = ({ column }: { column: Column<TransactionDb> }) => {
  const val = column?.getFilterValue();
  return (
    <Select value={val} onValueChange={(value) => column.setFilterValue(value)}>
      <SelectTrigger>
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem key={'All'} value={null}>
            All
          </SelectItem>
          {transactionCategories.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
          <SelectItem key={'empty'} value={'Uncategorized'}>
            {'Uncategorized'}
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

const MultiFilterCategory = ({ column }: { column: Column<TransactionDb> }) => {
  const val = column?.getFilterValue() ?? null;
  const options = [
    { label: 'Uncategorized', value: 'Uncategorized' },
    ...transactionCategories.map((category) => ({
      label: category,
      value: category,
    })),
  ];

  return (
    <MultiSelect
      options={options}
      defaultValue={val}
      value={val}
      onValueChange={(values) => {
        // Если выбрано "All" или все категории, очищаем фильтр
        if (values.includes(null) || values.length === options.length - 1) {
          column.setFilterValue(null);
        } else {
          column.setFilterValue(values);
        }
      }}
      placeholder="Select categories..."
      maxCount={1}
      className="w-full min-w-80"
    />
  );
};

const FilterAmount = ({ column, reset }: { column: Column<TransactionDb>; reset: () => void }) => {
  const [min, max] = column?.getFilterValue() ?? ['', ''];

  return (
    <div className="flex gap-2">
      <div className="flex gap-2">
        <DebounceNumberInput
          placeholder="Min"
          value={min}
          step={100000}
          onChange={(e) => column.setFilterValue([e, max])}
        />
        <DebounceNumberInput
          placeholder="Max"
          value={max}
          step={100000}
          onChange={(e) => column.setFilterValue([min, e])}
        />
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="aspect-square w-10"
        onClick={() => {
          reset();
        }}
      >
        <FilterX className="h-5 w-5" />
      </Button>
    </div>
  );
};

const FilterDates = ({ column }: { column: Column<TransactionDb> }) => {
  const [start, end] = column?.getFilterValue();
  return (
    <div className="flex gap-2">
      <DatePicker date={start} setDate={(date) => column.setFilterValue(([a, b]) => [date, b])} />
      <DatePicker date={end} setDate={(date) => column.setFilterValue(([a, b]) => [a, date])} />
    </div>
  );
};

export { FilterType, FilterText, FilterDates, FilterAmount, FilterCategory, MultiFilterCategory };
