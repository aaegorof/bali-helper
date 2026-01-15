import { TransactionDb } from '@/app/permata/lib/transactions-service';
import { Checkbox } from '@/components/ui/checkbox';
import { createColumnHelper } from '@tanstack/react-table';
import { format } from 'date-fns';
import {
  DebitCreditFilter,
  FilterAmount,
  FilterCurrency,
  FilterDates,
  FilterText,
  MultiFilterCategory,
} from './transaction-filters-new';

// Расширяем тип meta для кастомных свойств
// declare module '@tanstack/react-table' {
//   interface ColumnMeta<TData, TValue> {
//     className?: string;
//     Filter?: React.FunctionComponent<{ column: Column<TData, TValue>; reset: () => void }>;
//   }
// }

const columnHelper = createColumnHelper<TransactionDb>();

export const columns = [
  columnHelper.display({
    id: 'select',
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
  }),

  columnHelper.accessor('date', {
    header: 'Date',
    cell: ({ getValue }) => {
      const date = new Date(getValue() as string);
      return format(date, 'dd MMM yyyy HH:mm:ss');
    },
    meta: {
      Filter: FilterDates,
      className: 'text-nowrap w-[8ch]',
    },
  }),

  columnHelper.accessor('description', {
    header: 'Description',
    cell: (info) => info.getValue(),
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
  }),

  columnHelper.accessor('category', {
    header: 'Category',
    cell: (info) => info.getValue(),
    meta: {
      Filter: MultiFilterCategory,
    },
  }),

  columnHelper.accessor('amount', {
    header: 'Amount',
    sortingFn: 'alphanumeric',
    meta: {
      className: 'text-nowrap text-right justify-end',
      Filter: FilterAmount,
    },
    filterFn: 'inNumberRange',
    cell: ({ getValue, row }) => {
      const amount = getValue();
      const formatted = amount?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

      return row.original.credit_debit === 'Debit' ? (
        <span className="text-destructive">{formatted}</span>
      ) : (
        <span className="text-positive">{formatted}</span>
      );
    },
  }),

  columnHelper.accessor('currency', {
    header: 'Currency',
    meta: {
      className: 'w-[8ch] text-nowrap text-right justify-end',
      Filter: FilterCurrency,
    },
    cell: ({ getValue }) => {
      const currency = getValue();
      return <span>{currency}</span>;
    },
  }),
];
