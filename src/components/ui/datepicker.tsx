'use client';

import { format } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';

import { cn } from '@/app/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DatePickerProps {
  date: Date;
  setDate: (date: Date | null) => void;
  label?: string;
}

export function DatePicker({ date, setDate, label }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-[180px] justify-between text-left font-normal',
            !date && 'text-muted-foreground'
          )}
        >
          {date ? format(date, 'PP') : <span>{label ? label : 'Pick a date'}</span>}
          <div className="flex justify-end items-center gap-2">
            {date && (
              <X
                className="h-4 w-4"
                onClick={(e) => {
                  e.stopPropagation();
                  setDate(null);
                }}
              />
            )}
            <CalendarIcon className="h-4 w-4" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar mode="single" selected={date} onSelect={setDate} required />
      </PopoverContent>
    </Popover>
  );
}
