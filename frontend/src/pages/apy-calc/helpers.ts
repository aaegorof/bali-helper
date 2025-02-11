import { Trade } from "@/components/TradeHistory";
import { Balance } from "@/components/WalletBalance";
import { cp } from "fs";

export type ItemT = {
    balancesWithInvestment: string;
    balancesWithoutInvestment: string;
    diff: string;
    monthIncome: string;
  };

  export interface AveragePrice {
    buyAvg: number;
    sellAvg: number;
    totalBuyVolume: number;
    totalSellVolume: number;
}
  
  export function calculateAPR(
    initialDeposit: number,
    monthlyContribution: number,
    annualAPR: number,
    months: number
  ) {
    // Переводим годовой APR в месячную процентную ставку
    const items: ItemT[] = new Array(months).fill({});
    const monthlyRate = 1 + annualAPR / 100 / 12;
  
    const calculateMonth = (
      newBalance: number,
      month: number,
      noInvestBalance: number
    ) => {
      if (month === months) return;
      const investB = newBalance * monthlyRate;
      const monthIncome = investB - newBalance;
      const noInvest = noInvestBalance + (month === 0 ? 0 : monthlyContribution);
      const diff = investB - noInvest;
      items[month] = {
        balancesWithInvestment: investB.toFixed(2),
        balancesWithoutInvestment: noInvest.toFixed(2),
        diff: diff.toFixed(2),
        monthIncome: monthIncome.toFixed(2),
      };
      calculateMonth(investB + monthlyContribution, month + 1, noInvest);
    };
    calculateMonth(initialDeposit, 0, initialDeposit);
  
    return items;
  }
  

  export const calculateAverages = (trades: Trade[]) => {
    const symbolAverages: {[key: string]: AveragePrice} = {};
    
    trades.forEach((trade) => {
        if (!symbolAverages[trade.symbol]) {
            symbolAverages[trade.symbol] = {
                buyAvg: 0,
                sellAvg: 0,
                totalBuyVolume: 0,
                totalSellVolume: 0
            };
        }

        const volume = trade.price * trade.qty;
        
        if (trade.side.toUpperCase() === 'BUY') {
            const currentTotal = symbolAverages[trade.symbol].buyAvg * symbolAverages[trade.symbol].totalBuyVolume;
            symbolAverages[trade.symbol].totalBuyVolume += trade.qty;
            symbolAverages[trade.symbol].buyAvg = (currentTotal + volume) / symbolAverages[trade.symbol].totalBuyVolume;
        } else {
            const currentTotal = symbolAverages[trade.symbol].sellAvg * symbolAverages[trade.symbol].totalSellVolume;
            symbolAverages[trade.symbol].totalSellVolume += trade.qty;
            symbolAverages[trade.symbol].sellAvg = (currentTotal + volume) / symbolAverages[trade.symbol].totalSellVolume;
        }
    });

    return symbolAverages;
};


export const calculateProfitLoss = (average: AveragePrice, coinBalance: Balance) => {
  const tradePercentage = (average.sellAvg- average.buyAvg)/average.buyAvg * 100
  const totalBuy = average.totalBuyVolume * average.buyAvg;
  const totalSold = average.totalSellVolume * average.sellAvg;
  const profitLoss = totalSold - totalBuy;
  const tokensLeft = average.totalBuyVolume - average.totalSellVolume
  const profitLossPercentage = totalBuy > 0 ? (profitLoss / totalBuy) * 100 : 0;
  // Находим текущий баланс и цену для выбранной монеты
  const currentValue = coinBalance 
    ? coinBalance.total * (coinBalance.current_price || 0)
    : 0;

  const walletVal = (coinBalance?.usd_value ?? 0)
  
  const unrealisedProfit = profitLoss + walletVal
  
  const unrealisedProfitPercentage = (unrealisedProfit / totalBuy) * 100
  
  const potentialProfit = (tokensLeft - coinBalance.total) * coinBalance.current_price
  

  return {
    profitLoss,
    profitLossPercentage,
    currentValue,
    unrealisedProfit,
    unrealisedProfitPercentage,
    tradePercentage,
    potentialProfit,
  };
};