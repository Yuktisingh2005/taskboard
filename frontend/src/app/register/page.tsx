  "use client";

  import Link from "next/link";
  import { useRouter } from "next/navigation";
  import { motion } from "framer-motion";
  import { AuthForm } from "@/components/AuthForm";
  import { AuthBackground } from "@/components/AuthBackground";
  import { registerUser } from "@/lib/authApi";
  import { useAuthStore } from "@/store/authStore";

  export default function RegisterPage() {
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);

    const handleRegister = async ({
      name,
      email,
      password,
    }: {
      name?: string;
      email: string;
      password: string;
    }) => {
      const { token, user } = await registerUser(name || "", email, password);
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
            <h1 className="text-xl font-semibold text-white">Create your account</h1>
            <p className="mt-1 text-sm text-zinc-400">Start collaborating on TaskBoard</p>
          </div>

          <AuthForm mode="register" onSubmit={handleRegister} />

          <p className="mt-6 text-center text-sm text-zinc-400">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-indigo-400 hover:text-indigo-300">
              Log in
            </Link>
          </p>
        </motion.div>
      </main>
    );
  }