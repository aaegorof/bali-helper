import { useDebounceCallback } from '@/app/hooks/useDebounceCallback';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/datepicker';
import { DebounceInput, DebounceNumberInput } from '@/components/ui/input';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Column, FilterFn } from '@tanstack/react-table';
import { FilterX } from 'lucide-react';
import { TransactionDb } from '../api/transactions/route';
import { transactionCategories } from '../categories';


export const multiIncludesFilter: FilterFn<TransactionDb> = (row, columnId, filterValue) => {
  if (!filterValue) return true;
  const [Debit, Credit] = filterValue;
  const cellValue = row.getValue(columnId) as string;

  return (cellValue === 'Debit' && Debit) || (cellValue === 'Credit' && Credit);
};

interface FilterAmountProps {
  column: Column<TransactionDb, number>;
  reset: () => void;
}

export const FilterAmount: React.FC<FilterAmountProps> = ({ column, reset }) => {
  const columnFilterValue = (column.getFilterValue() as [number?, number?]) ?? [
    undefined,
    undefined,
  ];

  const [minValue, maxValue] = columnFilterValue;

  return (
    <div className="flex gap-2">
      <div className="flex gap-2">
        <DebounceNumberInput
          placeholder="Min"
          value={minValue}
          step={100000}
          onChange={(e) => column.setFilterValue([e, maxValue])}
        />
        <DebounceNumberInput
          placeholder="Max"
          value={maxValue}
          step={100000}
          onChange={(e) => column.setFilterValue([minValue, e])}
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

interface MultiFilterCategoryProps {
  column: Column<TransactionDb, string | null>;
}

export const MultiFilterCategory = ({ column }: MultiFilterCategoryProps) => {
  const val = column?.getFilterValue() as string[] | undefined;
  const options = [
    { label: 'Uncategorized', value: 'Uncategorized' },
    ...transactionCategories.map((category) => ({
      label: category,
      value: category,
    })),
  ];

  const debouncedSetFilter = useDebounceCallback<typeof column.setFilterValue>((values) => {
    column.setFilterValue(values);
  }, 1200);

  return (
    <MultiSelect
      options={options}
      defaultValue={val}
      value={val}
      onValueChange={debouncedSetFilter}
      placeholder="Select categories..."
      maxCount={1}
      className="w-full min-w-80"
    />
  );
};

export const FilterText = ({ column }: { column: Column<TransactionDb> }) => {
  const val = column?.getFilterValue() as string | undefined;
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

export const DebitCreditFilter = ({ column }: { column: Column<TransactionDb> }) => {
  const val = column?.getFilterValue() as string | undefined;
  return (
    <Select value={val} onValueChange={(value) => column.setFilterValue(value)}>
      <SelectTrigger>
        <SelectValue placeholder="Transaction type" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {/* @ts-expect-error - null is a valid value for the SelectItem */}
          <SelectItem key={'All'} value={null}>
            All
          </SelectItem>
          {['Debit', 'Credit'].map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export const FilterDates = ({ column }: { column: Column<TransactionDb> }) => {
  const [start, end] = (column?.getFilterValue() as [Date, Date]) ?? [undefined, undefined];
  return (
    <div className="flex gap-2">
      <DatePicker
        date={start}
        setDate={(date) =>
          column.setFilterValue(([a, b]: [Date, Date]) => [date?.toISOString(), b])
        }
        label="Start date"
      />
      <DatePicker
        date={end}
        setDate={(date) =>
          column.setFilterValue(([a, b]: [Date, Date]) => [a, date?.toISOString()])
        }
        label="End date"
      />
      {/* <DateRangePicker dates={column?.getFilterValue() as Date[]} setDates={(dates) => {
          console.log(dates);
          column.setFilterValue(dates)}} /> */}
    </div>
  );
};
