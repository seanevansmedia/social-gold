"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSignup = async () => {
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        router.push("/");
      } else {
        router.push("/profile-setup");
      }
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user") {
        setLoading(false);
        return;
      }
      console.error(err);
      setError("Google sign-in failed. Please try again.");
    } finally {
        if (error) setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push("/profile-setup");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center px-4 pt-10 md:pt-24">
      <div className="relative z-10 w-full max-w-md rounded-[2.5rem] bg-secondary/80 backdrop-blur-2xl p-8 md:p-14 shadow-2xl border border-white/10 animate-in slide-in-from-bottom-10 duration-700">
        <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-primary font-lexend uppercase mb-2">
                Social<span className="text-foreground">Gold</span>
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/60">
                Begin Your Legacy
            </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl bg-red-500/10 border border-red-500 p-4 text-center text-[10px] font-black text-red-500 uppercase tracking-widest">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-6">
          <div className="space-y-2">
            <label className="ml-1 block text-[10px] font-black uppercase tracking-widest text-primary">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="future@member.com"
              className="w-full rounded-2xl border-2 border-white/5 bg-background/50 p-4 text-base focus:border-primary focus:ring-0 transition-all text-foreground placeholder:text-foreground/20 shadow-inner"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="ml-1 block text-[10px] font-black uppercase tracking-widest text-primary">
              Secure Password
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
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10"></span>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                <span className="bg-transparent px-2 text-foreground/40 backdrop-blur-xl">Or Access With</span>
            </div>
        </div>

        <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full bg-white text-black rounded-2xl py-5 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
        >
            <FcGoogle className="text-2xl" />
            {/* CLEANED UP FONT */}
            <span className="text-base font-bold">Sign in with Google</span>
        </button>

        <p className="mt-10 text-center text-[10px] font-black uppercase tracking-widest text-foreground/40">
          Already a member?{" "}
          <Link href="/login" className="text-primary hover:underline underline-offset-8 transition-all">
            Return to Vault
          </Link>
        </p>
      </div>
    </div>
  );
}