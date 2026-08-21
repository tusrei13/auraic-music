import { create } from "zustand";

export type ToastType = "success" | "info" | "error";

export interface ToastItem {
  id: string;
  message: string;
  type?: ToastType;
}

interface ToastState {
  toasts: ToastItem[];
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (message, type = "success") => {
    const id = Math.random().toString(36).substring(2, 9);

    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));

    // Tự động đóng Toast sau 3 giây
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 3000);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));