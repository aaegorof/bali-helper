/**
 * Formats numbers with leading zeros by showing zero count as superscript
 * Example: 0.00123 will be displayed as 0.0<sup>2</sup>123
 */
export const formatNumberWithLeadingZeros = (
  value: number | string | null | undefined,
  toFixed: number = 2
): React.ReactNode => {
  if (value === null || value === undefined) return 'N/A';

  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return 'N/A';

  const strValue = numValue.toString();
  const match = strValue.match(/^0\.0+/);

  if (match) {
    const zeroCount = (strValue.match(/^0\.(0+)/) || ['', ''])[1].length;
    if (zeroCount > 3) {
      const significantPart = strValue.slice(zeroCount + 2);
      return (
        <span>
          0.0<sup>{zeroCount}</sup>
          {significantPart}
        </span>
      );
    }
    // Для чисел с 3 или менее нулями после точки возвращаем как есть
    return strValue;
  }

  // Для обычных чисел без ведущих нулей используем toFixed
  const hasDecimals = strValue.includes('.');
  return hasDecimals ? numValue.toFixed(toFixed) : strValue;
};

/**
 * Utility functions for precise decimal calculations
 */
export const preciseCalc = {
  multiply: (a: number, b: number): number => {
    const multiplier = Math.pow(10, 10);
    const result = (a * multiplier * (b * multiplier)) / (multiplier * multiplier);
    return parseFloat(result.toFixed(10));
  },

  divide: (a: number, b: number): number => {
    if (b === 0) return 0;
    const multiplier = Math.pow(10, 10);
    const result = (a * multiplier) / (b * multiplier);
    return parseFloat(result.toFixed(10));
  },

  add: (a: number, b: number): number => {
    const multiplier = Math.pow(10, 10);
    const result = (a * multiplier + b * multiplier) / multiplier;
    return parseFloat(result.toFixed(10));
  },

  subtract: (a: number, b: number): number => {
    const multiplier = Math.pow(10, 10);
    const result = (a * multiplier - b * multiplier) / multiplier;
    return parseFloat(result.toFixed(10));
  },
};
