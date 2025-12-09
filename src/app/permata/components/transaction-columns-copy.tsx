import { createColumnHelper } from '@tanstack/react-table';
import { TransactionDb } from '@/app/permata/lib/transactions-service';
import { DebitCreditFilter, FilterAmount, FilterDates, FilterText, MultiFilterCategory } from './transaction-filters-new';
import { Checkbox } from '@/components/ui/checkbox';


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

  

  columnHelper.accessor('posted_date', {
    header: 'Date',
    cell: ({ getValue }) => {
      const date = new Date(getValue() as string);
      const day = date.getDate();
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    },
    meta: {
      Filter: FilterDates,
      className: 'text-nowrap w-[8ch]',
    },
  }),

  columnHelper.accessor('time', {
    header: 'Time',
    cell: info => info.getValue(),
    meta: {
      className: 'text-nowrap text-right w-[8ch]',
    },
  }),

  columnHelper.accessor('description', {
    header: 'Description',
    cell: info => info.getValue(),
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
    cell: info => info.getValue(),
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
];