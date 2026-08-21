import { create } from "zustand";
import { getCurrentUser, login, register, type ApiError, type CurrentUser } from "@/lib/api";

interface AuthState {
  user: CurrentUser | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  error: string | null;
  isAuthModalOpen: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const getToken = () => typeof window !== "undefined" ? localStorage.getItem("token") : null;
const getErrorMessage = (error: unknown) => {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as ApiError).message);
  }
  return "Đã xảy ra lỗi xác thực";
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "idle",
  error: null,
  isAuthModalOpen: false,

  initialize: async () => {
    if (!getToken()) {
      set({ status: "unauthenticated", user: null });
      return;
    }

    set({ status: "loading", error: null });
    try {
      const user = await getCurrentUser();
      set({ user, status: "authenticated", isAuthModalOpen: false });
    } catch {
      localStorage.removeItem("token");
      set({ user: null, status: "unauthenticated" });
    }
  },

  signIn: async (email, password) => {
    set({ status: "loading", error: null });
    try {
      const response = await login(email, password);
      if (!response.token) throw new Error("Đăng nhập không trả về token");
      localStorage.setItem("token", response.token);
      const user = await getCurrentUser();
      set({ user, status: "authenticated", isAuthModalOpen: false });
    } catch (error) {
      set({ user: null, status: "unauthenticated", error: getErrorMessage(error) });
      throw error;
    }
  },

  signUp: async (email, password, name) => {
    set({ status: "loading", error: null });
    try {
      const response = await register(email, password, name);
      if (response.token) {
        localStorage.setItem("token", response.token);
        const user = await getCurrentUser();
        set({ user, status: "authenticated", isAuthModalOpen: false });
      } else {
        set({ status: "unauthenticated" });
      }
    } catch (error) {
      set({ user: null, status: "unauthenticated", error: getErrorMessage(error) });
      throw error;
    }
  },

  signOut: () => {
    localStorage.removeItem("token");
    set({ user: null, status: "unauthenticated", error: null });
  },

  openAuthModal: () => set({ isAuthModalOpen: true, error: null }),
  closeAuthModal: () => set({ isAuthModalOpen: false, error: null }),
}));
