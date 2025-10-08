// Base API Response type
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
};
