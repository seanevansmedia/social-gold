"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useState, useEffect } from "react";
import NotificationBell from "./NotificationBell";

interface NavbarProps {
  backNav?: boolean;
  title?: string;
}

export default function Navbar({ backNav = false, title }: NavbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) setUserData(docSnap.data());
      }, (error) => {
        // Silently catch permission errors during logout
        if (error.code !== "permission-denied") console.error(error);
      });
      return () => unsubscribe();
    }
  }, [user]);

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-white/5 bg-background/60 backdrop-blur-xl shrink-0">
      <div className="mx-auto flex items-center justify-between px-6 py-4 md:py-6 max-w-2xl">
        <div className="flex items-center gap-4">
          {backNav ? (
            <>
              <button onClick={() => router.back()} className="text-primary text-2xl md:text-3xl hover:scale-110 transition-transform">←</button>
              {title && <h1 className="text-xl md:text-2xl font-black font-lexend uppercase tracking-tighter">{title}</h1>}
            </>
          ) : (
            <Link href="/" className="text-2xl md:text-4xl font-black tracking-tighter font-lexend uppercase flex items-center gap-2">
              <span className="text-foreground">Social</span>
              <span className="text-primary">Gold</span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          {!backNav && <Link href="/search" className="text-2xl md:text-3xl hover:scale-110 transition-transform p-1">🔍</Link>}
          <NotificationBell />
          {userData?.photoURL && (
            <Link href={`/profile/${userData.username}`} className="h-8 w-8 md:h-10 md:w-10 overflow-hidden rounded-full border-2 border-primary/50 shadow-lg hover:scale-105 transition-transform">
              <img src={userData.photoURL} alt="Me" className="h-full w-full object-cover" />
            </Link>
          )}
          <button 
            onClick={() => logout()} 
            className="text-[10px] md:text-base font-bold uppercase tracking-widest text-primary border-2 border-primary/20 px-3 py-2 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl bg-primary/5 transition-all hover:scale-105 hover:brightness-110 active:scale-95 shadow-md"
          >
            <span className="hidden md:inline">Logout</span>
            <span className="md:hidden">Bye</span>
          </button>
        </div>
      </div>
    </nav>
  );
}