'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastValue | undefined>(undefined);

let counter = 0;

/**
 * Global, lightweight toast notifications. The provider also renders the toast
 * stack (bottom-center, above the cart drawer) so a single mount in the root
 * layout is all that's needed.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++counter;
    setToasts((list) => [...list, { id, message, type }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3200);
  }, []);

  const value = useMemo<ToastValue>(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-6 z-[70] flex flex-col items-center gap-2 px-4"
        role="region"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-fade-up pointer-events-auto flex items-center gap-3 rounded-full bg-noir px-5 py-3 text-sm text-ivory shadow-lift"
          >
            <span
              aria-hidden
              className={
                t.type === 'error' ? 'text-red-400' : t.type === 'info' ? 'text-champagne' : 'text-gold'
              }
            >
              {t.type === 'error' ? '✕' : t.type === 'info' ? '✦' : '✓'}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
