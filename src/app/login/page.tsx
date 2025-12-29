"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err: any) {
      setError("Failed to login. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-md rounded-[2.5rem] bg-secondary p-10 md:p-14 shadow-2xl border border-white/5">
        <h1 className="mb-2 text-center text-4xl font-bold tracking-tight text-primary">
          Welcome back
        </h1>
        <p className="mb-8 text-center text-sm font-medium opacity-50">
          Good to see you again!
        </p>

        {error && (
          <div className="mb-6 rounded-2xl bg-red-500/10 border border-red-500/50 p-4 text-center text-sm font-bold text-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="mb-2 ml-1 block text-sm font-bold opacity-70">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yourname@email.com"
              className="w-full rounded-2xl border-none bg-background p-4 text-base shadow-inner ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition-all"
              required
            />
          </div>

          <div>
            <label className="mb-2 ml-1 block text-sm font-bold opacity-70">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border-none bg-background p-4 text-base shadow-inner ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-primary text-foreground transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ background: `linear-gradient(to right, var(--gradient-from), var(--gradient-to))` }}
            className={`w-full rounded-2xl py-4 text-base font-bold text-primary-foreground shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${
              loading ? "opacity-70 cursor-not-allowed" : "hover:brightness-110"
            }`}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm font-medium opacity-50">
          Don't have an account?{" "}
          <Link href="/signup" className="text-primary font-bold hover:underline underline-offset-4 transition-all">
            Join the community
          </Link>
        </p>
      </div>
    </div>
  );
}