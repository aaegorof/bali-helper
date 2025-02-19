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
} from "@tanstack/react-table";
import { FilterType, FilterText, FilterDates, FilterCategory, FilterAmount } from "./filters";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FilterX,
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

type Props = {
  data: TransactionDb[];
  onFilterChange: (filteredData: TransactionDb[]) => void;
};

const defaultFilters: ColumnFiltersState = [
  { id: "type", value: [true, true] },
  { id: "date", value: ["", ""] },
  { id: "amount", value: ["", ""] },
];

const defaultSorting: SortingState = [{ id: "date", desc: true }];

const TransactionsPermata = ({ data, onFilterChange }: Props) => {
  const [filters, setFilters] = useState<ColumnFiltersState>(defaultFilters);
  const [sorting, setSorting] = useState<SortingState>(defaultSorting);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 30,
  });

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

  const columns = useMemo<ColumnDef<TransactionDb, any>[]>(
    () => [
      {
        header: "Date",
        id: "date",
        accessorKey: "posted_date",
        cell: ({ getValue }) => new Date(getValue()).toLocaleDateString(),
        sortingFn: (a, b) => {
          const dateA = new Date(a.original.posted_date);
          const dateB = new Date(b.original.posted_date);
          return dateA.getTime() - dateB.getTime();
        },
        Filter: FilterDates,
        filterFn: filterByDateRange,
      },
      {
        header: "Time",
        id: "time",
        accessorKey: "time",
        // cell: ({ getValue }) => new Date(getValue()).toLocaleTimeString(),
      },
      {
        header: "Description",
        accessorKey: "description",
        Filter: FilterText,
        className: "text-xs",
      },
      {
        header: "Type",
        id: "type",
        accessorKey: "credit_debit",
        cell: ({ getValue }) => {
          const value = getValue();
          return (
            <span
              style={{
                color: TRANSACTION_COLORS[value.toLowerCase()]?.text,
              }}
            >
              {value}
            </span>
          );
        },
        Filter: FilterType,
        filterFn: multiIncludesFilter,
      },{
        header: "Category",
        id: "category",
        accessorKey: "category",
        Filter: FilterCategory,
      },
      {
        header: "Amount",
        accessorKey: "amount",
        sortingFn: "alphanumeric",
        className: "text-nowrap text-right",
        Filter: FilterAmount,
        filterFn: 'inNumberRange',
        cell: ({ getValue }) =>
          getValue()
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, " "),
      },
    ],
    []
  );

  const {
    getHeaderGroups,
    getRowModel,
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
    getRowCount
  } = useReactTable({
    data: data,
    state: {
      columnFilters: filters,
      sorting,
      pagination,
    },
    initialState: {
      columnFilters: defaultFilters,
    },
    columns,
    enableColumnFilters: true,
    filterFns: {
      multiIncludes: multiIncludesFilter,
    },
    onSortingChange: setSorting,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
  });

  useEffect(() => {
    onFilterChange(getRowData().rows.map((row) => row.original));
  }, [getRowData()]);

  return (
    <div className="overflow-x-auto">
      <div>
        {getHeaderGroups().map((headerGroup) => (
          <div className="flex gap-4 items-center py-2">
            {headerGroup.headers.map((header) => (
              <div>
                {header.column.columnDef.Filter ? (
                  <header.column.columnDef.Filter
                    column={header.column}
                    reset={() => {
                      setFilters(defaultFilters);
                      // setColumnFilters(defaultFilters);
                    }}
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
                    className={header.column.columnDef.className}
                    key={header.id}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    <span>
                      {{
                        asc: " 🔼",
                        desc: " 🔽",
                      }[header.column.getIsSorted() as string] ?? null}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </React.Fragment>
          ))}
        </TableHeader>
        <TableBody>
          {getRowModel().rows.map((row) => {
            return (
              <TableRow id={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    id={cell.id}
                    className={cell.column.columnDef.className}
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
