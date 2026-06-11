import { useToastStore, ToastType } from '@/store/toast/useToastStore';

const DEFAULT_DURATION = 4000;

function push(type: ToastType, message: string, duration = DEFAULT_DURATION) {
  if (!message.trim()) return;
  useToastStore.getState().addToast({ type, message, duration });
}

export const toast = {
  success: (message: string, duration?: number) => push('success', message, duration),
  error: (message: string, duration?: number) => push('error', message, duration ?? 5000),
  warning: (message: string, duration?: number) => push('warning', message, duration),
};
