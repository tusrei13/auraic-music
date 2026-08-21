"use client";

import { useToastStore } from "@/store/useToastStore";
import { CheckCircle2, Info, AlertCircle, X } from "lucide-react";

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 right-6 z-[100] flex flex-col gap-2.5 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-3 bg-[#1e1e24]/95 backdrop-blur-2xl border border-white/10 text-white px-4 py-3 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300 min-w-[280px] max-w-sm"
        >
          {toast.type === "success" && (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          )}
          {toast.type === "info" && (
            <Info className="w-5 h-5 text-indigo-400 flex-shrink-0" />
          )}
          {toast.type === "error" && (
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          )}

          <p className="text-xs font-semibold flex-1 text-white/90 leading-tight">
            {toast.message}
          </p>

          <button
            onClick={() => removeToast(toast.id)}
            className="text-white/40 hover:text-white p-1 rounded-lg transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}