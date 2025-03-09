interface APRResult {
  balancesWithInvestment: string;
  balancesWithoutInvestment: string;
  monthIncome: string;
  diff: string;
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
    const interestWithoutInvestment = balanceWithoutInvestment * monthlyRate;

    // Обновление баланса с инвестициями (добавляем проценты и ежемесячный взнос)
    balanceWithInvestment += interestWithInvestment + monthly;
    
    // Обновление баланса без инвестиций (добавляем только проценты)
    balanceWithoutInvestment += interestWithoutInvestment;

    // Форматирование результатов
    results.push({
      balancesWithInvestment: formatCurrency(balanceWithInvestment),
      balancesWithoutInvestment: formatCurrency(balanceWithoutInvestment),
      monthIncome: formatCurrency(interestWithInvestment),
      diff: formatCurrency(balanceWithInvestment - balanceWithoutInvestment)
    });
  }

  return results;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
} 