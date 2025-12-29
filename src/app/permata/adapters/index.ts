import { BankAdapter } from './base-adapter';
import { PermataAdapter } from './permata-adapter';

/**
 * Реестр всех доступных адаптеров
 */
export const AVAILABLE_ADAPTERS: BankAdapter[] = [
  new PermataAdapter(),
  // Добавьте другие адаптеры здесь в будущем:
  // new BCAAdapter(),
  // new MandiriAdapter(),
];

/**
 * Получить адаптер по ID
 */
export function getAdapterById(id: string): BankAdapter | undefined {
  return AVAILABLE_ADAPTERS.find((adapter) => adapter.id === id);
}

export * from './base-adapter';
export * from './permata-adapter';
