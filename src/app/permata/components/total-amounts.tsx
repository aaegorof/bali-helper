import { TRANSACTION_COLORS } from '@/app/lib/constants';
import { formatNumberToKMil } from '@/app/lib/utils';
import { useTransactionsContext } from './transactions-context';

export default function TotalAmounts() {
  const { totalDebit, totalCredit, count, totalCount } = useTransactionsContext();
  return (
    <div>
      <p className="text-xs">
        Calculated from{' '}
        {count !== totalCount && (
          <span>
            <span className="font-bold">{count}</span> filtered transactions
            out of
          </span>
        )}{' '}
        <span className="font-bold">{totalCount}</span> total transactions.
      </p>
      <p>
        Total Debit:{' '}
        <span className="font-bold" style={{ color: TRANSACTION_COLORS.debit.text }}>
          {formatNumberToKMil(totalDebit)}
        </span>
      </p>
      <p>
        Total Credit:{' '}
        <span className="font-bold" style={{ color: TRANSACTION_COLORS.credit.text }}>
          {formatNumberToKMil(totalCredit)}
        </span>
      </p>
    </div>
  );
}
