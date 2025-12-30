"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/5 bg-background/40 backdrop-blur-md py-12 mt-20 relative z-10">
      <div className="mx-auto max-w-2xl px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          
          {/* Brand Side */}
          <div>
            <Link href="/" className="text-2xl font-black tracking-tighter font-lexend uppercase flex items-center justify-center md:justify-start gap-2">
              <span className="text-foreground">Social</span>
              <span className="text-primary">Gold</span>
            </Link>
            <p className="mt-2 text-[10px] font-bold text-primary uppercase tracking-[0.3em]">
              The Vault of Connection
            </p>
          </div>

          {/* Links Side */}
          <div className="flex gap-8">
            <Link href="/feed" className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground hover:text-primary transition-all">Feed</Link>
            <Link href="/search" className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground hover:text-primary transition-all">Search</Link>
            {/* FIXED LINK */}
            <Link href="/privacy" className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground hover:text-primary transition-all">Privacy</Link>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 text-center">
          <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.3em]">
            &copy; {new Date().getFullYear()} Social Gold. Stay Golden.
          </p>
        </div>
      </div>
    </footer>
  );
}