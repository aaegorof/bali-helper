'use client';

import { useTradingContext } from '@/app/trading-analyser/context/TradingContext';

const TradingSummary = () => {
  const { tradeAnalyze, walletBalances, selectedPair } = useTradingContext();

  const currentBalance = walletBalances.find(
    (balance) => balance.coin === selectedPair.replace('USDT', '')
  );
  if (!currentBalance) return null;

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

    const unrealisedProfit =
      (currentBalance.current_price - buyAvg) * (totalBuyVolume - totalSellVolume);
    const unrealisedProfitPercentage = (unrealisedProfit / totalBuy) * 100;
    const priceDelta = ((sellAvg - buyAvg) * 100) / buyAvg;
    const potentialProfit = leftFromTrading * currentBalance.current_price;
    const roi = ((potentialProfit + pnl - totalBuy) / totalBuy) * 100;
    return (
      <div key={`${symbol}-${index}`} className="space-y-6 p-6 border-b last:border-b-0">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-xl">Summary: {symbol}</h3>
          <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
            <span className="text-sm">Price Delta: </span>
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
                <span className="font-medium text-green-600">{buyAvg.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Volume:</span>
                <span>{totalBuyVolume.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Bought:</span>
                <span>{totalBuy.toFixed(2)} USDT</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h4 className="font-medium mb-3 text-gray-700 dark:text-gray-300">Sell Information</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Average Sell Price:</span>
                <span className="font-medium text-red-600">{sellAvg.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Volume:</span>
                <span>{totalSellVolume.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Sold:</span>
                <span>{totalSell.toFixed(2)} USDT</span>
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
                    {currentBalance.total.toFixed(6)} {symbol}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">Current Price:</span>
                  <span>{currentBalance.current_price?.toFixed(6)} USDT</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">Potential Value:</span>
                  <span>{potentialProfit.toFixed(2)} USDT</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">Unrealized P/L:</span>
                  <span
                    className={`font-medium ${unrealisedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {unrealisedProfit.toFixed(2)} USDT ({unrealisedProfitPercentage.toFixed(2)}%)
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
