interface APRResult {
  balancesWithInvestment: number;
  balancesWithoutInvestment: number;
  monthIncome: number;
  diff: number;
  month: number;
}

export function calculateAPR(
  initial: number,
  monthly: number,
  apy: number,
  months: number
): APRResult[] {
  const results: APRResult[] = [];
  const monthlyRate = apy / 100 / 12;

  let balanceWithInvestment = initial;
  let balanceWithoutInvestment = initial;

  for (let i = 0; i < months; i++) {
    // Расчет процентов за месяц
    const interestWithInvestment = balanceWithInvestment * monthlyRate;

    // Обновление баланса с инвестициями (добавляем проценты и ежемесячный взнос)
    balanceWithInvestment += interestWithInvestment + monthly;

    // Обновление баланса без инвестиций (добавляем только проценты)
    balanceWithoutInvestment += monthly;

    // Форматирование результатов
    results.push({
      month: i + 1,
      balancesWithInvestment: balanceWithInvestment,
      balancesWithoutInvestment: balanceWithoutInvestment,
      monthIncome: interestWithInvestment,
      diff: balanceWithInvestment - balanceWithoutInvestment,
    });
  }

  return results;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
