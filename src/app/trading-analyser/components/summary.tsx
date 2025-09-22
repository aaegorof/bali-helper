'use client';

import { formatNumberWithLeadingZeros, preciseCalc } from '@/app/lib/helpers';
import { useTradingContext } from '@/app/trading-analyser/context/TradingContext';
import Loader from '@/components/ui/loader';
const TradingSummary = () => {
  const { tradeAnalyze, walletBalances, selectedPair } = useTradingContext();

  const currentBalance = walletBalances.find(
    (balance) => balance.coin === selectedPair.replace('USDT', '')
  );
  if (!currentBalance) return <Loader>Trying to fetch balance...</Loader>;

  return Object.entries(tradeAnalyze).map(([symbol, stats], index) => {
    const {
      pnl,
      pnlPercentage,
      totalBuy,
      totalSell,
      totalBuyVolume,
      totalSellVolume,
      buyAvg,
      sellAvg,
      leftFromTrading,
    } = stats;

    const priceDelta =
      totalSellVolume > 0
        ? preciseCalc.multiply(
            preciseCalc.divide(preciseCalc.subtract(sellAvg, buyAvg), buyAvg),
            100
          )
        : 0;
    const potentialProfit =
      leftFromTrading > 0 ? preciseCalc.multiply(leftFromTrading, currentBalance.current_price) : 0;
    const roi = preciseCalc.multiply(
      preciseCalc.divide(
        preciseCalc.subtract(preciseCalc.add(potentialProfit, totalSell), totalBuy),
        totalBuy
      ),
      100
    );

    return (
      <div key={`${symbol}-${index}`} className="space-y-6 p-6 border-b last:border-b-0">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-xl">Summary: {symbol}</h3>
          <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
            <span className="text-sm">Trade Price Delta: </span>
            <span className={`font-medium ${priceDelta > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {priceDelta.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h4 className="font-medium mb-3 text-gray-700 dark:text-gray-300">Buy Information</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Average Buy Price:</span>
                <span className="font-medium text-green-600">
                  {formatNumberWithLeadingZeros(buyAvg, 4)} USDT
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Volume:</span>
                <span>{formatNumberWithLeadingZeros(totalBuyVolume, 4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Bought:</span>
                <span>{formatNumberWithLeadingZeros(totalBuy, 2)} USDT</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h4 className="font-medium mb-3 text-gray-700 dark:text-gray-300">Sell Information</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Average Sell Price:</span>
                <span className="font-medium text-red-600">
                  {formatNumberWithLeadingZeros(sellAvg, 4)} USDT
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Volume:</span>
                <span>{formatNumberWithLeadingZeros(totalSellVolume, 4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Sold:</span>
                <span>{formatNumberWithLeadingZeros(totalSell, 2)} USDT</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-5 mt-4">
          <h4 className="font-medium mb-4 border-b pb-2">Trading Analysis</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-300">Realized P/L:</span>
              <span className={`font-medium ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {pnl.toFixed(2)} USDT ({pnlPercentage.toFixed(2)}%)
              </span>
            </div>
            {currentBalance && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">Current Balance:</span>
                  <span>
                    {currentBalance.total.toFixed(6)} {symbol.replace('USDT', '')}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">Leftovers:</span>
                  <span className={`${leftFromTrading < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatNumberWithLeadingZeros(leftFromTrading, 6)} {symbol.replace('USDT', '')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">Current Price:</span>
                  <span>{formatNumberWithLeadingZeros(currentBalance.current_price, 2)} USDT</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">Unrealized P/L:</span>
                  <span className={`${potentialProfit < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {potentialProfit.toFixed(2)} USDT{' '}
                    {potentialProfit < 0 && <span className="text-red-600">(Sold Extra)</span>}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">ROI:</span>
                  <span className={`font-medium ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {roi.toFixed(2)}%
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  });
};

export default TradingSummary;
