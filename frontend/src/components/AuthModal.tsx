"use client";

import { FormEvent, useState } from "react";
import { LogIn, UserPlus, X, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, signIn, signUp, status, error } = useAuthStore();
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (isRegistering) await signUp(email, password, name);
      else await signIn(email, password);
    } catch {
      // The store exposes the API error below the form.
    }
  };

  const isLoading = status === "loading";

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeAuthModal();
      }}
    >
      <section className="relative w-full max-w-md rounded-3xl border border-white/15 bg-[#18181c] p-7 text-white shadow-2xl">
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute right-5 top-5 rounded-full p-2 text-white/40 transition hover:bg-white/10 hover:text-white"
          aria-label="Đóng cửa sổ đăng nhập"
        >
          <X className="h-5 w-5" />
        </button>

        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-300">AURAIC</p>
        <h2 className="text-2xl font-black">{isRegistering ? "Tạo tài khoản" : "Đăng nhập để tiếp tục"}</h2>
        <p className="mt-2 pr-8 text-sm text-white/50">
          Đồng bộ bài hát yêu thích và playlist của em trên mọi thiết bị.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          {isRegistering && (
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Tên hiển thị"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-indigo-400"
            />
          )}
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-indigo-400"
          />
          <input
            required
            minLength={6}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mật khẩu tối thiểu 6 ký tự"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-indigo-400"
          />

          {error && <p className="text-sm text-rose-300">{error}</p>}

          <button
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isRegistering ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
            {isRegistering ? "Đăng ký" : "Đăng nhập"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setIsRegistering((value) => !value)}
          className="mt-5 w-full text-center text-xs text-white/50 transition hover:text-white"
        >
          {isRegistering ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký"}
        </button>
      </section>
    </div>
  );
}
