import { AxiosError } from 'axios';

export function formatApiError(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!error || typeof error !== 'object') return fallback;

  const axiosError = error as AxiosError<{ detail?: unknown }>;
  const detail = axiosError.response?.data?.detail;

  if (typeof detail === 'string' && detail.trim()) return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'msg' in item) {
          return String((item as { msg?: string }).msg ?? '');
        }
        return '';
      })
      .filter(Boolean)
      .join(', ') || fallback;
  }

  if (detail && typeof detail === 'object') {
    try {
      return JSON.stringify(detail);
    } catch {
      return fallback;
    }
  }

  if (axiosError.message) return axiosError.message;

  return fallback;
}
