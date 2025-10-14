import { Checkbox } from '@/components/ui/checkbox';
import { Column, ColumnDef, ColumnMeta, createColumnHelper, FilterFn } from '@tanstack/react-table';
import { TransactionDb } from '../api/transactions/route';
import {
  DebitCreditFilter,
  FilterAmount,
  FilterDates,
  FilterText,
  MultiFilterCategory,
} from './filters';

type TableColumnDef<TData, TValue = unknown> = ColumnDef<TData, TValue> & {
  meta?: ColumnMeta<TData, TValue> & {
    className?: string;
    Filter?: React.ComponentType<{
      column: Column<TData, TValue>;
      reset: () => void;
    }>;
  };
};

export const multiIncludesFilter: FilterFn<TransactionDb> = (row, columnId, filterValue) => {
  if (!filterValue) return true;
  const [Debit, Credit] = filterValue;
  const cellValue = row.getValue(columnId) as string;

  return (cellValue === 'Debit' && Debit) || (cellValue === 'Credit' && Credit);
};

const filterByDateRange: FilterFn<TransactionDb> = (row, columnId, filterValue) => {
  const [startDate, endDate] = filterValue;
  const cellValue = row.getValue(columnId) as string;
  if (startDate && endDate) {
    return new Date(cellValue) >= new Date(startDate) && new Date(cellValue) <= new Date(endDate);
  }
  if (startDate) {
    return new Date(cellValue) >= new Date(startDate);
  }

  if (endDate) {
    return new Date(cellValue) <= new Date(endDate);
  }
  return true;
};

// const helper = createColumnHelper<TransactionDb>();

export const columns: TableColumnDef<TransactionDb>[] = [
  {
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value: boolean) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    meta: {
      className: 'w-4',
    },
    id: 'select',
    cell: ({ row }) => {
      return (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(checked: boolean) => {
            row.toggleSelected(!!checked);
          }}
        />
      );
    },
  },
  {
    header: 'Date',
    id: 'posted_date',
    accessorKey: 'posted_date',
    cell: ({ getValue }) => {
      const date = new Date(getValue() as string);
      const day = date.getDate();
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    },
    // sortingFn: (a, b) => {
    //   if (!a?.original?.posted_date || !b?.original?.posted_date) return 0;
    //   const dateA = new Date(a?.original?.posted_date);
    //   const dateB = new Date(b?.original?.posted_date);
    //   return dateA.getTime() - dateB.getTime();
    // },
    meta: {
      Filter: FilterDates,
      className: 'text-nowrap w-[8ch]',
    },
    filterFn: filterByDateRange,
  },
  {
    header: 'Time',
    id: 'time',
    accessorKey: 'time',
    meta: {
      className: 'text-nowrap text-right w-[8ch]',
    },
    // cell: ({ getValue }) => new Date(getValue()).toLocaleTimeString(),
  },
  {
    header: 'Description',
    accessorKey: 'description',
    meta: {
      Filter: FilterText,
      className: 'text-xs',
    },
  },
  {
    header: 'Type',
    id: 'credit_debit',
    accessorKey: 'credit_debit',
    cell: ({ getValue }) => {
      const value = getValue();
      return (
        <span className={value === 'Debit' ? 'text-destructive' : 'text-positive'}>{value}</span>
      );
    },
    meta: {
      Filter: DebitCreditFilter,
    },
    filterFn: multiIncludesFilter,
  },
  {
    header: 'Category',
    id: 'category',
    accessorKey: 'category',
    meta: {
      Filter: MultiFilterCategory,
    },
    // filterFn: "arrIncludesSome",
    // filterFn: (row, columnId, filterValue) => {
    //   const cellValue = row.getValue(columnId) as string;
    //   if (!filterValue || filterValue.length === 0) return true;
    //   if (filterValue.includes('Uncategorized') && filterValue.length === 1)
    //     return cellValue === '' || cellValue === 'Uncategorized';
    //   return filterValue.includes(cellValue);
    // },
  },
  {
    header: 'Amount',
    accessorKey: 'amount',
    sortingFn: 'alphanumeric',
    meta: {
      className: 'text-nowrap text-right justify-end',
      Filter: FilterAmount,
    },
    filterFn: 'inNumberRange',
    cell: ({ getValue, row }) =>
      row.original.credit_debit === 'Debit' ? (
        <span className="text-destructive">
          {getValue()
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
        </span>
      ) : (
        <span className="text-positive">
          {getValue()
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
        </span>
      ),
  },
];

const columnHelper = createColumnHelper<TransactionDb>();

export const columnsWithHelper = [
  columnHelper.display({
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => row.toggleSelected(!!checked)}
      />
    ),
    meta: {
      className: 'w-4',
    },
  }),
  columnHelper.accessor('posted_date', {
    header: 'Date',
    cell: ({ getValue }) => {
      const date = new Date(getValue());
      const day = date.getDate();
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    },
    meta: {
      Filter: FilterDates,
      className: 'text-nowrap w-[8ch]',
    },
    filterFn: filterByDateRange,
  }),
  columnHelper.accessor('time', {
    header: 'Time',
    meta: {
      className: 'text-nowrap text-right w-[8ch]',
    },
  }),
  columnHelper.accessor('description', {
    header: 'Description',
    meta: {
      Filter: FilterText,
      className: 'text-xs',
    },
  }),
  columnHelper.accessor('credit_debit', {
    header: 'Type',
    cell: ({ getValue }) => {
      const value = getValue();
      return (
        <span className={value === 'Debit' ? 'text-destructive' : 'text-positive'}>{value}</span>
      );
    },
    meta: {
      Filter: DebitCreditFilter,
    },
    filterFn: multiIncludesFilter,
  }),
  columnHelper.accessor('category', {
    header: 'Category',
    meta: {
      Filter: MultiFilterCategory,
    },
  }),
  columnHelper.accessor('amount', {
    header: 'Amount',
    cell: ({ getValue, row }) =>
      row.original.credit_debit === 'Debit' ? (
        <span className="text-destructive">
          {getValue()
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
        </span>
      ) : (
        <span className="text-positive">
          {getValue()
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
        </span>
      ),
    sortingFn: 'alphanumeric',
    meta: {
      className: 'text-nowrap text-right justify-end',
      Filter: FilterAmount,
    },
    filterFn: 'inNumberRange',
  }),
];
