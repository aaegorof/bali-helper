'use client';

import { CURRENCY_OPTIONS, CurrencyCode } from '@/app/lib/currencies';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CurrencySelectProps {
  value?: CurrencyCode;
  onChange: (value: CurrencyCode) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Currency selector component using ISO 4217 currency codes
 */
export function CurrencySelect({
  value,
  onChange,
  disabled = false,
  placeholder = 'Choose currency',
}: CurrencySelectProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {CURRENCY_OPTIONS.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            <div className="flex items-center gap-2">
              <span className="font-medium">{currency.symbol}</span>
              <span>{currency.name}</span>
              <span className="text-xs text-muted-foreground">({currency.code})</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
