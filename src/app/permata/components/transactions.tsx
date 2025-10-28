import { cn } from '@/app/lib/utils';
import { TransactionDb } from '@/app/permata/api/transactions/route';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Column,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  Row,
  Updater,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { BulkEditDialog } from './bulk-edit-dialog';
import PaginationStack from './pagination';
import { columns } from './transaction-columns-copy';
import { defaultFilters, useTransactionsContext } from './transactions-context';

declare module '@tanstack/table-core' {
  interface ColumnMeta<TData, TValue> {
    className?: string;
    Filter?: React.FunctionComponent<{
      column: Column<TData, TValue>;
      reset: () => void;
    }>;
  }
}

const TransactionsPermata = () => {
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  const {
    fetchTransactions,
    transactions: data,
    filters,
    setFilters,
    pagination,
    setPagination,
    sorting,
    setSorting,
    count,
  } = useTransactionsContext();

  useEffect(() => {
    resetRowSelection();
  }, [data]);

  const table = useReactTable({
    data: data,
    state: {
      columnFilters: filters,
      sorting,
      pagination,
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    initialState: {
      columnFilters: filters,
    },
    columns,
    enableColumnFilters: true,

    // getFilteredRowModel: getFilteredRowModel(),
    getCoreRowModel: getCoreRowModel(),
    // getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
    manualPagination: true,
    manualFiltering: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: (updaterOrValue: Updater<ColumnFiltersState>) => {
      setFilters(updaterOrValue as ColumnFiltersState);
    },
    onPaginationChange: setPagination,
    enableRowSelection: true,
    enableMultiRowSelection: true,
    rowCount: count,
  });

  const { getHeaderGroups, resetRowSelection, getSelectedRowModel } = table;

  const onResetFilters = () => {
    setFilters(defaultFilters);
    resetRowSelection();
  };

  function handleRowClick(row: Row<TransactionDb>, event: React.MouseEvent) {
    const flatTble = table.getSortedRowModel().flatRows;
    const rowIndex = row.index;
    const indexNum = flatTble.findLastIndex((v) => v.index === rowIndex);
    const indexLastNum = flatTble.findLastIndex((v) => v.index === lastSelectedIndex);

    if (indexLastNum !== null && indexLastNum !== -1 && event.shiftKey) {
      const start = Math.min(indexLastNum, indexNum);
      const end = Math.max(indexLastNum, indexNum);

      const newSelection = { ...rowSelection };
      for (let i = start; i <= end; i++) {
        const currentRow = flatTble[i];

        if (currentRow?.id) {
          newSelection[currentRow.id] = true;
        }
      }

      setRowSelection(newSelection);
      setLastSelectedIndex(rowIndex);
    } else {
      row.toggleSelected();
      setLastSelectedIndex(rowIndex);
    }
  }

  return (
    <div className="overflow-x-auto">
      <div>
        {getHeaderGroups().map((headerGroup) => (
          <div className="flex items-center gap-4 py-2" key={headerGroup.id}>
            <BulkEditDialog
              ids={getSelectedRowModel().rows.map((row) => row.original.id ?? 0)}
              transactions={getSelectedRowModel().rows.map((row) => row.original)}
              onSave={async () => {
                await fetchTransactions({ pagination, filters, sorting });
                resetRowSelection();
              }}
            />
            {headerGroup.headers.map((header) => (
              <div key={header.id + 'filter'}>
                {header.column.columnDef.meta?.Filter ? (
                  <header.column.columnDef.meta.Filter
                    column={header.column}
                    reset={onResetFilters}
                  />
                ) : null}
              </div>
            ))}
          </div>
        ))}
      </div>

      <Table className="min-w-full">
        <TableHeader>
          {getHeaderGroups().map((headerGroup) => (
            <React.Fragment key={headerGroup.id}>
              <TableRow>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    id={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    key={header.id}
                  >
                    <div
                      className={cn(
                        'justify-inherit flex items-center gap-2',
                        header.column.columnDef.meta?.className
                      )}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <span>
                        {{
                          asc: <ArrowUp className="h-4 w-4" />,
                          desc: <ArrowDown className="h-4 w-4" />,
                        }[header.column.getIsSorted() as string] ?? null}
                      </span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </React.Fragment>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.map((row) => {
            return (
              <TableRow
                className="cursor-pointer"
                key={row.original.id?.toString() + 'row'}
                id={row.original.id?.toString() + 'row'}
                onClick={(e) => handleRowClick(row, e)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    id={cell.id}
                    key={cell.id}
                    className={cell.column.columnDef.meta?.className}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <PaginationStack count={count} table={table} />
    </div>
  );
};

export default TransactionsPermata;
