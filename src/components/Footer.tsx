"use client";

import Link from "next/link";

// Using a default export
export default function Footer() {
  return (
    <footer className="w-full border-t border-white/5 bg-background py-12 mt-20">
      <div className="mx-auto max-w-2xl px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          
          {/* Brand Side */}
          <div>
            <Link href="/" className="text-2xl font-black tracking-tighter font-lexend uppercase flex items-center justify-center md:justify-start gap-2">
              <span className="text-foreground">Social</span>
              <span className="text-primary">Gold</span>
            </Link>
            <p className="mt-2 text-xs font-bold opacity-30 uppercase tracking-widest">
              The Vault of Connection
            </p>
          </div>

          {/* Links Side */}
          <div className="flex gap-8">
            <Link href="/feed" className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 hover:opacity-100 hover:text-primary transition-all">Feed</Link>
            <Link href="/search" className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 hover:opacity-100 hover:text-primary transition-all">Search</Link>
            <Link href="#" className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 hover:opacity-100 hover:text-primary transition-all">Privacy</Link>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 text-center">
          <p className="text-[10px] font-bold opacity-20 uppercase tracking-[0.3em]">
            &copy; {new Date().getFullYear()} Social Gold. Stay Golden.
          </p>
        </div>
      </div>
    </footer>
  );
}