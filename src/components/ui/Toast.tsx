import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  id?: string;
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export interface ToastItem extends ToastOptions {
  id: string;
  type: ToastType;
}

export interface ToastContextValue {
  toast: (options: ToastOptions | string) => string;
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const fallbackToastContext: ToastContextValue = {
  toast: () => '',
  success: () => '',
  error: () => '',
  info: () => '',
  warning: () => '',
  dismiss: () => {},
  dismissAll: () => {},
};

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  return context || fallbackToastContext;
}

const toastTypeStyles: Record<ToastType, { icon: React.ReactNode; borderColor: string; iconColor: string }> = {
  success: {
    icon: <CheckCircle2 className="w-5 h-5 text-[var(--accent-green)]" />,
    borderColor: 'border-emerald-500/30',
    iconColor: 'text-[var(--accent-green)]',
  },
  error: {
    icon: <AlertCircle className="w-5 h-5 text-[var(--accent-red)]" />,
    borderColor: 'border-red-500/30',
    iconColor: 'text-[var(--accent-red)]',
  },
  info: {
    icon: <Info className="w-5 h-5 text-[var(--accent-blue)]" />,
    borderColor: 'border-blue-500/30',
    iconColor: 'text-[var(--accent-blue)]',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    borderColor: 'border-amber-500/30',
    iconColor: 'text-amber-500',
  },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const addToast = useCallback(
    (options: ToastOptions | string): string => {
      const id = typeof options === 'string' ? Math.random().toString(36).substring(2, 9) : options.id || Math.random().toString(36).substring(2, 9);
      const message = typeof options === 'string' ? options : options.message;
      const type: ToastType = typeof options === 'string' ? 'info' : options.type || 'info';
      const title = typeof options === 'string' ? undefined : options.title;
      const duration = typeof options === 'string' ? 3000 : options.duration !== undefined ? options.duration : 3000;

      const newToast: ToastItem = { id, message, type, title, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }

      return id;
    },
    [dismiss]
  );

  const success = useCallback((message: string, title?: string) => addToast({ type: 'success', message, title }), [addToast]);
  const error = useCallback((message: string, title?: string) => addToast({ type: 'error', message, title }), [addToast]);
  const info = useCallback((message: string, title?: string) => addToast({ type: 'info', message, title }), [addToast]);
  const warning = useCallback((message: string, title?: string) => addToast({ type: 'warning', message, title }), [addToast]);

  const value = useMemo(
    () => ({
      toast: addToast,
      success,
      error,
      info,
      warning,
      dismiss,
      dismissAll,
    }),
    [addToast, success, error, info, warning, dismiss, dismissAll]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            aria-live="polite"
            className="fixed bottom-0 right-0 z-[9999] p-4 sm:p-6 flex flex-col gap-2.5 pointer-events-none max-w-sm sm:max-w-md w-full pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pr-[calc(1rem+env(safe-area-inset-right,0px))]"
          >
            <AnimatePresence mode="popLayout">
              {toasts.map((t) => {
                const style = toastTypeStyles[t.type];
                return (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: 24, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    className={`
                      pointer-events-auto flex items-start gap-3 p-4
                      bg-[var(--bg-elevated)]/95 backdrop-blur-md
                      border ${style.borderColor}
                      rounded-[var(--radius-lg)] shadow-xl
                      text-[var(--text-primary)] select-none
                    `.trim().replace(/\s+/g, ' ')}
                  >
                    <div className="shrink-0 mt-0.5">{style.icon}</div>
                    <div className="flex-1 min-w-0 pr-1">
                      {t.title && (
                        <h4 className="text-sm font-semibold tracking-tight text-[var(--text-primary)] mb-0.5">
                          {t.title}
                        </h4>
                      )}
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed break-words">
                        {t.message}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => dismiss(t.id)}
                      className="shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1 rounded transition-colors -mr-1 -mt-1 cursor-pointer"
                      aria-label="Dismiss notification"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
};

export default ToastProvider;
