// src/app/lib/migrations/init-supabase.ts
import { Transaction } from '../../permata/lib/TransactionParseResult';
import { TransactionEmbedding } from '../../permata/lib/vectorDb';
import { Trade } from '../../trading-analyser/api/types';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { DbUser } from '../dal';
import { getDb } from '../db';

async function initializeSupabaseTables() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Включаем vector расширение
  await supabase.rpc('enable_vector_extension');
}

export { initializeSupabaseTables };

async function migrateVectorData() {
  const sqliteDb = getDb();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('Fetching data from SQLite...');

  try {
    const usersPromise = new Promise<DbUser[]>((resolve, reject) =>
      sqliteDb.all('SELECT * FROM users', [], (err, rows) =>
        err ? reject(err) : resolve(rows as DbUser[])
      )
    );

    const transactionsPromise = new Promise<Transaction[]>((resolve, reject) =>
      sqliteDb.all('SELECT * FROM transactions', [], (err, rows) =>
        err ? reject(err) : resolve(rows as Transaction[])
      )
    );

    const spottradesPromise = new Promise<Trade[]>((resolve, reject) =>
      sqliteDb.all('SELECT * FROM spottrades', [], (err, rows) =>
        err ? reject(err) : resolve(rows as Trade[])
      )
    );

    const [users, transactions, spottrades] = await Promise.all([
      usersPromise,
      transactionsPromise,
      spottradesPromise,
    ]);

    console.log(
      `Found: ${users.length} users, ${transactions.length} transactions, ${spottrades.length} spot trades`
    );

    const batchSize = 1000;

    // Мигрируем пользователей
    console.log('Migrating users...');
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const { error } = await supabase.from('users').insert(batch);
      if (error) throw new Error(`Error inserting users batch: ${error.message}`);
      console.log(`Migrated users: ${i + batch.length}/${users.length}`);
    }

    // Мигрируем транзакции
    console.log('Migrating transactions...');
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      const { error } = await supabase.from('transactions').insert(batch);
      if (error) throw new Error(`Error inserting transactions batch: ${error.message}`);
      console.log(`Migrated transactions: ${i + batch.length}/${transactions.length}`);
    }

    // Мигрируем спот-сделки
    console.log('Migrating spot trades...');
    for (let i = 0; i < spottrades.length; i += batchSize) {
      const batch = spottrades.slice(i, i + batchSize);
      const { error } = await supabase.from('spottrades').insert(batch);
      if (error) throw new Error(`Error inserting spot trades batch: ${error.message}`);
      console.log(`Migrated spot trades: ${i + batch.length}/${spottrades.length}`);
    }

    // Мигрируем векторные данные
    console.log('Migrating vector embeddings...');
    const embeddings = await new Promise<TransactionEmbedding[]>((resolve, reject) => {
      sqliteDb.all('SELECT * FROM transaction_embeddings', [], (err, rows) =>
        err ? reject(err) : resolve(rows as TransactionEmbedding[])
      );
    });

    console.log(`Found ${embeddings.length} embeddings to migrate`);

    for (let i = 0; i < embeddings.length; i += batchSize) {
      const batch = embeddings.slice(i, i + batchSize).map((row) => ({
        description: row.description,
        category: row.category,
        embedding: JSON.parse(row.embedding),
        last_used_at: row.last_used_at,
        usage_count: row.usage_count,
      }));

      const { error } = await supabase.from('transaction_embeddings').insert(batch);
      if (error) throw new Error(`Error inserting embeddings batch: ${error.message}`);
      console.log(`Migrated embeddings: ${i + batch.length}/${embeddings.length}`);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    // Закрываем соединение с SQLite
    sqliteDb.close();
  }
}

async function runMigration() {
  try {
    // Загружаем переменные окружения
    dotenv.config();

    console.log('Starting Supabase migration...');

    // Инициализируем таблицы
    console.log('Initializing tables...');
    await initializeSupabaseTables();

    // Мигрируем данные
    console.log('Migrating data...');
    await migrateVectorData();

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
