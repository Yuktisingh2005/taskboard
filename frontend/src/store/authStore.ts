  import { create } from "zustand";
  import { persist } from "zustand/middleware";
  import type { User } from "@/types";

  interface AuthState {
    token: string | null;
    user: User | null;
    hasHydrated: boolean;
    setAuth: (token: string, user: User) => void;
    logout: () => void;
    setHasHydrated: (value: boolean) => void;
  }

  export const useAuthStore = create<AuthState>()(
    persist(
      (set) => ({
        token: null,
        user: null,
        hasHydrated: false,
        setAuth: (token, user) => set({ token, user }),
        logout: () => set({ token: null, user: null }),
        setHasHydrated: (value) => set({ hasHydrated: value }),
      }),
      {
        name: "taskboard-auth",
        onRehydrateStorage: () => (state) => {
          state?.setHasHydrated(true);
        },
      }
    )
  );