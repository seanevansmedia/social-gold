"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { doc, onSnapshot, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useState, useEffect } from "react";
import NotificationBell from "./NotificationBell";

interface NavbarProps {
  backNav?: boolean;
  title?: string;
  isProfile?: boolean; 
}

export default function Navbar({ backNav = false, title, isProfile = false }: NavbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      const unsubUser = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) setUserData(docSnap.data());
      }, (error) => {
        if (error.code !== "permission-denied") console.error(error);
      });

      const chatsRef = collection(db, "chats");
      const q = query(chatsRef, where("unreadBy", "array-contains", user.uid));
      const unsubUnread = onSnapshot(q, (snapshot) => {
        setUnreadMessages(snapshot.docs.length);
      }, (err) => err.code !== "permission-denied" && console.error(err));

      return () => { unsubUser(); unsubUnread(); };
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
            <Link href="/" className="text-2xl md:text-4xl font-black tracking-tighter font-lexend uppercase flex items-center">
              <span className="text-foreground">Social</span><span className="text-primary">Gold</span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          {/* SEARCH SVG - Only on Main Feed */}
          {!backNav && !isProfile && (
            <Link href="/search" className="hover:scale-110 transition-transform p-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary md:w-8 md:h-8">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
            </Link>
          )}
          
          {/* INBOX: Only on Profile/Settings Pages */}
          {isProfile && (
            <Link href="/messages" className="relative text-2xl md:text-3xl hover:scale-110 transition-transform p-1">
              ✉️
              {unreadMessages > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 bg-primary rounded-full border-2 border-background animate-pulse shadow-lg" />
              )}
            </Link>
          )}
          
          <NotificationBell />

          {userData?.photoURL && (
            <Link href={`/profile/${userData.username}`} className="h-8 w-8 md:h-10 md:w-10 overflow-hidden rounded-full border-2 border-primary/50 shadow-lg hover:scale-105 transition-transform">
              <img src={userData.photoURL} alt="Me" className="h-full w-full object-cover" />
            </Link>
          )}

          <button onClick={() => logout()} className="text-[10px] md:text-base font-bold uppercase tracking-widest text-primary border-2 border-primary/20 px-3 py-2 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl bg-primary/5 transition-all hover:scale-105 shadow-md">
            <span className="hidden md:inline">Logout</span>
            <span className="md:hidden">Bye</span>
          </button>
        </div>
      </div>
    </nav>
  );
}