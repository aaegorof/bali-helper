import { TRANSACTION_COLORS } from "@/lib/constants";
import { useTransactionsContext } from "./transactions-context";
import { formatNumberToKMil } from '@/lib/utils';

export default function TotalAmounts() {
    const { filteredTransactions, transactions, totalDebit, totalCredit } = useTransactionsContext();
return (
    <div>
    <p className="text-xs">
              Calculated from{" "}
            {filteredTransactions.length !== transactions.length && (
              <span>
                <span className="font-bold">{filteredTransactions.length}</span>{" "}
                filtered transactions out of
              </span>
            )}{" "}
            <span className="font-bold">{transactions.length}</span> total
            transactions.
          </p>
          <p>
            Total Debit:{" "}
            <span
              className="font-bold"
              style={{ color: TRANSACTION_COLORS.debit.text }}
            >
              {formatNumberToKMil(totalDebit)}
            </span>
          </p>
          <p>
            Total Credit:{" "}
            <span
              className="font-bold"
              style={{ color: TRANSACTION_COLORS.credit.text }}
            >
              {formatNumberToKMil(totalCredit)}
            </span>
          </p>
          </div>
    )
}