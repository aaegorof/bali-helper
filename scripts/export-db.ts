import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';

const DB_PATH = path.join(process.cwd(), 'transactions.db');
const EXPORT_DIR = path.join(process.cwd(), 'db-export');

// Ensure export directory exists
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR);
}

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    process.exit(1);
  }
  console.log('Connected to database successfully');
});

interface TableInfo {
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

async function getTableColumns(tableName: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, (err, rows: TableInfo[]) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows.map((row) => row.name));
    });
  });
}

async function exportTable(tableName: string) {
  try {
    const columns = await getTableColumns(tableName);
    const csvWriter = createObjectCsvWriter({
      path: path.join(EXPORT_DIR, `${tableName}.csv`),
      header: columns.map((column) => ({ id: column, title: column })),
    });

    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM ${tableName}`, async (err, rows: Record<string, any>[]) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          await csvWriter.writeRecords(rows);
          console.log(`Exported ${rows.length} records from ${tableName}`);
          resolve(true);
        } catch (writeErr) {
          reject(writeErr);
        }
      });
    });
  } catch (error) {
    console.error(`Error exporting ${tableName}:`, error);
    throw error;
  }
}

async function exportAllTables() {
  try {
    // Get list of all tables
    const tables = await new Promise<string[]>((resolve, reject) => {
      db.all(
        "SELECT name FROM sqlite_master WHERE type='table'",
        (err, rows: { name: string }[]) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows.map((row) => row.name));
        }
      );
    });

    console.log('Found tables:', tables);

    // Export each table
    for (const table of tables) {
      await exportTable(table);
    }

    console.log(`\nExport completed! Files are saved in ${EXPORT_DIR}`);
  } catch (error) {
    console.error('Export failed:', error);
  } finally {
    db.close();
  }
}

exportAllTables();
