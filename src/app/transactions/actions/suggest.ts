'use server';

import { TransactionDb } from "../lib/transactions-service";
import { determineKeywordCategory } from "../lib/vectorDb";
import { determineCategoryWithRAG } from "../lib/vectorDb";

export async function suggestCategories(transactions: TransactionDb[]) {

    if (!transactions) {
        throw new Error('Transactions are required');
      }
    
      try {
        const categories = await Promise.all(
          transactions.map(async (trans) => {
            const ragCategory = await determineCategoryWithRAG(trans.description || '');
            const keywordCategory = determineKeywordCategory(trans.description || '');
    
            return {
              id: trans.id,
              category: ragCategory,
              keywordCategory,
            };
          })
        );
    
        return {
          success: true,
          categories,
        }
      } catch (err) {
        return {
          success: false,
          error: 'Error suggesting category: ' + err,
          categories: [],
        };
      }
}