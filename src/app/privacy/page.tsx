"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-transparent text-foreground font-jakarta pb-20">
      <nav className="sticky top-0 z-40 w-full border-b border-white/10 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-6 py-6">
          <button onClick={() => router.back()} className="text-primary text-3xl p-2 hover:scale-110 transition-transform">←</button>
          <h1 className="text-xl font-black font-lexend uppercase tracking-tighter text-foreground">Privacy Protocol</h1>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-6 pt-10">
        <div className="rounded-[2.5rem] bg-secondary/80 backdrop-blur-xl p-8 md:p-12 shadow-2xl border border-white/5">
          <h2 className="text-3xl font-bold font-lexend text-primary mb-8 uppercase tracking-tight">The Gold Standard of Privacy</h2>
          
          <div className="space-y-8 text-base md:text-lg leading-relaxed font-medium text-foreground">
            <section>
              <h3 className="text-primary font-black uppercase text-xs tracking-widest mb-3">1. Data Collection</h3>
              <p>We collect your email address, username, and profile information to establish your identity within the Social Gold network. All interactions are stored securely via Firebase.</p>
            </section>

            <section>
              <h3 className="text-primary font-black uppercase text-xs tracking-widest mb-3">2. Visual Content</h3>
              <p>Images uploaded to the vault are processed and stored as encoded strings. We do not use your images for advertising or external data mining.</p>
            </section>

            <section>
              <h3 className="text-primary font-black uppercase text-xs tracking-widest mb-3">3. Secure Messaging</h3>
              <p>Direct messages between members are private. These "Vault" conversations are accessible only to the participants involved.</p>
            </section>

            <section>
              <h3 className="text-primary font-black uppercase text-xs tracking-widest mb-3">4. Cookies & Session</h3>
              <p>We use essential authentication cookies to keep your session active. No third-party tracking scripts are utilized within the premium interface.</p>
            </section>

            <div className="pt-10 border-t border-white/10 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Last Updated: December 2025</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}