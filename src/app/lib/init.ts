import { initializeTables, isDatabaseInitialized } from './db';
import { addPasswordField } from './migrations/add-password-field';

let isInitializing = false;
let isInitialized = false;

export async function ensureDatabaseInitialized() {
  // Проверяем, не выполняется ли уже инициализация
  if (isInitializing) {
    return;
  }

  // Проверяем, не инициализирована ли уже база
  if (isInitialized) {
    return;
  }

  isInitializing = true;

  try {
    // Проверяем состояние базы данных
    const initialized = await isDatabaseInitialized();

    if (!initialized) {
      console.log('Инициализация базы данных...');
      await initializeTables();
      await addPasswordField();
      console.log('База данных успешно инициализирована');
    } else {
      console.log('База данных уже инициализирована');
    }

    isInitialized = true;
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
    throw error;
  } finally {
    isInitializing = false;
  }
}
