import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

// Global emitter for toasts (simplest approach without context refactor overhead)
let toastListener: ((toast: ToastMessage) => void) | null = null;

export const toast = {
  success: (message: string) => emitToast('success', message),
  error: (message: string) => emitToast('error', message),
  info: (message: string) => emitToast('info', message),
};

const emitToast = (type: ToastType, message: string) => {
  if (toastListener) {
    toastListener({ id: Math.random().toString(36).substring(2, 9), type, message });
  }
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    toastListener = (t: ToastMessage) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== t.id));
      }, 5000); // auto-dismiss in 5s
    };
    return () => {
      toastListener = null;
    };
  }, []);

  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`
            pointer-events-auto flex items-start p-4 rounded-lg shadow-lg border max-w-sm transform transition-all
            ${t.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : ''}
            ${t.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : ''}
            ${t.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-800' : ''}
          `}
        >
          <div className="shrink-0 mr-3 mt-0.5">
            {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
            {t.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
            {t.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
          </div>
          <div className="flex-1 bg-transparent text-sm font-medium">
            {t.message}
          </div>
          <button
            onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
            className="ml-4 shrink-0 opacity-50 hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
};
