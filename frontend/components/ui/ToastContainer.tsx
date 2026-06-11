'use client';

import { useEffect } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useToastStore, ToastItem } from '@/store/toast/useToastStore';

const STYLES: Record<ToastItem['type'], { container: string; icon: typeof CheckCircle2 }> = {
  success: {
    container: 'border-green-200 bg-green-50 text-green-900',
    icon: CheckCircle2,
  },
  error: {
    container: 'border-red-200 bg-red-50 text-red-900',
    icon: AlertCircle,
  },
  warning: {
    container: 'border-amber-200 bg-amber-50 text-amber-900',
    icon: AlertTriangle,
  },
};

function ToastCard({ toast }: { toast: ToastItem }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const Icon = STYLES[toast.type].icon;

  useEffect(() => {
    const timer = window.setTimeout(() => removeToast(toast.id), toast.duration);
    return () => window.clearTimeout(timer);
  }, [toast.duration, toast.id, removeToast]);

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${STYLES[toast.type].container}`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
      <button
        type="button"
        onClick={() => removeToast(toast.id)}
        className="shrink-0 rounded p-0.5 opacity-70 transition hover:opacity-100"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[9999] flex w-full max-w-sm flex-col gap-3 sm:right-6 sm:top-6">
      {toasts.map((item) => (
        <ToastCard key={item.id} toast={item} />
      ))}
    </div>
  );
}
