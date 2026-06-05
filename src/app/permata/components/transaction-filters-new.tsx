import { useDebounceCallback } from '@/app/hooks/useDebounceCallback';
import { CURRENCY_OPTIONS, CurrencyCode } from '@/app/lib/currencies';
import { toISOString } from '@/app/lib/helpers';
import { AVAILABLE_ADAPTERS } from '@/app/permata/adapters/index';
import { TransactionDb } from '@/app/permata/lib/transactions-service';
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
import { transactionCategories } from '../categories';

export const multiIncludesFilter: FilterFn<TransactionDb> = (row, columnId, filterValue) => {
  if (!filterValue) return true;
  const [Debit, Credit] = filterValue;
  const cellValue = row.getValue(columnId) as string;

  return (cellValue === 'Debit' && Debit) || (cellValue === 'Credit' && Credit);
};

interface FilterAmountProps {
  column: Column<TransactionDb, number>;
}

interface MultiFilterCategoryProps {
  column: Column<TransactionDb, string | null>;
}

export const FilterDates = ({ column }: { column: Column<TransactionDb> }) => {
  const [start, end] = (column?.getFilterValue() as [Date, Date]) ?? [undefined, undefined];

  return (
    <div className="flex gap-2">
      <DatePicker
        date={start}
        setDate={(date) => {
          column.setFilterValue([toISOString(date), end]);
        }}
        label="Start date"
      />
      <DatePicker
        date={end}
        setDate={(date) => {
          column.setFilterValue([start, toISOString(date)]);
        }}
        label="End date"
      />
      {/* <DateRangePicker dates={column?.getFilterValue() as Date[]} setDates={(dates) => {
          console.log(dates);
          column.setFilterValue(dates)}} /> */}
    </div>
  );
};

export const FilterText = ({ column }: { column: Column<TransactionDb> }) => {
  const val = column?.getFilterValue() as string | undefined;
  return (
    <DebounceInput
      type="search"
      placeholder="Search..."
      className="w-[clamp(8ch,25%,32ch)]"
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
      <SelectTrigger className="w-[clamp(12ch,20%,20ch)]">
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
      // className="w-[clamp(12ch,25%,34ch)]"
      className="min-w-[16ch] flex-1"
    />
  );
};

export const FilterAmount: React.FC<FilterAmountProps> = ({ column }) => {
  const columnFilterValue = (column.getFilterValue() as [number?, number?]) ?? [
    undefined,
    undefined,
  ];

  const [minValue, maxValue] = columnFilterValue;

  return (
    <div className="flex gap-2 w-[clamp(20ch,25%,32ch)]">
      <DebounceNumberInput
        id="min-amount"
        placeholder="Price Min"
        value={minValue}
        className="min-w-[12ch]"
        step={100000}
        onChange={(e) => column.setFilterValue([e, maxValue])}
      />
      <DebounceNumberInput
        id="max-amount"
        placeholder="Price Max"
        className="min-w-[12ch]"
        value={maxValue}
        step={100000}
        onChange={(e) => column.setFilterValue([minValue, e])}
      />
    </div>
  );
};

export const FilterCurrency = ({ column }: { column: Column<TransactionDb> }) => {
  const val = column?.getFilterValue() as CurrencyCode | undefined;

  return (
    <Select value={val} onValueChange={(value) => column.setFilterValue(value)}>
      <SelectTrigger className="w-[clamp(12ch,20%,20ch)]">
        <SelectValue placeholder="Currency" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {/* @ts-expect-error - null is a valid value for the SelectItem */}
          <SelectItem key="All" value={null}>
            All
          </SelectItem>
          {CURRENCY_OPTIONS.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              <div className="flex gap-2">
                <span className="font-medium">{currency.symbol}</span>
                <span>{currency.code}</span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export const FilterSource = ({ column }: { column: Column<TransactionDb> }) => {
  const val = column?.getFilterValue() as string[] | undefined;

  const options = AVAILABLE_ADAPTERS.map((adapter) => ({
    label: adapter.name,
    value: adapter.id,
  }));

  const debouncedSetFilter = useDebounceCallback<typeof column.setFilterValue>((values) => {
    column.setFilterValue(values);
  }, 1200);

  return (
    <MultiSelect
      options={options}
      defaultValue={val}
      value={val}
      onValueChange={debouncedSetFilter}
      placeholder="Select source..."
      maxCount={1}
      className="min-w-[16ch] w-auto"
    />
  );
};
