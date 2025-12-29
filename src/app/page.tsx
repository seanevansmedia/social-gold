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
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center bg-background">
      <div className="max-w-3xl w-full">
        <h1 className="mb-4 text-6xl md:text-8xl font-black tracking-tight leading-none font-lexend">
          <span 
            style={{ 
              background: "linear-gradient(to right, var(--gradient-from), var(--gradient-to))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}
          >
            Social
          </span>
          <br />
          <span className="text-foreground">Gold</span>
        </h1>
        
        {user ? (
          <div className="mt-8 space-y-6 flex flex-col items-center">
            {userData ? (
              <div className="space-y-4 animate-in fade-in duration-700">
                {userData.photoURL && (
                   <img 
                    src={userData.photoURL} 
                    className="h-20 w-20 rounded-full border-2 border-primary mx-auto object-cover" 
                    alt="Profile"
                   />
                )}
                <div>
                  <p className="text-2xl font-bold text-primary">@{userData.username}</p>
                  <p className="text-sm opacity-60 max-w-xs mx-auto">{userData.bio}</p>
                </div>
              </div>
            ) : (
              <p className="text-lg font-medium opacity-80">Welcome, {user.email}</p>
            )}
            
            <div className="flex flex-col items-center gap-4 w-full">
              {!userData?.setupComplete && (
                <Link
                  href="/profile-setup"
                  className="w-full md:w-64 rounded-2xl bg-primary/10 border border-primary/30 py-3 text-sm font-bold text-primary hover:bg-primary/20 transition-all"
                >
                  Complete Profile Setup
                </Link>
              )}

              <Link
                href="/feed"
                style={{ background: "linear-gradient(to right, var(--gradient-from), var(--gradient-to))" }}
                className="w-full md:w-64 rounded-2xl px-12 py-4 text-base font-bold text-primary-foreground shadow-xl transition-all hover:scale-105 active:scale-95"
              >
                Go to Feed
              </Link>
              
              <button
                onClick={() => logout()}
                className="text-xs font-bold text-primary uppercase tracking-widest hover:opacity-70 transition-all p-2"
              >
                Log Out
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row justify-center gap-5 px-4 w-full md:w-auto mt-10 font-bold">
            <Link
              href="/login"
              style={{ background: "linear-gradient(to right, var(--gradient-from), var(--gradient-to))" }}
              className="w-full md:w-auto rounded-2xl px-12 py-4 text-primary-foreground shadow-xl text-center"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="w-full md:w-auto rounded-2xl border-2 border-primary px-12 py-4 text-primary text-center hover:bg-primary/10 transition-all"
            >
              Join Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}