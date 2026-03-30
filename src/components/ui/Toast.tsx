import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  action?: { label: string; onClick: () => void };
}

let toastListener: ((toast: ToastMessage) => void) | null = null;

export const toast = {
  success: (message: string, action?: ToastMessage['action']) => emitToast('success', message, action),
  error: (message: string) => emitToast('error', message),
  info: (message: string) => emitToast('info', message),
};

const emitToast = (type: ToastType, message: string, action?: ToastMessage['action']) => {
  if (toastListener) {
    toastListener({ id: Math.random().toString(36).substring(2, 9), type, message, action });
  }
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    toastListener = (t: ToastMessage) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== t.id));
      }, 5000);
    };
    return () => { toastListener = null; };
  }, []);

  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`
            pointer-events-auto flex items-center p-4 rounded-lg shadow-lg border max-w-sm
            ${t.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : ''}
            ${t.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : ''}
            ${t.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-800' : ''}
          `}
        >
          <div className="shrink-0 mr-3">
            {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
            {t.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
            {t.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
          </div>
          <div className="flex-1 text-sm font-medium">{t.message}</div>
          {t.action && (
            <button
              onClick={() => {
                t.action!.onClick();
                setToasts((prev) => prev.filter((x) => x.id !== t.id));
              }}
              className="ml-3 shrink-0 text-xs font-bold underline hover:no-underline transition-all"
            >
              {t.action.label}
            </button>
          )}
          <button
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className="ml-3 shrink-0 opacity-40 hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
};