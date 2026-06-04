# Currency-Aware Aggregation Changes

## Overview
Updated transaction aggregation and visualization to properly handle multiple currencies.

## Changes Made

### 1. Database Queries (`aggregated-data.ts`)
- Added `currency` field to aggregation queries
- Updated `MonthlyTransactionStats` and `CategoryTransactionStats` interfaces to include `currency: CurrencyCode | null`
- Now queries group by: `month`, `credit_debit`, `currency` for monthly stats
- Category stats group by: `category`, `currency`

### 2. Monthly Graph (`graph.tsx`)
- Now shows separate bars for each currency when no currency filter is applied
- When currency filter is selected, shows combined Debit/Credit view for that currency
- Bar names dynamically generated: "Debit (USD)", "Credit (EUR)", etc.
- Added informational message when multiple currencies are displayed

### 3. Category Analyzer (`category-analyzer.tsx`)
- Groups categories by currency
- Shows total spending per currency separately
- Tooltips and detail views now include currency symbols
- Percentages calculated per currency (not across all currencies)
- When no currency filter selected, shows data for all currencies with proper labeling

### 4. Total Amounts Component (`total-amounts.tsx`)
- **Breaking Change**: Removed single `totalDebit` and `totalCredit` calculations
- Now calculates and displays totals per currency
- Shows each currency in a separate section with its symbol
- Better visual separation with border styling

### 5. Context (`transactions-context.tsx`)
- Removed `totalDebit` and `totalCredit` from context (breaking change)
- These are now calculated per-currency in the `TotalAmounts` component
- Simplified context interface

## Usage Notes

### Currency Filter Behavior
- **No filter**: All currencies shown separately (e.g., "Debit (USD)", "Credit (EUR)")
- **With filter**: Combined view for selected currency (e.g., "Debit", "Credit")

### Data Integrity
- All aggregations now properly separate currencies
- No more incorrect summation of different currencies
- Percentages in category view are calculated per-currency

### Migration Impact
Any component using `totalDebit` or `totalCredit` from context will need to be updated to calculate per-currency totals from `monthlyStats` instead.

## Example: Calculate Currency Totals

```typescript
const totalsByCurrency = useMemo(() => {
  return monthlyStats.reduce(
    (acc, stat) => {
      const currency = stat.currency || 'USD';
      if (!acc[currency]) {
        acc[currency] = { debit: 0, credit: 0 };
      }
      if (stat.credit_debit === 'Debit') {
        acc[currency].debit += stat.sum || 0;
      } else if (stat.credit_debit === 'Credit') {
        acc[currency].credit += stat.sum || 0;
      }
      return acc;
    },
    {} as Record<CurrencyCode, { debit: number; credit: number }>
  );
}, [monthlyStats]);
```

## Testing
- Verify graphs display correctly with mixed currencies
- Test currency filter functionality
- Check that totals are displayed per currency
- Verify category breakdown works with multiple currencies
