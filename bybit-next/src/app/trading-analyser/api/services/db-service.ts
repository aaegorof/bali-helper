import { getDb } from '@/app/lib/db';
import { Trade } from '../types';

export class SpotTradeDbService {
  /**
   * Save multiple spot trades to the database
   * @param trades Array of trades to save
   * @param userId User ID to associate with the trades
   * @returns Number of trades successfully inserted
   */
  static async saveTrades(trades: Trade[], userId: number): Promise<number> {
    const db = getDb();
    let insertedCount = 0;

    return new Promise((resolve, reject) => {
      // Begin transaction for better performance with many inserts
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        const stmt = db.prepare(`
          INSERT OR IGNORE INTO spottrades (
            symbol, side, price, quantity, timestamp, order_id, user_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        try {
          // Insert each trade, ignoring duplicates (due to UNIQUE constraint)
          for (const trade of trades) {
            stmt.run(
              trade.symbol,
              trade.side,
              trade.price,
              trade.qty,
              trade.timestamp,
              trade.orderId,
              userId,
              function (this: { changes: number }, err: Error | null) {
                if (!err && this.changes > 0) {
                  insertedCount++;
                }
              }
            );
          }

          stmt.finalize();

          db.run('COMMIT', (err) => {
            if (err) {
              console.error('Error committing transaction:', err);
              reject(err);
            } else {
              console.log(`Successfully inserted ${insertedCount} of ${trades.length} trades`);
              resolve(insertedCount);
            }
          });
        } catch (error) {
          db.run('ROLLBACK');
          console.error('Error inserting trades:', error);
          reject(error);
        }
      });
    });
  }

  /**
   * Get spot trades for a user and symbol within a time range
   */
  static async getTradesBySymbol(
    userId: number,
    symbol: string,
    startTimestamp?: number,
    endTimestamp?: number,
    limit: number = 1000
  ): Promise<Trade[]> {
    const db = getDb();

    let query = `
      SELECT symbol, side, price, quantity as qty, timestamp, order_id as orderId
      FROM spottrades
      WHERE user_id = ? AND symbol = ?
    `;

    const params: any[] = [userId, symbol];

    if (startTimestamp) {
      query += ' AND timestamp >= ?';
      params.push(startTimestamp);
    }

    if (endTimestamp) {
      query += ' AND timestamp <= ?';
      params.push(endTimestamp);
    }

    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);

    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) {
          console.error('Error fetching trades:', err);
          reject(err);
        } else {
          resolve(rows as Trade[]);
        }
      });
    });
  }

  /**
   * Get all symbols for which a user has spot trades
   */
  static async getUserSymbols(userId: number): Promise<string[]> {
    const db = getDb();

    return new Promise((resolve, reject) => {
      db.all(
        'SELECT DISTINCT symbol FROM spottrades WHERE user_id = ? ORDER BY symbol',
        [userId],
        (err, rows: { symbol: string }[]) => {
          if (err) {
            console.error('Error fetching user symbols:', err);
            reject(err);
          } else {
            resolve(rows.map((row) => row.symbol));
          }
        }
      );
    });
  }
}

export default SpotTradeDbService;
