import { preciseCalc } from '../lib/helpers';
import { CoinAnalisys, Trade } from './api/types';

export const analyzeCoinTrade = (trades: Trade[]) => {
  const tradeAnalyze: { [key: string]: CoinAnalisys } = {};
  trades.forEach((trade) => {
    if (!tradeAnalyze[trade.symbol]) {
      tradeAnalyze[trade.symbol] = {
        buyAvg: 0,
        sellAvg: 0,
        totalBuyVolume: 0,
        totalSellVolume: 0,
        totalBuy: 0,
        totalSell: 0,
        pnl: 0,
        pnlPercentage: 0,
        leftFromTrading: 0,
      };
    }
    const pairStat = tradeAnalyze[trade.symbol];

    const tradeValue = preciseCalc.multiply(trade.price, trade.qty);

    if (trade.side.toUpperCase() === 'BUY') {
      pairStat.totalBuy = preciseCalc.add(pairStat.totalBuy, tradeValue);
      const currentTotal = preciseCalc.multiply(pairStat.buyAvg, pairStat.totalBuyVolume);
      pairStat.totalBuyVolume = preciseCalc.add(pairStat.totalBuyVolume, trade.qty);

      pairStat.buyAvg = preciseCalc.divide(
        preciseCalc.add(currentTotal, tradeValue),
        pairStat.totalBuyVolume
      );
    } else {
      pairStat.totalSell = preciseCalc.add(pairStat.totalSell, tradeValue);
      const costBasis = preciseCalc.multiply(trade.qty, pairStat.buyAvg);

      const tradePnl = preciseCalc.subtract(
        tradeValue,
        costBasis
      );
      pairStat.pnl = preciseCalc.add(pairStat.pnl, tradePnl);

      const currentTotal = preciseCalc.multiply(pairStat.sellAvg, pairStat.totalSellVolume);
      pairStat.totalSellVolume = preciseCalc.add(pairStat.totalSellVolume, trade.qty);
      pairStat.sellAvg = preciseCalc.divide(
        preciseCalc.add(currentTotal, tradeValue),
        pairStat.totalSellVolume
      );
    }

    pairStat.pnl = preciseCalc.subtract(pairStat.totalSell, preciseCalc.multiply(pairStat.totalSellVolume, pairStat.buyAvg));
    pairStat.pnlPercentage = preciseCalc.multiply(
      preciseCalc.divide(pairStat.pnl, pairStat.totalBuy),
      100
    );
    pairStat.leftFromTrading = preciseCalc.subtract(
      pairStat.totalBuyVolume,
      pairStat.totalSellVolume
    );
  });

  return tradeAnalyze;
};
