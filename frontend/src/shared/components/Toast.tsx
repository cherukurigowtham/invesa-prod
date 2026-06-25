import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const error = useCallback((message: string, duration?: number) => {
    showToast(message, 'error', duration);
  }, [showToast]);

  const info = useCallback((message: string, duration?: number) => {
    showToast(message, 'info', duration);
  }, [showToast]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[9999] flex flex-col gap-3 max-w-sm w-[calc(100vw-40px)] pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const { id, message, type, duration = 4000 } = toast;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (elapsed >= duration) {
        clearInterval(interval);
        onRemove(id);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [id, duration, onRemove]);

  const getStyle = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300',
          icon: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
          progressBg: 'bg-emerald-500',
        };
      case 'error':
        return {
          bg: 'bg-red-950/20 border-red-500/30 text-red-300',
          icon: <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />,
          progressBg: 'bg-red-500',
        };
      case 'info':
        return {
          bg: 'bg-indigo-950/20 border-indigo-500/30 text-indigo-300',
          icon: <Info className="w-5 h-5 text-indigo-400 shrink-0" />,
          progressBg: 'bg-indigo-500',
        };
    }
  };

  const style = getStyle();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      className={`relative pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-xl overflow-hidden ${style.bg}`}
    >
      {style.icon}
      <div className="flex-1 text-xs font-medium leading-relaxed pr-2 select-text text-white">
        {message}
      </div>
      <button
        onClick={() => onRemove(id)}
        className="text-white/40 hover:text-white/80 p-0.5 rounded transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-[3px] w-full bg-white/5">
        <div 
          className={`h-full transition-all duration-[30ms] ease-linear ${style.progressBg}`} 
          style={{ width: `${progress}%` }} 
        />
      </div>
    </motion.div>
  );
}
