import { AveragePrice, WalletBalance } from '@/app/types/api';
import { calculateProfitLoss } from '../helpers';

const TradingSummary = (averages: AveragePrice, currentBalance: WalletBalance) => {
  if (!averages) return null;
  return (
    <div className="mt-4">
      {Object.entries(averages).map(([symbol, average], index) => {
        const {
          profitLoss,
          profitLossPercentage,
          currentValue,
          unrealisedProfit,
          unrealisedProfitPercentage,
          tradePercentage,
          potentialProfit,
        } = calculateProfitLoss(average, currentBalance);

        const totalSpent = average.totalBuyVolume * average.buyAvg;
        const totalEarned = average.totalSellVolume * average.sellAvg;

        return (
          <div key={`${symbol}-${index}`} className="space-y-4 py-4 border-b">
            <div className="font-medium text-lg">{symbol}</div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-green-600">Средняя цена покупки:</div>
                <div>{average.buyAvg.toFixed(2)} USDT</div>
                <div className="text-sm text-gray-600">
                  Объем: {average.totalBuyVolume.toFixed(4)}
                </div>
                <div className="text-sm text-gray-600">
                  Общая сумма покупки: {totalSpent.toFixed(2)} USDT
                </div>
              </div>
              <div>
                <div className="text-red-600">Средняя цена продажи:</div>
                <div>{average.sellAvg.toFixed(2)} USDT</div>
                <div className="text-sm text-gray-600">
                  Объем продаж: {average.totalSellVolume.toFixed(4)}
                </div>
                <div className="text-sm text-gray-600">
                  Общая сумма продаж: {totalEarned.toFixed(2)} USDT
                </div>
              </div>
              <div className="text-gray-600">
                <div>Эффективности торговли:</div>
                <div
                  className={`text-${tradePercentage > 0 ? 'green' : 'red'}-600 text-lg font-medium`}
                >
                  {tradePercentage.toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Анализ торговли</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Реализованная П/У:</span>
                  <span className={`text-${profitLoss >= 0 ? 'green' : 'red'}-600`}>
                    {profitLoss.toFixed(2)} USDT ({profitLossPercentage.toFixed(2)}%)
                  </span>
                </div>

                {currentBalance && (
                  <>
                    <div className="flex justify-between text-gray-700">
                      <span>Текущий баланс:</span>
                      <span>
                        {currentBalance.total.toFixed(6)} {symbol}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Текущая цена:</span>
                      <span>{currentBalance.current_price?.toFixed(6)} USDT</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Текущая стоимость:</span>
                      <span>{currentValue.toFixed(2)} USDT</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Нереализованная П/У:</span>
                      <span className={`text-${unrealisedProfit >= 0 ? 'green' : 'red'}-600`}>
                        {unrealisedProfit.toFixed(2)} USDT ({unrealisedProfitPercentage.toFixed(2)}
                        %)
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TradingSummary;
