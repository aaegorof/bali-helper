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