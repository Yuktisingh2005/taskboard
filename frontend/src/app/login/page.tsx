  "use client";

  import Link from "next/link";
  import { useRouter } from "next/navigation";
  import { motion } from "framer-motion";
  import { AuthForm } from "@/components/AuthForm";
  import { AuthBackground } from "@/components/AuthBackground";
  import { loginUser } from "@/lib/authApi";
  import { useAuthStore } from "@/store/authStore";

  export default function LoginPage() {
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);

    const handleLogin = async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const { token, user } = await loginUser(email, password);
      setAuth(token, user);
      router.push("/dashboard");
    };

    return (
      <main className="relative flex min-h-screen items-center justify-center px-4">
        <AuthBackground />

        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/40 backdrop-blur-xl"
        >
          <div className="mb-8 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-lg font-bold text-white shadow-lg shadow-indigo-500/30">
              ✦
            </div>
            <h1 className="text-xl font-semibold text-white">Welcome back</h1>
            <p className="mt-1 text-sm text-zinc-400">Log in to TaskBoard</p>
          </div>

          <AuthForm mode="login" onSubmit={handleLogin} />

          <p className="mt-6 text-center text-sm text-zinc-400">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-indigo-400 hover:text-indigo-300">
              Sign up
            </Link>
          </p>
        </motion.div>
      </main>
    );
  }