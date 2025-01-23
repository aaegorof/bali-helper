export type ItemT = {
    balancesWithInvestment: string;
    balancesWithoutInvestment: string;
    diff: string;
    monthIncome: string;
  };
  
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
  