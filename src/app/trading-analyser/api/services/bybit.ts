import { RestClientV5 } from 'bybit-api';
import { FundingRate, Trade } from '../types';

export class BybitService {
  private client: RestClientV5;

  constructor() {
    this.client = new RestClientV5({
      testnet: false,
      key: process.env.BYBIT_API_KEY,
      secret: process.env.BYBIT_API_SECRET,
    });
  }

  async getFundingRates(symbols: string[]): Promise<FundingRate[]> {
    const results: FundingRate[] = [];

    for (const symbol of symbols) {
      try {
        const response = await this.client.getFundingRateHistory({
          category: 'linear',
          symbol,
          limit: 1,
        });

        if (response.retCode === 0 && response.result.list.length > 0) {
          const latest = response.result.list[0];
          results.push({
            symbol,
            fundingRate: parseFloat(latest.fundingRate) * 100,
            timestamp: parseInt(latest.fundingRateTimestamp),
          });
        }
      } catch (e) {
        console.error(`Error fetching funding rate for ${symbol}:`, e);
      }
    }

    return results;
  }

  async getWalletBalance(pairs: string[]) {
    const symbols = new Set<string>();
    try {
      pairs.forEach((pair) => {
        const symbol = pair.replace('USDT', '');
        symbols.add(symbol);
      });

      const symbolsList = Array.from(symbols);

      const response = await this.client.getWalletBalance({
        accountType: 'UNIFIED',
        coin: symbolsList.join(','),
      });
      return response.result.list;
    } catch (e) {
      console.error('Error in getWalletBalance:', e);
      throw e;
    }
  }

  async getCurrentPrices(symbols: string[]): Promise<Map<string, string>> {
    try {
      const prices = new Map<string, string>();

      for (const symbol of symbols) {
        const pairSymbol = symbol.endsWith('USDT') ? symbol : `${symbol}USDT`;

        try {
          const response = await this.client.getTickers({
            category: 'spot',
            symbol: pairSymbol,
          });

          if (response.retCode === 0 && response.result.list.length > 0) {
            const price = response.result.list[0].lastPrice;
            prices.set(symbol.replace('USDT', ''), price);
          }
        } catch (e) {
          console.error(`Error getting price for ${symbol}:`, e);
        }
      }

      return prices;
    } catch (e) {
      console.error('Error in getCurrentPrices:', e);
      return new Map<string, string>(); // Return empty map in case of error
    }
  }

  /**
   * Get historical spot trades for a symbol within a date range
   * Note: Bybit limits queries to 7 days max, so we split the request into chunks
   */
  async getHistoricalSpotTrades(
    symbol: string,
    startTime: Date,
    endTime: Date,
    limit: number = 1000
  ): Promise<Trade[]> {
    try {
      const allTrades: Trade[] = [];
      let currentStartTime = new Date(startTime);
      const maxChunkDays = 7; // Bybit's maximum period for a single request

      // Loop through time chunks until we reach the end date
      while (currentStartTime < endTime) {
        // Calculate chunk end time (start time + 7 days or end time, whichever is earlier)
        let chunkEndTime = new Date(currentStartTime);
        chunkEndTime.setDate(chunkEndTime.getDate() + maxChunkDays - 1); // -1 для учета ограничения в 7 дней включительно

        if (chunkEndTime > endTime) {
          chunkEndTime = new Date(endTime);
        }

        console.log(
          `Fetching trades for ${symbol} from ${currentStartTime.toISOString()} to ${chunkEndTime.toISOString()}`
        );

        try {
          // Get trades for this time chunk
          const response = await this.client.getExecutionList({
            category: 'spot',
            symbol,
            limit,
            // Convert to milliseconds (Bybit API требует timestamp в миллисекундах)
            startTime: currentStartTime.getTime(),
            endTime: chunkEndTime.getTime(),
          });

          if (response.retCode !== 0) {
            console.error(`Error fetching trades: ${response.retMsg}`);
            // Продолжаем выполнение, а не выбрасываем исключение
            console.log('Continuing to next time chunk...');
          } else if (response.result?.list?.length) {
            const trades = response.result.list.map((trade) => ({
              symbol: trade.symbol,
              side: trade.side.toLowerCase(),
              price: parseFloat(trade.execPrice),
              qty: parseFloat(trade.execQty),
              timestamp: parseInt(trade.execTime),
              orderId: trade.execId || trade.orderId, // Using trade ID as order ID for public trades
            }));

            allTrades.push(...trades);
            console.log(`Fetched ${trades.length} trades for this chunk`);
          } else {
            console.log('No trades found in this time chunk');
          }
        } catch (chunkError) {
          // Логируем ошибку, но продолжаем выполнение для следующего промежутка
          console.error(
            `Error in chunk ${currentStartTime.toISOString()} - ${chunkEndTime.toISOString()}:`,
            chunkError
          );
          console.log('Continuing to next time chunk...');
        }

        // Move to next chunk (добавляем 1 день, чтобы избежать перекрытия диапазонов)
        currentStartTime = new Date(chunkEndTime);
        currentStartTime.setDate(currentStartTime.getDate() + 1);

        // Add a small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      console.log(`Total trades fetched: ${allTrades.length}`);
      return allTrades;
    } catch (e) {
      console.error('Error in getHistoricalSpotTrades:', e);
      throw e;
    }
  }
}

export default new BybitService();
