import React, { useMemo, useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TransactionDb } from "@/pages/permata";
import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
  Column,
  Row,
} from "@tanstack/react-table";
import {
  FilterType,
  FilterText,
  FilterDates,
  FilterCategory,
  FilterAmount,
  MultiFilterCategory,
} from "./filters";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";
import { TRANSACTION_COLORS } from "@/lib/constants";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkEditDialog } from "./bulk-edit-dialog";
import { useTransactionsContext } from "./transactions-context";
import { cn } from "@/lib/utils";

// Add type for checkbox event
type CheckboxEvent = {
  nativeEvent: PointerEvent;
};

declare module '@tanstack/table-core' {
  interface ColumnMeta<TData extends unknown, TValue> {
    className?: string;
    Filter?: React.ComponentType<{
      column: Column<TData, TValue>;
      reset: () => void;
    }>;
  }
}

type TableColumnDef<TData> = ColumnDef<TData, any> & {
  meta?: {
    className?: string;
    Filter?: React.ComponentType<{
      column: Column<TData, any>;
      reset: () => void;
    }>;
  };
};

const defaultFilters: ColumnFiltersState = [
  { id: "type", value: [true, true] },
  { id: "date", value: ["", ""] },
  { id: "amount", value: ["", ""] },
  { id: "category", value: null },
];

const defaultSorting: SortingState = [{ id: "date", desc: true }];

const TransactionsPermata = () => {
  const [filters, setFilters] = useState<ColumnFiltersState>(defaultFilters);
  const [sorting, setSorting] = useState<SortingState>(defaultSorting);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 30,
  });
  const [rowSelection, setRowSelection] = useState({});
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  const { fetchTransactions, transactions: data, setFilteredTransactions } = useTransactionsContext();

  const multiIncludesFilter: FilterFn<any> = (row, columnId, filterValue) => {
    if (!filterValue) return true;
    const [Debit, Credit] = filterValue;
    const cellValue = row.getValue(columnId) as string;

    return (
      (cellValue === "Debit" && Debit) || (cellValue === "Credit" && Credit)
    );
  };

  const filterByDateRange: FilterFn<any> = (row, columnId, filterValue) => {
    const [startDate, endDate] = filterValue;
    const cellValue = row.getValue(columnId) as string;
    if (startDate && endDate) {
      return (
        new Date(cellValue) >= new Date(startDate) &&
        new Date(cellValue) <= new Date(endDate)
      );
    }
    if (startDate) {
      return new Date(cellValue) >= new Date(startDate);
    }

    if (endDate) {
      return new Date(cellValue) <= new Date(endDate);
    }
  };

  useEffect(() => {
    resetRowSelection();
  }, [data])

  const columns = useMemo<TableColumnDef<TransactionDb>[]>(
    () => [
      {
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        meta: {
          className: "w-4",
        },
        id: "select",
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
        header: "Date",
        id: "date",
        accessorKey: "posted_date",
        cell: ({ getValue }) => {
          const date = new Date(getValue() as string);
          const day = date.getDate();
          const month = date.toLocaleString("default", { month: "short" });
          const year = date.getFullYear();
          return `${day} ${month} ${year}`;
        },
        sortingFn: (a, b) => {
          const dateA = new Date(a.original.posted_date);
          const dateB = new Date(b.original.posted_date);
          return dateA.getTime() - dateB.getTime();
        },
        meta: {
          Filter: FilterDates,
          className: "text-nowrap w-[8ch]",
        },
        filterFn: filterByDateRange,
      },
      {
        header: "Time",
        id: "time",
        accessorKey: "time",
        meta: {
          className: "text-nowrap text-right w-[8ch]",
        },
        // cell: ({ getValue }) => new Date(getValue()).toLocaleTimeString(),
      },
      {
        header: "Description",
        accessorKey: "description",
        meta: {
          Filter: FilterText,
          className: "text-xs",
        },
      },
      {
        header: "Type",
        id: "type",
        accessorKey: "credit_debit",
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return (
            <span
              className={value === "Debit" ? "text-destructive" : "text-positive"}
            >
              {value}
            </span>
          );
        },
        meta: {
          Filter: FilterType,
        },
        filterFn: multiIncludesFilter,
      },
      {
        header: "Category",
        id: "category",
        accessorKey: "category",
        meta: {
          Filter: MultiFilterCategory,
        },
        // filterFn: "arrIncludesSome",
        filterFn: (row, columnId, filterValue) => {
          const cellValue = row.getValue(columnId) as string;
          if (!filterValue || filterValue.length === 0) return true;
          if (filterValue.includes("Uncategorized") && filterValue.length === 1) return cellValue === "" || cellValue === 'Uncategorized';
          return filterValue.includes(cellValue)
        },
      },
      {
        header: "Amount",
        accessorKey: "amount",
        sortingFn: "alphanumeric",
        meta: {
          className: "text-nowrap text-right justify-end",
          Filter: FilterAmount,
        },
        filterFn: "inNumberRange",
        cell: ({ getValue, row }) =>
          row.original.credit_debit === "Debit" ? (
            <span className="text-destructive">
              {getValue()
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
            </span>
          ) : (
            <span className="text-positive">
              {getValue()
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, " ")}
            </span>
          )
      },
    ],
    []
  );

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
      columnFilters: defaultFilters,
    },
    columns,
    enableColumnFilters: true,
    filterFns: {
      multiIncludes: multiIncludesFilter,
    },
    getFilteredRowModel: getFilteredRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setFilters,
    onPaginationChange: setPagination,
    enableRowSelection: true,
    enableMultiRowSelection: true,
  });

  const {
    getHeaderGroups,
    getFilteredRowModel: getRowData,
    firstPage,
    getCanPreviousPage,
    getCanNextPage,
    previousPage,
    nextPage,
    lastPage,
    getState,
    getPageCount,
    setPageIndex,
    setPageSize,
    getRowCount,
    resetRowSelection,
    getSelectedRowModel,
  } = table;

  useEffect(() => {
    const data = [...getRowData().rows.map((row) => row.original)]
    setFilteredTransactions(data);
  }, [getRowData()]);

  const onResetFilters = () => {
    setFilters(defaultFilters);
    resetRowSelection();
  };

  function handleRowClick(rowIndex: number, row: Row<TransactionDb>, event: React.MouseEvent) {
    
    if (lastSelectedIndex !== null && event.shiftKey) {
      const start = Math.min(lastSelectedIndex, rowIndex);
        const end = Math.max(lastSelectedIndex, rowIndex);
        
        const newSelection = { ...rowSelection };
        for (let i = start; i <= end; i++) {
          const currentRow = table.getRowModel().rowsById[i]
          
          if (currentRow) {
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
          <div className="flex gap-4 items-center py-2" key={headerGroup.id}>
            <BulkEditDialog
              ids={getSelectedRowModel().rows.map((row) => row.original.id)}
              transactions={getSelectedRowModel().rows.map((row) => row.original)}
              onSave={async () => {
                await fetchTransactions();
                resetRowSelection();
              }}
            />
            {headerGroup.headers.map((header) => (
              <div key={header.id + "filter"}>
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
                    <div className={cn("flex items-center gap-2 justify-inherit", header.column.columnDef.meta?.className)}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    <span>
                      {{  
                        asc: <ArrowUp className="w-4 h-4" />,
                        desc: <ArrowDown className="w-4 h-4" />,
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
              <TableRow className='cursor-pointer' id={row.original.id.toString() + "row"} onClick={(e) => handleRowClick(row.index, row, e)}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    id={cell.id}
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

      <div className="flex items-center justify-end gap-2 py-4">
        <div>Count: {getRowCount()}</div>
        <Button
          variant="outline"
          size="sm"
          onClick={firstPage}
          disabled={!getCanPreviousPage()}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={previousPage}
          disabled={!getCanPreviousPage()}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from(
          { length: Math.min(5, getState().pagination.pageSize) },
          (_, i) => {
            const pageNumber = getState().pagination.pageIndex - 2 + i;
            if (pageNumber < 0 || pageNumber >= getPageCount()) return null;
            return (
              <Button
                key={pageNumber}
                variant={
                  pageNumber === getState().pagination.pageIndex
                    ? "default"
                    : "outline"
                }
                size="sm"
                className="aspect-square"
                onClick={() => setPageIndex(pageNumber)}
              >
                {pageNumber + 1}
              </Button>
            );
          }
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={nextPage}
          disabled={!getCanNextPage()}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={lastPage}
          disabled={!getCanNextPage()}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
        <span>Page</span>
        <Input
          type="number"
          min="1"
          max={getPageCount()}
          defaultValue={getState().pagination.pageIndex + 1}
          onChange={(e) => {
            const page = e.target.value ? Number(e.target.value) - 1 : 0;
            setPageIndex(page);
          }}
          className="border p-1 rounded w-16 text-center"
        />
        <Select
          value={String(getState().pagination.pageSize)}
          onValueChange={(val) => {
            setPageSize(Number(val));
          }}
        >
          <SelectTrigger className="w-[8ch]">
            <SelectValue placeholder="Page size" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={String(pageSize)}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default TransactionsPermata;
