"use client";

import { useState, useEffect, useCallback } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

// Global Toast State (einfache Implementierung ohne Context für weniger Overhead)
let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toastState: Toast[] = [];

const notifyListeners = () => {
  toastListeners.forEach((listener) => listener([...toastState]));
};

const addToast = (toast: Toast) => {
  toastState = [...toastState, toast];
  notifyListeners();
};

const removeToast = (id: string) => {
  toastState = toastState.filter((t) => t.id !== id);
  notifyListeners();
};

export const showToast = (message: string, type: ToastType = "info", duration: number = 5000) => {
  const id = Math.random().toString(36).substring(2, 9);
  addToast({ id, message, type, duration });
  
  if (duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }
  
  return id;
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => {
      setToasts(newToasts);
    };
    
    toastListeners.push(listener);
    setToasts([...toastState]);
    
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  const handleRemove = useCallback((id: string) => {
    removeToast(id);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-24 right-4 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`glass rounded-xl p-4 border-2 shadow-2xl pointer-events-auto animate-fade-in-up ${
            toast.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10"
              : toast.type === "error"
              ? "border-red-500/40 bg-red-500/10"
              : toast.type === "warning"
              ? "border-amber-500/40 bg-amber-500/10"
              : "border-cyan-500/40 bg-cyan-500/10"
          }`}
          role="alert"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {toast.type === "success" && (
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {toast.type === "error" && (
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {toast.type === "warning" && (
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              {toast.type === "info" && (
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-body-sm font-semibold ${
                toast.type === "success"
                  ? "text-emerald-300"
                  : toast.type === "error"
                  ? "text-red-300"
                  : toast.type === "warning"
                  ? "text-amber-300"
                  : "text-cyan-300"
              }`}>
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => handleRemove(toast.id)}
              className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
              aria-label="Close notification"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

