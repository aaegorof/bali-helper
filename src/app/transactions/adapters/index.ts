import { BankAdapter } from './base-adapter';
import { DeelAdapter } from './deel-adapter';
import { PermataAdapter } from './permata-adapter';

/**
 * Реестр всех доступных адаптеров
 */
export const AVAILABLE_ADAPTERS: BankAdapter[] = [
  new PermataAdapter(),
  new DeelAdapter(),
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
export * from './deel-adapter';
export * from './permata-adapter';
