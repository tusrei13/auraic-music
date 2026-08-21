"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, status, error } = useAuthStore();
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("");
    try {
      if (isRegistering) {
        await signUp(email, password, name);
        setNotice("Đăng ký thành công. Hãy kiểm tra email nếu Supabase yêu cầu xác nhận.");
      } else {
        await signIn(email, password);
        router.push("/");
      }
    } catch {
      // The auth store exposes the server error to the form.
    }
  };

  const isLoading = status === "loading";

  return (
    <main className="min-h-full flex items-center justify-center p-6">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-black/30 p-8 shadow-2xl backdrop-blur-2xl">
        <div className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-indigo-300">AURAIC</p>
          <h1 className="text-3xl font-black">{isRegistering ? "Tạo tài khoản" : "Chào mừng trở lại"}</h1>
          <p className="mt-2 text-sm text-white/50">Đăng nhập để đồng bộ playlist và bài hát yêu thích.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {(error || notice) && (
            <p className={`text-sm ${error ? "text-rose-300" : "text-emerald-300"}`}>{error || notice}</p>
          )}

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
          onClick={() => { setIsRegistering((value) => !value); setNotice(""); }}
          className="mt-6 w-full text-center text-xs text-white/50 transition hover:text-white"
        >
          {isRegistering ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký"}
        </button>
      </section>
    </main>
  );
}
