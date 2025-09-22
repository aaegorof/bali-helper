import { getDb } from '../db';

export async function addPasswordField() {
  return new Promise((resolve, reject) => {
    const db = getDb();

    // Add password column to users table
    db.run('ALTER TABLE users ADD COLUMN password_hash TEXT', (err) => {
      if (err) {
        // If error is about column already existing, we can ignore it
        if (err.message.includes('duplicate column name')) {
          resolve(null);
          return;
        }
        reject(err);
        return;
      }
      resolve(null);
    });
  });
}
