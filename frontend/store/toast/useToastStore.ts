import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
}

let toastCounter = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: ({ type, message, duration }) => {
    const id = `toast-${Date.now()}-${toastCounter++}`;
    set((state) => ({
      toasts: [...state.toasts, { id, type, message, duration }],
    }));
    return id;
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));
