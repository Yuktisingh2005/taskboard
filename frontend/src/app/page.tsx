  "use client";

  import { useEffect } from "react";
  import { useRouter } from "next/navigation";
  import { useAuthStore } from "@/store/authStore";

  export default function Home() {
    const router = useRouter();
    const token = useAuthStore((state) => state.token);
    const hasHydrated = useAuthStore((state) => state.hasHydrated);

    useEffect(() => {
      if (!hasHydrated) return;
      router.replace(token ? "/dashboard" : "/login");
    }, [token, hasHydrated, router]);

    return null;
  }