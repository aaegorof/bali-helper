import { useDebounceCallback } from '@/app/hooks/useDebounceCallback';
import { TransactionDb } from '@/app/permata/api/transactions/route';
import { transactionCategories } from '@/app/permata/categories';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Column } from '@tanstack/react-table';
import { FilterX } from 'lucide-react';

const FilterDates = ({ column }: { column: Column<TransactionDb> }) => {
  const [start, end] = (column?.getFilterValue() as [Date, Date]) ?? [undefined, undefined];
  return (
    <div className="flex gap-2">
      <DatePicker
        date={start}
        setDate={(date) => column.setFilterValue(([a, b]) => [date?.toISOString(), b])}
        label="Start date"
      />
      <DatePicker
        date={end}
        setDate={(date) => column.setFilterValue(([a, b]) => [a, date?.toISOString()])}
        label="End date"
      />
      {/* <DateRangePicker dates={column?.getFilterValue() as Date[]} setDates={(dates) => {
          console.log(dates);
          column.setFilterValue(dates)}} /> */}
    </div>
  );
};

const DebitCreditFilter = ({ column }: { column: Column<TransactionDb> }) => {
  const val = column?.getFilterValue() as string | undefined;
  return (
    <Select value={val} onValueChange={(value) => column.setFilterValue(value)}>
      <SelectTrigger>
        <SelectValue placeholder="Transaction type" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
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

const FilterType = ({ column }: { column: Column<TransactionDb> }) => {
  const val = column?.getFilterValue();
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

const FilterText = ({ column }: { column: Column<TransactionDb> }) => {
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

// const FilterCategory = ({ column }: { column: Column<TransactionDb> }) => {
//   const val = column?.getFilterValue();
//   return (
//     <Select value={val} onValueChange={(value) => column.setFilterValue(value)}>
//       <SelectTrigger>
//         <SelectValue placeholder="Select category" />
//       </SelectTrigger>
//       <SelectContent>
//         <SelectGroup>
//           <SelectItem key={'All'} value={null}>
//             All
//           </SelectItem>
//           {transactionCategories.map((category) => (
//             <SelectItem key={category} value={category}>
//               {category}
//             </SelectItem>
//           ))}
//           <SelectItem key={'empty'} value={'Uncategorized'}>
//             {'Uncategorized'}
//           </SelectItem>
//         </SelectGroup>
//       </SelectContent>
//     </Select>
//   );
// };

const MultiFilterCategory = ({ column }: { column: Column<TransactionDb, string[] | null> }) => {
  const val = column?.getFilterValue() as string[] | undefined;
  const options = [
    { label: 'Uncategorized', value: 'Uncategorized' },
    ...transactionCategories.map((category) => ({
      label: category,
      value: category,
    })),
  ];

  const debouncedSetFilter = useDebounceCallback((values: string[] | null) => {
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

const FilterAmount = ({
  column,
  reset,
}: {
  column: Column<TransactionDb, [number?, number?]>;
  reset: () => void;
}) => {
  const [min, max] = (column?.getFilterValue() as [number?, number?]) ?? [undefined, undefined];

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

export {
  DebitCreditFilter,
  FilterAmount,
  // FilterCategory,
  FilterDates,
  FilterText,
  FilterType,
  MultiFilterCategory,
};
