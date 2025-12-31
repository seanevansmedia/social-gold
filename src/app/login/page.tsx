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
    /* FIXED: Removed min-h-screen to stop long-page scroll. Added precise top padding. */
    <div className="relative flex flex-col items-center px-4 pt-10 md:pt-24">
      <div className="relative z-10 w-full max-w-md rounded-[2.5rem] bg-secondary/80 backdrop-blur-2xl p-8 md:p-14 shadow-2xl border border-white/10 animate-in zoom-in duration-500">
        <div className="text-center mb-10">
            {/* FIXED: No space in SocialGold */}
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-primary font-lexend uppercase mb-2">
                Social<span className="text-foreground">Gold</span>
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/60">
                The Vault Awaits
            </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl bg-red-500/10 border border-red-500 p-4 text-center text-[10px] font-black text-red-500 uppercase tracking-widest">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="ml-1 block text-[10px] font-black uppercase tracking-widest text-primary">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="gold@member.com"
              className="w-full rounded-2xl border-2 border-white/5 bg-background/50 p-4 text-base focus:border-primary focus:ring-0 transition-all text-foreground placeholder:text-foreground/20 shadow-inner"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="ml-1 block text-[10px] font-black uppercase tracking-widest text-primary">
              Access Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border-2 border-white/5 bg-background/50 p-4 text-base focus:border-primary focus:ring-0 transition-all text-foreground placeholder:text-foreground/20 shadow-inner"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ background: `linear-gradient(to right, var(--gradient-from), var(--gradient-to))` }}
            className={`w-full rounded-2xl py-5 text-sm font-black uppercase tracking-[0.2em] text-primary-foreground shadow-[0_10px_30px_rgba(202,138,4,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] ${
              loading ? "opacity-50 cursor-not-allowed" : "hover:brightness-110 hover:shadow-[0_15px_40px_rgba(202,138,4,0.5)]"
            }`}
          >
            {loading ? "Verifying..." : "Enter the Vault"}
          </button>
        </form>

        <p className="mt-10 text-center text-[10px] font-black uppercase tracking-widest text-foreground/40">
          Not a member?{" "}
          <Link href="/signup" className="text-primary hover:underline underline-offset-8 transition-all">
            Apply for Access
          </Link>
        </p>
      </div>
    </div>
  );
}