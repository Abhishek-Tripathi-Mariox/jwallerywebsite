import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastState {
  toasts: ToastItem[];
  push: (message: string, variant?: ToastVariant, duration?: number) => number;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (message, variant = "info", duration = 3500) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, message, variant, duration }] }));
    if (duration > 0) {
      setTimeout(() => get().dismiss(id), duration);
    }
    return id;
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// Convenience helpers so callers don't need the hook in event handlers.
export const toast = {
  success: (msg: string, duration?: number) =>
    useToastStore.getState().push(msg, "success", duration),
  error: (msg: string, duration?: number) =>
    useToastStore.getState().push(msg, "error", duration),
  info: (msg: string, duration?: number) =>
    useToastStore.getState().push(msg, "info", duration),
  warning: (msg: string, duration?: number) =>
    useToastStore.getState().push(msg, "warning", duration),
};
