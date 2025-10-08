'use client';

import { format } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';

import { cn } from '@/app/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DatePickerProps {
  dates: Date[];
  setDates: (dates: Date[]) => void;
}

export function DateRangePicker({ dates, setDates }: DatePickerProps) {
  const [start, end] = dates;
  const _setDates = (dates: Date[]) => {
    if (dates?.length === 2) {
      const [date1, date2] = dates;
      if (date1 > date2) {
        dates = [date2, date1];
      }
      setDates(dates);
    }
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-[280px] justify-between text-left font-normal',
            !dates && 'text-muted-foreground'
          )}
        >
          {start && end ? format(start, 'PP') + ' - ' + format(end, 'PP') : <span>Date range</span>}
          {start && end && (
            <X
              className="mr-2 h-4 w-4"
              onClick={(e) => {
                e.stopPropagation();
                setDates([]);
              }}
            />
          )}
          <CalendarIcon className="mr-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar mode="multiple" selected={dates} onSelect={_setDates} required max={2} />
      </PopoverContent>
    </Popover>
  );
}
