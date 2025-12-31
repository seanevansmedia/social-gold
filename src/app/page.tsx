"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";

export default function Home() {
  const { user, logout, loading: authLoading } = useAuth();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    async function fetchUserData() {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      }
    }
    fetchUserData();
  }, [user]);

  if (authLoading) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center">
      <div className="max-w-3xl w-full animate-in fade-in zoom-in duration-1000">
        {/* FIXED: Space removed between Social and Gold */}
        <h1 className="mb-4 text-7xl md:text-9xl font-black tracking-tighter leading-none font-lexend uppercase">
          <span 
            style={{ 
              background: "linear-gradient(to right, var(--gradient-from), var(--gradient-to))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}
          >
            Social
          </span>
          <br className="md:hidden" />
          <span className="text-foreground">Gold</span>
        </h1>
        
        {user ? (
          <div className="mt-12 space-y-8 flex flex-col items-center">
            {userData && (
              <div className="p-8 rounded-[3rem] bg-secondary/40 backdrop-blur-xl border border-white/10 shadow-2xl animate-in slide-in-from-bottom-5 duration-700">
                {userData.photoURL && (
                   <img src={userData.photoURL} className="h-24 w-24 rounded-full border-2 border-primary mx-auto object-cover shadow-2xl mb-4" alt="Profile" />
                )}
                <p className="text-3xl font-bold text-primary font-lexend">@{userData.username}</p>
                <p className="text-sm font-medium text-foreground/60 max-w-xs mx-auto mt-2">{userData.bio}</p>
              </div>
            )}
            
            <div className="flex flex-col items-center gap-4 w-full">
              <Link
                href="/feed"
                style={{ background: "linear-gradient(to right, var(--gradient-from), var(--gradient-to))" }}
                className="w-full md:w-72 rounded-2xl px-12 py-5 text-base font-black text-primary-foreground shadow-[0_20px_50px_rgba(202,138,4,0.3)] transition-all hover:scale-105 active:scale-95 uppercase tracking-widest"
              >
                Go to Feed
              </Link>
              <button onClick={() => logout()} className="text-[10px] font-black text-primary uppercase tracking-[0.4em] hover:text-white transition-all py-4">Logout Session</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row justify-center gap-6 px-4 w-full md:w-auto mt-12 font-bold">
            <Link
              href="/login"
              style={{ background: "linear-gradient(to right, var(--gradient-from), var(--gradient-to))" }}
              className="w-full md:w-auto rounded-2xl px-16 py-5 text-primary-foreground shadow-2xl text-center uppercase tracking-widest hover:brightness-110 transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="w-full md:w-auto rounded-2xl border-2 border-primary px-16 py-5 text-primary text-center hover:bg-primary/10 transition-all uppercase tracking-widest"
            >
              Join Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}