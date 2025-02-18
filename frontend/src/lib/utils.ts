import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatNumberToKMil = (value: string | number): string => {
  // Преобразуем входное значение в число
  const num =
    typeof value === "string"
      ? parseFloat(value.replace(/[^0-9.-]+/g, ""))
      : value;

  const absNum = Math.abs(num);

  if (absNum >= 1000000) {
    return `${(num / 1000000).toFixed(2)} Mil`;
  } else if (absNum >= 1000) {
    return `${(num / 1000).toFixed(0)} K`;
  }

  return num.toString();
};
