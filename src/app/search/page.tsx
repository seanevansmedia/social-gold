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

  if (authLoading) return null;

  return (
    <div className="text-foreground font-jakarta">
      <nav className="sticky top-0 z-40 w-full border-b border-white/10 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-6 py-4">
          <Link href="/feed" className="text-primary text-3xl p-2 hover:scale-110 transition-transform">←</Link>
          <div className="flex-1 relative">
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search members..."
              className="w-full bg-secondary/40 border-2 border-primary/20 rounded-2xl px-6 py-3 text-lg focus:border-primary focus:ring-0 transition-all font-medium placeholder:text-foreground/40 shadow-inner text-foreground"
              autoFocus
            />
          </div>
          <NotificationBell />
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="space-y-4">
          {results.map((profile) => (
            <Link 
              key={profile.id} 
              href={`/profile/${profile.username}`} 
              className="flex items-center gap-6 p-5 rounded-[2.5rem] bg-secondary/40 backdrop-blur-md border border-white/10 hover:border-primary/50 transition-all group active:scale-95 shadow-xl"
            >
              <img src={profile.photoURL || "/default-avatar.png"} className="h-16 w-16 rounded-full border-2 border-primary object-cover shadow-lg" alt="" />
              <div className="flex-1">
                <p className="text-xl font-bold text-primary font-lexend leading-none uppercase tracking-tight">{profile.displayName}</p>
                <p className="text-[10px] font-bold text-foreground/60 uppercase tracking-[0.3em] mt-2">@{profile.username}</p>
              </div>
              <span className="text-primary transition-all text-2xl mr-2 group-hover:translate-x-2">→</span>
            </Link>
          ))}

          {searchTerm.length >= 2 && results.length === 0 && !isSearching && (
            <div className="text-center py-20 animate-in fade-in duration-500">
              <p className="text-4xl mb-4">📭</p>
              <p className="font-lexend text-sm uppercase tracking-[0.4em] text-primary font-black">No gold found</p>
            </div>
          )}

          {searchTerm.length < 2 && (
            <div className="text-center py-20 animate-in fade-in duration-500">
              <p className="text-6xl mb-6">🔍</p>
              <p className="text-sm font-black uppercase tracking-[0.6em] max-w-xs mx-auto text-primary">
                Search the vault
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}