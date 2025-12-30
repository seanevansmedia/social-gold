"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import NotificationBell from "@/components/NotificationBell";

export default function SearchPage() {
  const { user, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim().length >= 2) { handleSearch(); } 
      else { setResults([]); }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const q = query(
        collection(db, "users"),
        where("username", ">=", searchTerm.toLowerCase()),
        where("username", "<=", searchTerm.toLowerCase() + "\uf8ff"),
        limit(15)
      );
      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(u => u.id !== user?.uid);
      setResults(users);
    } catch (error) { console.error("Search error:", error); } 
    finally { setIsSearching(false); }
  };

  if (authLoading) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-background text-foreground font-jakarta pb-20">
      <nav className="sticky top-0 z-40 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-6 py-6">
          <Link href="/feed" className="text-primary text-3xl p-2 hover:scale-110 transition-transform">←</Link>
          <div className="flex-1 relative">
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search members..."
              className="w-full bg-secondary border-2 border-white/5 rounded-2xl px-6 py-4 text-lg focus:outline-none focus:border-primary transition-all font-medium placeholder:opacity-20 shadow-inner"
              autoFocus
            />
          </div>
          <NotificationBell />
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-4 pt-10">
        <div className="space-y-6">
          {results.map((profile) => (
            <Link key={profile.id} href={`/profile/${profile.username}`} className="flex items-center gap-6 p-6 rounded-[2.5rem] bg-secondary hover:bg-secondary/80 border border-white/5 transition-all group active:scale-95 shadow-xl">
              <img src={profile.photoURL || "/default-avatar.png"} className="h-20 w-20 rounded-full border-2 border-primary/20 object-cover shadow-lg" alt="" />
              <div className="flex-1">
                <p className="text-2xl font-bold text-primary font-lexend leading-none uppercase tracking-tight">{profile.displayName}</p>
                <p className="text-xs font-bold opacity-30 uppercase tracking-[0.3em] mt-2">@{profile.username}</p>
              </div>
              <span className="text-primary opacity-0 group-hover:opacity-100 transition-all text-3xl mr-4">→</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}