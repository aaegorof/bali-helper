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
    let pairStat = tradeAnalyze[trade.symbol];

    const volume = trade.price * trade.qty;

    if (trade.side.toUpperCase() === 'BUY') {
      pairStat.totalBuy += volume;
      const currentTotal = pairStat.buyAvg * pairStat.totalBuyVolume;
      pairStat.totalBuyVolume += trade.qty;

      pairStat.buyAvg = (currentTotal + volume) / pairStat.totalBuyVolume;
    } else {
      pairStat.totalSell += volume;
      const costBasis = trade.qty * pairStat.buyAvg;

      pairStat.pnl += trade.qty * trade.price - costBasis;
      const currentTotal = pairStat.sellAvg * pairStat.totalSellVolume;
      pairStat.totalSellVolume += trade.qty;
      pairStat.sellAvg = (currentTotal + volume) / pairStat.totalSellVolume;
    }

    pairStat.pnlPercentage = (pairStat.pnl / (pairStat.totalSellVolume * pairStat.buyAvg)) * 100;
    pairStat.leftFromTrading = pairStat.totalBuyVolume - pairStat.totalSellVolume;
  });

  return tradeAnalyze;
};
