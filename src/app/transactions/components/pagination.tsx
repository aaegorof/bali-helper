import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

type PaginationProps<TData> = {
  count: number;
  table: Table<TData>;
};

const PaginationStack = <TData,>({ count, table }: PaginationProps<TData>) => {
  const {
    getState,
    getCanPreviousPage,
    getCanNextPage,
    getPageCount,
    setPageIndex,
    setPageSize,
    firstPage,
    previousPage,
    nextPage,
    lastPage,
  } = table;

  return (
    <div className="flex items-center justify-end gap-2 py-4">
      <div>Count: {count}</div>
      <Button variant="outline" size="sm" onClick={firstPage} disabled={!getCanPreviousPage()}>
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={previousPage} disabled={!getCanPreviousPage()}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {Array.from({ length: Math.min(5, getPageCount()) }, (_, i) => {
        const pageNumber = getState().pagination.pageIndex - 2 + i;
        if (pageNumber < 0 || pageNumber >= getPageCount()) return null;
        return (
          <Button
            key={pageNumber}
            variant={pageNumber === getState().pagination.pageIndex ? 'default' : 'outline'}
            size="sm"
            className="aspect-square"
            onClick={() => setPageIndex(pageNumber)}
          >
            {pageNumber + 1}
          </Button>
        );
      })}
      <Button variant="outline" size="sm" onClick={nextPage} disabled={!getCanNextPage()}>
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={lastPage} disabled={!getCanNextPage()}>
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
        className="w-16 rounded border p-1 text-center"
      />

      <Select
        value={String(getState().pagination.pageSize)}
        onValueChange={(val: string) => {
          setPageSize(Number(val));
        }}
      >
        <SelectTrigger className="w-[8ch]">
          <SelectValue placeholder="Page size" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {[10, 20, 30, 50, 100].map((pageSize) => (
              <SelectItem key={pageSize} value={String(pageSize)}>
                {pageSize}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default PaginationStack;
