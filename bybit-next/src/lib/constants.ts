export const TRANSACTION_COLORS = {
  debit: {
    background: "hsl(347 80% 60% / 0.75)", // destructive with 0.5 opacity
    text: "hsl(347 80% 60%)", // destructive
  },
  credit: {
    background: "hsl(138 78% 33% / 0.75)", // positive with 0.5 opacity 
    text: "hsl(138 78% 33%)", // positive
  },
} as const;


// Символы для Funding Rates
export const DEFAULT_SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "BNBUSDT",
  "XRPUSDT",
];

// Символы для Trading Analyser
export const TRADING_SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "BNBUSDT",
  "XRPUSDT",
]; 